const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const RoomManager = require('./rooms');
const StateManager = require('./state-manager');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "http://localhost:3000", methods: ["GET", "POST"] }
});

app.use(cors());
app.use(express.json());

const roomManager = new RoomManager();
const stateManager = new StateManager();

app.get('/health', (req, res) => {
  res.json({ status: 'Server running', activeConnections: io.engine.clientsCount });
});

io.on('connection', (socket) => {
  const userColor = '#' + Math.floor(Math.random()*16777215).toString(16);

  socket.userData = { id: socket.id, color: userColor, cursor: { x: 0, y: 0 } };

  socket.on('join_room', (roomId) => {
    socket.join(roomId);
    socket.currentRoom = roomId;
    roomManager.addUser(roomId, socket.id, socket.userData);

    socket.emit('load_history', stateManager.getHistory(roomId));
    io.to(roomId).emit('users_update', roomManager.getRoomUsers(roomId));
  });

  // FULL STROKE (points array)
  socket.on('drawing_step', (stroke) => {
    const roomId = socket.currentRoom;
    if (!roomId) return;

    const fullStroke = {
      userId: socket.id,
      id: stroke.id,
      style: stroke.style,
      points: stroke.points,
      timestamp: Date.now()
    };

    stateManager.addStroke(roomId, fullStroke);
    socket.to(roomId).emit('remote_drawing', fullStroke);
  });

  socket.on('undo', () => {
    const roomId = socket.currentRoom;
    const removed = stateManager.undoStroke(roomId, socket.id);
    if (removed) io.to(roomId).emit('stroke_removed', removed.id);
  });

  socket.on('clear_canvas', () => {
    const roomId = socket.currentRoom;
    stateManager.clearRoom(roomId);
    io.to(roomId).emit('canvas_cleared');
  });

  socket.on('cursor_move', (pos) => {
    const roomId = socket.currentRoom;
    if (!roomId) return;
    socket.userData.cursor = pos;

    socket.to(roomId).emit('cursor_update', {
      userId: socket.id,
      cursor: pos,
      color: socket.userData.color
    });
  });

  socket.on('disconnect', () => {
    const roomId = socket.currentRoom;
    if (!roomId) return;
    roomManager.removeUser(roomId, socket.id);
    io.to(roomId).emit('users_update', roomManager.getRoomUsers(roomId));
    io.to(roomId).emit('user_disconnected', socket.id);
  });
});

server.listen(5000, () => console.log("🚀 Server running on port 5000"));
