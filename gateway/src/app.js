require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { createProxyMiddleware } = require('http-proxy-middleware');
const { verifyToken } = require('./middleware/auth');

const app = express();

app.use(cors());
app.use(morgan('dev'));
// Do NOT use express.json() here — it consumes the body stream before the proxy can forward it.

// Public routes — no auth required
app.post('/auth/login', createProxyMiddleware({
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

// All routes below require a valid JWT
app.use(verifyToken);

// Proxy routes to downstream services
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

module.exports = app;
