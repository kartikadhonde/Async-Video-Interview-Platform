// Purpose: Define data models and schema rules.

const mongoose = require('mongoose');

// Main flow: Execute core operations and return results.

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password_hash: { type: String, required: true },
  role: { type: String, enum: ['candidate', 'reviewer', 'HR'], required: true },
  company_id: { type: String },
  created_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model('User', userSchema);
