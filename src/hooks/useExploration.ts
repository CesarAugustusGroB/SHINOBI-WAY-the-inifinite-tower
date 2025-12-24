import { useCallback } from 'react';
import {
  GameState, Player, BranchingRoom, CharacterStats,
  Location, Item, GameEvent, Skill, Enemy, LogEntry,
  TrainingActivity, ScrollDiscoveryActivity
} from '../game/types';
import { getCurrentActivity, getCurrentRoom, isFloorComplete } from '../game/systems/LocationSystem';
import { logRoomExit, logStateChange } from '../game/utils/explorationDebug';
import { CombatExplorationState } from './useCombatExplorationState';
import { useActivityHandler, ActivitySceneSetters } from './useActivityHandler';
import { useLocationCards } from './useLocationCards';
import { useRoomNavigation } from './useRoomNavigation';

// Re-export types for App.tsx compatibility
export type { ActivitySceneSetters } from './useActivityHandler';

/**
 * Dependencies for the useExploration hook
 */
export interface UseExplorationDeps {
  player: Player | null;
  playerStats: CharacterStats | null;
  setPlayer: React.Dispatch<React.SetStateAction<Player | null>>;
  setGameState: (state: GameState) => void;
  gameState: GameState;
  addLog: (text: string, type?: LogEntry['type']) => void;
  currentLocation: Location | null;
  activitySetters: ActivitySceneSetters;
  setEnemy: (enemy: Enemy | null) => void;
}

/**
 * Return type for useExploration hook
 */
export interface UseExplorationReturn {
  // Card selection handlers
  handleCardSelect: (index: number) => void;
  handleEnterSelectedLocation: () => void;
  // Room handlers
  handleLocationRoomSelect: (room: BranchingRoom) => void;
  handleLocationRoomEnter: (room: BranchingRoom) => void;
  handleBranchingRoomSelect: (room: BranchingRoom) => void;
  handleBranchingRoomEnter: (room: BranchingRoom) => void;
  // Navigation handlers
  handlePathChoice: (path: import('../game/types').LocationPath) => void;
  handleLeaveLocation: () => void;
  returnToMap: () => void;
}

/**
 * Hook that manages exploration navigation and activity handling.
 * Composes smaller specialized hooks for cleaner separation of concerns.
 *
 * Architecture:
 * - useActivityHandler: Room activity execution (combat, merchant, etc.)
 * - useLocationCards: Card selection and location navigation
 * - useRoomNavigation: Room-level select/enter handlers
 * - useExploration: Composition layer + returnToMap
 */
export function useExploration(
  explorationState: CombatExplorationState,
  deps: UseExplorationDeps
): UseExplorationReturn {
  const {
    // Legacy branching exploration
    branchingFloor,
    setBranchingFloor,
    selectedBranchingRoom,
    setSelectedBranchingRoom,
    setShowApproachSelector,
    // Region exploration
    region,
    setRegion,
    setSelectedLocation,
    locationFloor,
    setLocationFloor,
    // Card-based location selection
    locationDeck,
    intelPool,
    drawnCards,
    setDrawnCards,
    selectedCardIndex,
    setSelectedCardIndex,
    // Location intel
    currentIntel,
    setCurrentIntel,
  } = explorationState;

  const {
    player,
    playerStats,
    setPlayer,
    setGameState,
    gameState,
    addLog,
    currentLocation,
    activitySetters,
    setEnemy,
  } = deps;

  const { setDroppedItems, setDroppedSkill } = activitySetters;

  // ============================================================================
  // COMPOSE SPECIALIZED HOOKS
  // ============================================================================

  // Activity handler - executes room activities
  const { executeRoomActivity } = useActivityHandler({
    player,
    playerStats,
    setPlayer,
    setGameState,
    addLog,
    currentLocation,
    activitySetters,
    setSelectedBranchingRoom,
    setShowApproachSelector,
    setCurrentIntel,
    currentIntel,
  });

  // Location cards - card selection and location navigation
  const {
    handleCardSelect,
    handleEnterSelectedLocation,
    handlePathChoice,
    handleLeaveLocation,
  } = useLocationCards(
    {
      region,
      locationDeck,
      locationFloor,
      intelPool,
      drawnCards,
      selectedCardIndex,
      currentIntel,
      setRegion,
      setSelectedLocation,
      setLocationFloor,
      setDrawnCards,
      setSelectedCardIndex,
      setCurrentIntel,
    },
    { addLog, setGameState }
  );

  // Room navigation - room select/enter handlers
  const {
    handleLocationRoomSelect,
    handleLocationRoomEnter,
    handleBranchingRoomSelect,
    handleBranchingRoomEnter,
  } = useRoomNavigation(
    {
      branchingFloor,
      locationFloor,
      region,
      setBranchingFloor,
      setLocationFloor,
      setSelectedBranchingRoom,
    },
    { player, playerStats, executeRoomActivity }
  );

  // ============================================================================
  // RETURN TO MAP (requires cross-hook coordination)
  // ============================================================================

  // Forward ref for handleLeaveLocation in returnToMap

  const handleLeaveLocationRef = useCallback(() => {
    handleLeaveLocation();
  }, [handleLeaveLocation]);

  /**
   * Return to map after completing an activity (combat, loot, etc.)
   * Handles activity chaining and location completion checks.
   */
  const returnToMap = useCallback(() => {
    logRoomExit(selectedBranchingRoom?.id || 'unknown', 'returnToMap');
    logStateChange(gameState.toString(), 'EXPLORE', 'returnToMap');
    setDroppedItems([]);
    setDroppedSkill(null);
    setEnemy(null);

    // If in location mode, check for activity chaining
    if (region && locationFloor && region.currentLocationId) {
      const currentRoom = getCurrentRoom(locationFloor);
      if (currentRoom) {
        const nextActivity = getCurrentActivity(currentRoom);
        if (nextActivity) {
          // Auto-trigger next activity in room without incrementing roomsVisited
          // (we're staying in the same room, just processing the next activity)
          setSelectedBranchingRoom(null);
          setTimeout(() => executeRoomActivity(currentRoom, locationFloor, setLocationFloor, GameState.LOCATION_EXPLORE), 100);
          return;
        }
      }

      // Check if location is completed (exit room cleared)
      if (isFloorComplete(locationFloor)) {
        setSelectedBranchingRoom(null);
        setTimeout(() => handleLeaveLocationRef(), 100);
        return;
      }

      setSelectedBranchingRoom(null);
      setGameState(GameState.LOCATION_EXPLORE);
    } else {
      setSelectedBranchingRoom(null);
      setGameState(GameState.EXPLORE);
    }
  }, [
    selectedBranchingRoom, gameState, region, locationFloor,
    setDroppedItems, setDroppedSkill, setEnemy, setSelectedBranchingRoom, setGameState,
    executeRoomActivity, setLocationFloor, handleLeaveLocationRef
  ]);

  // ============================================================================
  // PUBLIC API
  // ============================================================================

  return {
    // Card selection
    handleCardSelect,
    handleEnterSelectedLocation,
    // Room navigation
    handleLocationRoomSelect,
    handleLocationRoomEnter,
    handleBranchingRoomSelect,
    handleBranchingRoomEnter,
    // Location navigation
    handlePathChoice,
    handleLeaveLocation,
    returnToMap,
  };
}
