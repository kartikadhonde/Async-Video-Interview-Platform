const express = require('express');
const router = express.Router();
const questionsController = require('../controllers/questions.controller');

router.get('/fixed', questionsController.getFixedQuestions);

module.exports = router;
