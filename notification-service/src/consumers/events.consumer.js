const amqp = require('amqplib');
const { sendEmail } = require('../services/email.service');

async function bindAndConsume(channel, exchange, handler) {
  await channel.assertExchange(exchange, 'fanout', { durable: true });
  const q = await channel.assertQueue('', { exclusive: true });
  await channel.bindQueue(q.queue, exchange, '');
  channel.consume(q.queue, async (msg) => {
    if (!msg) return;
    const payload = JSON.parse(msg.content.toString());
    await handler(payload);
    channel.ack(msg);
  });
}

async function startConsumers(retries = 10) {
  for (let i = 0; i < retries; i++) {
    try {
      const connection = await amqp.connect(process.env.RABBITMQ_URL);
      const channel = await connection.createChannel();

      await bindAndConsume(channel, 'transcript.ready', async (payload) => {
        console.log('transcript.ready received:', payload);
        // TODO: look up reviewer email and send notification
        // await sendEmail({ to: reviewerEmail, subject: 'Transcript ready', text: '...' });
      });

      await bindAndConsume(channel, 'feedback.posted', async (payload) => {
        console.log('feedback.posted received:', payload);
        // TODO: look up candidate email and notify
      });

      console.log('Notification Service: RabbitMQ consumers started');
      return;
    } catch (err) {
      console.error(`Consumer connection attempt ${i + 1} failed. Retrying in 5s...`);
      await new Promise(res => setTimeout(res, 5000));
    }
  }
  throw new Error('Failed to start consumers');
}

module.exports = { startConsumers };
