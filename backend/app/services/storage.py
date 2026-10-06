import os
import shutil
import uuid
from pathlib import Path
from typing import Tuple
from fastapi import UploadFile, HTTPException
from app.core.config import settings
from app.core.logging import logger
from app.models.material import MaterialType


class StorageService:
    """Manages file storage, path isolation, and file validation."""

    def __init__(self, base_upload_dir: Path = settings.UPLOAD_DIR):
        self.upload_dir = base_upload_dir
        self.upload_dir.mkdir(parents=True, exist_ok=True)

    def validate_file_extension(self, filename: str, material_type: MaterialType) -> str:
        """Validates that the file has a permissible extension for its declared material type."""
        ext = Path(filename).suffix.lower()
        if material_type == MaterialType.TEXTBOOK:
            allowed = settings.ALLOWED_TEXTBOOK_EXTENSIONS
        elif material_type == MaterialType.LECTURE_VIDEO:
            allowed = settings.ALLOWED_VIDEO_EXTENSIONS
        elif material_type == MaterialType.SLIDE_DECK:
            allowed = settings.ALLOWED_SLIDE_EXTENSIONS
        else:
            allowed = set()

        if ext not in allowed:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file extension '{ext}' for material type '{material_type.value}'. Allowed: {sorted(list(allowed))}"
            )
        return ext

    async def save_upload_file(self, upload_file: UploadFile, material_id: str, material_type: MaterialType) -> Tuple[Path, int]:
        """
        Saves an uploaded file to an isolated material directory under storage/uploads/<material_id>/.
        Returns (destination_path, file_size_in_bytes).
        """
        filename = upload_file.filename or "uploaded_file"
        self.validate_file_extension(filename, material_type)

        target_dir = self.upload_dir / material_id
        target_dir.mkdir(parents=True, exist_ok=True)

        safe_filename = Path(filename).name
        dest_path = target_dir / safe_filename

        bytes_written = 0
        max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024

        try:
            with open(dest_path, "wb") as buffer:
                while chunk := await upload_file.read(1024 * 1024):  # 1MB chunks
                    bytes_written += len(chunk)
                    if bytes_written > max_bytes:
                        raise HTTPException(
                            status_code=413,
                            detail=f"File exceeds maximum allowed size of {settings.MAX_UPLOAD_SIZE_MB}MB"
                        )
                    buffer.write(chunk)
        except Exception as e:
            if dest_path.exists():
                dest_path.unlink(missing_ok=True)
            raise e

        logger.info(f"Saved file {safe_filename} ({bytes_written} bytes) to {dest_path}")
        return dest_path, bytes_written

    def delete_material_files(self, material_id: str) -> None:
        """Removes the stored files for a given material ID."""
        target_dir = self.upload_dir / material_id
        if target_dir.exists():
            shutil.rmtree(target_dir, ignore_errors=True)
            logger.info(f"Deleted storage directory for material {material_id}")


storage_service = StorageService()

async def save_upload_file(upload_file: UploadFile, material_id: str = None, material_type: MaterialType = None) -> str:
    """Helper function to save an uploaded file and return the string path."""
    import uuid
    if not material_id:
        material_id = str(uuid.uuid4())
    if material_type is None:
        ext = Path(upload_file.filename or "").suffix.lower()
        if ext in settings.ALLOWED_VIDEO_EXTENSIONS:
            material_type = MaterialType.LECTURE_VIDEO
        elif ext in settings.ALLOWED_SLIDE_EXTENSIONS:
            material_type = MaterialType.SLIDE_DECK
        else:
            material_type = MaterialType.TEXTBOOK
    path, _ = await storage_service.save_upload_file(upload_file, material_id, material_type)
    return str(path)
