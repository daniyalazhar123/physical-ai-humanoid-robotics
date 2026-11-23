"""DEPRECATED - use Better-Auth exclusively. Better-Auth is the ONLY auth system.
Custom JWT system kept for backward compatibility only. Do not create new auth here.
"""

import logging
import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional

import asyncpg
import bcrypt
import jwt
from fastapi import APIRouter, Depends, HTTPException, Header
from pydantic import BaseModel, EmailStr

from config import settings

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/auth", tags=["auth"])

JWT_ALGORITHM = "HS256"

# DEPRECATED: Better-Auth is the ONLY auth system. Do not use or create custom JWT auth.
_auth_pool: Optional[asyncpg.Pool] = None


def set_auth_pool(pool: asyncpg.Pool):
    global _auth_pool
    _auth_pool = pool


async def get_pool() -> asyncpg.Pool:
    if _auth_pool is None:
        raise RuntimeError("Auth pool not initialized")
    return _auth_pool


# ─── Models ────────────────────────────────────────────────────────────────────

class SignupRequest(BaseModel):
    email: EmailStr
    password: str
    name: Optional[str] = None
    role: Optional[str] = "Student"
    skillLevel: Optional[str] = "Beginner"
    skill_level: Optional[str] = None


class SigninRequest(BaseModel):
    email: EmailStr
    password: str


class AuthResponse(BaseModel):
    user: dict
    token: str


class ErrorResponse(BaseModel):
    error: str


# ─── Helpers ───────────────────────────────────────────────────────────────────

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())


def create_token(user_id: str) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": user_id,
        "iat": now,
        "exp": now + timedelta(hours=settings.jwt_expiry_hours),
    }
    return jwt.encode(payload, settings.auth_secret, algorithm=JWT_ALGORITHM)

def _naive_now() -> datetime:
    """Offset-naive UTC datetime for DB TIMESTAMP columns."""
    return datetime.now(timezone.utc).replace(tzinfo=None)


def decode_token(token: str) -> Optional[dict]:
    try:
        return jwt.decode(token, settings.auth_secret, algorithms=[JWT_ALGORITHM])
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
        return None


# ─── Dependencies ──────────────────────────────────────────────────────────────

async def get_current_user(authorization: str | None = Header(None)) -> dict:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")
    return await _resolve_user(authorization)


async def get_optional_user(authorization: str | None = Header(None)) -> dict | None:
    if not authorization or not authorization.startswith("Bearer "):
        return None
    try:
        return await _resolve_user(authorization)
    except HTTPException:
        return None


async def _resolve_user(authorization: str) -> dict:
    token = authorization.split(" ", 1)[1]
    payload = decode_token(token)
    if payload is None:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    user_id = payload.get("sub")
    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT id, email, name, role, skill_level, created_at FROM users WHERE id = $1",
            user_id,
        )
        if not row:
            raise HTTPException(status_code=401, detail="User not found")
        return {
            "id": row["id"],
            "email": row["email"],
            "name": row["name"],
            "role": row["role"],
            "skill_level": row["skill_level"],
            "created_at": row["created_at"].isoformat() if row["created_at"] else None,
        }


# ─── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/signup", response_model=AuthResponse)
@router.post("/sign-up", response_model=AuthResponse)
async def signup(req: SignupRequest):
    if len(req.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    pool = await get_pool()
    async with pool.acquire() as conn:
        existing = await conn.fetchval("SELECT id FROM users WHERE email = $1", req.email)
        if existing:
            raise HTTPException(status_code=409, detail="Email already registered")
        user_id = str(uuid.uuid4())
        hashed = hash_password(req.password)
        name = req.name or req.email.split("@")[0]
        skill_level = req.skill_level or req.skillLevel or "Beginner"
        await conn.execute(
            "INSERT INTO users (id, email, name, email_verified, role, skill_level) "
            "VALUES ($1, $2, $3, $4, $5, $6)",
            user_id, req.email, name, True, req.role or "Student", skill_level,
        )
        await conn.execute(
            "INSERT INTO accounts (id, user_id, account_id, provider_id, password_hash) VALUES ($1, $2, $3, $4, $5)",
            str(uuid.uuid4()), user_id, user_id, "credential", hashed,
        )
        token = create_token(user_id)
        await conn.execute(
            "INSERT INTO sessions (id, user_id, expires_at, token) VALUES ($1, $2, $3, $4)",
            str(uuid.uuid4()), user_id,
            _naive_now() + timedelta(hours=settings.jwt_expiry_hours),
            token,
        )
        logger.info("User signed up: %s (%s)", req.email, user_id)
        return AuthResponse(
            user={
                "id": user_id,
                "email": req.email,
                "name": name,
                "role": req.role or "Student",
                "skillLevel": skill_level,
            },
            token=token,
        )


@router.post("/signin", response_model=AuthResponse)
@router.post("/sign-in", response_model=AuthResponse)
async def signin(req: SigninRequest):
    logger.info("Signin attempt: %s", req.email)
    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT id, email, name, role, skill_level FROM users WHERE email = $1",
            req.email,
        )
        if not row:
            raise HTTPException(status_code=401, detail="Invalid email or password")
        user_id, email, name = row["id"], row["email"], row["name"]
        role = row["role"] or "Student"
        skill_level = row["skill_level"] or "Beginner"
        acct = await conn.fetchrow(
            "SELECT password_hash FROM accounts WHERE user_id = $1 AND provider_id = $2",
            user_id, "credential",
        )
        if not acct or not verify_password(req.password, acct["password_hash"]):
            raise HTTPException(status_code=401, detail="Invalid email or password")
        token = create_token(user_id)
        await conn.execute(
            "INSERT INTO sessions (id, user_id, expires_at, token) VALUES ($1, $2, $3, $4)",
            str(uuid.uuid4()), user_id,
            _naive_now() + timedelta(hours=settings.jwt_expiry_hours),
            token,
        )
        logger.info("User signed in: %s", email)
        return AuthResponse(
            user={
                "id": user_id,
                "email": email,
                "name": name,
                "role": role,
                "skillLevel": skill_level,
            },
            token=token,
        )


@router.post("/signout")
async def signout(user: dict = Depends(get_current_user), authorization: str | None = Header(None)):
    token = authorization.split(" ", 1)[1]
    pool = await get_pool()
    async with pool.acquire() as conn:
        await conn.execute("DELETE FROM sessions WHERE token = $1", token)
        logger.info("User signed out: %s", user["email"])
        return {"message": "Signed out successfully"}


@router.get("/profile")
async def profile(user: dict = Depends(get_current_user)):
    return {"user": user}
