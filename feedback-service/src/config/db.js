// Purpose: Load and expose configuration values.

const mongoose = require('mongoose');

// Main flow: Execute core operations and return results.

// Function: connectDB - Connects to db.
async function connectDB() {
  await mongoose.connect(process.env.MONGO_URI);
}

module.exports = connectDB;
