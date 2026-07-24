// Purpose: Provide reusable service/business logic.

require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const app = require('./src/app');
const connectDB = require('./src/config/db');
const connectRabbitMQ = require('./src/config/rabbitmq');
const { startConsumers } = require('./src/consumers/events.consumer');

// Global process safety: log and exit on unexpected errors to allow supervisors to restart
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection at:', reason);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception thrown', err);
  process.exit(1);
});

// Main flow: Execute core operations and return results.

const PORT = process.env.PORT || 3006;

// Function: start - Starts the process.
async function start() {
  try {
    await connectDB();
    await connectRabbitMQ();
    await startConsumers();
    const server = app.listen(PORT, () => {
      console.log(`analytics-service listening on port ${PORT}`);
    });
    return server;
  } catch (err) {
    console.error('Failed to start analytics-service', err);
    process.exit(1);
  }
}

start().catch((err) => {
  console.error('Startup error', err);
  process.exit(1);
});
