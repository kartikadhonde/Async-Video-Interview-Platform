require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const express = require('express');
const { startConsumers } = require('./src/consumers/events.consumer');

const PORT = process.env.PORT || 3005;

const app = express();
app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.listen(PORT, () => console.log(`Notification Service running on port ${PORT}`));

startConsumers();
