const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analytics.controller');

router.get('/candidates/:candidateId', analyticsController.getCandidateMetrics);
router.get('/sessions/:sessionId/candidates', analyticsController.getSessionCandidates);
router.get('/reviewers/:reviewerId', analyticsController.getReviewerMetrics);

module.exports = router;
