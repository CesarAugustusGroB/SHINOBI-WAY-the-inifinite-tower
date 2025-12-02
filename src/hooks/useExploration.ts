import { useCallback } from 'react';
import { Player, BranchingFloor, BranchingRoom, GameState } from '../game/types';
import { CombatState } from '../game/systems/CombatSystem';
import { ApproachResult } from '../game/systems/ApproachSystem';
import { getPlayerFullStats } from '../game/systems/StatSystem';
import {
  generateBranchingFloor,
  moveToRoom,
  getCurrentActivity,
  completeActivity,
  getCurrentRoom,
} from '../game/systems/BranchingFloorSystem';

export type ActivityType = 'combat' | 'merchant' | 'event' | 'rest' | 'training' | 'treasure';

export interface ActivityResult {
  type: ActivityType;
  room: BranchingRoom;
  updatedFloor: BranchingFloor;
}

export interface UseExplorationProps {
  player: Player | null;
  difficulty: number;
  addLog: (text: string, type?: string, details?: string) => void;
  setPlayer: React.Dispatch<React.SetStateAction<Player | null>>;
  setGameState: (state: GameState) => void;
  onActivity: (result: ActivityResult) => void;

  // Shared state from useCombatExplorationState
  branchingFloor: BranchingFloor | null;
  setBranchingFloor: React.Dispatch<React.SetStateAction<BranchingFloor | null>>;
  selectedBranchingRoom: BranchingRoom | null;
  setSelectedBranchingRoom: React.Dispatch<React.SetStateAction<BranchingRoom | null>>;
  showApproachSelector: boolean;
  setShowApproachSelector: React.Dispatch<React.SetStateAction<boolean>>;
  setCombatState: React.Dispatch<React.SetStateAction<CombatState | null>>;
  setApproachResult: React.Dispatch<React.SetStateAction<ApproachResult | null>>;
}

export interface UseExplorationReturn {
  // Actions only - state is now managed by useCombatExplorationState
  selectRoom: (room: BranchingRoom) => void;
  enterRoom: (room: BranchingRoom) => void;
  nextFloor: (floor: number) => void;
  returnToMap: (clearDrops: () => void) => void;
  completeCurrentActivity: (activityType: ActivityType) => void;
}

/**
 * Custom hook for managing exploration navigation and actions.
 * Extracts floor exploration logic from App.tsx
 *
 * Note: State is now received via props from useCombatExplorationState
 * to break the circular dependency with useCombat.
 */
export function useExploration({
  player,
  difficulty,
  addLog,
  setPlayer,
  setGameState,
  onActivity,
  // Shared state from useCombatExplorationState
  branchingFloor,
  setBranchingFloor,
  selectedBranchingRoom,
  setSelectedBranchingRoom,
  setShowApproachSelector,
  setCombatState,
  setApproachResult,
}: UseExplorationProps): UseExplorationReturn {

  /**
   * Select a room (for preview/info)
   */
  const selectRoom = useCallback((room: BranchingRoom) => {
    setSelectedBranchingRoom(room);
  }, [setSelectedBranchingRoom]);

  /**
   * Enter a room and trigger its activity
   */
  const enterRoom = useCallback((room: BranchingRoom) => {
    if (!branchingFloor || !player) return;

    // Move to the room
    const updatedFloor = moveToRoom(branchingFloor, room.id);
    setBranchingFloor(updatedFloor);

    // Get the current activity for the room
    const currentRoom = updatedFloor.rooms.find(r => r.id === room.id);
    if (!currentRoom) return;

    const activity = getCurrentActivity(currentRoom);

    if (!activity) {
      addLog(`You enter ${currentRoom.name}. Nothing remains here.`, 'info');
      return;
    }

    // Notify parent of activity to handle
    onActivity({
      type: activity,
      room: currentRoom,
      updatedFloor,
    });
  }, [branchingFloor, player, addLog, onActivity, setBranchingFloor]);

  /**
   * Advance to the next floor
   */
  const nextFloor = useCallback((currentFloor: number) => {
    const nextFloorNum = currentFloor + 1;

    setPlayer(p => {
      if (!p) return null;
      const stats = getPlayerFullStats(p);

      // Apply natural regeneration
      const updatedPlayer = {
        ...p,
        currentChakra: Math.min(stats.derived.maxChakra, p.currentChakra + stats.derived.chakraRegen),
        currentHp: Math.min(stats.derived.maxHp, p.currentHp + stats.derived.hpRegen)
      };

      // Reset combat state
      setShowApproachSelector(false);
      setCombatState(null);
      setApproachResult(null);

      // Generate new branching floor
      const newBranchingFloor = generateBranchingFloor(nextFloorNum, difficulty, updatedPlayer);
      setBranchingFloor(newBranchingFloor);
      setSelectedBranchingRoom(null);

      return updatedPlayer;
    });

    setGameState(GameState.BRANCHING_EXPLORE);
  }, [difficulty, setPlayer, setGameState, setCombatState, setApproachResult, setShowApproachSelector, setBranchingFloor, setSelectedBranchingRoom]);

  /**
   * Return to exploration map (after loot/events)
   */
  const returnToMap = useCallback((clearDrops: () => void) => {
    clearDrops();

    // Check if we came from a branching room with remaining activities
    if (selectedBranchingRoom && branchingFloor) {
      const currentRoom = branchingFloor.rooms.find(r => r.id === selectedBranchingRoom.id);
      if (currentRoom) {
        const nextActivity = getCurrentActivity(currentRoom);
        if (nextActivity) {
          // Re-enter the room to trigger the next activity
          enterRoom(currentRoom);
          return;
        }
      }
    }

    // No remaining activities, clear selection and return to map
    setSelectedBranchingRoom(null);
    setGameState(GameState.BRANCHING_EXPLORE);
  }, [selectedBranchingRoom, branchingFloor, enterRoom, setGameState, setSelectedBranchingRoom]);

  /**
   * Mark an activity as completed in the current room
   */
  const completeCurrentActivity = useCallback((activityType: ActivityType) => {
    if (!branchingFloor) return;

    const currentRoom = getCurrentRoom(branchingFloor);
    if (!currentRoom) return;

    const updatedFloor = completeActivity(branchingFloor, currentRoom.id, activityType);
    setBranchingFloor(updatedFloor);
  }, [branchingFloor, setBranchingFloor]);

  return {
    // Actions only - state is now managed by useCombatExplorationState
    selectRoom,
    enterRoom,
    nextFloor,
    returnToMap,
    completeCurrentActivity,
  };
}
