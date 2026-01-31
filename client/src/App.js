// App.js - Main application component using React hooks
import React, { useState } from 'react';
import Canvas from './components/Canvas';
import Toolbar from './components/Toolbar';
import UserList from './components/UserList';
import RoomSelector from './components/RoomSelector';
import './App.css';

function App() {
  // ============================================
  // STATE MANAGEMENT using useState hook
  // ============================================
  
  // Room state - which room the user is in
  const [currentRoom, setCurrentRoom] = useState(null);
  
  // Drawing tool state
  const [selectedColor, setSelectedColor] = useState('#000000'); // Default black
  const [strokeWidth, setStrokeWidth] = useState(5); // Default stroke width
  
  // List of users in the current room
  const [users, setUsers] = useState([]);
  
  // Mobile sidebar state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  /**
   * Handle joining a room
   * This function is passed down to RoomSelector component
   */
  const handleJoinRoom = React.useCallback((roomId) => {
    setCurrentRoom(roomId);
  }, []);

  /**
   * Handle leaving a room
   * Resets the room state so user can join a different room
   */
  const handleLeaveRoom = React.useCallback(() => {
    setCurrentRoom(null);
    setUsers([]);
  }, []);

  /**
   * Update the list of users when new users join or leave
   * This function is passed down to Canvas component
   */
  const handleUsersUpdate = React.useCallback((usersList) => {
    setUsers(usersList);
  }, []);

  /**
   * Toggle mobile sidebar
   */
  const toggleSidebar = React.useCallback(() => {
    setIsSidebarOpen(!isSidebarOpen);
  }, [isSidebarOpen]);

  /**
   * Close sidebar when clicking outside
   */
  const closeSidebar = React.useCallback(() => {
    setIsSidebarOpen(false);
  }, []);

  // ============================================
  // CONDITIONAL RENDERING
  // If user hasn't joined a room, show room selector
  // If user is in a room, show the canvas and tools
  // ============================================
  
  if (!currentRoom) {
    return (
      <div className="app">
        <RoomSelector onJoinRoom={handleJoinRoom} />
      </div>
    );
  }

  return (
    <div className="app">
      {/* Header section with room info and controls */}
      <header className="app-header">
        <button className="mobile-menu-btn" onClick={toggleSidebar}>
          ☰
        </button>
        <div className="header-left">
          <h1>Collaborative Canvas</h1>
          <span className="room-badge">Room: {currentRoom}</span>
        </div>
        <button className="leave-btn" onClick={handleLeaveRoom}>
          Leave Room
        </button>
      </header>

      {/* Sidebar overlay for mobile */}
      {isSidebarOpen && (
        <div className="sidebar-overlay active" onClick={closeSidebar}></div>
      )}

      {/* Main content area */}
      <div className="app-content">
        {/* Sidebar with toolbar and user list */}
        <aside className={`sidebar ${isSidebarOpen ? 'mobile-open' : ''}`}>
          <Toolbar 
            selectedColor={selectedColor}
            setSelectedColor={setSelectedColor}
            strokeWidth={strokeWidth}
            setStrokeWidth={setStrokeWidth}
          />
          <UserList users={users} />
        </aside>

        {/* Canvas area - the main drawing surface */}
        <main className="canvas-container">
          <Canvas 
            roomId={currentRoom}
            color={selectedColor}
            strokeWidth={strokeWidth}
            onUsersUpdate={handleUsersUpdate}
          />
        </main>
      </div>
    </div>
  );
}

export default App;