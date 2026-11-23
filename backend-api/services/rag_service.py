"""
OpenAI-style Agent using native google.generativeai SDK (Gemini) with Grok fallback.

Architecture:
  - Tool: retrieve_textbook_knowledge(query) -> PostgreSQL full-text search (FTS)
  - Primary LLM: Gemini (google.generativeai SDK, native function calling)
  - Fallback LLM: Grok (openai SDK, OpenAI-compatible function calling)
  - Last resort: return compiled textbook chunks directly (no LLM needed)

Key design: FTS is the PRIMARY retrieval mechanism (not a fallback).
No external embedding API needed. Works entirely via PostgreSQL to_tsvector.
"""

import asyncio
import json
import logging
import re
from typing import Any, Dict, List, Optional

import asyncpg
import google.generativeai as genai
from google.generativeai import protos
from openai import OpenAI

from config import settings

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Gemini FunctionDeclaration for the tool
# ---------------------------------------------------------------------------

RETRIEVE_TOOL = protos.FunctionDeclaration(
    name="retrieve_textbook_knowledge",
    description="Search the Physical AI & Humanoid Robotics textbook for content relevant to the user's question. Use this FIRST before answering.",
    parameters=protos.Schema(
        type=protos.Type.OBJECT,
        properties={
            "query": protos.Schema(
                type=protos.Type.STRING,
                description="The search query — use the user's actual question verbatim.",
            ),
        },
        required=["query"],
    ),
)

GEMINI_TOOLS = [protos.Tool(function_declarations=[RETRIEVE_TOOL])]

SYSTEM_PROMPT = (
    "You are Atlas, an expert tutor for Physical AI & Humanoid Robotics.\n\n"
    "## Your tools\n"
    "- `retrieve_textbook_knowledge` — searches the official textbook for relevant excerpts. Always call this first.\n\n"
    "## Rules\n"
    "1. ALWAYS call `retrieve_textbook_knowledge` with the user's question first.\n"
    "2. If the returned content answers the question, use ONLY that content. Cite the chapter and section.\n"
    "3. If NO relevant content is found, answer from your general robotics knowledge.\n"
    "4. Label whether information comes from the textbook or general knowledge.\n"
    "5. Use markdown formatting. Wrap code in fenced blocks.\n"
    "6. Keep answers educational and concise (2-5 paragraphs).\n\n"
    "## Textbook modules\n"
    "- ROS 2: Nodes, topics, services, actions, TF2, Nav2, ROS 2 Control\n"
    "- Gazebo: Simulation, URDF/SDF, sensors, plugins, physics engines\n"
    "- NVIDIA Isaac Sim: Digital twins, Omniverse, RTX, PhysX, RL, synthetic data\n"
    "- VLA Models: RT-2, Pi-Zero, OpenVLA, Octo, flow matching"
)


# ---------------------------------------------------------------------------
# Agent class
# ---------------------------------------------------------------------------


