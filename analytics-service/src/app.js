const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const analyticsRoutes = require('./routes/analytics.routes');

const app = express();

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

app.use('/analytics', analyticsRoutes);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

module.exports = app;
