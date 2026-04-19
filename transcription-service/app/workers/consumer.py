import json
import os
import time
import traceback
from datetime import datetime

import pika

from app.config.settings import get_db
from app.services import minio_service, rabbitmq_service, whisper_service


def handle_video_uploaded(ch, method, properties, body):
    payload = None
    local_path = None

    try:
        payload = json.loads(body)
        print(f"Received video.uploaded event: {payload}")

        video_id = payload["videoId"]
        session_id = payload["sessionId"]
        candidate_id = payload["candidateId"]
        minio_url = payload["minioUrl"]

        db = get_db()

        # Prevent duplicate processing for the same uploaded video job.
        existing = db["transcripts"].find_one({"video_id": video_id}, {"_id": 1})
        if existing:
            print(f"Transcript already exists for video_id={video_id}. Skipping.")
            ch.basic_ack(delivery_tag=method.delivery_tag)
            return

        local_path = minio_service.download_video(minio_url)
        result = whisper_service.transcribe(local_path)

        transcript_doc = {
            "video_id": video_id,
            "session_id": session_id,
            "candidate_id": candidate_id,
            "full_text": result.get("text", ""),
            "language": result.get("language", "en"),
            "duration_seconds": 0,
            "segments": [
                {
                    "start_ms": int(seg["start"] * 1000),
                    "end_ms": int(seg["end"] * 1000),
                    "text": seg.get("text", ""),
                    "confidence": 1.0,
                }
                for seg in result.get("segments", [])
            ],
            "created_at": datetime.utcnow(),
        }
        inserted = db["transcripts"].insert_one(transcript_doc)

        rabbitmq_service.publish_transcript_ready(
            {
                "videoId": video_id,
                "transcriptId": str(inserted.inserted_id),
                "sessionId": session_id,
                "candidateId": candidate_id,
            }
        )

        ch.basic_ack(delivery_tag=method.delivery_tag)
        print(f"Transcription complete for video_id={video_id}")
    except Exception as exc:
        print(f"Failed to process video.uploaded event: {exc}")
        print(traceback.format_exc())

        try:
            db = get_db()
            db["transcription_failures"].insert_one(
                {
                    "payload": payload,
                    "error": str(exc),
                    "traceback": traceback.format_exc(),
                    "created_at": datetime.utcnow(),
                }
            )
        except Exception as log_exc:
            print(f"Failed to persist transcription error: {log_exc}")

        # Drop failed events to avoid poison-message retry loops.
        ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)
    finally:
        if local_path and os.path.exists(local_path):
            try:
                os.remove(local_path)
            except Exception as cleanup_exc:
                print(f"Failed to remove temp file {local_path}: {cleanup_exc}")


def start_consumer():
    url = os.getenv("RABBITMQ_URL", "amqp://localhost")
    queue_name = os.getenv("VIDEO_UPLOADED_QUEUE", "transcription.video.uploaded")

    while True:
        connection = None
        try:
            connection = pika.BlockingConnection(pika.URLParameters(url))
            channel = connection.channel()

            exchange = "video.uploaded"
            channel.exchange_declare(exchange=exchange, exchange_type="fanout", durable=True)
            channel.queue_declare(queue=queue_name, durable=True)
            channel.queue_bind(exchange=exchange, queue=queue_name)

            channel.basic_qos(prefetch_count=1)
            channel.basic_consume(
                queue=queue_name,
                on_message_callback=handle_video_uploaded,
                auto_ack=False,
            )

            print(
                f"Transcription Service: Waiting for video.uploaded events on queue '{queue_name}'..."
            )
            channel.start_consuming()
        except Exception as exc:
            print(f"RabbitMQ consumer error: {exc}. Reconnecting in 5s...")
            time.sleep(5)
        finally:
            if connection:
                try:
                    connection.close()
                except Exception:
                    pass
