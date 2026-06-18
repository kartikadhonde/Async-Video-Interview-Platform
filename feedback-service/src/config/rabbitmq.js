// Purpose: Load and expose configuration values.

const amqp = require('amqplib');

// Main flow: Execute core operations and return results.

let channel;

// Function: connectRabbitMQ - Connects to rabbit mq.
async function connectRabbitMQ(retries = 5) {
  for (let i = 0; i < retries; i++) {
    try {
      const connection = await amqp.connect(process.env.RABBITMQ_URL);
      channel = await connection.createChannel();
      return;
    } catch {
      await new Promise(res => setTimeout(res, 5000));
    }
  }
  throw new Error('Failed to connect to RabbitMQ');
}

// Function: getChannel - Returns channel.
function getChannel() {
  if (!channel) throw new Error('RabbitMQ channel not initialised');
  return channel;
}

module.exports = connectRabbitMQ;
module.exports.getChannel = getChannel;
