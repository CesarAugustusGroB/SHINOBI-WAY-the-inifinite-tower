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

// ============================================================================
// REGION NAVIGATION (Land of Waves / Region System)
// ============================================================================

export function logRegionEnter(regionName: string, totalLocations: number): void {
  explorationLog('flow', `=== ENTERING REGION: ${regionName} (${totalLocations} locations) ===`);
}

export function logRegionExit(regionName: string, locationsCompleted: number): void {
  explorationLog('flow', `=== EXITING REGION: ${regionName} (${locationsCompleted} completed) ===`);
}

// ============================================================================
// LOCATION NAVIGATION
// ============================================================================

export function logLocationSelect(locationId: string, locationName: string): void {
  explorationLog('room', `[SELECT] Location: ${locationName} (${locationId})`);
}

export function logLocationEnter(locationId: string, locationName: string, dangerLevel: number): void {
  explorationLog('room', `>>> ENTERING LOCATION: ${locationName} (Danger ${dangerLevel})`, { locationId });
}

export function logLocationComplete(locationId: string, locationName: string): void {
  explorationLog('room', `✓ LOCATION COMPLETE: ${locationName}`, { locationId });
}

export function logLocationLeave(locationId: string, locationName: string, reason: string): void {
  explorationLog('room', `<<< LEAVING LOCATION: ${locationName} - ${reason}`, { locationId });
}

// ============================================================================
// INTEL MISSION
// ============================================================================

export function logIntelMissionStart(locationName: string, enemyName: string): void {
  explorationLog('activity', `[INTEL] Starting mission in ${locationName} vs ${enemyName}`);
}

export function logIntelMissionVictory(locationName: string): void {
  explorationLog('activity', `[INTEL] ✓ Victory in ${locationName} - Path choice earned!`);
}

export function logIntelMissionSkip(locationName: string): void {
  explorationLog('activity', `[INTEL] ✗ Skipped in ${locationName} - Random path assigned`);
}

// ============================================================================
// PATH NAVIGATION
// ============================================================================

export function logPathChoice(pathId: string, targetLocation: string, pathType: string): void {
  explorationLog('flow', `[PATH] Chose ${pathType} path → ${targetLocation}`, { pathId });
}

export function logPathRandom(pathId: string, targetLocation: string): void {
  explorationLog('flow', `[PATH] Random assignment → ${targetLocation}`, { pathId });
}

export function logPathReveal(pathIds: string[], locationName: string): void {
  explorationLog('info', `[PATH] Revealed ${pathIds.length} path(s) from ${locationName}`, pathIds);
}

// ============================================================================
// INTEL & CARD SYSTEM
// ============================================================================

export function logIntelEvaluate(intel: number, cardCount: number, revealedCount: number): void {
  explorationLog('info', `[INTEL] Evaluated: ${intel}% → ${cardCount} cards, ${revealedCount} revealed`);
}

export function logCardDrawStart(regionId: string, count: number, revealedCount: number | undefined): void {
  explorationLog('flow', `[CARD] Draw starting: region=${regionId}, count=${count}, revealed=${revealedCount ?? 'auto'}`);
}

export function logCardDraw(index: number, locationName: string, intelLevel: number, isRevealed: boolean): void {
  explorationLog('flow', `[CARD] Draw #${index}: ${locationName} - Intel:${intelLevel} Revealed:${isRevealed}`);
}

export function logCardDrawComplete(cards: Array<{ name: string; intelLevel: number }>): void {
  explorationLog('flow', `[CARD] Draw complete:`, cards);
}

export function logInitialCardDraw(initialIntel: number, cardCount: number, revealedCount: number): void {
  explorationLog('flow', `=== INITIAL CARD DRAW: Intel ${initialIntel}% → ${cardCount} cards, ${revealedCount} revealed ===`);
}

export function logCardRender(index: number, locationName: string, intelLevel: number, showMystery: boolean): void {
  explorationLog('info', `[RENDER] Card #${index}: ${locationName} - Intel:${intelLevel} Mystery:${showMystery}`);
}

export function logCardsReceived(cardCount: number, cards: Array<{ name: string; intelLevel: number }>): void {
  explorationLog('info', `[REGION_MAP] Received ${cardCount} cards:`, cards);
}

// ============================================================================
// INTEL STATE CHANGES
// ============================================================================

export function logIntelGain(source: string, amount: number, newTotal: number): void {
  explorationLog('activity', `[INTEL] +${amount}% from ${source} → ${newTotal}%`);
}

export function logIntelReset(locationName: string): void {
  explorationLog('flow', `[INTEL] Reset to 0% (entering ${locationName})`);
}
