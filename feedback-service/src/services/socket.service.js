// Purpose: Provide reusable service/business logic.

const { Server } = require('socket.io');

// Main flow: Execute core operations and return results.

let io;

// Function: initSocket - Initializes socket.
function initSocket(server) {
  io = new Server(server, {
    cors: { origin: '*' },
  });

  io.on('connection', (socket) => {
    socket.on('join-session', (sessionId) => {
      socket.join(sessionId);
    });

    socket.on('post-comment', (data) => {
      // Broadcast to all other reviewers in the same session room
      socket.to(data.sessionId).emit('new-comment', data);
    });

    socket.on('disconnect', () => {
    });
  });
}

// Function: getIO - Returns io.
function getIO() {
  if (!io) throw new Error('Socket.io not initialised');
  return io;
}

module.exports = { initSocket, getIO };
