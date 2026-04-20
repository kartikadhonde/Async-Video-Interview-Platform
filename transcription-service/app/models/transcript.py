from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


class TranscriptSegment(BaseModel):
    start_ms: int
    end_ms: int
    text: str
    confidence: float


class QuestionBoundary(BaseModel):
    question_id: Optional[str] = None
    question_text: Optional[str] = None
    started_at_ms: int
    ended_at_ms: Optional[int] = None


class Transcript(BaseModel):
    video_id: str
    full_text: str
    language: str
    duration_seconds: float
    segments: List[TranscriptSegment] = []
    question_boundaries: List[QuestionBoundary] = []
    created_at: datetime = datetime.utcnow()
