// Purpose: Provide reusable service/business logic.

const express = require('express');
const cors = require('cors');
const schedulingRoutes = require('./routes/scheduling.routes');
const authRoutes = require('./routes/auth.routes');

// Main flow: Execute core operations and return results.

const app = express();

app.use(cors());
app.use(express.json());

app.use('/auth', authRoutes);
app.use('/scheduling', schedulingRoutes);

module.exports = app;
