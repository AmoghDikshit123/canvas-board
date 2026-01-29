// Canvas.js - The main drawing canvas component using React hooks
// This component handles all drawing logic, WebSocket communication, and cursor tracking

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { initSocket, getSocket } from '../utils/websocket';
import './Canvas.css';

function Canvas({ roomId, color, strokeWidth, onUsersUpdate }) {
  // ============================================
  // REFS - References to DOM elements
  // useRef persists values across renders without causing re-renders
  // ============================================
  
  // Reference to the canvas HTML element
  const canvasRef = useRef(null);
  
  // Reference to the 2D drawing context (the API for drawing)
  const ctxRef = useRef(null);
  
  // Track if user is currently drawing
  const isDrawingRef = useRef(false);
  
  // Store the last position while drawing (for smooth lines)
  const lastPosRef = useRef({ x: 0, y: 0 });
  
  // Store all strokes for undo functionality
  const strokesRef = useRef([]);
  
  // Store remote cursors (other users' cursor positions)
  const remoteCursorsRef = useRef(new Map());

  // ============================================
  // STATE - Component state using useState hook
  // ============================================
  
  // Track connection status
  const [isConnected, setIsConnected] = useState(false);
  
  // Store remote cursors in state for rendering
  const [remoteCursors, setRemoteCursors] = useState([]);

  /**
   * Get accurate canvas coordinates from mouse/touch event
   * Canvas coordinates can differ from screen coordinates due to CSS scaling
   */
  const getCanvasCoordinates = useCallback((event, canvas) => {
    // getBoundingClientRect() gives us the canvas position and size on screen
    const rect = canvas.getBoundingClientRect();
    
    // Calculate scaling factors (canvas internal size vs displayed size)
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    // Get mouse position relative to canvas and apply scaling
    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY
    };
  }, []);

  /**
   * Draw a line segment on the canvas
   * This is the core drawing function used for both local and remote drawing
   */
  const drawLine = useCallback((start, end, style) => {
    const ctx = ctxRef.current;
    if (!ctx) return;

    // Begin a new path
    ctx.beginPath();
    
    // Set line style
    ctx.strokeStyle = style.color;
    ctx.lineWidth = style.width;
    ctx.lineCap = 'round'; // Rounded line ends for smoother appearance
    ctx.lineJoin = 'round'; // Rounded corners where lines meet
    
    // Draw the line
    ctx.moveTo(start.x, start.y); // Starting point
    ctx.lineTo(end.x, end.y);     // Ending point
    ctx.stroke();                  // Actually draw the line
  }, []);

  /**
   * Redraw the entire canvas from scratch using the stroke history
   * Used after undo operations or when loading history
   */
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    
    if (!canvas || !ctx) return;

    // Clear the entire canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Redraw all strokes in order
    strokesRef.current.forEach(stroke => {
      drawLine(stroke.start, stroke.end, stroke.style);
    });
  }, [drawLine]);

  /**
   * Handle mouse down - start drawing
   */
  const handleMouseDown = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Get accurate coordinates
    const pos = getCanvasCoordinates(e, canvas);
    
    // Set drawing state
    isDrawingRef.current = true;
    lastPosRef.current = pos;
  }, [getCanvasCoordinates]);

  /**
   * Handle mouse move - draw line if mouse is down
   */
  const handleMouseMove = useCallback((e) => {
    const canvas = canvasRef.current;
    const socket = getSocket();
    
    if (!canvas || !socket) return;

    const currentPos = getCanvasCoordinates(e, canvas);

    // Emit cursor position to other users (throttled by requestAnimationFrame)
    socket.emit('cursor_move', currentPos);

    // If not drawing, just update cursor position
    if (!isDrawingRef.current) return;

    // Draw locally
    const style = { color, width: strokeWidth };
    drawLine(lastPosRef.current, currentPos, style);

    // Create stroke data
    const strokeData = {
    start: lastPosRef.current,
    end: currentPos,
    style: style,
    id: crypto.randomUUID()   // 🔥 FIXED
  };


    // Add to local history
    strokesRef.current.push(strokeData);

    // Send to server (will be broadcast to other users)
    socket.emit('drawing_step', strokeData);


    // Update last position for next segment
    lastPosRef.current = currentPos;
  }, [color, strokeWidth, getCanvasCoordinates, drawLine]);

  /**
   * Handle mouse up - stop drawing
   */
  const handleMouseUp = useCallback(() => {
    isDrawingRef.current = false;
  }, []);

  /**
   * Handle undo button click
   */
  const handleUndo = useCallback(() => {
    const socket = getSocket();
    if (!socket) return;

    // Tell server to undo
    socket.emit('undo');
  }, []);

  /**
   * Handle clear canvas button click
   */
  const handleClear = useCallback(() => {
    const socket = getSocket();
    if (!socket) return;

    // Tell server to clear
    socket.emit('clear_canvas');
  }, []);

  /**
   * Draw remote cursors (other users' cursors)
   */
  const drawRemoteCursors = useCallback(() => {
    const cursors = Array.from(remoteCursorsRef.current.values());
    setRemoteCursors(cursors);
  }, []);

  // ============================================
  // EFFECTS - Side effects using useEffect hook
  // ============================================

  /**
   * Effect 1: Initialize canvas and WebSocket connection
   * Runs once when component mounts
   */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas size to window size
    canvas.width = window.innerWidth - 300; // Subtract sidebar width
    canvas.height = window.innerHeight - 80; // Subtract header height

    // Get 2D drawing context
    const ctx = canvas.getContext('2d');
    ctxRef.current = ctx;

    // Initialize socket connection
    initSocket();
    const socket = getSocket();

    let hasJoined = false;

    if (socket) {
      // Join the room (only once)
      if (!hasJoined) {
        socket.emit('join_room', roomId);
        hasJoined = true;
        setIsConnected(true);
      }

      // ============================================
      // SOCKET EVENT LISTENERS
      // ============================================

      /**
       * Load drawing history when joining
       */
      socket.on('load_history', (history) => {
        console.log('📦 Loading history:', history.length, 'strokes');
        strokesRef.current = history;
        redrawCanvas();
      });

      /**
       * Receive drawing from other users
       */
      socket.on('remote_drawing', (stroke) => {
        // Draw the stroke
        drawLine(stroke.start, stroke.end, stroke.style);
        
        // Add to history
        strokesRef.current.push(stroke);
      });

      /**
       * Update list of users in room
       */
      socket.on('users_update', (users) => {
        console.log('👥 Users updated:', users.length);
        onUsersUpdate(users);
      });

      /**
       * Handle cursor updates from other users
       */
      socket.on('cursor_update', (data) => {
        remoteCursorsRef.current.set(data.userId, {
          id: data.userId,
          x: data.cursor.x,
          y: data.cursor.y,
          color: data.color
        });
        drawRemoteCursors();
      });

      /**
       * Remove a stroke (undo functionality)
       */
      socket.on('stroke_removed', (strokeId) => {
        // Filter out the removed stroke
        strokesRef.current = strokesRef.current.filter(s => s.id !== strokeId);
        redrawCanvas();
      });

      /**
       * Clear entire canvas
       */
      socket.on('canvas_cleared', () => {
        strokesRef.current = [];
        redrawCanvas();
      });

      /**
       * Handle user disconnection
       */
      socket.on('user_disconnected', (userId) => {
        remoteCursorsRef.current.delete(userId);
        drawRemoteCursors();
      });
    }

    // Cleanup function - runs when component unmounts
    return () => {
      if (socket) {
        socket.off('load_history');
        socket.off('remote_drawing');
        socket.off('users_update');
        socket.off('cursor_update');
        socket.off('stroke_removed');
        socket.off('canvas_cleared');
        socket.off('user_disconnected');
      }
    };
  }, [roomId]);

  /**
   * Effect 2: Handle window resize
   * Adjust canvas size when window is resized
   */
  useEffect(() => {
  const handleResize = () => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;

    // Save current drawing as image data
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    // Resize canvas
    const newWidth = window.innerWidth - 300;
    const newHeight = window.innerHeight - 80;
    
    canvas.width = newWidth;
    canvas.height = newHeight;

    // Restore the image
    ctx.putImageData(imageData, 0, 0);
  };

  // Debounce resize to prevent excessive calls
  let resizeTimeout;
  const debouncedResize = () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(handleResize, 250);
  };

  window.addEventListener('resize', debouncedResize);
  
  return () => {
    window.removeEventListener('resize', debouncedResize);
    clearTimeout(resizeTimeout);
  };
}, []);

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="canvas-wrapper">
      {/* Connection status indicator */}
      <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
        {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
      </div>

      {/* Control buttons */}
      <div className="canvas-controls">
        <button onClick={handleUndo} className="control-btn">
          ↩️ Undo
        </button>
        <button onClick={handleClear} className="control-btn clear-btn">
          🗑️ Clear All
        </button>
      </div>

      {/* The actual canvas element */}
      <canvas
        ref={canvasRef}
        className="drawing-canvas"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp} // Stop drawing if mouse leaves canvas
      />

      {/* Remote cursors - show where other users are drawing */}
      {remoteCursors.map(cursor => (
        <div
          key={cursor.id}
          className="remote-cursor"
          style={{
            left: cursor.x,
            top: cursor.y,
            borderColor: cursor.color
          }}
        >
          <div 
            className="cursor-dot" 
            style={{ backgroundColor: cursor.color }}
          />
        </div>
      ))}
    </div>
  )
}

export default Canvas;