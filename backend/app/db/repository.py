import json
import threading
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Any
from app.core.config import settings
from app.core.logging import logger
from app.models.material import Material, ProcessingStatus, MaterialType
from app.models.knowledge_base import KnowledgeUnit, ModalityType
from app.schemas.knowledge import KnowledgeSearchQuery


class KnowledgeBaseRepository:
    """
    Repository for persisting and retrieving study materials and their granular knowledge units.
    Features thread-safe in-memory caching with persistent JSON-file backing.
    """

    def __init__(self, data_dir: Path = settings.DATA_DIR):
        self.data_dir = data_dir
        self.data_dir.mkdir(parents=True, exist_ok=True)
        self.materials_file = self.data_dir / "materials.json"
        self.knowledge_file = self.data_dir / "knowledge_units.json"
        self._lock = threading.RLock()

        self._materials: Dict[str, Material] = {}
        self._knowledge_units: Dict[str, KnowledgeUnit] = {}
        self._tasks: Dict[str, Dict[str, Any]] = {}

        self._load_from_disk()

    def _load_from_disk(self) -> None:
        """Loads cached materials and units from disk if available."""
        with self._lock:
            if self.materials_file.exists():
                try:
                    with open(self.materials_file, "r", encoding="utf-8") as f:
                        data = json.load(f)
                        for item in data:
                            mat = Material(**item)
                            self._materials[mat.id] = mat
                    logger.info(f"Loaded {len(self._materials)} materials from disk.")
                except Exception as e:
                    logger.error(f"Error loading materials: {e}")

            if self.knowledge_file.exists():
                try:
                    with open(self.knowledge_file, "r", encoding="utf-8") as f:
                        data = json.load(f)
                        for item in data:
                            unit = KnowledgeUnit(**item)
                            self._knowledge_units[unit.id] = unit
                    logger.info(f"Loaded {len(self._knowledge_units)} knowledge units from disk.")
                except Exception as e:
                    logger.error(f"Error loading knowledge units: {e}")

    def _persist_to_disk(self) -> None:
        """Flushes in-memory data to JSON storage files."""
        with self._lock:
            try:
                materials_data = [mat.model_dump(mode="json") for mat in self._materials.values()]
                with open(self.materials_file, "w", encoding="utf-8") as f:
                    json.dump(materials_data, f, indent=2, default=str)

                units_data = [unit.model_dump(mode="json") for unit in self._knowledge_units.values()]
                with open(self.knowledge_file, "w", encoding="utf-8") as f:
                    json.dump(units_data, f, indent=2, default=str)
            except Exception as e:
                logger.error(f"Failed to persist knowledge base to disk: {e}")

    # --- Material CRUD ---
    def save_material(self, material: Material) -> Material:
        with self._lock:
            material.updated_at = datetime.utcnow()
            self._materials[material.id] = material
            self._persist_to_disk()
            return material

    def get_material(self, material_id: str) -> Optional[Material]:
        with self._lock:
            return self._materials.get(material_id)

    def list_materials(self, course_id: Optional[str] = None, material_type: Optional[MaterialType] = None) -> List[Material]:
        with self._lock:
            items = list(self._materials.values())
            if course_id:
                items = [m for m in items if m.course_id == course_id]
            if material_type:
                items = [m for m in items if m.material_type == material_type]
            items.sort(key=lambda m: m.created_at, reverse=True)
            return items

    def delete_material(self, material_id: str) -> bool:
        with self._lock:
            if material_id in self._materials:
                del self._materials[material_id]
                # Also delete associated knowledge units
                self._knowledge_units = {
                    uid: u for uid, u in self._knowledge_units.items() if u.material_id != material_id
                }
                self._persist_to_disk()
                return True
            return False

    # --- Knowledge Unit CRUD ---
    def save_knowledge_units(self, units: List[KnowledgeUnit]) -> None:
        with self._lock:
            for unit in units:
                self._knowledge_units[unit.id] = unit
            self._persist_to_disk()

    def get_units_for_material(self, material_id: str) -> List[KnowledgeUnit]:
        with self._lock:
            units = [u for u in self._knowledge_units.values() if u.material_id == material_id]
            units.sort(key=lambda u: u.source_tracking.chunk_index)
            return units

    def get_unit_by_id(self, unit_id: str) -> Optional[KnowledgeUnit]:
        with self._lock:
            return self._knowledge_units.get(unit_id)

    # --- Search & Source-Tracking Retrieval ---
    def search_knowledge_units(self, query_params: KnowledgeSearchQuery) -> Tuple[List[KnowledgeUnit], int]:
        """
        Searches knowledge units with full provenance filtering across textbooks, lecture videos, and slides.
        """
        with self._lock:
            results = list(self._knowledge_units.values())

            # Filter by material ID
            if query_params.material_id:
                results = [u for u in results if u.material_id == query_params.material_id]

            # Filter by Material Type
            if query_params.material_type:
                results = [u for u in results if u.source_tracking.material_type == query_params.material_type]

            # Filter by Modality
            if query_params.modality:
                results = [u for u in results if u.modality == query_params.modality]

            # Textbook filters: Page numbers & Chapter
            if query_params.min_page is not None:
                results = [
                    u for u in results
                    if u.source_tracking.page_number is not None and u.source_tracking.page_number >= query_params.min_page
                ]
            if query_params.max_page is not None:
                results = [
                    u for u in results
                    if u.source_tracking.page_number is not None and u.source_tracking.page_number <= query_params.max_page
                ]
            if query_params.chapter:
                ch_query = query_params.chapter.lower()
                results = [
                    u for u in results
                    if u.source_tracking.chapter and ch_query in u.source_tracking.chapter.lower()
                ]

            # Slide filters: Slide number
            if query_params.slide_number is not None:
                results = [
                    u for u in results
                    if u.source_tracking.slide_number == query_params.slide_number
                ]

            # Video filters: Timestamp intervals
            if query_params.min_timestamp_seconds is not None:
                results = [
                    u for u in results
                    if u.source_tracking.end_time_seconds is not None
                    and u.source_tracking.end_time_seconds >= query_params.min_timestamp_seconds
                ]
            if query_params.max_timestamp_seconds is not None:
                results = [
                    u for u in results
                    if u.source_tracking.start_time_seconds is not None
                    and u.source_tracking.start_time_seconds <= query_params.max_timestamp_seconds
                ]

            # Text content search query
            if query_params.query:
                terms = [t.lower() for t in query_params.query.split()]
                results = [
                    u for u in results
                    if any(t in u.content.lower() or (u.source_tracking.citation_label and t in u.source_tracking.citation_label.lower()) for t in terms)
                ]

            total_count = len(results)
            # Paginate
            paginated = results[query_params.offset : query_params.offset + query_params.limit]
            return paginated, total_count

    # --- Task Progress Tracking ---
    def update_task_progress(
        self,
        task_id: str,
        material_id: str,
        status: ProcessingStatus,
        progress: int,
        message: Optional[str] = None,
        units_extracted: int = 0,
        details: Optional[Dict[str, Any]] = None,
    ) -> None:
        with self._lock:
            self._tasks[task_id] = {
                "task_id": task_id,
                "material_id": material_id,
                "status": status,
                "progress_percentage": progress,
                "message": message,
                "units_extracted": units_extracted,
                "details": details or {},
            }

    def get_task_status(self, task_id: str) -> Optional[Dict[str, Any]]:
        with self._lock:
            return self._tasks.get(task_id)


repository = KnowledgeBaseRepository()
