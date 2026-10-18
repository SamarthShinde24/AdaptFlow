from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.core.deps import get_optional_user
from app.db.models import User
from app.schemas.base import APIResponse
from app.schemas.audio_overview import (
    AudioOverviewGenerateRequest,
    AudioOverviewEpisode,
)
from app.services.audio_overview_service import audio_overview_service

router = APIRouter()


@router.post("/generate", summary="Generate a 3-5 minute 2-host audio overview podcast")
async def generate_audio_overview(
    payload: AudioOverviewGenerateRequest,
    current_user: Optional[User] = Depends(get_optional_user),
):
    """
    Generates a conversational podcast episode discussing core concepts from uploaded materials.
    """
    try:
        episode = audio_overview_service.generate_episode(
            material_ids=payload.material_ids,
            topic=payload.topic,
            duration_target=payload.duration_target or "deep_dive",
            custom_instructions=payload.custom_instructions,
        )
        return {
            "success": True,
            "data": episode.model_dump(),
            "episode": episode.model_dump(),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate audio overview: {str(e)}")


@router.get("/episodes", summary="List ready audio overview episodes")
async def list_audio_overviews():
    """Returns available audio overview deep dive episodes."""
    episodes = audio_overview_service.list_episodes()
    ep_data = [ep.model_dump() for ep in episodes]
    return {
        "success": True,
        "total": len(ep_data),
        "data": ep_data,
        "episodes": ep_data,
    }


@router.get("/episodes/{episode_id}", summary="Get specific episode by ID")
async def get_audio_overview(episode_id: str):
    """Retrieves an episode by ID with its full two-host dialogue transcript."""
    episode = audio_overview_service.get_episode_by_id(episode_id)
    if not episode:
        raise HTTPException(status_code=404, detail="Audio overview episode not found")
    return {
        "success": True,
        "data": episode.model_dump(),
        "episode": episode.model_dump(),
    }


@router.get("/material/{material_id}", summary="Get or generate audio overview for a specific material")
async def get_material_audio_overview(material_id: str, title: Optional[str] = Query(None)):
    """Retrieves or automatically generates an audio overview tailored to a specific study material."""
    episode = audio_overview_service.get_or_generate_for_material(material_id, title=title or "")
    return {
        "success": True,
        "data": episode.model_dump(),
        "episode": episode.model_dump(),
    }
