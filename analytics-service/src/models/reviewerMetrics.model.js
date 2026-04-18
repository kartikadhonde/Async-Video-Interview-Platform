const mongoose = require('mongoose');

const reviewerMetricsSchema = new mongoose.Schema({
  reviewer_id: { type: String, required: true },
  session_id: { type: String, required: true },
  video_id: { type: String },
  review_duration_seconds: { type: Number, default: 0 },
  comment_count: { type: Number, default: 0 },
  timestamp_spread_score: { type: Number, default: 0 },
  turnaround_hours: { type: Number, default: 0 },
  computed_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model('ReviewerMetrics', reviewerMetricsSchema);
