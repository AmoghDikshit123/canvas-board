// server.js - Main server file that handles WebSocket connections and broadcasting
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const RoomManager = require('./rooms');
const StateManager = require('./state-manager');

const app = express();

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: function(origin, callback) {
      callback(null, true);
    },
    methods: ["GET", "POST"]
  }
});

app.use(cors());

const staticPath = path.join(__dirname, '../client/build');
app.use(express.static(staticPath));

app.use(express.json());

// Creates instances of our room and state managers
const roomManager = new RoomManager();
const stateManager = new StateManager();

app.get('*', (req, res) => {
  res.sendFile(path.join(staticPath, 'index.html'));
});

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

  // EVENT: join_room
  // When a user wants to join a specific drawing room
  socket.on('join_room', (roomId) => {
    // If user was in a different room, leave it first
    if (socket.currentRoom && socket.currentRoom !== roomId) {
      const oldRoom = socket.currentRoom;
      socket.leave(oldRoom);
      roomManager.removeUser(oldRoom, socket.id);
      io.to(oldRoom).emit('users_update', roomManager.getRoomUsers(oldRoom));
      io.to(oldRoom).emit('user_disconnected', socket.id);
    }

    socket.join(roomId);
    socket.currentRoom = roomId;
    
    roomManager.addUser(roomId, socket.id, socket.userData);
    
    console.log(`👤 User ${socket.id} joined room: ${roomId}`);
    
    // Sends existing drawing history to the newly joined user
    const roomHistory = stateManager.getHistory(roomId);
    socket.emit('load_history', roomHistory);
    
    io.to(roomId).emit('users_update', roomManager.getRoomUsers(roomId));
  });

  // Event: leave_room
  // When a user wants to leave the current room
  socket.on('leave_room', () => {
    const roomId = socket.currentRoom;
    
    if (!roomId) return;
    
    socket.leave(roomId);
    roomManager.removeUser(roomId, socket.id);
    
    console.log(`👤 User ${socket.id} left room: ${roomId}`);
    
    io.to(roomId).emit('users_update', roomManager.getRoomUsers(roomId));
    io.to(roomId).emit('user_disconnected', socket.id);
    
    socket.currentRoom = null;
  });

  //Event: drawing_step
  //When a user draws a line segment on their canvas
  socket.on('drawing_step', (data) => {
    const roomId = socket.currentRoom;
    
    if (!roomId) return ; 
    
    // Adds the stroke to the drawing history
    const stroke = {
      userId: socket.id,
      start: data.start,
      end: data.end,
      style: data.style,
      timestamp: Date.now(),
      id: data.id || `${socket.id}-${Date.now()}` 
    };
    
    stateManager.addStroke(roomId, stroke);
    
    socket.to(roomId).emit('remote_drawing', stroke);
  });

  // Event: cursor_move
  // When a user moves their cursor on the canvas
  socket.on('cursor_move', (position) => {
    const roomId = socket.currentRoom;
    
    if (!roomId) return;
    
    socket.userData.cursor = position;
    roomManager.updateUserCursor(roomId, socket.id, position);
    
    // Broadcast cursor position to others in the room
    socket.to(roomId).emit('cursor_update', {
      userId: socket.id,
      cursor: position,
      color: socket.userData.color
    });
  });

  // Event: undo
  // When a user wants to undo the last stroke (global undo for the room)
  socket.on('undo', () => {
    const roomId = socket.currentRoom;
    
    if (!roomId) return;
    
    const removedStroke = stateManager.undoStroke(roomId);
    
    if (removedStroke) {
      io.to(roomId).emit('stroke_removed', removedStroke.id);
      console.log(`↩️ User ${socket.id} triggered global undo for stroke ${removedStroke.id}`);
      console.log(`↩️ User ${socket.id} undid stroke ${removedStroke.id}`);
    }
  });

  //Event: clear_canvas
  //When a user wants to clear the entire canvas
  socket.on('clear_canvas', () => {
    const roomId = socket.currentRoom;
    
    if (!roomId) return;
    
    stateManager.clearRoom(roomId);
    
    io.to(roomId).emit('canvas_cleared');
    console.log(`🧹 Canvas cleared in room: ${roomId}`);
  });

  // EVENT: disconnect
  // When a user closes the browser or loses connection
  socket.on('disconnect', () => {
    const roomId = socket.currentRoom;
    
    if (roomId) {
      roomManager.removeUser(roomId, socket.id);
      
      io.to(roomId).emit('users_update', roomManager.getRoomUsers(roomId));
      io.to(roomId).emit('user_disconnected', socket.id);
      
      console.log(`User ${socket.id} disconnected from room: ${roomId}`);
    }
  });
});

// Start the server on port 5000
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});