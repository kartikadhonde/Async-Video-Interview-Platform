// Purpose: Define endpoint routes and route wiring.

const express = require('express');
// Main flow: Map routes to handlers and middleware.

const router = express.Router();
const schedulingController = require('../controllers/scheduling.controller');

// Sessions
router.post('/sessions', schedulingController.createSession);
router.get('/sessions', schedulingController.listSessions);
router.get('/sessions/:sessionId', schedulingController.getSession);
router.get('/sessions/:sessionId/assignments', schedulingController.listAssignmentsBySession);
router.get('/reviewers', schedulingController.listReviewersByIds);

// Question sets
router.post('/question-sets', schedulingController.createQuestionSet);
router.get('/question-sets/:id', schedulingController.getQuestionSet);

// Candidate assignments
router.post('/assignments', schedulingController.createAssignment);
router.get('/assignments/:token', schedulingController.getAssignmentByToken);

module.exports = router;
