// Purpose: Provide reusable service/business logic.

require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const http = require('http');
const app = require('./src/app');
const connectDB = require('./src/config/db');
const connectRabbitMQ = require('./src/config/rabbitmq');
const { initSocket } = require('./src/services/socket.service');

// Main flow: Execute core operations and return results.

const PORT = process.env.PORT || 3003;

// Function: start - Starts the process.
async function start() {
  await connectDB();
  await connectRabbitMQ();

  const server = http.createServer(app);
  initSocket(server);

  server.listen(PORT);
}

start();
