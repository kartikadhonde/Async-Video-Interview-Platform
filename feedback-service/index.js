// Purpose: Provide reusable service/business logic.

require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const http = require('http');
const app = require('./src/app');
const connectDB = require('./src/config/db');
const connectRabbitMQ = require('./src/config/rabbitmq');
const { initSocket } = require('./src/services/socket.service');

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection at:', reason);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception thrown', err);
  process.exit(1);
});

// Main flow: Execute core operations and return results.

const PORT = process.env.PORT || 3003;

// Function: start - Starts the process.
async function start() {
  try {
    await connectDB();
    await connectRabbitMQ();

    const server = http.createServer(app);
    initSocket(server);

    server.listen(PORT, () => {
      console.log(`feedback-service listening on port ${PORT}`);
    });
    return server;
  } catch (err) {
    console.error('Failed to start feedback-service', err);
    process.exit(1);
  }
}

start().catch((err) => {
  console.error('Startup error', err);
  process.exit(1);
});
