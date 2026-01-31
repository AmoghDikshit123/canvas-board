// server.js - Main server file that handles WebSocket connections and broadcasting
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const RoomManager = require('./rooms');
const StateManager = require('./state-manager');

// Initialize Express app - a framework for building web servers
const app = express();

// Create HTTP server - needed for Socket.io to work
const server = http.createServer(app);

// Initialize Socket.io with CORS settings
const io = new Server(server, {
  cors: {
    origin: function(origin, callback) {
      callback(null, true);
    },
    methods: ["GET", "POST"]
  }
});

// Enable CORS middleware for Express
app.use(cors());

// Serve static files from the React build directory
const staticPath = path.join(__dirname, '../client/build');
app.use(express.static(staticPath));

// Parse JSON request bodies
app.use(express.json());

// Create instances of our room and state managers
const roomManager = new RoomManager();
const stateManager = new StateManager();

// Serve the React app for all non-API routes (for client-side routing)
app.get('*', (req, res) => {
  res.sendFile(path.join(staticPath, 'index.html'));
});

// Basic health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'Server is running', activeConnections: io.engine.clientsCount });
});

// Socket.io connection handler - runs when a new client connects
io.on('connection', (socket) => {
  console.log(`✅ New user connected: ${socket.id}`);
  
  // Generate a random color for this user's cursor
  const userColor = '#' + Math.floor(Math.random()*16777215).toString(16);
  
  // Store user data
  socket.userData = {
    id: socket.id,
    color: userColor,
    cursor: { x: 0, y: 0 }
  };

  // ============================================
  // EVENT: join_room
  // When a user wants to join a specific drawing room
  // ============================================
  socket.on('join_room', (roomId) => {
    // If user was in a different room, leave it first
    if (socket.currentRoom && socket.currentRoom !== roomId) {
      const oldRoom = socket.currentRoom;
      socket.leave(oldRoom);
      roomManager.removeUser(oldRoom, socket.id);
      io.to(oldRoom).emit('users_update', roomManager.getRoomUsers(oldRoom));
      io.to(oldRoom).emit('user_disconnected', socket.id);
    }

    // Add socket to the new room
    socket.join(roomId);
    socket.currentRoom = roomId;
    
    // Add user to room manager
    roomManager.addUser(roomId, socket.id, socket.userData);
    
    console.log(`👤 User ${socket.id} joined room: ${roomId}`);
    
    // Send existing drawing history to the newly joined user
    // This ensures they see what was already drawn before they joined
    const roomHistory = stateManager.getHistory(roomId);
    socket.emit('load_history', roomHistory);
    
    // Notify everyone in the room about all current users
    io.to(roomId).emit('users_update', roomManager.getRoomUsers(roomId));
  });

  // ============================================
  // EVENT: leave_room
  // When a user wants to leave the current room
  // ============================================
  socket.on('leave_room', () => {
    const roomId = socket.currentRoom;
    
    if (!roomId) return;
    
    socket.leave(roomId);
    roomManager.removeUser(roomId, socket.id);
    
    console.log(`👤 User ${socket.id} left room: ${roomId}`);
    
    // Notify remaining users
    io.to(roomId).emit('users_update', roomManager.getRoomUsers(roomId));
    io.to(roomId).emit('user_disconnected', socket.id);
    
    socket.currentRoom = null;
  });

  // ============================================
  // EVENT: drawing_step
  // When a user draws a line segment on their canvas
  // ============================================
  socket.on('drawing_step', (data) => {
    const roomId = socket.currentRoom;
    
    if (!roomId) return; // User not in a room yet
    
    // Add the stroke to the drawing history
    const stroke = {
      userId: socket.id,
      start: data.start,
      end: data.end,
      style: data.style,
      timestamp: Date.now(),
      // Use client-provided id when available so a gesture can be grouped
      id: data.id || `${socket.id}-${Date.now()}` // Unique identifier for this stroke
    };
    
    // Save to state manager
    stateManager.addStroke(roomId, stroke);
    
    // Broadcast this drawing event to ALL users in the room EXCEPT the sender
    // The sender already drew it locally, no need to send it back to them
    socket.to(roomId).emit('remote_drawing', stroke);
  });

  // ============================================
  // EVENT: cursor_move
  // When a user moves their cursor on the canvas
  // ============================================
  socket.on('cursor_move', (position) => {
    const roomId = socket.currentRoom;
    
    if (!roomId) return;
    
    // Update cursor position in room manager
    socket.userData.cursor = position;
    roomManager.updateUserCursor(roomId, socket.id, position);
    
    // Broadcast cursor position to others in the room
    socket.to(roomId).emit('cursor_update', {
      userId: socket.id,
      cursor: position,
      color: socket.userData.color
    });
  });

  // ============================================
  // EVENT: undo
  // When a user wants to undo the last stroke (global undo for the room)
  // ============================================
  socket.on('undo', () => {
    const roomId = socket.currentRoom;
    
    if (!roomId) return;
    
    // Remove the last stroke in the room (any user can undo any stroke)
    const removedStroke = stateManager.undoStroke(roomId);
    
    if (removedStroke) {
      // Tell everyone in the room to remove this stroke
      io.to(roomId).emit('stroke_removed', removedStroke.id);
      console.log(`↩️ User ${socket.id} triggered global undo for stroke ${removedStroke.id}`);
      console.log(`↩️ User ${socket.id} undid stroke ${removedStroke.id}`);
    }
  });

  // ============================================
  // EVENT: clear_canvas
  // When a user wants to clear the entire canvas
  // ============================================
  socket.on('clear_canvas', () => {
    const roomId = socket.currentRoom;
    
    if (!roomId) return;
    
    // Clear all strokes for this room
    stateManager.clearRoom(roomId);
    
    // Tell everyone to clear their canvas
    io.to(roomId).emit('canvas_cleared');
    console.log(`🧹 Canvas cleared in room: ${roomId}`);
  });

  // ============================================
  // EVENT: disconnect
  // When a user closes the browser or loses connection
  // ============================================
  socket.on('disconnect', () => {
    const roomId = socket.currentRoom;
    
    if (roomId) {
      // Remove user from room
      roomManager.removeUser(roomId, socket.id);
      
      // Notify remaining users
      io.to(roomId).emit('users_update', roomManager.getRoomUsers(roomId));
      io.to(roomId).emit('user_disconnected', socket.id);
      
      console.log(`❌ User ${socket.id} disconnected from room: ${roomId}`);
    }
  });
});

// Start the server on port 5000
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});