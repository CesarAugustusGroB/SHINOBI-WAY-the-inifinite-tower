// ============================================================================
// EXPLORATION DEBUG UTILITY
// Mirrors combatDebug.ts pattern for tracking navigation flow
// ============================================================================

export const EXPLORATION_DEBUG = true;

type DebugCategory = 'room' | 'activity' | 'modal' | 'state' | 'flow' | 'sync' | 'info';

const COLORS: Record<DebugCategory, string> = {
  room: 'color: #00ff88; font-weight: bold',      // Bright green - room entry/exit
  activity: 'color: #ff8800; font-weight: bold',  // Orange - activity processing
  modal: 'color: #00bfff; font-weight: bold',     // Cyan - modal open/close
  state: 'color: #ff00ff; font-weight: bold',     // Magenta - GameState changes
  flow: 'color: #ffff00; font-weight: bold',      // Yellow - flow checkpoints
  sync: 'color: #ff4444; font-weight: bold',      // Red - state sync warnings
  info: 'color: #888888',                         // Gray - general info
};

function explorationLog(category: DebugCategory, message: string, data?: any): void {
  if (!EXPLORATION_DEBUG) return;
  const timestamp = new Date().toISOString().split('T')[1].slice(0, -1);
  const prefix = `[EXPLORE ${timestamp}]`;
  if (data !== undefined) {
    console.log(`%c${prefix} [${category.toUpperCase()}] ${message}`, COLORS[category], data);
  } else {
    console.log(`%c${prefix} [${category.toUpperCase()}] ${message}`, COLORS[category]);
  }
}

// ============================================================================
// ROOM NAVIGATION
// ============================================================================

export function logRoomEnter(roomId: string, roomName: string, currentActivity: string | null): void {
  explorationLog('room', `>>> ENTERING: ${roomName} (${roomId})`, { currentActivity });
}

export function logRoomExit(roomId: string, reason: string): void {
  explorationLog('room', `<<< EXITING: ${roomId} - ${reason}`);
}

export function logRoomSelect(roomId: string, roomName: string): void {
  explorationLog('room', `[SELECT] ${roomName} (${roomId}) - UI only`);
}

// ============================================================================
// ACTIVITY PROCESSING
// ============================================================================

export function logActivityStart(roomId: string, activityType: string, data?: any): void {
  explorationLog('activity', `[START] ${activityType} in ${roomId}`, data);
}

export function logActivityComplete(roomId: string, activityType: string): void {
  explorationLog('activity', `[COMPLETE] ${activityType} in ${roomId}`);
}

export function logActivitySkip(roomId: string, activityType: string, reason: string): void {
  explorationLog('activity', `[SKIP] ${activityType} in ${roomId} - ${reason}`);
}

// ============================================================================
// MODAL STATES
// ============================================================================

export function logModalOpen(modalName: string, data?: any): void {
  explorationLog('modal', `[OPEN] ${modalName}`, data);
}

export function logModalClose(modalName: string, action?: string): void {
  explorationLog('modal', `[CLOSE] ${modalName}${action ? ` - ${action}` : ''}`);
}

// ============================================================================
// GAMESTATE TRANSITIONS
// ============================================================================

export function logStateChange(from: string, to: string, trigger?: string): void {
  explorationLog('state', `${from} → ${to}${trigger ? ` (${trigger})` : ''}`);
}

// ============================================================================
// FLOW CHECKPOINTS
// ============================================================================

export function logExplorationCheckpoint(label: string, data?: any): void {
  explorationLog('flow', `[CHECKPOINT] ${label}`, data);
}

export function logSyncWarning(message: string, data?: any): void {
  explorationLog('sync', `[WARNING] ${message}`, data);
}

// ============================================================================
// FLOOR NAVIGATION
// ============================================================================

export function logFloorChange(oldFloor: number, newFloor: number): void {
  explorationLog('flow', `=== FLOOR CHANGE: ${oldFloor} → ${newFloor} ===`);
}
