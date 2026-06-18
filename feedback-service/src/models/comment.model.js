// Purpose: Define data models and schema rules.

const mongoose = require('mongoose');

// Main flow: Execute core operations and return results.

const commentSchema = new mongoose.Schema({
  session_id: { type: String, required: true },
  candidate_id: { type: String },
  reviewer_id: { type: String, required: true },
  video_timestamp_ms: { type: Number, required: true },
  text: { type: String, required: true },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Comment', commentSchema);
