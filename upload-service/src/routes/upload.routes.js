const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/upload.controller');
const multer = require('multer');

const upload = multer({ storage: multer.memoryStorage() });

// POST /upload/video — receive a video chunk
router.post('/video', upload.single('chunk'), uploadController.uploadChunk);

// GET /upload/sessions/:sessionId/candidates — latest completed video per candidate
router.get('/sessions/:sessionId/candidates', uploadController.getLatestSessionVideosByCandidate);

// GET /upload/sessions/:sessionId/candidates/:candidateId/latest-video — latest completed video for candidate
router.get('/sessions/:sessionId/candidates/:candidateId/latest-video', uploadController.getLatestVideoByCandidate);

// GET /upload/sessions/:sessionId/latest-video — get latest completed video for a session
router.get('/sessions/:sessionId/latest-video', uploadController.getLatestSessionVideo);

// GET /upload/:jobId — get upload job status
router.get('/:jobId', uploadController.getJob);

module.exports = router;
