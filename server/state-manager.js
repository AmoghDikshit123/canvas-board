// state-manager.js -Manages the drawing history(all strokes) for each room

class StateManager {
  constructor() {
    this.roomStates = new Map();
  }

  getHistory(roomId) {
    const state = this.roomStates.get(roomId);
    
    if (!state) return [];
    
    return state.strokes;
  }

  addStroke(roomId, stroke) {
    if (!this.roomStates.has(roomId)) {
      this.roomStates.set(roomId, {
        strokes: [] // Array that store all drawing strokes
      });
    }

    const state = this.roomStates.get(roomId);
    
    state.strokes.push(stroke);
    
    console.log(`Stroke added to room ${roomId}. Total strokes: ${state.strokes.length}`);
  }

  undoStroke(roomId) {
    const state = this.roomStates.get(roomId);
    
    if (!state || state.strokes.length === 0) {
      return null;
    }

    // Get the LAST stroke in the room (most recent, regardless of user)
    const lastStroke = state.strokes[state.strokes.length - 1];
    const strokeId = lastStroke.id;

    const removedParts = state.strokes.filter(s => s.id === strokeId);
    state.strokes = state.strokes.filter(s => s.id !== strokeId);

    console.log(`Undo: Removed ${removedParts.length} segments for stroke ${strokeId} from room ${roomId}`);

    return { id: strokeId };
  }

  clearRoom(roomId) {
    const state = this.roomStates.get(roomId);
    
    if (state) {
      state.strokes = [];
      console.log(`🧹 Room ${roomId} cleared`);
    }
  }

  deleteRoom(roomId) {
    const deleted = this.roomStates.delete(roomId);
    
    if (deleted) {
      console.log(`Room ${roomId} state deleted`);
    }
  }

  getStrokeCount(roomId) {
    const state = this.roomStates.get(roomId);
    return state ? state.strokes.length : 0;
  }

  getRoomStats(roomId) {
    const state = this.roomStates.get(roomId);
    
    if (!state) {
      return { strokeCount: 0, users: [] };
    }

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

module.exports = StateManager;