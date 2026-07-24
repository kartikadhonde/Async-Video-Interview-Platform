// Purpose: Provide reusable service/business logic.

require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const app = require('./src/app');
const connectDB = require('./src/config/db');
const connectRabbitMQ = require('./src/config/rabbitmq');

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection at:', reason);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception thrown', err);
  process.exit(1);
});

// Main flow: Execute core operations and return results.

const PORT = process.env.PORT || 3001;

// Function: start - Starts the process.
async function start() {
  try {
    await connectDB();
    await connectRabbitMQ();
    const server = app.listen(PORT, () => {
      console.log(`upload-service listening on port ${PORT}`);
    });
    return server;
  } catch (err) {
    console.error('Failed to start upload-service', err);
    process.exit(1);
  }
}

start().catch((err) => {
  console.error('Startup error', err);
  process.exit(1);
});
