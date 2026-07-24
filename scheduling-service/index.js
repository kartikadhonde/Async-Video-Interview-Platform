// Purpose: Provide reusable service/business logic.

require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const app = require('./src/app');
const connectDB = require('./src/config/db');

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection at:', reason);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception thrown', err);
  process.exit(1);
});

// Main flow: Execute core operations and return results.

const PORT = process.env.PORT || 3004;

// Function: start - Starts the process.
async function start() {
  try {
    await connectDB();
    const server = app.listen(PORT, () => {
      console.log(`scheduling-service listening on port ${PORT}`);
    });
    return server;
  } catch (err) {
    console.error('Failed to start scheduling-service', err);
    process.exit(1);
  }
}

start().catch((err) => {
  console.error('Startup error', err);
  process.exit(1);
});
