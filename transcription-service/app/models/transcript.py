from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


class TranscriptSegment(BaseModel):
    start_ms: int
    end_ms: int
    text: str
    confidence: float


class Transcript(BaseModel):
    video_id: str
    full_text: str
    language: str
    duration_seconds: float
    segments: List[TranscriptSegment] = []
    created_at: datetime = datetime.utcnow()
