// RoomSelector.js - Component for joining or creating a drawing room
import React, { useState } from 'react';
import './RoomSelector.css';

function RoomSelector({ onJoinRoom }) {
  //State that store the room ID entered by user
  const [roomInput, setRoomInput] = useState('');

  const generateRoomId = () =>{
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `room-${timestamp}-${random}`;
  };

  const handleJoinRoom = (e) =>{
    e.preventDefault();
    
    if (roomInput.trim()){
      onJoinRoom(roomInput.trim());
    }
  };

  const handleCreateRoom = () =>{
    const newRoomId = generateRoomId();
    onJoinRoom(newRoomId);
  };

  const handleQuickJoin = (roomId) =>{
    onJoinRoom(roomId);
  };

  return (
    <div className="room-selector">
      <div className="room-selector-card">
        <div className="room-header">
          <h1 className="room-title">Collaborative Canvas</h1>
          <p className="room-subtitle">Draw together in real-time</p>
        </div>

        <form onSubmit={handleJoinRoom} className="room-form">
          <label className="form-label">Join Existing Room</label>
          <div className="input-group">
            <input
              type="text"
              value={roomInput}
              onChange={(e) => setRoomInput(e.target.value)}
              placeholder="Enter room ID..."
              className="room-input"
            />
            <button 
              type="submit" 
              className="join-btn"
              disabled={!roomInput.trim()}
            >
              Join Room
            </button>
          </div>
        </form>

        <div className="divider">
          <span>OR</span>
        </div>

        <div className="create-room-section">
          <button 
            onClick={handleCreateRoom}
            className="create-btn"
          >
            Create New Room
          </button>
          <p className="create-hint">
            A unique room ID will be generated for you
          </p>
        </div>

        {/* Quick join section */}
        <div className="quick-join-section">
          <label className="form-label">Quick Join</label>
          <div className="quick-join-buttons">
            <button 
              onClick={() => handleQuickJoin('general')}
              className="quick-btn"
            >
              General Room
            </button>
            <button 
              onClick={() => handleQuickJoin('dev-team')}
              className="quick-btn"
            >
              Dev Team
            </button>
            <button 
              onClick={() => handleQuickJoin('art-class')}
              className="quick-btn"
            >
              Art Class
            </button>
          </div>
        </div>

        {/*Instructions*/}
        <div className="instructions">
          <h3>How it works</h3>
          <ul>
            <li>🎨 Join or create a room to start drawing</li>
            <li>👥 Share the room ID with others to collaborate</li>
            <li>✏️ Draw together in real-time</li>
            <li>↩️ Use Undo to remove your strokes</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default RoomSelector;