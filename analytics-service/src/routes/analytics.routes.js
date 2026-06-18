// Purpose: Define endpoint routes and route wiring.

const express = require('express');
// Main flow: Map routes to handlers and middleware.

const router = express.Router();
const analyticsController = require('../controllers/analytics.controller');

router.get('/candidates/:candidateId', analyticsController.getCandidateMetrics);
router.get('/sessions/:sessionId/candidates', analyticsController.getSessionCandidates);
router.get('/reviewers/:reviewerId', analyticsController.getReviewerMetrics);

module.exports = router;
