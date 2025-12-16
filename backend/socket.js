const { Server } = require("socket.io");

let ioInstance = null;

function initializeSocket(server) {
  if (ioInstance) {
    return ioInstance;
  }

  ioInstance = new Server(server, {
    cors: {
      origin: ["http://localhost:8080", "http://localhost:5173"],
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  // Store active rooms and users
  const rooms = new Map();

  ioInstance.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Join a room (session)
    socket.on('join-room', (roomId, userId, userName) => {
      socket.join(roomId);
      
      if (!rooms.has(roomId)) {
        rooms.set(roomId, new Map());
      }
      
      const room = rooms.get(roomId);
      room.set(socket.id, { userId, userName });
      
      // Notify others in the room
      socket.to(roomId).emit('user-joined', { socketId: socket.id, userId, userName });
      
      // Send list of existing users to the new user
      const existingUsers = Array.from(room.entries())
        .filter(([id]) => id !== socket.id)
        .map(([id, user]) => ({ socketId: id, ...user }));
      
      socket.emit('existing-users', existingUsers);
      
      console.log(`User ${userName} joined room ${roomId}`);
    });

    // WebRTC signaling - offer
    socket.on('offer', (data) => {
      socket.to(data.target).emit('offer', {
        offer: data.offer,
        sender: socket.id,
      });
    });

    // WebRTC signaling - answer
    socket.on('answer', (data) => {
      socket.to(data.target).emit('answer', {
        answer: data.answer,
        sender: socket.id,
      });
    });

    // WebRTC signaling - ICE candidate
    socket.on('ice-candidate', (data) => {
      socket.to(data.target).emit('ice-candidate', {
        candidate: data.candidate,
        sender: socket.id,
      });
    });

    // Screen sharing
    socket.on('start-screen-share', (data) => {
      socket.to(data.roomId).emit('user-screen-sharing', {
        socketId: socket.id,
        isSharing: true,
      });
    });

    socket.on('stop-screen-share', (data) => {
      socket.to(data.roomId).emit('user-screen-sharing', {
        socketId: socket.id,
        isSharing: false,
      });
    });

    // Join conversation room for chat
    socket.on('join-conversation', (conversationId) => {
      socket.join(`conversation-${conversationId}`);
      console.log(`User ${socket.id} joined conversation ${conversationId}`);
    });

    // Leave conversation room
    socket.on('leave-conversation', (conversationId) => {
      socket.leave(`conversation-${conversationId}`);
      console.log(`User ${socket.id} left conversation ${conversationId}`);
    });

    // Chat messages (legacy - for WebRTC rooms)
    socket.on('chat-message', (data) => {
      const room = rooms.get(data.roomId);
      const user = room?.get(socket.id);
      
      ioInstance.to(data.roomId).emit('chat-message', {
        message: data.message,
        userName: user?.userName || 'Unknown',
        userId: user?.userId || socket.id,
        timestamp: new Date().toISOString(),
      });
    });

    // Toggle video/audio
    socket.on('toggle-media', (data) => {
      socket.to(data.roomId).emit('user-media-toggle', {
        socketId: socket.id,
        video: data.video,
        audio: data.audio,
      });
    });

    // Leave room
    socket.on('leave-room', (roomId) => {
      const room = rooms.get(roomId);
      if (room) {
        room.delete(socket.id);
        if (room.size === 0) {
          rooms.delete(roomId);
        }
      }
      socket.to(roomId).emit('user-left', { socketId: socket.id });
      socket.leave(roomId);
      console.log(`User left room ${roomId}`);
    });

    // Disconnect
    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
      
      // Remove user from all rooms
      for (const [roomId, room] of rooms.entries()) {
        if (room.has(socket.id)) {
          room.delete(socket.id);
          socket.to(roomId).emit('user-left', { socketId: socket.id });
          
          if (room.size === 0) {
            rooms.delete(roomId);
          }
          break;
        }
      }
    });
  });

  return ioInstance;
}

function getIO() {
  if (!ioInstance) {
    throw new Error('Socket.IO not initialized. Call initializeSocket first.');
  }
  return ioInstance;
}

module.exports = {
  initializeSocket,
  getIO,
};


