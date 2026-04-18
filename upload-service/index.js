require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const app = require('./src/app');
const connectDB = require('./src/config/db');
const connectRabbitMQ = require('./src/config/rabbitmq');

const PORT = process.env.PORT || 3001;

async function start() {
  await connectDB();
  await connectRabbitMQ();
  app.listen(PORT, () => {
    console.log(`Upload Service running on port ${PORT}`);
  });
}

start();
