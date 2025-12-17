/**
 * LocationSystem Unit Tests
 * Tests floor generation, room navigation, and activity management
 */

import { describe, it, expect } from 'vitest';
import {
  generateBranchingFloor,
  isRoomAccessible,
  moveToRoom,
  getCurrentActivity,
  completeActivity,
  isFloorComplete,
  getRoomById,
  getCurrentRoom,
} from '../LocationSystem';
import { BranchingRoomType, ACTIVITY_ORDER } from '../../types';
import { createMockPlayer } from './testFixtures';

describe('generateBranchingFloor', () => {
  const player = createMockPlayer();

  it('generates floor with proper structure', () => {
    const floor = generateBranchingFloor(1, 50, player);

    expect(floor.floor).toBe(1);
    expect(floor.rooms.length).toBeGreaterThan(0);
    expect(floor.currentRoomId).toBeDefined();
    expect(floor.arc).toBeDefined();
    expect(floor.biome).toBeDefined();
  });

  it('floor 1 has START room', () => {
    const floor = generateBranchingFloor(1, 50, player);
    const startRoom = floor.rooms.find(r => r.type === BranchingRoomType.START);

    expect(startRoom).toBeDefined();
    expect(startRoom!.tier).toBe(0);
    expect(startRoom!.isCleared).toBe(true); // Start is pre-cleared
  });

  it('floor 2+ does not have START room', () => {
    const floor = generateBranchingFloor(2, 50, player);
    const startRoom = floor.rooms.find(r => r.type === BranchingRoomType.START);

    expect(startRoom).toBeUndefined();
  });

  it('generates branching structure (1 -> 2 -> 4)', () => {
    const floor = generateBranchingFloor(1, 50, player);

    // Tier 0: 1 room (START)
    const tier0 = floor.rooms.filter(r => r.tier === 0);
    expect(tier0.length).toBe(1);

    // Tier 1: 2 rooms
    const tier1 = floor.rooms.filter(r => r.tier === 1);
    expect(tier1.length).toBe(2);

    // Tier 2: 4 rooms
    const tier2 = floor.rooms.filter(r => r.tier === 2);
    expect(tier2.length).toBe(4);
  });

  it('tier 1 rooms are accessible from start', () => {
    const floor = generateBranchingFloor(1, 50, player);
    const tier1Rooms = floor.rooms.filter(r => r.tier === 1);

    tier1Rooms.forEach(room => {
      expect(room.isAccessible).toBe(true);
    });
  });
});

describe('isRoomAccessible', () => {
  const player = createMockPlayer();

  it('current room is always accessible', () => {
    const floor = generateBranchingFloor(1, 50, player);

    expect(isRoomAccessible(floor, floor.currentRoomId)).toBe(true);
  });

  it('child rooms accessible after current room is cleared', () => {
    let floor = generateBranchingFloor(1, 50, player);
    const currentRoom = getCurrentRoom(floor);

    expect(currentRoom).toBeDefined();
    expect(currentRoom!.isCleared).toBe(true); // START is pre-cleared

    // Child rooms should be accessible
    currentRoom!.childIds.forEach(childId => {
      expect(isRoomAccessible(floor, childId)).toBe(true);
    });
  });
});

describe('moveToRoom', () => {
  const player = createMockPlayer();

  it('updates current room when moving', () => {
    let floor = generateBranchingFloor(1, 50, player);
    const startRoom = getCurrentRoom(floor);
    const targetId = startRoom!.childIds[0];

    floor = moveToRoom(floor, targetId);

    expect(floor.currentRoomId).toBe(targetId);
  });

  it('increments rooms visited counter', () => {
    let floor = generateBranchingFloor(1, 50, player);
    const initialVisited = floor.roomsVisited;
    const startRoom = getCurrentRoom(floor);
    const targetId = startRoom!.childIds[0];

    floor = moveToRoom(floor, targetId);

    expect(floor.roomsVisited).toBe(initialVisited + 1);
  });

  it('does not increment rooms visited when re-entering same room', () => {
    let floor = generateBranchingFloor(1, 50, player);
    const currentRoomId = floor.currentRoomId;
    const initialVisited = floor.roomsVisited;

    // Try to move to the same room (re-entry for remaining activities)
    floor = moveToRoom(floor, currentRoomId);

    // roomsVisited should NOT have incremented
    expect(floor.roomsVisited).toBe(initialVisited);
  });

  it('does not move to inaccessible room', () => {
    let floor = generateBranchingFloor(1, 50, player);
    const tier2Room = floor.rooms.find(r => r.tier === 2);

    // Tier 2 is not directly accessible from START
    const originalRoomId = floor.currentRoomId;
    floor = moveToRoom(floor, tier2Room!.id);

    // Should not have moved (tier 2 not accessible yet)
    expect(floor.currentRoomId).toBe(originalRoomId);
  });
});

