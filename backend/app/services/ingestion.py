from pathlib import Path
from typing import Optional
from app.core.logging import logger
from app.models.material import Material, ProcessingStatus
from app.db.repository import repository
from app.services.parsers import parser_registry


class IngestionService:
    """Orchestrates parsing of multimodal study materials and indexes knowledge units."""

    async def process_material(
        self,
        task_id: str,
        material: Material,
        file_path: Path,
        chunk_size: Optional[int] = None,
        chunk_overlap: Optional[int] = None,
    ) -> None:
        """
        Background task worker to parse the material, extract source-tracked knowledge units,
        and index them into the repository.
        """
        logger.info(f"Starting ingestion job {task_id} for material '{material.title}' (ID: {material.id})")
        repository.update_task_progress(
            task_id=task_id,
            material_id=material.id,
            status=ProcessingStatus.PARSING,
            progress=15,
            message="Selecting parser and inspecting file structure...",
        )

        try:
            # 1. Update material status
            material.status = ProcessingStatus.PARSING
            material.status_message = "Parsing multimodal content and extracting source provenance..."
            repository.save_material(material)

            # 2. Select appropriate parser
            parser = parser_registry.get_parser(file_path, material.material_type)
            parser_name = parser.__class__.__name__

            repository.update_task_progress(
                task_id=task_id,
                material_id=material.id,
                status=ProcessingStatus.PARSING,
                progress=40,
                message=f"Executing {parser_name}...",
            )

            # 3. Parse file
            knowledge_units = await parser.parse(
                material=material,
                file_path=file_path,
                chunk_size=chunk_size,
                chunk_overlap=chunk_overlap,
            )

            repository.update_task_progress(
                task_id=task_id,
                material_id=material.id,
                status=ProcessingStatus.INDEXED,
                progress=85,
                message=f"Indexing {len(knowledge_units)} knowledge units with source metadata...",
                units_extracted=len(knowledge_units),
            )

            # 4. Save knowledge units
            repository.save_knowledge_units(knowledge_units)

            # 5. Update material completion status for text extraction
            material.status = ProcessingStatus.INDEXED
            material.status_message = f"Successfully parsed and indexed {len(knowledge_units)} text knowledge units."
            material.total_units_extracted = len(knowledge_units)
            material.metadata["parser_used"] = parser_name
            repository.save_material(material)

            # 6. Multimodal Visual Extraction Phase (Diagrams, Figures, Slide Visuals)
            from app.models.material import MaterialType
            from app.services.parsers.visual_extractor import visual_extractor

            visual_units = []
            if material.material_type in (MaterialType.TEXTBOOK, MaterialType.SLIDE_DECK):
                try:
                    material.image_extraction_status = "processing"
                    repository.save_material(material)
                    repository.update_task_progress(
                        task_id=task_id,
                        material_id=material.id,
                        status=ProcessingStatus.INDEXED,
                        progress=90,
                        message="Extracting and analyzing visual diagrams, charts, and figures...",
                        units_extracted=len(knowledge_units),
                    )

                    if material.material_type == MaterialType.TEXTBOOK:
                        visual_units = await visual_extractor.extract_pdf_visuals(material, file_path)
                    elif material.material_type == MaterialType.SLIDE_DECK:
                        visual_units = await visual_extractor.extract_slide_visuals(material, file_path)

                    if visual_units:
                        repository.save_knowledge_units(visual_units)
                        material.total_visuals_extracted = len(visual_units)
                        material.total_units_extracted += len(visual_units)

                    material.image_extraction_status = "complete"
                    repository.save_material(material)
                    logger.info(f"Visual extraction complete: {len(visual_units)} visuals indexed for {material.title}")

                except Exception as vis_err:
                    logger.error(f"Visual extraction encountered an error for {material.title}: {vis_err}", exc_info=True)
                    material.image_extraction_status = "failed"
                    repository.save_material(material)
            else:
                material.image_extraction_status = "complete"
                repository.save_material(material)

            # 7. Mark task finished
            total_count = len(knowledge_units) + len(visual_units)
            repository.update_task_progress(
                task_id=task_id,
                material_id=material.id,
                status=ProcessingStatus.INDEXED,
                progress=100,
                message=f"Ingestion completed: {len(knowledge_units)} text units, {len(visual_units)} visuals indexed.",
                units_extracted=total_count,
                details={
                    "parser": parser_name,
                    "text_units": len(knowledge_units),
                    "visual_units": len(visual_units),
                    "image_extraction_status": material.image_extraction_status,
                },
            )
            logger.info(f"Ingestion job {task_id} completed successfully with {total_count} total units ({len(visual_units)} visuals).")


        except Exception as e:
            error_msg = f"Ingestion failed: {str(e)}"
            logger.error(error_msg, exc_info=True)

            material.status = ProcessingStatus.FAILED
            material.status_message = error_msg
            repository.save_material(material)

            repository.update_task_progress(
                task_id=task_id,
                material_id=material.id,
                status=ProcessingStatus.FAILED,
                progress=100,
                message=error_msg,
            )


ingestion_service = IngestionService()