class TextbookAgent:
    """OpenAI-style agent using Gemini (primary) / Grok (fallback) with function calling."""

    def __init__(self) -> None:
        self._pg_pool: Optional[asyncpg.Pool] = None
        self._gemini_model: Optional[genai.GenerativeModel] = None
        self._grok_client: Optional[OpenAI] = None

    # ------------------------------------------------------------------
    # Lifecycle
    # ------------------------------------------------------------------

    async def start(self) -> None:
        """Initialize DB pool and LLM clients."""
        # DB pool (required)
        self._pg_pool = await asyncpg.create_pool(
            settings.neon_url,
            min_size=settings.db_pool_size,
            max_size=settings.db_pool_overflow,
        )
        async with self._pg_pool.acquire() as conn:
            await conn.execute("CREATE EXTENSION IF NOT EXISTS vector")
            await conn.execute(
                "CREATE INDEX IF NOT EXISTS idx_embeddings_fts ON embeddings "
                "USING GIN (to_tsvector('english', chunk_text))"
            )
        logger.info("DB pool ready")

        # Gemini (optional — may fail if quota exhausted)
        try:
            genai.configure(api_key=settings.gemini_api_key)
            self._gemini_model = genai.GenerativeModel(
                model_name=settings.gemini_model,
                tools=GEMINI_TOOLS,
                system_instruction=SYSTEM_PROMPT,
            )
            logger.info("Gemini model ready: %s", settings.gemini_model)
        except Exception as e:
            logger.warning("Gemini init skipped: %s", str(e)[:100])

        # Grok (optional)
        if settings.grok_api_key:
            try:
                self._grok_client = OpenAI(
                    api_key=settings.grok_api_key,
                    base_url="https://api.x.ai/v1",
                    max_retries=0,
                )
                logger.info("Grok client ready")
            except Exception as e:
                logger.warning("Grok init skipped: %s", str(e)[:100])

        logger.info("TextbookAgent started")

    async def stop(self) -> None:
        if self._pg_pool:
            await self._pg_pool.close()

    # ------------------------------------------------------------------
    # FTS-based retrieval (no embeddings needed)
    # ------------------------------------------------------------------

    async def _search_fts(self, query: str, top_k: int = 8) -> List[Dict[str, Any]]:
        """PostgreSQL keyword search with word-boundary regex (primary) and FTS fallback.

        1. Word-boundary regex on individual query words (fast, accurate)
        2. plainto_tsquery (AND match) if regex yields nothing
        """
        clean_query = re.sub(r'[^\w\s]', ' ', query).strip()
        if not clean_query:
            return []

        stop_words = {'what', 'is', 'the', 'how', 'does', 'this', 'that', 'and', 'are',
                      'for', 'with', 'was', 'were', 'its', 'their', 'can', 'will',
                      'has', 'had', 'have', 'not', 'but', 'you', 'all', 'any',
                      'each', 'which', 'who', 'whom', 'why', 'where', 'when'}
        words = [w for w in clean_query.lower().split()
                 if len(w) > 2 and w not in stop_words]
        if not words:
            return []

        try:
            async with self._pg_pool.acquire() as conn:
                # Strategy 1: word-boundary regex on individual words
                # This avoids FTS issues (e.g. 'ros' matching 'microprocessors')
                pattern = '|'.join(re.escape(w) for w in words)
                rows = await conn.fetch(
                    f"""
                    SELECT chunk_text, chapter, section, source_url,
                           (SELECT COUNT(*) FROM regexp_matches(chunk_text, $1, 'gi')) AS score
                    FROM {settings.embeddings_table}
                    WHERE chunk_text ~* $1
                    ORDER BY score DESC
                    LIMIT $2
                    """,
                    f'\\m(?:{pattern})\\M',
                    top_k,
                )

                # Strategy 2: FTS AND match as fallback
                if not rows:
                    rows = await conn.fetch(
                        f"""
                        SELECT chunk_text, chapter, section, source_url,
                               ts_rank(to_tsvector('english', chunk_text),
                                       plainto_tsquery('english', $1)) AS score
                        FROM {settings.embeddings_table}
                        WHERE to_tsvector('english', chunk_text) @@ plainto_tsquery('english', $1)
                        ORDER BY score DESC
                        LIMIT $2
                        """,
                        clean_query,
                        top_k,
                    )

                return [
                    {
                        "text": r["chunk_text"] or "",
                        "chapter": r["chapter"] or "",
                        "section": r["section"] or "",
                        "source_url": r["source_url"] or "",
                        "score": float(r["score"] or 0),
                    }
                    for r in rows
                ]
        except Exception as exc:
            logger.error("DB search failed: %s", exc)
            return []

    @staticmethod
    def _chunks_to_text(chunks: List[Dict[str, Any]]) -> str:
        if not chunks:
            return json.dumps({
                "found": False,
                "message": "No relevant content found in the textbook. Answer from general knowledge."
            })
        lines = []
        for i, c in enumerate(chunks, 1):
            lines.append(f"[Source {i}] Chapter: {c['chapter']} | Section: {c['section']}")
            if c["source_url"]:
                lines.append(f"URL: {c['source_url']}")
            lines.append("-" * 50)
            lines.append(c["text"])
            lines.append("")
        lines.append(f"\nRetrieved {len(chunks)} excerpts above. Use these to answer the user's question.")
        return "\n".join(lines)

    # ------------------------------------------------------------------
    # Agent loop — Gemini path
    # ------------------------------------------------------------------

    async def _run_gemini(
        self,
        query: str,
        selected_text: Optional[str] = None,
        chat_history: Optional[List[Dict[str, str]]] = None,
    ) -> Optional[Dict[str, Any]]:
        if self._gemini_model is None:
            return None

        user_content = query
        if selected_text:
            user_content = f"[Page context]:\n{selected_text}\n\n[Question]:\n{query}"

        chat = self._gemini_model.start_chat(enable_automatic_function_calling=False)

        if chat_history:
            for msg in chat_history[-6:]:
                role = "user" if msg.get("role") == "user" else "model"
                chat.history.append(protos.Content(
                    role=role,
                    parts=[protos.Part(text=msg.get("content", ""))],
                ))

        loop = asyncio.get_running_loop()

        try:
            resp = await loop.run_in_executor(
                None,
                lambda: chat.send_message(user_content),
            )
        except Exception as exc:
            logger.warning("Gemini round-1 failed: %s", str(exc)[:200])
            return None

        if not resp.candidates or not resp.candidates[0].content.parts:
            return None

        first_part = resp.candidates[0].content.parts[0]
        if not first_part.function_call:
            return {
                "response": resp.candidates[0].content.text or "",
                "sources": [],
                "tool_used": None,
                "chunk_count": 0,
            }

        fc = first_part.function_call
        args = {key: val for key, val in fc.args.items()}
        search_query = args.get("query", query)
        chunks = await self._search_fts(search_query)
        tool_result = self._chunks_to_text(chunks)
        sources = list({c["source_url"] for c in chunks if c["source_url"]})

        try:
            func_resp = await loop.run_in_executor(
                None,
                lambda: chat.send_message(
                    protos.Content(
                        parts=[protos.Part(
                            function_response=protos.FunctionResponse(
                                name=fc.name,
                                response={"result": tool_result},
                            )
                        )],
                    )
                ),
            )
        except Exception as exc:
            logger.warning("Gemini round-2 failed: %s", str(exc)[:200])
            return {
                "response": self._fallback_answer(query, chunks),
                "sources": sources,
                "tool_used": "retrieve_textbook_knowledge (gemini-fallback)",
                "chunk_count": len(chunks),
            }

        final_text = ""
        if func_resp.candidates and func_resp.candidates[0].content.parts:
            final_text = func_resp.candidates[0].content.text or ""

        if not final_text:
            final_text = self._fallback_answer(query, chunks)

        return {
            "response": final_text,
            "sources": sources,
            "tool_used": "retrieve_textbook_knowledge (gemini)",
            "chunk_count": len(chunks),
        }

    # ------------------------------------------------------------------
    # Agent loop — Grok fallback (OpenAI SDK)
    # ------------------------------------------------------------------

    OPENAI_TOOL_DEF = {
        "type": "function",
        "function": {
            "name": "retrieve_textbook_knowledge",
            "description": "Search the Physical AI & Humanoid Robotics textbook for content relevant to the user's question.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "The search query.",
                    }
                },
                "required": ["query"],
            },
        },
    }

    async def _run_grok(
        self,
        query: str,
        selected_text: Optional[str] = None,
        chat_history: Optional[List[Dict[str, str]]] = None,
    ) -> Optional[Dict[str, Any]]:
        if not self._grok_client:
            return None

        messages: List[Dict[str, str]] = [{"role": "system", "content": SYSTEM_PROMPT}]
        if chat_history:
            for msg in chat_history[-6:]:
                messages.append({"role": msg.get("role", "user"), "content": msg.get("content", "")})

        user_content = query
        if selected_text:
            user_content = f"[Page context]:\n{selected_text}\n\n[Question]:\n{query}"
        messages.append({"role": "user", "content": user_content})

        loop = asyncio.get_running_loop()

        try:
            resp = await loop.run_in_executor(
                None,
                lambda: self._grok_client.chat.completions.create(
                    model=settings.grok_model,
                    messages=messages,
                    tools=[self.OPENAI_TOOL_DEF],
                    tool_choice="auto",
                    temperature=settings.temperature,
                    max_tokens=settings.max_tokens,
                ),
            )
            choice = resp.choices[0]
            msg = choice.message
        except Exception as exc:
            logger.warning("Grok round-1 failed: %s", str(exc)[:200])
            return None

        if not msg.tool_calls:
            return {
                "response": msg.content or "",
                "sources": [],
                "tool_used": None,
                "chunk_count": 0,
            }

        messages.append(msg)
        sources: List[str] = []
        chunks: List[Dict[str, Any]] = []
        tool_used = ""

        for tc in msg.tool_calls:
            if tc.function.name == "retrieve_textbook_knowledge":
                tool_used = tc.function.name
                args = json.loads(tc.function.arguments)
                search_query = args.get("query", query)
                chunks = await self._search_fts(search_query)
                tool_result = self._chunks_to_text(chunks)
                sources = list({c["source_url"] for c in chunks if c["source_url"]})
                messages.append({
                    "role": "tool",
                    "tool_call_id": tc.id,
                    "content": tool_result,
                })

        try:
            resp2 = await loop.run_in_executor(
                None,
                lambda: self._grok_client.chat.completions.create(
                    model=settings.grok_model,
                    messages=messages,
                    temperature=settings.temperature,
                    max_tokens=settings.max_tokens,
                ),
            )
            final_text = resp2.choices[0].message.content or ""
        except Exception as exc:
            logger.warning("Grok round-2 failed: %s", str(exc)[:200])
            return None

        if not final_text:
            return None

        return {
            "response": final_text,
            "sources": sources,
            "tool_used": tool_used,
            "chunk_count": len(chunks),
        }

    # ------------------------------------------------------------------
    # Main run — try Gemini -> Grok -> raw FTS chunks
    # ------------------------------------------------------------------

    async def run(
        self,
        query: str,
        selected_text: Optional[str] = None,
        chat_history: Optional[List[Dict[str, str]]] = None,
    ) -> Dict[str, Any]:
        if not self._pg_pool:
            return {"response": "Service not initialized. Please try again.", "sources": [], "tool_used": None, "chunk_count": 0}

        # Try Gemini
        result = await self._run_gemini(query, selected_text, chat_history)
        if result and result.get("response"):
            resp_lower = result["response"].strip().lower()
            if "unavailable" not in resp_lower and len(resp_lower) > 20:
                logger.info("Gemini returned answer (%d chars)", len(result["response"]))
                return result
            logger.warning("Gemini returned error/short response")

        logger.info("Gemini failed -> trying Grok fallback")

        # Try Grok
        result = await self._run_grok(query, selected_text, chat_history)
        if result and result.get("response"):
            resp_lower = result["response"].strip().lower()
            if "unavailable" not in resp_lower and len(resp_lower) > 20:
                logger.info("Grok returned answer (%d chars)", len(result["response"]))
                return result
            logger.warning("Grok returned error/short response")

        # Last resort: return raw textbook chunks (always works)
        logger.info("Both LLMs failed -> returning raw textbook chunks")
        chunks = await self._search_fts(query)
        return {
            "response": self._fallback_answer(query, chunks),
            "sources": list({c["source_url"] for c in chunks if c["source_url"]}),
            "tool_used": "raw-chunks",
            "chunk_count": len(chunks),
        }

    # ------------------------------------------------------------------
    # Fallback formatter
    # ------------------------------------------------------------------

    @staticmethod
    def _fallback_answer(query: str, chunks: List[Dict[str, Any]]) -> str:
        if not chunks:
            return (
                "I couldn't find specific information about that in the textbook. "
                "Try asking about ROS 2, Gazebo, NVIDIA Isaac Sim, or VLA models.\n\n"
                "Here are some topics covered in the textbook:\n"
                "- Chapter 1: Introduction to Physical & Embodied AI\n"
                "- Chapter 2: ROS 2 & Robot Software Architecture\n"
                "- Chapter 3: Simulation and Modeling\n"
                "- Chapter 4: Computer Vision\n"
                "- Chapter 5: Vision-Language-Action (VLA) Systems\n"
                "- Chapter 6: Humanoid Development\n"
                "- Chapter 7: Conversational Robotics\n"
                "- Chapter 8: Advanced Concepts\n"
                "- Chapter 9: Advanced Topics\n"
                "- Chapter 10: Future Directions"
            )
        lines = [f"Based on the textbook, here is what I found about '{query}':\n"]
        for i, c in enumerate(chunks[:3], 1):
            preview = c["text"][:600].strip()
            chapter_info = f"{c['chapter']}/{c['section']}" if c['chapter'] else c['section']
            lines.append(f"**Excerpt {i}** (from {chapter_info}):\n{preview}...\n")
        if len(chunks) > 3:
            lines.append(f"\n*{len(chunks)} relevant passages found. Switch to a more specific question for details.*")
        return "\n".join(lines)

    # ------------------------------------------------------------------
    # Health
    # ------------------------------------------------------------------

    async def health_check(self) -> Dict[str, Any]:
        status: Dict[str, Any] = {"pgvector": False, "embeddings_count": 0, "llm": "unknown"}
        try:
            async with self._pg_pool.acquire() as conn:
                count = await conn.fetchval(
                    f"SELECT COUNT(*) FROM {settings.embeddings_table}"
                )
                status["pgvector"] = True
                status["embeddings_count"] = count or 0
        except Exception as exc:
            status["pgvector_error"] = str(exc)

        try:
            if self._gemini_model:
                status["llm"] = settings.gemini_model
        except Exception as exc:
            status["llm_error"] = str(exc)[:100]

        return status

    async def is_healthy(self) -> bool:
        h = await self.health_check()
        return h["pgvector"] and h["embeddings_count"] > 0
