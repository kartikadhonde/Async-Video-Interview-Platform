# Purpose: Define endpoint routes and route wiring.

from fastapi import APIRouter, HTTPException
from app.config.settings import get_db

# Main flow: Map routes to handlers and middleware.

router = APIRouter()


@router.get("/by-video/{video_id}")
# Function: get_transcript_by_video - Returns transcript by video.
def get_transcript_by_video(video_id: str):
    db = get_db()
    doc = db['transcripts'].find_one({'video_id': video_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Transcript not found")
    doc['_id'] = str(doc['_id'])
    return doc


@router.get("/by-session/{session_id}")
# Function: get_transcripts_by_session - Returns transcripts by session.
def get_transcripts_by_session(session_id: str):
    db = get_db()
    docs = list(db['transcripts'].find({'session_id': session_id}))
    for d in docs:
        d['_id'] = str(d['_id'])
    return docs


# Keep original route for backwards compatibility
@router.get("/{video_id}")
# Function: get_transcript - Returns transcript.
def get_transcript(video_id: str):
    return get_transcript_by_video(video_id)
