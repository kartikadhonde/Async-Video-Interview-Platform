const { getChannel } = require('../config/rabbitmq');

async function publishEvent(exchangeName, payload) {
  const channel = getChannel();
  await channel.assertExchange(exchangeName, 'fanout', { durable: true });
  channel.publish(exchangeName, '', Buffer.from(JSON.stringify(payload)));
  console.log(`Published ${exchangeName}:`, payload);
}

module.exports = { publishEvent };
