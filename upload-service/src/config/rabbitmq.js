const amqp = require('amqplib');

let channel;

async function connectRabbitMQ(retries = 5) {
  for (let i = 0; i < retries; i++) {
    try {
      const connection = await amqp.connect(process.env.RABBITMQ_URL);
      channel = await connection.createChannel();
      console.log('Upload Service: Connected to RabbitMQ');
      return;
    } catch (err) {
      console.error(`RabbitMQ connection attempt ${i + 1} failed. Retrying in 5s...`);
      await new Promise(res => setTimeout(res, 5000));
    }
  }
  throw new Error('Failed to connect to RabbitMQ after retries');
}

function getChannel() {
  if (!channel) throw new Error('RabbitMQ channel not initialised');
  return channel;
}

module.exports = connectRabbitMQ;
module.exports.getChannel = getChannel;
