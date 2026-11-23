"""Configuration settings for the Physical AI & Humanoid Robotics RAG Chatbot"""

import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()


class Settings:
    def __init__(self):
        self.cohere_api_key: str = os.getenv("COHERE_API_KEY", "")
        self.gemini_api_key: str = os.getenv("GEMINI_API_KEY", "")
        self.grok_api_key: str = os.getenv("GROK_API_KEY", "")
        self.neon_url: str = os.getenv("NEON_URL", "")
        self.api_token: str = os.getenv("API_TOKEN", "your-api-token-here")

        self.embeddings_table: str = os.getenv("EMBEDDINGS_TABLE", "embeddings")
        self.db_pool_size: int = int(os.getenv("DB_POOL_SIZE", "5"))
        self.db_pool_overflow: int = int(os.getenv("DB_POOL_OVERFLOW", "10"))

        self.gemini_model: str = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
        self.grok_model: str = os.getenv("GROK_MODEL", "grok-2-1212")
        self.max_tokens: int = int(os.getenv("MAX_TOKENS", "2048"))
        self.temperature: float = float(os.getenv("TEMPERATURE", "0.3"))

        self.docs_path: str = os.getenv(
            "DOCS_PATH",
            str(
                Path(__file__).resolve().parent.parent.parent
                / "my-website"
                / "docs"
            ),
        )

        self.auth_secret: str = os.getenv(
            "BETTER_AUTH_SECRET", os.getenv("AUTH_SECRET", "change-me-in-production")
        )
        self.better_auth_url: str = os.getenv("BETTER_AUTH_URL", "")
        self.frontend_url: str = os.getenv("FRONTEND_URL", "")
        self.jwt_expiry_hours: int = int(os.getenv("JWT_EXPIRY_HOURS", "72"))

        self._validate()

    def _validate(self):
        missing = []
        if not self.cohere_api_key:
            missing.append("COHERE_API_KEY")
        if not self.gemini_api_key:
            missing.append("GEMINI_API_KEY")
        if not self.neon_url:
            missing.append("NEON_URL")
        if missing:
            print(f"Warning: Missing env vars: {', '.join(missing)}")


settings = Settings()
