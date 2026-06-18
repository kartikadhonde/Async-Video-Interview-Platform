// Purpose: Define data models and schema rules.

const mongoose = require('mongoose');

// Main flow: Execute core operations and return results.

const candidateMetricsSchema = new mongoose.Schema({
  candidate_id: { type: String, required: true },
  session_id: { type: String, required: true },
  filler_word_count: { type: Number, default: 0 },
  keyword_match_score: { type: Number, default: 0 },
  talk_time_seconds: { type: Number, default: 0 },
  sentiment_score: { type: Number, default: 0 },
  overall_rank: { type: Number },
  computed_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model('CandidateMetrics', candidateMetricsSchema);
