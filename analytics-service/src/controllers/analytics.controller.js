// Purpose: Handle requests and shape responses.

const CandidateMetrics = require('../models/candidateMetrics.model');
const ReviewerMetrics = require('../models/reviewerMetrics.model');

// Main flow: Validate input, call services, return output.

// Function: getCandidateMetrics - Returns candidate metrics.
async function getCandidateMetrics(req, res) {
  try {
    const metrics = await CandidateMetrics.find({ candidate_id: req.params.candidateId });
    res.json(metrics);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch candidate metrics' });
  }
}

// Function: getSessionCandidates - Returns session candidates.
async function getSessionCandidates(req, res) {
  try {
    const metrics = await CandidateMetrics.find({ session_id: req.params.sessionId }).sort({ overall_rank: 1 });
    res.json(metrics);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch session candidates' });
  }
}

// Function: getReviewerMetrics - Returns reviewer metrics.
async function getReviewerMetrics(req, res) {
  try {
    const metrics = await ReviewerMetrics.find({ reviewer_id: req.params.reviewerId });
    res.json(metrics);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch reviewer metrics' });
  }
}

module.exports = { getCandidateMetrics, getSessionCandidates, getReviewerMetrics };
