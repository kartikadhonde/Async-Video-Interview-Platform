const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const schedulingRoutes = require('./routes/scheduling.routes');
const authRoutes = require('./routes/auth.routes');

const app = express();

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

app.use('/auth', authRoutes);
app.use('/scheduling', schedulingRoutes);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

module.exports = app;
