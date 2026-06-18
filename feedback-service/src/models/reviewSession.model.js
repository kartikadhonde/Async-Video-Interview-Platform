// Purpose: Define data models and schema rules.

const mongoose = require('mongoose');

// Main flow: Execute core operations and return results.

const reviewSessionSchema = new mongoose.Schema({
  session_id: { type: String, required: true },
  reviewer_id: { type: String, required: true },
  started_at: { type: Date, default: Date.now },
  completed_at: { type: Date },
  duration_seconds: { type: Number },
});

module.exports = mongoose.model('ReviewSession', reviewSessionSchema);
