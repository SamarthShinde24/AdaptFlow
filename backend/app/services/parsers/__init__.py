from pathlib import Path
from typing import List
from app.models.material import MaterialType
from app.services.parsers.base import BaseParser
from app.services.parsers.pdf_parser import PDFTextbookParser
from app.services.parsers.video_parser import LectureVideoParser
from app.services.parsers.slide_parser import SlideDeckParser


class ParserRegistry:
    """Registry that manages parsers for different study material types."""

    def __init__(self):
        self._parsers: List[BaseParser] = [
            PDFTextbookParser(),
            LectureVideoParser(),
            SlideDeckParser(),
        ]

    def get_parser(self, file_path: Path, material_type: MaterialType) -> BaseParser:
        """Finds the appropriate parser for the file and material type."""
        for parser in self._parsers:
            if parser.can_parse(file_path, material_type):
                return parser
        # Fallback to pdf/textbook parser if none matched
        return self._parsers[0]


parser_registry = ParserRegistry()

__all__ = [
    "BaseParser",
    "PDFTextbookParser",
    "LectureVideoParser",
    "SlideDeckParser",
    "ParserRegistry",
    "parser_registry",
]
