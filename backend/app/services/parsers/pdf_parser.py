import re
from pathlib import Path
from typing import List, Optional, Dict, Any, Tuple
from app.core.config import settings
from app.core.logging import logger
from app.models.material import Material, MaterialType
from app.models.knowledge_base import (
    KnowledgeUnit,
    ModalityType,
    SourceTrackingMetadata,
)
from app.services.parsers.base import BaseParser

try:
    import pypdf
    PYPDF_AVAILABLE = True
except ImportError:
    PYPDF_AVAILABLE = False


class PDFTextbookParser(BaseParser):
    """
    Parser for PDF textbooks and academic readings.
    Extracts text per page, identifies chapter outlines/bookmarks,
    and slices content into structured chunks with page-level source tracking.
    """

    def can_parse(self, file_path: Path, material_type: MaterialType) -> bool:
        return (
            material_type == MaterialType.TEXTBOOK
            or file_path.suffix.lower() in settings.ALLOWED_TEXTBOOK_EXTENSIONS
        )

    def _extract_outline_map(self, reader: Any) -> Dict[int, Tuple[str, Optional[str]]]:
        """
        Attempts to extract outline bookmarks from the PDF to map page numbers
        to chapter and section titles.
        Returns a dictionary mapping page_index (0-indexed) -> (chapter_title, section_title).
        """
        outline_map: Dict[int, Tuple[str, Optional[str]]] = {}
        try:
            outline = reader.outline
            if not outline:
                return outline_map

            current_chapter = "General"
            for item in outline:
                if isinstance(item, list):
                    # Sub-outline / sections
                    for sub in item:
                        if hasattr(sub, "title") and hasattr(sub, "page"):
                            try:
                                page_idx = reader.get_destination_page_number(sub)
                                outline_map[page_idx] = (current_chapter, sub.title)
                            except Exception:
                                pass
                elif hasattr(item, "title"):
                    current_chapter = item.title
                    try:
                        page_idx = reader.get_destination_page_number(item)
                        outline_map[page_idx] = (current_chapter, None)
                    except Exception:
                        pass
        except Exception as e:
            logger.warning(f"Could not parse PDF outline/TOC bookmarks: {e}")

        return outline_map

    def _chunk_text(self, text: str, max_words: int = 250, overlap_words: int = 30) -> List[str]:
        """Splits page text into coherent semantic chunks with overlap."""
        paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]
        chunks = []
        current_chunk: List[str] = []
        current_word_count = 0

        for para in paragraphs:
            words = para.split()
            if not words:
                continue

            if current_word_count + len(words) > max_words and current_chunk:
                chunk_str = "\n\n".join(current_chunk)
                chunks.append(chunk_str)
                # Overlap logic: keep last few words or paragraph
                current_chunk = [para]
                current_word_count = len(words)
            else:
                current_chunk.append(para)
                current_word_count += len(words)

        if current_chunk:
            chunks.append("\n\n".join(current_chunk))

        # Fallback if no paragraph breaks
        if not chunks and text.strip():
            words = text.split()
            for i in range(0, len(words), max_words - overlap_words):
                chunk = " ".join(words[i:i + max_words])
                if chunk:
                    chunks.append(chunk)

        return chunks

    async def parse(
        self,
        material: Material,
        file_path: Path,
        chunk_size: Optional[int] = None,
        chunk_overlap: Optional[int] = None,
        **kwargs
    ) -> List[KnowledgeUnit]:
        """Extracts text from PDF pages and returns KnowledgeUnits with page/chapter provenance."""
        units: List[KnowledgeUnit] = []
        max_words = (chunk_size or settings.CHUNK_SIZE_TOKENS)
        overlap = (chunk_overlap or settings.CHUNK_OVERLAP_TOKENS)

        logger.info(f"Parsing textbook PDF: {file_path.name} for material '{material.title}'")

        if PYPDF_AVAILABLE and file_path.suffix.lower() == ".pdf":
            try:
                reader = pypdf.PdfReader(str(file_path))
                num_pages = len(reader.pages)
                outline_map = self._extract_outline_map(reader)

                active_chapter = "Chapter 1"
                active_section = None
                global_chunk_idx = 0

                for page_idx in range(num_pages):
                    page_num = page_idx + 1  # 1-indexed

                    # Update chapter/section from outline if available
                    if page_idx in outline_map:
                        ch, sec = outline_map[page_idx]
                        active_chapter = ch
                        active_section = sec

                    page = reader.pages[page_idx]
                    page_text = page.extract_text() or ""
                    clean_text = re.sub(r"[ \t]+", " ", page_text).strip()

                    if not clean_text:
                        continue

                    # Look for chapter headers in page text if not found in bookmarks
                    chapter_match = re.search(r"(Chapter\s+\d+[:\s\w\-]+)", clean_text, re.IGNORECASE)
                    if chapter_match:
                        active_chapter = chapter_match.group(1).strip()

                    chunks = self._chunk_text(clean_text, max_words=max_words, overlap_words=overlap)

                    for sub_idx, chunk in enumerate(chunks):
                        global_chunk_idx += 1
                        metadata = SourceTrackingMetadata(
                            material_id=material.id,
                            material_title=material.title,
                            material_type=MaterialType.TEXTBOOK,
                            chunk_index=global_chunk_idx,
                            page_number=page_num,
                            page_range=f"p. {page_num}",
                            chapter=active_chapter,
                            section=active_section,
                            paragraph_index=sub_idx + 1,
                        )

                        unit = KnowledgeUnit.create(
                            material_id=material.id,
                            content=chunk,
                            modality=ModalityType.TEXT,
                            source_tracking=metadata,
                            tags=[material.subject] if material.subject else [],
                        )
                        units.append(unit)

                if units:
                    logger.info(f"Successfully extracted {len(units)} units from {num_pages} PDF pages.")
                    return units

            except Exception as e:
                logger.error(f"Error parsing PDF with pypdf: {e}. Falling back to plain text read.")

        # Fallback for plain text or if pypdf encountered unreadable stream
        try:
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read()
            chunks = self._chunk_text(content, max_words=max_words, overlap_words=overlap)
            for idx, chunk in enumerate(chunks):
                metadata = SourceTrackingMetadata(
                    material_id=material.id,
                    material_title=material.title,
                    material_type=MaterialType.TEXTBOOK,
                    chunk_index=idx + 1,
                    page_number=1,
                    chapter="General Reading",
                )
                units.append(KnowledgeUnit.create(
                    material_id=material.id,
                    content=chunk,
                    modality=ModalityType.TEXT,
                    source_tracking=metadata,
                ))
        except Exception as err:
            logger.error(f"Failed fallback parsing for {file_path}: {err}")

        return units
