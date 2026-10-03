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

            # 5. Update material completion status
            material.status = ProcessingStatus.INDEXED
            material.status_message = f"Successfully parsed and indexed {len(knowledge_units)} knowledge units."
            material.total_units_extracted = len(knowledge_units)
            material.metadata["parser_used"] = parser_name
            repository.save_material(material)

            # 6. Mark task finished
            repository.update_task_progress(
                task_id=task_id,
                material_id=material.id,
                status=ProcessingStatus.INDEXED,
                progress=100,
                message="Ingestion completed successfully.",
                units_extracted=len(knowledge_units),
                details={"parser": parser_name, "units_count": len(knowledge_units)},
            )
            logger.info(f"Ingestion job {task_id} completed successfully with {len(knowledge_units)} units.")

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
