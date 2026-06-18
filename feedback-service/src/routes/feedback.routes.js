// Purpose: Define endpoint routes and route wiring.

const express = require('express');
// Main flow: Map routes to handlers and middleware.

const router = express.Router();
const feedbackController = require('../controllers/feedback.controller');

// POST /feedback/comments — post a new comment
router.post('/comments', feedbackController.postComment);

// GET /feedback/comments/:sessionId — get all comments for a session
router.get('/comments/:sessionId', feedbackController.getComments);

// POST /feedback/ratings — upsert reviewer rating for a candidate
router.post('/ratings', feedbackController.upsertRating);

// GET /feedback/ratings/:sessionId — list ratings for a session (optional query: candidate_id, reviewer_id)
router.get('/ratings/:sessionId', feedbackController.getRatings);

// POST /feedback/sessions/:sessionId/complete — mark review as done
router.post('/sessions/:sessionId/complete', feedbackController.completeReview);

module.exports = router;
