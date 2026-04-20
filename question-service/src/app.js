const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const questionRoutes = require('./routes/questions.routes');

const app = express();

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

app.use('/questions', questionRoutes);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

module.exports = app;