describe('getCurrentActivity', () => {
  const player = createMockPlayer();

  it('returns first incomplete activity', () => {
    const floor = generateBranchingFloor(1, 50, player);
    // Move to a room with activities
    const targetRoom = floor.rooms.find(r => r.tier === 1 && r.activities.combat);

    if (targetRoom) {
      const activity = getCurrentActivity(targetRoom);
      // Should return combat first (it's first in ACTIVITY_ORDER)
      expect(activity).toBe('combat');
    }
  });

  it('returns null when all activities completed', () => {
    const floor = generateBranchingFloor(1, 50, player);
    const startRoom = getCurrentRoom(floor)!;

    // START room has no activities
    const activity = getCurrentActivity(startRoom);
    expect(activity).toBeNull();
  });
});

describe('completeActivity', () => {
  const player = createMockPlayer();

  it('marks activity as completed', () => {
    let floor = generateBranchingFloor(1, 50, player);
    const roomWithCombat = floor.rooms.find(r => r.activities.combat && !r.activities.combat.completed);

    if (roomWithCombat) {
      floor = completeActivity(floor, roomWithCombat.id, 'combat');
      const updatedRoom = getRoomById(floor, roomWithCombat.id);
      expect(updatedRoom!.activities.combat!.completed).toBe(true);
    }
  });

  it('marks room as cleared when all activities done', () => {
    let floor = generateBranchingFloor(1, 50, player);
    // Find a room with activities to complete
    const tier1Room = floor.rooms.find(r => r.tier === 1);

    if (tier1Room) {
      // Complete all activities in order
      for (const actKey of ACTIVITY_ORDER) {
        if (tier1Room.activities[actKey]) {
          floor = completeActivity(floor, tier1Room.id, actKey);
        }
      }

      const updatedRoom = getRoomById(floor, tier1Room.id);
      expect(updatedRoom!.isCleared).toBe(true);
    }
  });

  it('makes child rooms accessible when room cleared', () => {
    let floor = generateBranchingFloor(1, 50, player);
    const tier1Room = floor.rooms.find(r => r.tier === 1);

    if (tier1Room && tier1Room.childIds.length > 0) {
      // Complete all activities
      for (const actKey of ACTIVITY_ORDER) {
        if (tier1Room.activities[actKey]) {
          floor = completeActivity(floor, tier1Room.id, actKey);
        }
      }

      // Child rooms should now be accessible
      tier1Room.childIds.forEach(childId => {
        const childRoom = getRoomById(floor, childId);
        expect(childRoom!.isAccessible).toBe(true);
      });
    }
  });
});

describe('isFloorComplete', () => {
  const player = createMockPlayer();

  it('returns false when no exit room exists', () => {
    const floor = generateBranchingFloor(1, 50, player);
    // Initially, exit room may not exist yet
    if (!floor.exitRoomId) {
      expect(isFloorComplete(floor)).toBe(false);
    }
  });

  it('returns false when exit room not cleared', () => {
    let floor = generateBranchingFloor(1, 50, player);

    // Generate enough rooms to potentially create an exit
    // Move through rooms to trigger exit generation
    let currentRoom = getCurrentRoom(floor);
    for (let i = 0; i < 20 && currentRoom && currentRoom.childIds.length > 0; i++) {
      // Complete activities
      for (const actKey of ACTIVITY_ORDER) {
        if (currentRoom.activities[actKey]) {
          floor = completeActivity(floor, currentRoom.id, actKey);
        }
      }

      // Move to first child
      floor = moveToRoom(floor, currentRoom.childIds[0]);
      currentRoom = getCurrentRoom(floor);
    }

    // If exit exists and not cleared, should return false
    if (floor.exitRoomId) {
      const exitRoom = getRoomById(floor, floor.exitRoomId);
      if (exitRoom && !exitRoom.isCleared) {
        expect(isFloorComplete(floor)).toBe(false);
      }
    }
  });
});
