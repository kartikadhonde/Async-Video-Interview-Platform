// Purpose: Provide reusable service/business logic.

require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const app = require('./src/app');
const connectDB = require('./src/config/db');

// Main flow: Execute core operations and return results.

const PORT = process.env.PORT || 3004;

// Function: start - Starts the process.
async function start() {
  await connectDB();
  app.listen(PORT);
}

start();
