import { useCallback } from 'react';
import {
  GameState, Player, BranchingRoom, BranchingFloor, CharacterStats, Region
} from '../game/types';
import { moveToRoom } from '../game/systems/LocationSystem';
import { logRoomSelect } from '../game/utils/explorationDebug';

/**
 * State needed for room navigation
 */
export interface RoomNavigationState {
  branchingFloor: BranchingFloor | null;
  locationFloor: BranchingFloor | null;
  region: Region | null;
  // Setters
  setBranchingFloor: React.Dispatch<React.SetStateAction<BranchingFloor | null>>;
  setLocationFloor: React.Dispatch<React.SetStateAction<BranchingFloor | null>>;
  setSelectedBranchingRoom: React.Dispatch<React.SetStateAction<BranchingRoom | null>>;
}

/**
 * Dependencies for room navigation
 */
export interface RoomNavigationDeps {
  player: Player | null;
  playerStats: CharacterStats | null;
  executeRoomActivity: (
    currentRoom: BranchingRoom,
    updatedFloor: BranchingFloor,
    setFloor: React.Dispatch<React.SetStateAction<BranchingFloor | null>>,
    exploreState: GameState
  ) => void;
}

/**
 * Return type for room navigation hook
 */
export interface UseRoomNavigationReturn {
  handleLocationRoomSelect: (room: BranchingRoom) => void;
  handleLocationRoomEnter: (room: BranchingRoom) => void;
  handleBranchingRoomSelect: (room: BranchingRoom) => void;
  handleBranchingRoomEnter: (room: BranchingRoom) => void;
}

/**
 * Hook that handles room-level navigation.
 * Manages room selection and entry for both location and branching modes.
 */
export function useRoomNavigation(
  state: RoomNavigationState,
  deps: RoomNavigationDeps
): UseRoomNavigationReturn {
  const {
    branchingFloor,
    locationFloor,
    region,
    setBranchingFloor,
    setLocationFloor,
    setSelectedBranchingRoom,
  } = state;

  const { player, playerStats, executeRoomActivity } = deps;

  /**
   * Select a room in location exploration mode
   */
  const handleLocationRoomSelect = useCallback((room: BranchingRoom) => {
    logRoomSelect(room.id, room.name);
    setSelectedBranchingRoom(room);
  }, [setSelectedBranchingRoom]);

  /**
   * Enter a room in location exploration mode
   */
  const handleLocationRoomEnter = useCallback((room: BranchingRoom) => {
    if (!locationFloor || !region || !player || !playerStats) return;

    const updatedFloor = moveToRoom(locationFloor, room.id, player);
    setLocationFloor(updatedFloor);

    const currentRoom = updatedFloor.rooms.find(r => r.id === room.id);
    if (!currentRoom) return;

    executeRoomActivity(currentRoom, updatedFloor, setLocationFloor, GameState.LOCATION_EXPLORE);
  }, [locationFloor, region, player, playerStats, setLocationFloor, executeRoomActivity]);

  /**
   * Select a room in legacy branching exploration mode
   */
  const handleBranchingRoomSelect = useCallback((room: BranchingRoom) => {
    logRoomSelect(room.id, room.name);
    setSelectedBranchingRoom(room);
  }, [setSelectedBranchingRoom]);

  /**
   * Enter a room in legacy branching exploration mode
   */
  const handleBranchingRoomEnter = useCallback((room: BranchingRoom) => {
    if (!branchingFloor || !player || !playerStats) return;

    const updatedFloor = moveToRoom(branchingFloor, room.id);
    setBranchingFloor(updatedFloor);

    const currentRoom = updatedFloor.rooms.find(r => r.id === room.id);
    if (!currentRoom) return;

    executeRoomActivity(currentRoom, updatedFloor, setBranchingFloor, GameState.EXPLORE);
  }, [branchingFloor, player, playerStats, setBranchingFloor, executeRoomActivity]);

  return {
    handleLocationRoomSelect,
    handleLocationRoomEnter,
    handleBranchingRoomSelect,
    handleBranchingRoomEnter,
  };
}
