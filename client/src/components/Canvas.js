// Canvas.js - The main drawing canvas component using React hooks

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { initSocket, getSocket } from '../utils/websocket';
import './Canvas.css';

function Canvas({ roomId, color, strokeWidth, isEraser, onUsersUpdate }){
  // refs: DOM nodes and mutable holders that don't trigger rerenders
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const isDrawingRef = useRef(false);
  const lastPosRef = useRef({ x: 0, y: 0 });
  const strokesRef = useRef([]);
  const currentStrokeIdRef = useRef(null);
  const remoteCursorsRef = useRef(new Map());

  // state used for rendering
  const [isConnected, setIsConnected] = useState(false);
  const [remoteCursors, setRemoteCursors] = useState([]);

  // Convert client (mouse/touch) coordinates into real canvas pixels
  const getCanvasCoordinates = useCallback((clientX, clientY, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  }, []);

  // Draw a single segment. Eraser uses destination-out so we erase pixels.
  const drawLine = useCallback((start, end, style) => {
    const ctx = ctxRef.current;
    if (!ctx) return;

    if (style.isEraser){
      ctx.save();
      ctx.globalCompositeOperation = 'destination-out';
      ctx.strokeStyle = 'rgba(0,0,0,1)';
      ctx.lineWidth = style.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();
      ctx.restore();
    } else {
      ctx.beginPath();
      ctx.strokeStyle = style.color;
      ctx.lineWidth = style.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();
    }
  }, []);

  // Clear and replay stroke history – used after undo or when loading history
  const redrawCanvas = useCallback(() =>{
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    strokesRef.current.forEach(stroke => {
      drawLine(stroke.start, stroke.end, stroke.style);
    });
  }, [drawLine]);

  // Start a new stroke (give the gesture a shared id for undo)
  const handleMouseDown = useCallback((e) =>{
    const canvas = canvasRef.current;
    if (!canvas) return;
    const pos = getCanvasCoordinates(e.clientX, e.clientY, canvas);
    isDrawingRef.current = true;
    lastPosRef.current = pos;
    const socket = getSocket();
    if (socket) currentStrokeIdRef.current = `${socket.id}-${Date.now()}`;
  }, [getCanvasCoordinates]);

  // Draw as the mouse moves, emit segment to server and record locally
  const handleMouseMove = useCallback((e) =>{
    const canvas = canvasRef.current;
    const socket = getSocket();
    if (!canvas || !socket) return;
    const currentPos = getCanvasCoordinates(e.clientX, e.clientY, canvas);
    socket.emit('cursor_move', currentPos);
    if (!isDrawingRef.current) return;
    const style = { color: isEraser ? '#000000' : color, width: strokeWidth, isEraser };
    drawLine(lastPosRef.current, currentPos, style);
    const strokeData = {
      start: lastPosRef.current,
      end: currentPos,
      style: style,
      id: currentStrokeIdRef.current || `${socket.id}-${Date.now()}`
    };
    // keep every tiny segment; grouped by id for sensible undo behavior
    strokesRef.current.push(strokeData);
    socket.emit('drawing_step', {
      start: lastPosRef.current,
      end: currentPos,
      style: style,
      id: strokeData.id
    });
    lastPosRef.current = currentPos;
  }, [color, strokeWidth, isEraser, getCanvasCoordinates, drawLine]);

  const handleMouseUp = useCallback(() =>{
    isDrawingRef.current = false;
    currentStrokeIdRef.current = null;
  }, []);

  // Touch event handlers for mobile devices
  const handleTouchStart = useCallback((e) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const touch = e.touches[0];
    const pos = getCanvasCoordinates(touch.clientX, touch.clientY, canvas);
    isDrawingRef.current = true;
    lastPosRef.current = pos;
    const socket = getSocket();
    if (socket) currentStrokeIdRef.current = `${socket.id}-${Date.now()}`;
  }, [getCanvasCoordinates]);

  const handleTouchMove = useCallback((e) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    const socket = getSocket();
    if (!canvas || !socket) return;
    const touch = e.touches[0];
    const currentPos = getCanvasCoordinates(touch.clientX, touch.clientY, canvas);
    socket.emit('cursor_move', currentPos);
    if (!isDrawingRef.current) return;
    const style = { color: isEraser ? '#000000' : color, width: strokeWidth, isEraser };
    drawLine(lastPosRef.current, currentPos, style);
    const strokeData = {
      start: lastPosRef.current,
      end: currentPos,
      style: style,
      id: currentStrokeIdRef.current || `${socket.id}-${Date.now()}`
    };
    strokesRef.current.push(strokeData);
    socket.emit('drawing_step', {
      start: lastPosRef.current,
      end: currentPos,
      style: style,
      id: strokeData.id
    });
    lastPosRef.current = currentPos;
  }, [color, strokeWidth, isEraser, getCanvasCoordinates, drawLine]);

  const handleTouchEnd = useCallback((e) => {
    e.preventDefault();
    isDrawingRef.current = false;
    currentStrokeIdRef.current = null;
  }, []);

  // Tell server to undo the most recent stroke for the room
  const handleUndo = useCallback(() =>{
    const socket = getSocket();
    if (!socket) return;
    socket.emit('undo');
  }, []);

  // Tell server to redo the most recently undone stroke for the room
  const handleRedo = useCallback(() =>{
    const socket = getSocket();
    if (!socket) return;
    socket.emit('redo');
  }, []);

  const handleClear = useCallback(() =>{
    const socket = getSocket();
    if (!socket) return;
    socket.emit('clear_canvas');
  }, []);

  // Render-friendly snapshot of remote cursors
  const drawRemoteCursors = useCallback(() =>{
    const cursors = Array.from(remoteCursorsRef.current.values());
    setRemoteCursors(cursors);
  }, []);

  // Initialize canvas size, socket, and all socket listeners
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const isMobile = window.innerWidth < 480;
    const sidebarWidth = isMobile ? 0 : 300;
    canvas.width = window.innerWidth - sidebarWidth;
    canvas.height = window.innerHeight - 80;
    const ctx = canvas.getContext('2d');
    ctxRef.current = ctx;
    initSocket();
    const socket = getSocket();
    if (socket) {
      socket.emit('join_room', roomId);
      setIsConnected(true);
      socket.on('load_history', (history) =>{
        strokesRef.current = history;
        redrawCanvas();
      });
      socket.on('remote_drawing', (stroke) =>{
        drawLine(stroke.start, stroke.end, stroke.style);
        strokesRef.current.push(stroke);
      });
      socket.on('users_update', (users) => onUsersUpdate(users));
      socket.on('cursor_update', (data) => {
        remoteCursorsRef.current.set(data.userId,{
          id: data.userId,
          x: data.cursor.x,
          y: data.cursor.y,
          color: data.color
        });
        drawRemoteCursors();
      });
      socket.on('stroke_removed', (strokeId) =>{
        strokesRef.current = strokesRef.current.filter(s => s.id !== strokeId);
        redrawCanvas();
      });
      socket.on('stroke_restored', (strokes) =>{
        // Add all parts of the restored stroke back
        strokes.forEach(stroke => {
          strokesRef.current.push(stroke);
        });
        redrawCanvas();
      });
      socket.on('canvas_cleared',() =>{
        strokesRef.current = [];
        redrawCanvas();
      });
      socket.on('user_disconnected',(userId) =>{
        remoteCursorsRef.current.delete(userId);
        drawRemoteCursors();
      });
    }
    return () =>{
      if (socket){
        socket.emit('leave_room');
        socket.off('load_history');
        socket.off('remote_drawing');
        socket.off('users_update');
        socket.off('cursor_update');
        socket.off('stroke_removed');
        socket.off('stroke_restored');
        socket.off('canvas_cleared');
        socket.off('user_disconnected');
      }
    };
  },[roomId, onUsersUpdate, drawLine, redrawCanvas, drawRemoteCursors]);

  // Resize canvas on window change, preserve drawn strokes
  useEffect(() =>{
    const handleResize =() =>{
      const canvas = canvasRef.current;
      if (!canvas) return;
      const tempStrokes = [...strokesRef.current];
      const isMobile = window.innerWidth < 480;
      const sidebarWidth = isMobile ? 0 : 300;
      canvas.width = window.innerWidth - sidebarWidth;
      canvas.height = window.innerHeight - 80;
      strokesRef.current = tempStrokes;
      redrawCanvas();
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [redrawCanvas]);

  // UI: canvas + minimal controls
  return (
    <div className="canvas-wrapper">
      <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
        {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
      </div>

      <div className="canvas-controls">
        <button onClick={handleUndo} className="control-btn">↩️ Undo</button>
        <button onClick={handleRedo} className="control-btn">↪️ Redo</button>
        <button onClick={handleClear} className="control-btn clear-btn">🗑️ Clear All</button>
      </div>

      <canvas
        ref={canvasRef}
        className="drawing-canvas"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
      />

      {remoteCursors.map(cursor =>(
        <div
          key={cursor.id}
          className="remote-cursor"
          style={{ left: cursor.x, top: cursor.y, borderColor: cursor.color }}
        >
          <div className="cursor-dot" style={{ backgroundColor: cursor.color }} />
        </div>
      ))}
    </div>
  );
}

export default Canvas;