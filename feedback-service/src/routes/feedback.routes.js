const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedback.controller');

// POST /feedback/comments — post a new comment
router.post('/comments', feedbackController.postComment);

// GET /feedback/comments/:sessionId — get all comments for a session
router.get('/comments/:sessionId', feedbackController.getComments);

// POST /feedback/sessions/:sessionId/complete — mark review as done
router.post('/sessions/:sessionId/complete', feedbackController.completeReview);

module.exports = router;
