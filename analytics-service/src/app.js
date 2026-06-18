// Purpose: Provide reusable service/business logic.

const express = require('express');
const cors = require('cors');
const analyticsRoutes = require('./routes/analytics.routes');

// Main flow: Execute core operations and return results.

const app = express();

app.use(cors());
app.use(express.json());

app.use('/analytics', analyticsRoutes);

module.exports = app;
