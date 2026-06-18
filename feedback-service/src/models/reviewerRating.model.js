// Purpose: Define data models and schema rules.

const mongoose = require('mongoose');

// Main flow: Execute core operations and return results.

const reviewerRatingSchema = new mongoose.Schema({
    session_id: { type: String, required: true },
    candidate_id: { type: String, required: true },
    reviewer_id: { type: String, required: true },
    communication_score: { type: Number, required: true, min: 0, max: 10 },
    technical_score: { type: Number, required: true, min: 0, max: 10 },
    problem_solving_score: { type: Number, required: true, min: 0, max: 10 },
    confidence_score: { type: Number, required: true, min: 0, max: 10 },
    culture_fit_score: { type: Number, required: true, min: 0, max: 10 },
    overall_score: { type: Number, required: true, min: 0, max: 10 },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
});

reviewerRatingSchema.index({ session_id: 1, candidate_id: 1, reviewer_id: 1 }, { unique: true });

module.exports = mongoose.model('ReviewerRating', reviewerRatingSchema);
