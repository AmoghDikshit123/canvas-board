URL: https://canvas-board.onrender.com/
Deployed on RENDER platform.


Collaborative Canvas: Several users can join the same room and work together on a shared canvas using this real-time collaborative drawing app.

Features: 
Use a Room ID to create or join rooms, 
Syncing drawings in real time between users, 
Custom color picker plus brush color selection, 
Adaptable brush dimensions,
Clear the canvas and undo the final stroke,
Tracking the cursor in real time,
displays the room's active users, 
indicator of connection status 

Technology Used: HTML5 Canvas, WebSockets for real-time communication, React Hooks (useState, useEffect, useCallback, useRef)

Key Concepts Used:
State management with React hooks,
Canvas coordinate scaling for accurate drawing,
Stroke-based history model (not bitmap-based),
Event-driven architecture,
Real-time cursor presence system,
Component re-render optimization using refs,

Realtime Communication:
WebSockets (Socket-based communication layer)

How it operates: Every drawing action is broadcast to every person in the room via sockets. Because strokes are stored locally, redrawing and undoing are seamless even after resizing.
