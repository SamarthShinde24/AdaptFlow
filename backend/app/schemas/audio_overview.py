from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime


class PodcastCitation(BaseModel):
    source_title: str
    citation_label: str
    page_or_timestamp: Optional[str] = None
    material_type: Optional[str] = None


class PodcastSegment(BaseModel):
    id: str
    speaker: str = Field(..., description="'Alex' (Host / Questioner) or 'Jordan' (Expert / Explainer)")
    text: str
    duration_estimate_sec: float
    citation: Optional[PodcastCitation] = None


class AudioOverviewGenerateRequest(BaseModel):
    material_ids: Optional[List[str]] = Field(default_factory=list, description="IDs of materials to summarize")
    topic: Optional[str] = Field(default=None, description="Optional custom focus topic")
    duration_target: Optional[str] = Field(
        default="deep_dive",
        description="'deep_dive' (4-5 min), 'quick_sprint' (2-3 min), or 'exam_pitfalls' (3-4 min)",
    )
    custom_instructions: Optional[str] = None


class AudioOverviewEpisode(BaseModel):
    id: str
    title: str
    subtitle: str
    material_ids: List[str] = Field(default_factory=list)
    material_titles: List[str] = Field(default_factory=list)
    duration_seconds: int
    created_at: str
    summary: str
    key_takeaways: List[str] = Field(default_factory=list)
    segments: List[PodcastSegment]
    format_target: Optional[str] = "deep_dive"
    subject: Optional[str] = None
    difficulty: Optional[str] = "Intermediate"
    hosts: Dict[str, str] = Field(
        default_factory=lambda: {
            "Alex": "Curious Co-Host & Analogy Master",
            "Jordan": "Technical Specialist & Domain Analyst",
        }
    )
