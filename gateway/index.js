// Purpose: Forward and coordinate gateway requests.

require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const app = require('./src/app');

// Main flow: Initialize dependencies and run module logic.

const PORT = process.env.PORT || 3000;

app.listen(PORT);
