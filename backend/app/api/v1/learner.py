"""
Learner Model API Endpoints for AdaptFlow
Track D: Personalized Tutoring & Adaptive Learning

Provides REST access to Bayesian Knowledge Tracing (BKT) engine:
  - GET  /api/v1/learner/mastery     : Current per-topic mastery and weak-topic diagnostics
  - POST /api/v1/learner/record      : Record quiz or chat evidence to update BKT state
  - POST /api/v1/learner/diagnostic  : Cold-start calibration for new students
"""

from typing import Dict, Any, Optional
from fastapi import APIRouter, Query, Body, HTTPException
from pydantic import BaseModel, Field

from app.services.learner_model import learner_engine

router = APIRouter()


class RecordEvidenceRequest(BaseModel):
    student_id: str = Field(..., description="Student identifier or email")
    topic: str = Field(..., description="Target knowledge topic")
    is_correct: Optional[bool] = Field(None, description="True if quiz answer was correct, False otherwise")
    dialogue_signal: Optional[float] = Field(None, description="Signal score in [-1.0, 1.0] from Socratic chat")
    context: str = Field("quiz", description="Context source: 'quiz', 'socratic_chat', or 'flashcard'")


class DiagnosticIntakeRequest(BaseModel):
    student_id: str = Field(..., description="Student identifier")
    diagnostic_answers: Dict[str, bool] = Field(..., description="Map of topic name to boolean pass/fail status")


@router.get("/mastery")
async def get_student_mastery(
    student_id: str = Query("sam@student.adaptflow.ai", description="Student ID or email")
):
    """
    Retrieve real-time Bayesian Knowledge Tracing (BKT) mastery scores.
    Returns per-topic probabilities P(L_t), weak topics, and active recommendations.
    """
    report = learner_engine.get_student_mastery_report(student_id)
    return {
        "success": True,
        "data": report
    }


@router.post("/record")
async def record_student_evidence(request: RecordEvidenceRequest):
    """
    Update BKT knowledge state after a quiz item or Socratic conversation turn.
    """
    if request.is_correct is not None:
        result = learner_engine.record_quiz_response(
            student_id=request.student_id,
            topic=request.topic,
            is_correct=request.is_correct,
            context_label=request.context
        )
    elif request.dialogue_signal is not None:
        result = learner_engine.record_chat_evidence(
            student_id=request.student_id,
            topic=request.topic,
            confidence_delta=request.dialogue_signal
        )
    else:
        raise HTTPException(status_code=400, detail="Must provide either 'is_correct' or 'dialogue_signal'")

    return {
        "success": True,
        "data": result
    }


@router.post("/diagnostic")
async def calibrate_diagnostic_intake(request: DiagnosticIntakeRequest):
    """
    Calibrate baseline knowledge prior P(L_0) for new students without history (Requirement 4.b).
    """
    result = learner_engine.calibrate_diagnostic(
        student_id=request.student_id,
        diagnostic_results=request.diagnostic_answers
    )
    return {
        "success": True,
        "data": result
    }
