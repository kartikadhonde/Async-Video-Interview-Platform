require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const app = require('./src/app');
const connectDB = require('./src/config/db');
const connectRabbitMQ = require('./src/config/rabbitmq');
const { startConsumers } = require('./src/consumers/events.consumer');

const PORT = process.env.PORT || 3006;

async function start() {
  await connectDB();
  await connectRabbitMQ();
  await startConsumers();
  app.listen(PORT, () => {
    console.log(`Analytics Service running on port ${PORT}`);
  });
}

start();
