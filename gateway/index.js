// Purpose: Forward and coordinate gateway requests.

require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const app = require('./src/app');

// Main flow: Initialize dependencies and run module logic.

const PORT = process.env.PORT || 3000;

process.on('unhandledRejection', (reason) => {
    console.error('Unhandled Rejection at:', reason);
    process.exit(1);
});

process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception thrown', err);
    process.exit(1);
});

try {
    app.listen(PORT, () => {
        console.log(`gateway listening on port ${PORT}`);
    });
} catch (err) {
    console.error('Failed to start gateway', err);
    process.exit(1);
}
