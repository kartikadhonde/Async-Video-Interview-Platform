const { Server } = require('socket.io');

let io;

function initSocket(server) {
  io = new Server(server, {
    cors: { origin: '*' },
  });

  io.on('connection', (socket) => {
    console.log(`Reviewer connected: ${socket.id}`);

    socket.on('join-session', (sessionId) => {
      socket.join(sessionId);
      console.log(`${socket.id} joined session ${sessionId}`);
    });

    socket.on('post-comment', (data) => {
      // Broadcast to all other reviewers in the same session room
      socket.to(data.sessionId).emit('new-comment', data);
    });

    socket.on('disconnect', () => {
      console.log(`Reviewer disconnected: ${socket.id}`);
    });
  });
}

function getIO() {
  if (!io) throw new Error('Socket.io not initialised');
  return io;
}

module.exports = { initSocket, getIO };
