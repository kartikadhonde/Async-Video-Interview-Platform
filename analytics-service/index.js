// Purpose: Provide reusable service/business logic.

require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const app = require('./src/app');
const connectDB = require('./src/config/db');
const connectRabbitMQ = require('./src/config/rabbitmq');
const { startConsumers } = require('./src/consumers/events.consumer');

// Main flow: Execute core operations and return results.

const PORT = process.env.PORT || 3006;

// Function: start - Starts the process.
async function start() {
  await connectDB();
  await connectRabbitMQ();
  await startConsumers();
  app.listen(PORT);
}

start();
