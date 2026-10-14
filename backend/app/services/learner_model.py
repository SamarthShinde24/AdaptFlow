"""
Bayesian Knowledge Tracing (BKT) Engine for AdaptFlow
Track D: Personalized Tutoring & Adaptive Learning

Implements the standard Corbett & Anderson (1995) BKT model with:
  - Per-topic mastery estimation: P(L_t)
  - Parameterized Slip P(S), Guess P(G), and Transition P(T)
  - Diagnostic cold-start calibration for new students
  - Dialogue evidence updates from Socratic chat interactions
  - Weak-topic identification and recommendation triggers
"""

import json
import logging
from pathlib import Path
from typing import Dict, List, Any, Optional
from datetime import datetime

logger = logging.getLogger(__name__)

ROOT_DIR = Path(__file__).resolve().parent.parent.parent
STORAGE_FILE = ROOT_DIR / "storage" / "data" / "learner_profiles.json"


class BKTParameters:
    """Standard Bayesian Knowledge Tracing hyperparameters."""
    def __init__(
        self,
        p_l0: float = 0.25,      # Initial prior probability of knowing the skill
        p_transit: float = 0.20, # Transition probability from unlearned to learned
        p_guess: float = 0.20,   # Guess probability (chance of correct if unlearned)
        p_slip: float = 0.10,    # Slip probability (chance of incorrect if learned)
    ):
        self.p_l0 = p_l0
        self.p_transit = p_transit
        self.p_guess = p_guess
        self.p_slip = p_slip

    def to_dict(self) -> Dict[str, float]:
        return {
            "p_l0": self.p_l0,
            "p_transit": self.p_transit,
            "p_guess": self.p_guess,
            "p_slip": self.p_slip,
        }


class TopicMasteryState:
    """Maintains real-time mastery tracking for a specific topic."""
    def __init__(self, topic: str, params: Optional[BKTParameters] = None, p_current: Optional[float] = None):
        self.topic = topic
        self.params = params or BKTParameters()
        self.p_learned = p_current if p_current is not None else self.params.p_l0
        self.opportunity_count = 0
        self.correct_count = 0
        self.history: List[Dict[str, Any]] = []

    def update(self, is_correct: bool, context_label: str = "quiz_item") -> float:
        """
        Bayesian posterior probability update given observation O_t in {0, 1}.
        Formula:
          If O_t = 1 (correct):
            P(L_t | O_t=1) = (P(L_t) * (1 - P(S))) / (P(L_t)*(1 - P(S)) + (1 - P(L_t))*P(G))
          If O_t = 0 (incorrect):
            P(L_t | O_t=0) = (P(L_t) * P(S)) / (P(L_t)*P(S) + (1 - P(L_t))*(1 - P(G)))

          Next opportunity prior:
            P(L_{t+1}) = P(L_t | O_t) + (1 - P(L_t | O_t)) * P(T)
        """
        p_l = self.p_learned
        p_s = self.params.p_slip
        p_g = self.params.p_guess
        p_t = self.params.p_transit

        if is_correct:
            numerator = p_l * (1.0 - p_s)
            denominator = numerator + (1.0 - p_l) * p_g
            p_posterior = numerator / denominator if denominator > 0 else p_l
            self.correct_count += 1
        else:
            numerator = p_l * p_s
            denominator = numerator + (1.0 - p_l) * (1.0 - p_g)
            p_posterior = numerator / denominator if denominator > 0 else p_l

        # Compute next-state transition
        p_next = p_posterior + (1.0 - p_posterior) * p_t

        # Bounded between 0.01 and 0.99 for numerical stability
        p_next = max(0.01, min(0.99, p_next))

        self.history.append({
            "timestamp": datetime.utcnow().isoformat(),
            "opportunity": self.opportunity_count + 1,
            "observation": 1 if is_correct else 0,
            "p_before": round(self.p_learned, 4),
            "p_posterior": round(p_posterior, 4),
            "p_after": round(p_next, 4),
            "context": context_label,
        })

        self.p_learned = p_next
        self.opportunity_count += 1
        return self.p_learned

    def update_dialogue_signal(self, confidence_score: float, context_label: str = "socratic_chat") -> float:
        """
        Updates mastery based on conversational evidence.
        confidence_score in [-1.0, 1.0], where > 0 indicates demonstrated mastery.
        """
        if confidence_score > 0.2:
            return self.update(is_correct=True, context_label=context_label)
        elif confidence_score < -0.2:
            return self.update(is_correct=False, context_label=context_label)
        return self.p_learned

    def to_dict(self) -> Dict[str, Any]:
        return {
            "topic": self.topic,
            "p_learned": round(self.p_learned, 4),
            "mastery_percentage": round(self.p_learned * 100.0, 1),
            "is_mastered": self.p_learned >= 0.85,
            "opportunity_count": self.opportunity_count,
            "accuracy": round(self.correct_count / self.opportunity_count, 3) if self.opportunity_count > 0 else 0.0,
            "params": self.params.to_dict(),
            "history": self.history[-10:] # Keep recent 10 events for payload brevity
        }


