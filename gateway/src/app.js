// Purpose: Forward and coordinate gateway requests.

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');
const { verifyToken } = require('./middleware/auth');

// Main flow: Initialize dependencies and run module logic.

const app = express();
// Fallback keeps local dev working even when env is not set.
const QUESTION_SERVICE_URL = process.env.QUESTION_SERVICE_URL || 'http://localhost:3008';

app.use(cors());
// Do NOT use express.json() here — it consumes the body stream before the proxy can forward it.

// Public routes — no auth required
app.post('/auth/login', createProxyMiddleware({
  target: process.env.SCHEDULING_SERVICE_URL,
  changeOrigin: true,
}));

app.post('/auth/reviewer-login', createProxyMiddleware({
  target: process.env.SCHEDULING_SERVICE_URL,
  changeOrigin: true,
}));

app.post('/auth/register', createProxyMiddleware({
  target: process.env.SCHEDULING_SERVICE_URL,
  changeOrigin: true,
}));

app.post('/auth/invite-login', createProxyMiddleware({
  target: process.env.SCHEDULING_SERVICE_URL,
  changeOrigin: true,
}));

// Candidate invite-link routes are intentionally public.
app.get('/scheduling/assignments/:token', createProxyMiddleware({
  target: process.env.SCHEDULING_SERVICE_URL,
  changeOrigin: true,
}));

app.get('/scheduling/sessions/:sessionId', createProxyMiddleware({
  target: process.env.SCHEDULING_SERVICE_URL,
  changeOrigin: true,
}));

app.get('/scheduling/question-sets/:id', createProxyMiddleware({
  target: process.env.SCHEDULING_SERVICE_URL,
  changeOrigin: true,
}));

app.get('/questions/fixed', createProxyMiddleware({
  target: QUESTION_SERVICE_URL,
  changeOrigin: true,
}));

// All routes below require a valid JWT
app.use(verifyToken);

// Protected downstream proxies: gateway enforces auth, services handle domain logic.
app.use('/upload', createProxyMiddleware({
  target: process.env.UPLOAD_SERVICE_URL,
  changeOrigin: true,
}));

app.use('/transcription', createProxyMiddleware({
  target: process.env.TRANSCRIPTION_SERVICE_URL,
  changeOrigin: true,
}));

app.use('/feedback', createProxyMiddleware({
  target: process.env.FEEDBACK_SERVICE_URL,
  changeOrigin: true,
}));

app.use('/scheduling', createProxyMiddleware({
  target: process.env.SCHEDULING_SERVICE_URL,
  changeOrigin: true,
}));

app.use('/analytics', createProxyMiddleware({
  target: process.env.ANALYTICS_SERVICE_URL,
  changeOrigin: true,
}));

app.use('/questions', createProxyMiddleware({
  target: QUESTION_SERVICE_URL,
  changeOrigin: true,
}));

module.exports = app;
