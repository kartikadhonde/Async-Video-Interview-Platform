from fastapi import APIRouter, HTTPException
from app.config.settings import get_db
from bson import ObjectId

router = APIRouter()


@router.get("/{video_id}")
def get_transcript(video_id: str):
    db = get_db()
    doc = db['transcripts'].find_one({'video_id': video_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Transcript not found")
    doc['_id'] = str(doc['_id'])
    return doc
