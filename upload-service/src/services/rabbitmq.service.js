const { getChannel } = require('../config/rabbitmq');

const EXCHANGE = 'video.uploaded';

async function publishVideoUploaded(payload) {
  const channel = getChannel();
  await channel.assertExchange(EXCHANGE, 'fanout', { durable: true });
  channel.publish(EXCHANGE, '', Buffer.from(JSON.stringify(payload)));
  console.log('Published video.uploaded event:', payload);
}

module.exports = { publishVideoUploaded };
