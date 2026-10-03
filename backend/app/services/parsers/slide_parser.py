from pathlib import Path
from typing import List, Optional
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
    from pptx import Presentation
    PPTX_AVAILABLE = True
except ImportError:
    PPTX_AVAILABLE = False


class SlideDeckParser(BaseParser):
    """
    Parser for slide decks (.pptx and slide presentation formats).
    Extracts individual slide titles, bullet points, shape content, and speaker notes,
    linking each piece of knowledge to the specific slide number.
    """

    def can_parse(self, file_path: Path, material_type: MaterialType) -> bool:
        return (
            material_type == MaterialType.SLIDE_DECK
            or file_path.suffix.lower() in settings.ALLOWED_SLIDE_EXTENSIONS
        )

    def _parse_pptx(self, material: Material, file_path: Path) -> List[KnowledgeUnit]:
        """Parses PowerPoint .pptx files using python-pptx."""
        units: List[KnowledgeUnit] = []
        prs = Presentation(str(file_path))
        global_chunk_idx = 0

        for slide_idx, slide in enumerate(prs.slides):
            slide_number = slide_idx + 1

            # Extract slide title
            slide_title = "Untitled Slide"
            if slide.shapes.title and slide.shapes.title.text:
                slide_title = slide.shapes.title.text.strip()

            # Extract text from shapes
            body_texts: List[str] = []
            for shape_idx, shape in enumerate(slide.shapes):
                if shape == slide.shapes.title:
                    continue
                if shape.has_text_frame:
                    paragraphs = [p.text.strip() for p in shape.text_frame.paragraphs if p.text.strip()]
                    if paragraphs:
                        body_texts.append("\n".join(paragraphs))
                elif shape.has_table:
                    # Extract tabular content
                    table_rows = []
                    for row in shape.table.rows:
                        row_text = " | ".join(cell.text.strip() for cell in row.cells)
                        if row_text.strip():
                            table_rows.append(row_text)
                    if table_rows:
                        body_texts.append("\n".join(table_rows))

            slide_body_content = "\n\n".join(body_texts).strip()

            # 1. Create KnowledgeUnit for Slide Visual Content
            if slide_body_content or slide_title != "Untitled Slide":
                global_chunk_idx += 1
                full_slide_content = f"# {slide_title}\n\n{slide_body_content}".strip()

                metadata = SourceTrackingMetadata(
                    material_id=material.id,
                    material_title=material.title,
                    material_type=MaterialType.SLIDE_DECK,
                    chunk_index=global_chunk_idx,
                    slide_number=slide_number,
                    slide_title=slide_title,
                    is_speaker_notes=False,
                )

                unit = KnowledgeUnit.create(
                    material_id=material.id,
                    content=full_slide_content,
                    modality=ModalityType.SLIDE_CONTENT,
                    source_tracking=metadata,
                    tags=[material.subject] if material.subject else [],
                )
                units.append(unit)

            # 2. Extract Speaker Notes (if present)
            if slide.has_notes_slide and slide.notes_slide:
                notes_text_frame = slide.notes_slide.notes_text_frame
                if notes_text_frame and notes_text_frame.text:
                    clean_notes = notes_text_frame.text.strip()
                    if clean_notes:
                        global_chunk_idx += 1
                        metadata_notes = SourceTrackingMetadata(
                            material_id=material.id,
                            material_title=material.title,
                            material_type=MaterialType.SLIDE_DECK,
                            chunk_index=global_chunk_idx,
                            slide_number=slide_number,
                            slide_title=slide_title,
                            is_speaker_notes=True,
                        )

                        unit_notes = KnowledgeUnit.create(
                            material_id=material.id,
                            content=clean_notes,
                            modality=ModalityType.SPEAKER_NOTES,
                            source_tracking=metadata_notes,
                            tags=[material.subject, "speaker_notes"] if material.subject else ["speaker_notes"],
                        )
                        units.append(unit_notes)

        return units

    async def parse(
        self,
        material: Material,
        file_path: Path,
        chunk_size: Optional[int] = None,
        chunk_overlap: Optional[int] = None,
        **kwargs
    ) -> List[KnowledgeUnit]:
        """Parses presentation slide decks and returns KnowledgeUnits with slide-number tracking."""
        units: List[KnowledgeUnit] = []
        logger.info(f"Parsing slide deck: {file_path.name} for material '{material.title}'")

        if PPTX_AVAILABLE and file_path.suffix.lower() == ".pptx":
            try:
                units = self._parse_pptx(material, file_path)
                if units:
                    logger.info(f"Successfully extracted {len(units)} units from {file_path.name}")
                    return units
            except Exception as e:
                logger.error(f"Error parsing .pptx with python-pptx: {e}. Attempting fallback.")

        # Fallback for text-based slide outlines or slide transcripts
        try:
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read()

            # Split by markdown headers or "Slide X" markers
            slides_raw = content.split("\n---")
            if len(slides_raw) <= 1:
                slides_raw = content.split("Slide ")

            for idx, raw_slide in enumerate(slides_raw):
                clean_slide = raw_slide.strip()
                if not clean_slide:
                    continue

                slide_num = idx + 1
                lines = clean_slide.split("\n")
                slide_title = lines[0].strip().replace("#", "").strip() or f"Slide {slide_num}"

                metadata = SourceTrackingMetadata(
                    material_id=material.id,
                    material_title=material.title,
                    material_type=MaterialType.SLIDE_DECK,
                    chunk_index=idx + 1,
                    slide_number=slide_num,
                    slide_title=slide_title,
                    is_speaker_notes=False,
                )

                units.append(KnowledgeUnit.create(
                    material_id=material.id,
                    content=clean_slide,
                    modality=ModalityType.SLIDE_CONTENT,
                    source_tracking=metadata,
                ))
        except Exception as err:
            logger.error(f"Failed fallback parsing for slide file {file_path}: {err}")

        return units
