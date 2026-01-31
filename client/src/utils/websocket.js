// websocket.js - Utility file to manage WebSocket connection
// This creates a singleton socket instance that can be shared across components

import { io } from 'socket.io-client';

// Store the socket instance
let socket = null;

/**
 * Initialize the WebSocket connection
 * This should be called once when the app starts
 */
export const initSocket = () => {
  // Only create socket if it doesn't exist yet
  if (!socket) {
    // Auto-detect server URL based on environment
    const serverUrl = process.env.NODE_ENV === 'development' 
      ? 'http://localhost:5000'
      : window.location.origin;
    
    // Connect to the server
    socket = io(serverUrl, {
      // Reconnection options
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    // Event: Connected successfully
    socket.on('connect', () => {
      console.log('✅ Connected to server with ID:', socket.id);
    });

    // Event: Connection error
    socket.on('connect_error', (error) => {
      console.error('❌ Connection error:', error);
    });

    // Event: Disconnected
    socket.on('disconnect', (reason) => {
      console.log('❌ Disconnected:', reason);
    });

    // Event: Reconnecting
    socket.on('reconnect_attempt', (attemptNumber) => {
      console.log('🔄 Reconnection attempt:', attemptNumber);
    });

    // Event: Successfully reconnected
    socket.on('reconnect', (attemptNumber) => {
      console.log('✅ Reconnected after', attemptNumber, 'attempts');
    });
  }

  return socket;
};

/**
 * Get the existing socket instance
 * Returns null if socket hasn't been initialized yet
 */
export const getSocket = () => {
  return socket;
};

/**
 * Disconnect the socket
 * Useful when leaving the app
 */
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};