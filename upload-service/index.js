// Purpose: Provide reusable service/business logic.

require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const app = require('./src/app');
const connectDB = require('./src/config/db');
const connectRabbitMQ = require('./src/config/rabbitmq');

// Main flow: Execute core operations and return results.

const PORT = process.env.PORT || 3001;

// Function: start - Starts the process.
async function start() {
  await connectDB();
  await connectRabbitMQ();
  app.listen(PORT);
}

start();
