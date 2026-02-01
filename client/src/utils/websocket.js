// websocket.js - Utility file to manage WebSocket connection
import { io } from 'socket.io-client';

let socket = null;

export const initSocket = () => {
  if (!socket) {
    //Auto-detect server URL based on environment
    const serverUrl = process.env.NODE_ENV === 'development' 
      ? 'http://localhost:5000'
      : window.location.origin;
    
    socket = io(serverUrl,{
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    //Event: Connected successfully
    socket.on('connect', () => {
      console.log('Connected to server with ID:', socket.id);
    });

    // Event: Connection error
    socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
    });

    //Event: Disconnected
    socket.on('disconnect', (reason) => {
      console.log('Disconnected:', reason);
    });

    //Event: Reconnecting
    socket.on('reconnect_attempt', (attemptNumber) => {
      console.log('Reconnection attempt:', attemptNumber);
    });

    // Event: Successfully reconnected
    socket.on('reconnect', (attemptNumber) => {
      console.log('Reconnected after', attemptNumber, 'attempts');
    });
  }

  return socket;
};

export const getSocket = () =>{
  return socket;
};

export const disconnectSocket = () =>{
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};