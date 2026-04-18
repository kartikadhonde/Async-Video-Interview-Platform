require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const http = require('http');
const app = require('./src/app');
const connectDB = require('./src/config/db');
const connectRabbitMQ = require('./src/config/rabbitmq');
const { initSocket } = require('./src/services/socket.service');

const PORT = process.env.PORT || 3003;

async function start() {
  await connectDB();
  await connectRabbitMQ();

  const server = http.createServer(app);
  initSocket(server);

  server.listen(PORT, () => {
    console.log(`Feedback Service running on port ${PORT}`);
    console.log('Socket.io ready');
  });
}

start();
