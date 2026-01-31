// state-manager.js - Manages the drawing history (all strokes) for each room
// This is the "global truth" - what has been drawn and who drew it

class StateManager {
  constructor() {
    // Store history for each room
    // Structure: { roomId: { strokes: [] } }
    this.roomStates = new Map();
  }

  /**
   * Get the complete drawing history for a room
   * This is used when a new user joins - they need to see what was already drawn
   * @param {string} roomId - The room identifier
   * @returns {Array} Array of all strokes in this room
   */
  getHistory(roomId) {
    const state = this.roomStates.get(roomId);
    
    // If room doesn't exist yet, return empty array
    if (!state) return [];
    
    return state.strokes;
  }

  /**
   * Add a new stroke to the room's history
   * @param {string} roomId - The room identifier
   * @param {object} stroke - The stroke data (contains start, end, style, userId, etc.)
   */
  addStroke(roomId, stroke) {
    // If room doesn't exist, create it
    if (!this.roomStates.has(roomId)) {
      this.roomStates.set(roomId, {
        strokes: [] // Array to store all drawing strokes
      });
    }

    const state = this.roomStates.get(roomId);
    
    // Add the stroke to the end of the array
    state.strokes.push(stroke);
    
    console.log(`✏️ Stroke added to room ${roomId}. Total strokes: ${state.strokes.length}`);
  }

  /**
   * Undo the last stroke in the room (global undo)
   * Any user can undo any stroke - removes the most recent stroke regardless of who drew it
   * @param {string} roomId - The room identifier
   * @returns {object|null} The removed stroke, or null if nothing to undo
   */
  undoStroke(roomId) {
    const state = this.roomStates.get(roomId);
    
    if (!state || state.strokes.length === 0) {
      return null; // Nothing to undo
    }

    // Get the LAST stroke in the room (most recent, regardless of user)
    const lastStroke = state.strokes[state.strokes.length - 1];
    const strokeId = lastStroke.id;

    // Remove all segments that share the same stroke id
    const removedParts = state.strokes.filter(s => s.id === strokeId);
    state.strokes = state.strokes.filter(s => s.id !== strokeId);

    console.log(`↩️ Undo: Removed ${removedParts.length} segments for stroke ${strokeId} from room ${roomId}`);

    // Return a minimal object describing the removed stroke (id is what clients need)
    return { id: strokeId };
  }

  /**
   * Clear all strokes in a room (clear canvas functionality)
   * @param {string} roomId - The room identifier
   */
  clearRoom(roomId) {
    const state = this.roomStates.get(roomId);
    
    if (state) {
      // Empty the strokes array
      state.strokes = [];
      console.log(`🧹 Room ${roomId} cleared`);
    }
  }

  /**
   * Delete a room entirely (cleanup when room is empty)
   * @param {string} roomId - The room identifier
   */
  deleteRoom(roomId) {
    const deleted = this.roomStates.delete(roomId);
    
    if (deleted) {
      console.log(`🗑️ Room ${roomId} state deleted`);
    }
  }

  /**
   * Get the number of strokes in a room
   * @param {string} roomId - The room identifier
   * @returns {number} Number of strokes
   */
  getStrokeCount(roomId) {
    const state = this.roomStates.get(roomId);
    return state ? state.strokes.length : 0;
  }

  /**
   * Get statistics about a room
   * @param {string} roomId - The room identifier
   * @returns {object} Statistics object
   */
  getRoomStats(roomId) {
    const state = this.roomStates.get(roomId);
    
    if (!state) {
      return { strokeCount: 0, users: [] };
    }

    // Count strokes per user
    const userStrokeCounts = {};
    
    state.strokes.forEach(stroke => {
      if (!userStrokeCounts[stroke.userId]) {
        userStrokeCounts[stroke.userId] = 0;
      }
      userStrokeCounts[stroke.userId]++;
    });

    return {
      strokeCount: state.strokes.length,
      userStrokeCounts
    };
  }
}

// Export the class so it can be used in server.js
module.exports = StateManager;