require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const app = require('./src/app');
const connectDB = require('./src/config/db');

const PORT = process.env.PORT || 3004;

async function start() {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Scheduling Service running on port ${PORT}`);
  });
}

start();
