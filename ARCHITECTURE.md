Architecture:
Real-time collaborative whiteboard. Multiple people can draw together, like Google Docs but for drawing.

Tech Stack:
Frontend:React +Socket.io client
Backend: Node.js + Express + Socket.io
Storage:In-memory (no database)

How it works:
User draws → Canvas component → WebSocket → Server → Broadcast to everyone
Pretty simple. When you draw, your strokes get sent to the server, saved in memory, and pushed to everyone else in the room.
Main Components
Frontend:-
Canvas.js - Main drawing area:

Handles mouse events for drawing
Sends/receives strokes via WebSocket
Shows other users' cursors
Manages undo/redo

Toolbar.js - Drawing tools:

Color picker(12 presets +custom)
Brush sizes (2px-50px)
Eraser toggle

RoomSelector.js -Entry point:

Join existing room by ID
Create new room
Quick-join buttons

UserList.js - Shows who's online:

Lists all users in current room
Each user has a colored dot

Backend:-
server.js -Socket server:

Handles all WebSocket events (join, draw, undo, redo, etc.)
Broadcasts changes to all users in a room

RoomManager(rooms.js):

Tracks which users are in which rooms
Stores user data (ID, color, cursor position)

StateManager (state-manager.js):

Stores all drawing strokes per room
Manages undo/redo stacks
Clears redo stack when new stroke is drawn

Key Events:
join_room -User enters a room
drawing_step -Someone drew a line segment
cursor_move - User moved cursor
undo -Remove last stroke (global)
redo -Restore last undone stroke (global)
clear_canvas -Delete everything

Data Flow Example
Drawing:
Mouse move → Create stroke →Emit to server →Save in StateManager → 
Broadcast to room → Other users redraw canvas
Undo/Redo:

Undo: Move stroke from strokes array to undoStack
Redo: Move stroke from undoStack back to strokes
Drawing new stroke clears the undoStack

Important Details
Why refs instead of state?
Mouse events fire ~60 times/second. Using setState would cause 60 re-renders/second. Refs update without re-rendering.
How strokes work:
Each drawing gesture has an ID. Multiple segments share the same ID, so undo removes the entire stroke at once.
Global undo/redo:
When you undo, it removes the last stroke ANYONE drew, not just yours. Keeps things simple.
Current Limitations

No database - everything lost on server restart
No authentication - just socket IDs
No drawing features like shapes, text, layers
No export to image

Running Locally
bash# Server
cd server
npm install
node server.js

# Client  
cd client
npm install
npm start
Server runs on port 5000, React on 3000.

This help to check code by running code in local system.