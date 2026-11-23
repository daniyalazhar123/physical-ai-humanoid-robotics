#!/usr/bin/env python3
"""
Initialize the Physical AI RAG Chatbot.

Steps:
  1. Create database schema (pgvector + all tables)
  2. Index all .md / .mdx files from my-website/docs into PostgreSQL (FTS)
  3. Verify with a test query

Usage:
  python initialize.py
"""

import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

import asyncpg
from dotenv import load_dotenv

load_dotenv(dotenv_path=Path(__file__).parent / ".env")

from config import settings
from services.document_processor import DocumentProcessor

SCHEMA_PATH = Path(__file__).parent / "database_schema.sql"


async def step_schema() -> None:
    print("=" * 60)
    print("  STEP 1/3: Applying database schema...")
    print("=" * 60)

    if not SCHEMA_PATH.exists():
        raise FileNotFoundError(f"Schema file not found: {SCHEMA_PATH}")

    sql = SCHEMA_PATH.read_text(encoding="utf-8")
    conn = await asyncpg.connect(settings.neon_url)
    try:
        for stmt in (s.strip() for s in sql.split(";") if s.strip()):
            try:
                await conn.execute(stmt)
            except Exception as exc:
                msg = str(exc)[:120]
                if "already exists" in msg:
                    print(f"    -> {msg}")
                else:
                    print(f"    !  {msg}")
        print("  [OK] Schema applied\n")
    finally:
        await conn.close()


async def step_index() -> int:
    print("=" * 60)
    print("  STEP 2/3: Indexing textbook content...")
    print("=" * 60)

    docs_dir = Path(settings.docs_path)
    print(f"  Docs path: {docs_dir}")
    if not docs_dir.is_dir():
        print(f"  [ERR] Directory not found: {docs_dir}")
        print(f"  Set DOCS_PATH in .env to point to your my-website/docs folder")
        return 0

    md_files = list(docs_dir.rglob("*.md")) + list(docs_dir.rglob("*.mdx"))
    print(f"  Files found: {len(md_files)}")
    if md_files:
        print(f"  First file: {md_files[0].relative_to(docs_dir)}")
        print(f"  Last file:  {md_files[-1].relative_to(docs_dir)}")
    print()

    proc = DocumentProcessor()
    count = await proc.reindex_all()
    if count > 0:
        print(f"\n  [OK] {count} chunks indexed (FTS search ready)")
    else:
        print("\n  [WARN] No content indexed -- check docs path")
    return count


async def step_verify(count: int) -> None:
    print("=" * 60)
    print("  STEP 3/3: Verifying the pipeline...")
    print("=" * 60)

    if count == 0:
        print("  [SKIP] No content -- skipping verification")
        return

    from services.rag_service import TextbookAgent

    agent = TextbookAgent()
    await agent.start()
    try:
        cnt = await agent.health_check()
        print(f"  DB chunks:  {cnt['embeddings_count']}")
        print(f"  LLM:        {cnt.get('llm', 'N/A')}")
        print()

        # Test 1: FTS search for topic in docs
        test_query = "What is ROS 2 and how does it work?"
        print(f"  Test query: '{test_query}'")
        print()

        result = await agent.run(test_query)
        resp = result.get("response", "")
        tool = result.get("tool_used")
        sources = result.get("sources", [])
        chunk_count = result.get("chunk_count", 0)

        print(f"  Tool used:        {tool}")
        print(f"  Chunks retrieved: {chunk_count}")
        if sources:
            print(f"  Sources:")
            for s in sources:
                print(f"    - {s}")

        print()
        if resp:
            preview = resp[:500]
            print(f"  Response (first 500 chars):")
            print(f"  {preview}")
        else:
            print("  [WARN] Empty response")

    finally:
        await agent.stop()


async def main() -> int:
    print()
    print("   Physical AI -- RAG Chatbot Initialization")
    print("   =========================================")
    print()

    await step_schema()
    count = await step_index()

    if count > 0:
        await step_verify(count)

    print("=" * 60)
    if count > 0:
        print("  [OK] Initialization complete.")
        print()
        print("  Start the backend:")
        print("    uvicorn main:app --reload --host 0.0.0.0 --port 8000")
        print()
        print("  Test chat:")
        print('    curl -X POST http://localhost:8000/api/v1/chat/chat -H "Content-Type: application/json" -d \'{"message":"what is ros 2"}\'')
        print()
        return 0
    else:
        print("  [ERR] No content indexed. Check DOCS_PATH in .env")
        return 1


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
