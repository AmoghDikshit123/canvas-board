// UserList.js - Component to display all users currently in the room
import React from 'react';
import './UserList.css';

function UserList({ users }) {
  return (
    <div className="user-list">
      <h3 className="user-list-title">
        Active Users ({users.length})
      </h3>

      {users.length === 0 ? (
        <p className="no-users">Waiting for users to join...</p>
      ) : (
        <ul className="users">
          {users.map(user => (
            <li key={user.id} className="user-item">
              <div 
                className="user-color"
                style={{ backgroundColor: user.color }}
              />
              
              <span className="user-id">
                User {user.id.substring(0, 8)}...
              </span>
              
              <span className="online-indicator">🟢</span>
            </li>
          ))}
        </ul>
      )}

      {/* Instructions for users */}
      <div className="user-list-footer">
        {/* tiny onboarding tip for new users */}
        <p className="user-tip">
          💡 Each user has a unique color
        </p>
      </div>
    </div>
  );
}

export default UserList;