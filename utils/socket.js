import { Server } from 'socket.io';

let io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: '*', // Allow all connections for dev/testing
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log(`New Client Connected: ${socket.id}`);

    // Event: User joins their specific family group room
    socket.on('join_family', (familyId) => {
      if (familyId) {
        socket.join(familyId);
        console.log(`Socket ${socket.id} joined family room: ${familyId}`);
      }
    });

    // Event: Disconnect
    socket.on('disconnect', () => {
      console.log('Client disconnected', socket.id);
    });
  });

  return io;
};

// Helper to get IO instance if needed elsewhere
const getIO = () => {
  if (!io) {
    throw new Error('Socket.io is not initialized!');
  }
  return io;
};

export { initSocket, getIO };