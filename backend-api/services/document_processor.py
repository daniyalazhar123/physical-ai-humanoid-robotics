"""
Document processor — chunks .md/.mdx files and stores in PostgreSQL for FTS search.
No external embedding API needed. Uses PostgreSQL to_tsvector for search.
"""

import asyncio
import json
import logging
import re
from pathlib import Path
from typing import Any, Dict, List

import asyncpg

from config import settings

logger = logging.getLogger(__name__)


class DocumentProcessor:
    def __init__(self) -> None:
        self.chunk_size = 600
        self.chunk_overlap = 80

    # ------------------------------------------------------------------
    # Chunking
    # ------------------------------------------------------------------

    @staticmethod
    def _strip_front_matter(text: str) -> str:
        if text.startswith("---"):
            parts = text.split("---", 2)
            if len(parts) >= 3:
                return parts[2].strip()
        return text

    def chunk_document(
        self,
        text: str,
        source: str,
        chapter: str = "",
        section: str = "",
    ) -> List[Dict[str, Any]]:
        body = self._strip_front_matter(text)
        body = re.sub(r"\r\n?", "\n", body)
        body = re.sub(r"\n{4,}", "\n\n", body)

        segments = re.split(r"(?=^#{1,3}\s)", body, flags=re.MULTILINE)

        chunks: List[Dict[str, Any]] = []
        buffer = ""
        idx = 0

        for seg in segments:
            seg = seg.strip()
            if not seg:
                continue

            if len(buffer) + len(seg) < self.chunk_size:
                buffer += seg + "\n\n"
            else:
                if buffer.strip():
                    chunks.append(self._make_chunk(buffer.strip(), source, chapter, section, idx))
                    idx += 1
                overlap = buffer[-self.chunk_overlap:] if len(buffer) > self.chunk_overlap else ""
                buffer = overlap + seg + "\n\n"

        if buffer.strip():
            chunks.append(self._make_chunk(buffer.strip(), source, chapter, section, idx))

        return chunks

    def _make_chunk(
        self, text: str, source: str, chapter: str, section: str, idx: int
    ) -> Dict[str, Any]:
        return {
            "text": text,
            "chapter": chapter,
            "section": section,
            "source_url": source,
            "chunk_index": idx,
        }

    # ------------------------------------------------------------------
    # Store chunks directly (no embeddings needed - FTS handles search)
    # ------------------------------------------------------------------

    async def _store_chunks(
        self, chunks: List[Dict[str, Any]], pool: asyncpg.Pool
    ) -> int:
        """Insert chunks with NULL embedding. FTS to_tsvector handles search."""
        if not chunks:
            return 0

        values = []
        params = []
        idx = 1
        for chunk in chunks:
            values.append(
                f"(${idx}::text, NULL, ${idx+1}, ${idx+2}, ${idx+3}, ${idx+4}::jsonb)"
            )
            params.extend([
                chunk["text"], chunk["chapter"],
                chunk["section"], chunk["source_url"],
                json.dumps({"chunk_index": chunk["chunk_index"]}),
            ])
            idx += 5

        sql = (
            f"INSERT INTO {settings.embeddings_table} "
            f"(chunk_text, embedding, chapter, section, source_url, metadata) "
            f"VALUES {', '.join(values)} "
            f"ON CONFLICT DO NOTHING"
        )
        try:
            async with pool.acquire() as conn:
                await conn.execute(sql, *params)
        except Exception as exc:
            logger.error("Batch INSERT failed (%d chunks): %s", len(chunks), exc)
            return 0

        return len(chunks)

    # ------------------------------------------------------------------
    # Full reindex
    # ------------------------------------------------------------------

    async def reindex_all(self) -> int:
        docs_dir = Path(settings.docs_path)
        if not docs_dir.is_dir():
            raise FileNotFoundError(f"Docs directory not found: {docs_dir}")

        logger.info("Reindexing from: %s", docs_dir.resolve())

        pool = await asyncpg.create_pool(
            settings.neon_url,
            min_size=2,
            max_size=5,
        )
        try:
            async with pool.acquire() as conn:
                await conn.execute(f"TRUNCATE {settings.embeddings_table}")
                await conn.execute("CREATE EXTENSION IF NOT EXISTS vector")
            logger.info("Emptied %s table", settings.embeddings_table)

            md_files = sorted(docs_dir.rglob("*.md")) + sorted(docs_dir.rglob("*.mdx"))
            if not md_files:
                logger.warning("No .md / .mdx files found")
                return 0

            total = 0
            for path in md_files:
                rel = path.relative_to(docs_dir)
                chapter = rel.parent.name
                section = path.stem
                source_url = f"/docs/{rel.with_suffix('').as_posix()}"
                text = path.read_text(encoding="utf-8")

                chunks = self.chunk_document(text, source_url, chapter, section)
                if not chunks:
                    continue

                n = await self._store_chunks(chunks, pool)
                total += n
                logger.info("  %s -> %d chunks", rel.as_posix(), n)

            async with pool.acquire() as conn:
                stored = await conn.fetchval(
                    f"SELECT COUNT(*) FROM {settings.embeddings_table}"
                )
            logger.info("Reindex complete -- %d total chunks", stored)
            return stored
        finally:
            await pool.close()
