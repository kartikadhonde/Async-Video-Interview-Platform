const mongoose = require('mongoose');

const reviewSessionSchema = new mongoose.Schema({
  session_id: { type: String, required: true },
  reviewer_id: { type: String, required: true },
  started_at: { type: Date, default: Date.now },
  completed_at: { type: Date },
  duration_seconds: { type: Number },
});

module.exports = mongoose.model('ReviewSession', reviewSessionSchema);
