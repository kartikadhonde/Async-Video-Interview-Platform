import os
import json
import time
import pika
from app.services import whisper_service, minio_service, rabbitmq_service
from app.config.settings import get_db


def handle_video_uploaded(ch, method, properties, body):
    payload = json.loads(body)
    print(f"Received video.uploaded event: {payload}")

    video_id = payload['videoId']
    session_id = payload['sessionId']
    candidate_id = payload['candidateId']
    minio_url = payload['minioUrl']

    # Download video from MinIO
    local_path = minio_service.download_video(minio_url)

    # Transcribe with Whisper
    result = whisper_service.transcribe(local_path)

    # Clean up local file
    os.remove(local_path)

    # Save to MongoDB
    db = get_db()
    transcript_doc = {
        'video_id': video_id,
        'full_text': result['text'],
        'language': result.get('language', 'en'),
        'duration_seconds': 0,
        'segments': [
            {
                'start_ms': int(seg['start'] * 1000),
                'end_ms': int(seg['end'] * 1000),
                'text': seg['text'],
                'confidence': 1.0,
            }
            for seg in result.get('segments', [])
        ],
    }
    inserted = db['transcripts'].insert_one(transcript_doc)

    # Publish transcript.ready event
    rabbitmq_service.publish_transcript_ready({
        'videoId': video_id,
        'transcriptId': str(inserted.inserted_id),
        'sessionId': session_id,
        'candidateId': candidate_id,
    })

    ch.basic_ack(delivery_tag=method.delivery_tag)


def start_consumer():
    url = os.getenv('RABBITMQ_URL', 'amqp://localhost')

    for attempt in range(10):
        try:
            connection = pika.BlockingConnection(pika.URLParameters(url))
            channel = connection.channel()

            exchange = 'video.uploaded'
            channel.exchange_declare(exchange=exchange, exchange_type='fanout', durable=True)

            result = channel.queue_declare(queue='', exclusive=True)
            queue_name = result.method.queue
            channel.queue_bind(exchange=exchange, queue=queue_name)

            channel.basic_consume(queue=queue_name, on_message_callback=handle_video_uploaded)
            print("Transcription Service: Waiting for video.uploaded events...")
            channel.start_consuming()
            break
        except Exception as e:
            print(f"RabbitMQ connection attempt {attempt + 1} failed: {e}. Retrying in 5s...")
            time.sleep(5)
