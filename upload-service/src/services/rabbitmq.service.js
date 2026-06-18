// Purpose: Provide reusable service/business logic.

const { getChannel } = require('../config/rabbitmq');

// Main flow: Execute core operations and return results.

const EXCHANGE = 'video.uploaded';

// Function: publishVideoUploaded - Publishes the final video upload event to RabbitMQ.
async function publishVideoUploaded(payload) {
  const channel = getChannel();
  await channel.assertExchange(EXCHANGE, 'fanout', { durable: true });
  channel.publish(EXCHANGE, '', Buffer.from(JSON.stringify(payload)));
}

module.exports = { publishVideoUploaded };
