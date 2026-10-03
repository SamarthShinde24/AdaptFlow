from abc import ABC, abstractmethod
from pathlib import Path
from typing import List, Optional
from app.models.material import Material, MaterialType
from app.models.knowledge_base import KnowledgeUnit


class BaseParser(ABC):
    """Abstract base parser for multimodal educational materials."""

    @abstractmethod
    def can_parse(self, file_path: Path, material_type: MaterialType) -> bool:
        """Determines if this parser handles the given file and material type."""
        pass

    @abstractmethod
    async def parse(
        self,
        material: Material,
        file_path: Path,
        chunk_size: Optional[int] = None,
        chunk_overlap: Optional[int] = None,
        **kwargs
    ) -> List[KnowledgeUnit]:
        """
        Parses the document into granular KnowledgeUnits with complete source-tracking metadata.
        """
        pass
