// Purpose: Provide reusable service/business logic.

const express = require('express');
const cors = require('cors');
const uploadRoutes = require('./routes/upload.routes');

// Main flow: Execute core operations and return results.

const app = express();

app.use(cors());
app.use(express.json());

app.use('/upload', uploadRoutes);

module.exports = app;
