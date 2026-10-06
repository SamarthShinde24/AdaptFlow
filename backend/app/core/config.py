import os
from pathlib import Path
from typing import List, Set
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Application configuration for AdaptFlow.
    Loads from environment variables or defaults.
    """
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    # General Project Info
    PROJECT_NAME: str = "AdaptFlow Backend"
    API_V1_STR: str = "/api/v1"
    DEBUG: bool = True
    VERSION: str = "0.1.0"

    # Base Paths
    BASE_DIR: Path = Path(__file__).resolve().parent.parent.parent
    STORAGE_DIR: Path = BASE_DIR / "storage"
    UPLOAD_DIR: Path = STORAGE_DIR / "uploads"
    DATA_DIR: Path = STORAGE_DIR / "data"

    # Upload & Size limits
    MAX_UPLOAD_SIZE_MB: int = 50

    # Parsing & Chunking Defaults
    CHUNK_SIZE_TOKENS: int = 500
    CHUNK_OVERLAP_TOKENS: int = 50
    DEFAULT_VIDEO_SEGMENT_SECONDS: float = 30.0

    # Allowed File Extensions
    ALLOWED_TEXTBOOK_EXTENSIONS: Set[str] = {".pdf", ".epub", ".txt"}
    ALLOWED_VIDEO_EXTENSIONS: Set[str] = {".mp4", ".mkv", ".mov", ".webm", ".avi", ".vtt", ".srt"}
    ALLOWED_SLIDE_EXTENSIONS: Set[str] = {".pptx", ".ppt", ".pdf", ".key"}

    # Database & Redis Settings
    DATABASE_URL: str = "postgresql+asyncpg://adaptflow:adaptflow@localhost:5432/adaptflow"
    DATABASE_URL_SYNC: str = "postgresql+psycopg2://adaptflow:adaptflow@localhost:5432/adaptflow"
    REDIS_URL: str = "redis://localhost:6379/0"

    @property
    def ASYNC_DATABASE_URL(self) -> str:
        url = self.DATABASE_URL
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql+asyncpg://", 1)
        elif url.startswith("postgresql://") and not url.startswith("postgresql+"):
            url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
        return url

    @property
    def SYNC_DATABASE_URL(self) -> str:
        url = os.getenv("DATABASE_URL_SYNC", self.DATABASE_URL)
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql+psycopg2://", 1)
        elif url.startswith("postgresql+asyncpg://"):
            url = url.replace("postgresql+asyncpg://", "postgresql+psycopg2://", 1)
        elif url.startswith("postgresql://") and not url.startswith("postgresql+"):
            url = url.replace("postgresql://", "postgresql+psycopg2://", 1)
        return url

    # JWT Settings
    JWT_SECRET_KEY: str = "change-me-in-production-use-openssl-rand-hex-32"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Celery Settings
    CELERY_BROKER_URL: str = "redis://localhost:6379/1"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/2"

    # CORS & Web
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]
    FRONTEND_URL: str = "http://localhost:3000"

    # Models & ML Settings
    EMBEDDING_MODEL: str = "all-MiniLM-L6-v2"
    CROSS_ENCODER_MODEL: str = "cross-encoder/ms-marco-MiniLM-L-6-v2"
    EMBEDDING_DIMENSION: int = 384
    RETRIEVAL_MIN_SIMILARITY: float = 0.75

    # Rate Limiting
    RATE_LIMIT_STANDARD: int = 60
    RATE_LIMIT_LLM: int = 10

    def setup_directories(self) -> None:
        """Ensure necessary storage directories and database parent paths exist."""
        os.makedirs(self.STORAGE_DIR, exist_ok=True)
        os.makedirs(self.UPLOAD_DIR, exist_ok=True)
        os.makedirs(self.DATA_DIR, exist_ok=True)

        # Automatically ensure SQLite database parent directories exist
        for url in (self.DATABASE_URL, self.DATABASE_URL_SYNC):
            if "sqlite" in url.lower():
                try:
                    db_path = url.split(":///")[-1].split("?")[0]
                    if db_path and not db_path.startswith(":memory:"):
                        parent_dir = os.path.dirname(os.path.abspath(db_path))
                        if parent_dir:
                            os.makedirs(parent_dir, exist_ok=True)
                except Exception:
                    pass


settings = Settings()
settings.setup_directories()
