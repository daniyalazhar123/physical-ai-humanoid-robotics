import logging
import os
from typing import Optional

import asyncpg
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from config import settings
from services.rag_service import TextbookAgent
from app.routes.auth import router as auth_router, set_auth_pool, get_optional_user

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

agent = TextbookAgent()

app = FastAPI(
    title="Physical AI & Humanoid Robotics RAG API",
    description="OpenAI-style agent powered by Gemini + Grok fallback + pgvector FTS",
    version="2.2.0",
)


class ChatRequest(BaseModel):
    message: str
    query: Optional[str] = None
    lang: Optional[str] = "en"
    language: Optional[str] = None
    context: Optional[str] = None

app.include_router(auth_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup():
    # Start RAG agent
    try:
        await agent.start()
        logger.info("TextbookAgent started")
    except Exception as e:
        logger.warning("Agent start skipped: %s", str(e)[:200])

    # Create auth pool
    try:
        pool = await asyncpg.create_pool(
            settings.neon_url,
            min_size=settings.db_pool_size,
            max_size=settings.db_pool_overflow,
        )
        set_auth_pool(pool)
        logger.info("Auth pool initialized")
    except Exception as e:
        logger.warning("Auth pool init skipped: %s", str(e)[:200])


@app.get("/")
async def root():
    return {"status": "ok", "message": "Physical AI RAG Chatbot API is running"}


@app.get("/health")
async def health():
    status = await agent.health_check()
    overall = "healthy" if status["pgvector"] and status["embeddings_count"] > 0 else "degraded"
    return {"status": overall, **status}


@app.get("/test")
async def test():
    logger.info("=== TEST: what is ros 2 ===")
    result = await agent.run("what is ros 2")
    logger.info("tool_used=%s chunks=%d sources=%s response_len=%d",
                result.get("tool_used"), result.get("chunk_count", 0),
                result.get("sources", []), len(result.get("response", "")))
    return result


@app.post("/api/v1/chat/chat")
async def chat_endpoint(
    request: ChatRequest,
    user: Optional[dict] = Depends(get_optional_user),
):
    try:
        query = request.message or request.query or ""
        language = request.lang or request.language or "en"
        context = request.context or None

        if not query:
            return {"reply": "Please ask a question."}

        full_query = query if language != "ur" else f"{query}\n\n(Respond in Urdu)"
        result = await agent.run(full_query, selected_text=context)

        # Ensure we always return a non-empty reply
        reply = result["response"]
        if not reply or len(reply.strip()) < 10:
            reply = "I couldn't find an answer in the textbook. Try asking about a specific topic like ROS 2, Gazebo, Isaac Sim, or VLA models."

        return {
            "reply": reply,
            "sources": result.get("sources", []),
            "tool_used": result.get("tool_used"),
            "user_id": user["id"] if user else None,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Chat endpoint error")
        return {"reply": "An error occurred processing your request.", "sources": []}


@app.get("/api/v1/chat/conversation")
async def conversation_list(user: Optional[dict] = Depends(get_optional_user)):
    try:
        pool = agent._pg_pool
        if not pool:
            return {"conversations": []}
        async with pool.acquire() as conn:
            if user:
                rows = await conn.fetch(
                    "SELECT id, title, created_at, updated_at FROM conversations "
                    "WHERE user_id = $1 ORDER BY updated_at DESC",
                    user["id"],
                )
            else:
                rows = []
            return {
                "conversations": [
                    {
                        "id": r["id"],
                        "title": r["title"],
                        "created_at": r["created_at"].isoformat() if r["created_at"] else None,
                        "updated_at": r["updated_at"].isoformat() if r["updated_at"] else None,
                    }
                    for r in rows
                ]
            }
    except Exception as e:
        logger.exception("Conversation list error")
        return {"conversations": []}


@app.get("/api/v1/content")
async def content_list():
    try:
        pool = agent._pg_pool
        if not pool:
            return {"chapters": []}
        async with pool.acquire() as conn:
            rows = await conn.fetch(
                "SELECT DISTINCT chapter FROM embeddings WHERE chapter IS NOT NULL ORDER BY chapter"
            )
            chapters = [
                {
                    "id": r["chapter"],
                    "title": r["chapter"],
                    "slug": r["chapter"],
                    "module_no": 0,
                }
                for r in rows
            ]
            return {"chapters": chapters}
    except Exception as e:
        logger.exception("Content list error")
        return {"chapters": []}


@app.get("/debug/auth")
async def debug_auth():
    """Diagnose auth pool and user lookup."""
    try:
        from app.routes.auth import _auth_pool, hash_password, verify_password, create_token, decode_token
        pool_status = "ok" if _auth_pool is not None else "None"
        results = {"pool": pool_status}

        if _auth_pool:
            async with _auth_pool.acquire() as conn:
                users = await conn.fetch("SELECT id, email, name FROM users LIMIT 5")
                results["users"] = [{"id": u["id"], "email": u["email"], "name": u["name"]} for u in users]
                accounts = await conn.fetch("SELECT user_id, provider_id, password_hash IS NOT NULL AS has_pw FROM accounts LIMIT 5")
                results["accounts"] = [{"user_id": a["user_id"], "provider": a["provider_id"], "has_pw": a["has_pw"]} for a in accounts]
                if accounts:
                    pw = accounts[0]["has_pw"]
                    if pw:
                        acct = await conn.fetchrow("SELECT password_hash FROM accounts LIMIT 1")
                        pw_check = verify_password("test123456", acct["password_hash"])
                        results["pw_check"] = pw_check
        return results
    except Exception as e:
        return {"error": str(e), "type": type(e).__name__}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
