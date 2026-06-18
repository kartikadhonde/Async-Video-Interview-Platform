# Purpose: Provide reusable service/business logic.

import os
import json
import pika


# Main flow: Execute core operations and return results.

# Function: publish_transcript_ready - Publishes transcript ready.
def publish_transcript_ready(payload: dict):
    url = os.getenv('RABBITMQ_URL', 'amqp://localhost')
    connection = pika.BlockingConnection(pika.URLParameters(url))
    channel = connection.channel()

    exchange = 'transcript.ready'
    channel.exchange_declare(exchange=exchange, exchange_type='fanout', durable=True)
    channel.basic_publish(
        exchange=exchange,
        routing_key='',
        body=json.dumps(payload),
    )
    connection.close()