class LearnerModelEngine:
    """Singleton state manager for all student knowledge profiles."""
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(LearnerModelEngine, cls).__new__(cls)
            cls._instance._profiles = {}
            cls._instance._load_from_storage()
        return cls._instance

    def _load_from_storage(self):
        try:
            if STORAGE_FILE.exists():
                with open(STORAGE_FILE, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    for student_id, student_data in data.items():
                        self._profiles[student_id] = {}
                        for topic, t_data in student_data.get("topics", {}).items():
                            params = BKTParameters(
                                p_l0=t_data["params"]["p_l0"],
                                p_transit=t_data["params"]["p_transit"],
                                p_guess=t_data["params"]["p_guess"],
                                p_slip=t_data["params"]["p_slip"]
                            )
                            state = TopicMasteryState(topic, params=params, p_current=t_data["p_learned"])
                            state.opportunity_count = t_data.get("opportunity_count", 0)
                            state.correct_count = int(t_data.get("accuracy", 0.0) * state.opportunity_count)
                            self._profiles[student_id][topic] = state
        except Exception as e:
            logger.warning(f"Could not load learner profiles from storage: {e}")

    def _save_to_storage(self):
        try:
            STORAGE_FILE.parent.mkdir(parents=True, exist_ok=True)
            export_data = {}
            for s_id, topics in self._profiles.items():
                export_data[s_id] = {
                    "updated_at": datetime.utcnow().isoformat(),
                    "topics": {k: v.to_dict() for k, v in topics.items()}
                }
            with open(STORAGE_FILE, "w", encoding="utf-8") as f:
                json.dump(export_data, f, indent=2)
        except Exception as e:
            logger.warning(f"Failed to persist learner profiles: {e}")

    def get_or_create_state(self, student_id: str, topic: str) -> TopicMasteryState:
        normalized_student = student_id.lower().strip()
        normalized_topic = topic.strip()
        if normalized_student not in self._profiles:
            self._profiles[normalized_student] = {}
        if normalized_topic not in self._profiles[normalized_student]:
            self._profiles[normalized_student][normalized_topic] = TopicMasteryState(normalized_topic)
        return self._profiles[normalized_student][normalized_topic]

    def record_quiz_response(self, student_id: str, topic: str, is_correct: bool, context_label: str = "quiz_10q") -> Dict[str, Any]:
        state = self.get_or_create_state(student_id, topic)
        new_mastery = state.update(is_correct, context_label)
        self._save_to_storage()
        return {
            "student_id": student_id,
            "topic": topic,
            "p_learned": round(new_mastery, 4),
            "mastery_percentage": round(new_mastery * 100.0, 1),
            "is_mastered": new_mastery >= 0.85
        }

    def record_chat_evidence(self, student_id: str, topic: str, confidence_delta: float) -> Dict[str, Any]:
        state = self.get_or_create_state(student_id, topic)
        new_mastery = state.update_dialogue_signal(confidence_delta, context_label="chat_dialogue")
        self._save_to_storage()
        return {
            "student_id": student_id,
            "topic": topic,
            "p_learned": round(new_mastery, 4),
            "mastery_percentage": round(new_mastery * 100.0, 1),
            "is_mastered": new_mastery >= 0.85
        }

    def calibrate_diagnostic(self, student_id: str, diagnostic_results: Dict[str, bool]) -> Dict[str, Any]:
        """
        Handles new students with zero history (Requirement 4.b).
        Calibrates initial P(L_0) prior based on intake diagnostic quiz.
        """
        normalized_student = student_id.lower().strip()
        calibrated = {}
        for topic, answered_correct in diagnostic_results.items():
            # If student passes diagnostic question, start at 0.55; otherwise 0.15
            initial_prior = 0.55 if answered_correct else 0.15
            params = BKTParameters(p_l0=initial_prior)
            state = TopicMasteryState(topic, params=params, p_current=initial_prior)
            if normalized_student not in self._profiles:
                self._profiles[normalized_student] = {}
            self._profiles[normalized_student][topic] = state
            calibrated[topic] = round(initial_prior * 100.0, 1)

        self._save_to_storage()
        return {
            "student_id": student_id,
            "status": "calibrated",
            "topics_initialized": calibrated
        }

    def get_student_mastery_report(self, student_id: str) -> Dict[str, Any]:
        normalized_student = student_id.lower().strip()
        topics = self._profiles.get(normalized_student, {})

        # Default fallback baseline if student has zero practice history
        if not topics:
            default_topics = [
                "Glycolysis & Cellular Respiration",
                "Chemiosmosis & ATP Synthase",
                "Hawa Mahal & Thermal Architecture",
                "Transformer Attention Mechanisms",
                "RAG Memory & Vector Retrieval"
            ]
            for t in default_topics:
                self.get_or_create_state(student_id, t)
            topics = self._profiles.get(normalized_student, {})

        topic_dicts = [v.to_dict() for v in topics.values()]
        avg_mastery = sum(t["p_learned"] for t in topic_dicts) / len(topic_dicts) if topic_dicts else 0.25

        # Sort to isolate weak topics for targeted revision (Requirement 6.b)
        sorted_by_mastery = sorted(topic_dicts, key=lambda x: x["p_learned"])
        weak_topics = [t["topic"] for t in sorted_by_mastery if t["p_learned"] < 0.70][:3]

        return {
            "student_id": student_id,
            "overall_mastery": round(avg_mastery, 4),
            "overall_mastery_percentage": round(avg_mastery * 100.0, 1),
            "topics_tracked": len(topic_dicts),
            "weak_topics": weak_topics,
            "recommended_focus": weak_topics[0] if weak_topics else "Advanced Synthesis",
            "topics": topic_dicts
        }


# Singleton export
learner_engine = LearnerModelEngine()
