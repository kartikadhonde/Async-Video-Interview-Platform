// Purpose: Define endpoint routes and route wiring.

const express = require('express');
// Main flow: Map routes to handlers and middleware.

const router = express.Router();
const authController = require('../controllers/auth.controller');

router.post('/login', authController.login);
router.post('/reviewer-login', authController.reviewerLogin);
router.post('/register', authController.register);
router.post('/invite-login', authController.inviteLogin);

module.exports = router;
