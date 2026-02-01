// rooms.js - Manages different drawing rooms and the users in each room
class RoomManager {
  constructor() {
    this.rooms = new Map();
  }

  addUser(roomId, userId, userData) {
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, {
        users: new Map() //stores users by their ID
      });
    }

    const room = this.rooms.get(roomId);
    room.users.set(userId, userData);

    console.log(`Room ${roomId} now has ${room.users.size} user(s)`);
  }

  
  removeUser(roomId, userId) {
    const room = this.rooms.get(roomId);
    
    if (!room) return; // Room doesn't exist

    // Delete the user from the room
    room.users.delete(userId);

    if (room.users.size === 0) {
      this.rooms.delete(roomId);
      console.log(`ðŸ—‘ï¸ Room ${roomId} deleted (empty)`);
    } else {
      console.log(`ðŸ“ Room ${roomId} now has ${room.users.size} user(s)`);
    }
  }

  
  updateUserCursor(roomId, userId, cursor) {
    const room = this.rooms.get(roomId);
    
    if (!room) return;

    const user = room.users.get(userId);
    
    if (user) {
      user.cursor = cursor;
    }
  }

  getRoomUsers(roomId) {
    const room = this.rooms.get(roomId);
    
    if (!room) return [];

    return Array.from(room.users.entries()).map(([id, data]) => ({
      id,
      ...data
    }));
  }

  getRoomUserCount(roomId) {
    const room = this.rooms.get(roomId);
    return room ? room.users.size : 0;
  }


  roomExists(roomId) {
    return this.rooms.has(roomId);
  }

  getAllRooms() {
    return Array.from(this.rooms.keys());
  }
}

module.exports = RoomManager;