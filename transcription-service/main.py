import threading
from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI
from app.routes import transcription
from app.workers.consumer import start_consumer

app = FastAPI(title="Transcription Service")

app.include_router(transcription.router, prefix="/transcription")


@app.get("/health")
def health():
    return {"status": "ok"}


@app.on_event("startup")
def startup_event():
    thread = threading.Thread(target=start_consumer, daemon=True)
    thread.start()
    print("RabbitMQ consumer thread started")
