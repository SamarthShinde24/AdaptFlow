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
    MAX_UPLOAD_SIZE_MB: int = 500

    # Parsing & Chunking Defaults
    CHUNK_SIZE_TOKENS: int = 500
    CHUNK_OVERLAP_TOKENS: int = 50
    DEFAULT_VIDEO_SEGMENT_SECONDS: float = 30.0

    # Allowed File Extensions
    ALLOWED_TEXTBOOK_EXTENSIONS: Set[str] = {".pdf", ".epub", ".txt"}
    ALLOWED_VIDEO_EXTENSIONS: Set[str] = {".mp4", ".mkv", ".mov", ".webm", ".avi", ".vtt", ".srt"}
    ALLOWED_SLIDE_EXTENSIONS: Set[str] = {".pptx", ".ppt", ".pdf", ".key"}

    def setup_directories(self) -> None:
        """Ensure necessary storage directories exist."""
        self.STORAGE_DIR.mkdir(parents=True, exist_ok=True)
        self.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
        self.DATA_DIR.mkdir(parents=True, exist_ok=True)


settings = Settings()
settings.setup_directories()
