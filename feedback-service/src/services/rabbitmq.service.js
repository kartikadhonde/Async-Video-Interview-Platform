// Purpose: Provide reusable service/business logic.

const { getChannel } = require('../config/rabbitmq');

// Main flow: Execute core operations and return results.

// Function: publishEvent - Publishes event.
async function publishEvent(exchangeName, payload) {
  const channel = getChannel();
  await channel.assertExchange(exchangeName, 'fanout', { durable: true });
  channel.publish(exchangeName, '', Buffer.from(JSON.stringify(payload)));
}

module.exports = { publishEvent };
