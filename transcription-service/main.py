# Purpose: Provide reusable service/business logic.

import threading
from dotenv import load_dotenv

# Main flow: Execute core operations and return results.

load_dotenv()

from fastapi import FastAPI
from app.routes import transcription
from app.workers.consumer import start_consumer

app = FastAPI(title="Transcription Service")

app.include_router(transcription.router, prefix="/transcription")


@app.on_event("startup")
# Function: startup_event - Handles startup event.
def startup_event():
    thread = threading.Thread(target=start_consumer, daemon=True)
    thread.start()
