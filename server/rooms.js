// rooms.js - Manages different drawing rooms and the users in each room
// Think of rooms like different drawing sessions - each room has its own set of users

class RoomManager {
  constructor() {
    // Store all rooms in a Map
    // Structure: { roomId: { users: Map of users } }
    this.rooms = new Map();
  }

  /**
   * Add a user to a specific room
   * @param {string} roomId - The room identifier (e.g., "room-123")
   * @param {string} userId - The socket ID of the user
   * @param {object} userData - User information (color, cursor position, etc.)
   */
  addUser(roomId, userId, userData) {
    // If room doesn't exist, create it
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, {
        users: new Map() // Map to store users by their ID
      });
    }

    // Get the room and add the user to it
    const room = this.rooms.get(roomId);
    room.users.set(userId, userData);

    console.log(`ðŸ“ Room ${roomId} now has ${room.users.size} user(s)`);
  }

  /**
   * Remove a user from a room (when they disconnect)
   * @param {string} roomId - The room identifier
   * @param {string} userId - The socket ID of the user
   */
  removeUser(roomId, userId) {
    const room = this.rooms.get(roomId);
    
    if (!room) return; // Room doesn't exist

    // Delete the user from the room
    room.users.delete(userId);

    // If room is now empty, clean it up to save memory
    if (room.users.size === 0) {
      this.rooms.delete(roomId);
      console.log(`ðŸ—‘ï¸ Room ${roomId} deleted (empty)`);
    } else {
      console.log(`ðŸ“ Room ${roomId} now has ${room.users.size} user(s)`);
    }
  }

  /**
   * Update a user's cursor position
   * @param {string} roomId - The room identifier
   * @param {string} userId - The socket ID of the user
   * @param {object} cursor - { x, y } coordinates
   */
  updateUserCursor(roomId, userId, cursor) {
    const room = this.rooms.get(roomId);
    
    if (!room) return;

    const user = room.users.get(userId);
    
    if (user) {
      // Update only the cursor property, keep other data intact
      user.cursor = cursor;
    }
  }

  /**
   * Get all users in a specific room
   * @param {string} roomId - The room identifier
   * @returns {Array} Array of user objects
   */
  getRoomUsers(roomId) {
    const room = this.rooms.get(roomId);
    
    if (!room) return [];

    // Convert Map to Array for easier handling in the frontend
    // Map.entries() gives us [key, value] pairs
    // We convert it to an array of user objects
    return Array.from(room.users.entries()).map(([id, data]) => ({
      id,
      ...data // Spread operator - copies all properties from data
    }));
  }

  /**
   * Get the count of users in a room
   * @param {string} roomId - The room identifier
   * @returns {number} Number of users
   */
  getRoomUserCount(roomId) {
    const room = this.rooms.get(roomId);
    return room ? room.users.size : 0;
  }

  /**
   * Check if a room exists
   * @param {string} roomId - The room identifier
   * @returns {boolean} True if room exists
   */
  roomExists(roomId) {
    return this.rooms.has(roomId);
  }

  /**
   * Get all active rooms
   * @returns {Array} Array of room IDs
   */
  getAllRooms() {
    return Array.from(this.rooms.keys());
  }
}

// Export the class so it can be used in server.js
module.exports = RoomManager;