from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


class TranscriptSegment(BaseModel):
    start_ms: int
    end_ms: int
    text: str
    confidence: float


class QuestionBoundary(BaseModel):
    question_index: int
    question_text: Optional[str] = None
    start_ms: int
    end_ms: int


class Transcript(BaseModel):
    video_id: str
    full_text: str
    language: str
    duration_seconds: float
    segments: List[TranscriptSegment] = []
    question_boundaries: List[QuestionBoundary] = []
    created_at: datetime = datetime.utcnow()
