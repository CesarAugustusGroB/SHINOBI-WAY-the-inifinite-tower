// ============================================================================
// BRANCHING FLOOR SYSTEM
// Generates and manages the 1→2→4 branching room exploration structure
// ============================================================================

import {
  BranchingFloor,
  BranchingRoom,
  BranchingRoomType,
  CombatModifierType,
  RoomActivities,
  RoomTier,
  RoomPosition,
  TerrainType,
  Player,
  Enemy,
  Item,
  GameEventDefinition,
  PrimaryStat,
  ACTIVITY_ORDER,
} from '../types';
import { generateEnemy, getStoryArc } from './EnemySystem';
import { generateLoot, generateRandomArtifact, generateSkillForFloor } from './LootSystem';
import {
  ROOM_TYPE_CONFIGS,
  getRandomRoomName,
  getRandomRoomDescription,
  getRandomTerrain,
  selectRandomRoomType,
  getRoomTypeConfig,
} from '../constants/roomTypes';
import { EVENTS } from '../constants';

// ============================================================================
// ID GENERATION
// ============================================================================

const generateId = (): string => {
  return `room-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};

// ============================================================================
// ROOM GENERATION
// ============================================================================

/**
 * Create a single branching room with activities based on type
 */
function createRoom(
  tier: RoomTier,
  position: RoomPosition,
  parentId: string | null,
  floor: number,
  difficulty: number,
  arc: string,
  forceType?: BranchingRoomType,
  depth: number = 0
): BranchingRoom {
  // Select room type
  const type = forceType ?? selectRandomRoomType(tier);
  const config = getRoomTypeConfig(type);

  // Generate room name and description
  const name = getRandomRoomName(type, arc);
  const description = getRandomRoomDescription(type);
  const terrain = getRandomTerrain(type);

  // Create the room
  const room: BranchingRoom = {
    id: generateId(),
    tier,
    position,
    parentId,
    childIds: [],

    type,
    name,
    description,
    terrain,
    icon: config.icon,

    activities: {},
    currentActivityIndex: 0,

    isVisible: true,
    isAccessible: tier === 0, // Only tier 0 is initially accessible
    isCleared: tier === 0, // Start room is pre-cleared
    isExit: false,
    isCurrent: tier === 0,

    // Dynamic generation tracking
    depth,
    hasGeneratedChildren: false,
  };

  // Generate activities based on room type config
  room.activities = generateActivities(room, config, floor, difficulty, arc);

  return room;
}

/**
 * Generate activities for a room based on its config
 */
function generateActivities(
  room: BranchingRoom,
  config: typeof ROOM_TYPE_CONFIGS[BranchingRoomType],
  floor: number,
  difficulty: number,
  arc: string
): RoomActivities {
  const activities: RoomActivities = {};

  // Combat (first if present)
  if (config.hasCombat === 'required' || (config.hasCombat === 'optional' && Math.random() < 0.5)) {
    const isElite = room.tier === 2 && Math.random() < 0.3;
    const enemyType = isElite ? 'ELITE' : 'NORMAL';
    const enemy = generateEnemy(floor, enemyType, difficulty);

    // Select combat modifiers
    const modifiers: CombatModifierType[] = config.combatModifiers
      ? [config.combatModifiers[Math.floor(Math.random() * config.combatModifiers.length)]]
      : [CombatModifierType.NONE];

    activities.combat = {
      enemy,
      modifiers,
      completed: false,
    };
  }

  // Merchant
  if (config.hasMerchant) {
    const itemCount = 2 + Math.floor(Math.random() * 3);
    const items: Item[] = [];
    for (let i = 0; i < itemCount; i++) {
      items.push(generateLoot(floor, difficulty));
    }

    activities.merchant = {
      items,
      discountPercent: Math.random() < 0.2 ? 15 : 0,
      completed: false,
    };
  }

  // Event
  if (config.hasEvent) {
    const arcEvents = EVENTS.filter(
      e => !e.allowedArcs || e.allowedArcs.includes(arc)
    );
    const event = arcEvents.length > 0
      ? arcEvents[Math.floor(Math.random() * arcEvents.length)]
      : EVENTS[0];

    if (event) {
      activities.event = {
        definition: event as unknown as GameEventDefinition,
        completed: false,
      };
    }
  }

  // Scroll Discovery - chance to find jutsu scrolls in certain rooms
  // Shrines, Ruins, and rooms with events have a chance for scrolls
  if (config.hasScrollDiscovery || (config.hasEvent && Math.random() < 0.25)) {
    const skill = generateSkillForFloor(floor);
    activities.scrollDiscovery = {
      availableScrolls: [skill],
      cost: { chakra: 15 + floor * 2 }, // Chakra cost to study the scroll
      completed: false,
    };
  }

  // Elite Challenge - rare chance in SHRINE and RUINS to fight elite for artifact
  // This is the ONLY source of artifacts in the game
  if ((room.type === BranchingRoomType.SHRINE || room.type === BranchingRoomType.RUINS) && Math.random() < 0.15) {
    const eliteEnemy = generateEnemy(floor + 1, 'ELITE', difficulty + 15);
    eliteEnemy.name = `${eliteEnemy.name} (Artifact Guardian)`;

    activities.eliteChallenge = {
      enemy: eliteEnemy,
      artifact: generateRandomArtifact(floor, difficulty + 20),
      completed: false,
    };
  }

  // Rest
  if (config.hasRest) {
    activities.rest = {
      healPercent: 30 + Math.floor(Math.random() * 20),
      chakraRestorePercent: 40 + Math.floor(Math.random() * 20),
      completed: false,
    };
  }

  // Training - Multiple stat options with intensity levels
  if (config.hasTraining) {
    // All 9 primary stats available for training
    const allStats: PrimaryStat[] = [
      PrimaryStat.WILLPOWER,
      PrimaryStat.CHAKRA,
      PrimaryStat.STRENGTH,
      PrimaryStat.SPIRIT,
      PrimaryStat.INTELLIGENCE,
      PrimaryStat.CALMNESS,
      PrimaryStat.SPEED,
      PrimaryStat.ACCURACY,
      PrimaryStat.DEXTERITY,
    ];

    // Shuffle and pick 3 random stats
    const shuffled = [...allStats].sort(() => Math.random() - 0.5);
    const selectedStats = shuffled.slice(0, 3);

    // Base costs and gains scale with floor
    const baseHpCost = 10 + floor * 2;
    const baseChakraCost = 5 + floor;
    const baseGain = 1 + Math.floor(floor / 10);

    activities.training = {
      options: selectedStats.map(stat => ({
        stat,
        intensities: {
          light: {
            cost: { hp: baseHpCost, chakra: baseChakraCost },
            gain: baseGain,
          },
          medium: {
            cost: { hp: baseHpCost * 2, chakra: baseChakraCost * 2 },
            gain: baseGain * 2,
          },
          intense: {
            cost: { hp: baseHpCost * 3, chakra: baseChakraCost * 3 },
            gain: baseGain * 3,
          },
        },
      })),
      completed: false,
    };
  }

  // Treasure - Source of components only (artifacts from Elite Challenges)
  if (config.hasTreasure) {
    const itemCount = 2 + Math.floor(Math.random() * 2); // 2-3 items
    const items: Item[] = [];
    for (let i = 0; i < itemCount; i++) {
      // Only components drop from treasure - artifacts from Elite Challenges only
      items.push(generateLoot(floor, difficulty + 5));
    }

    activities.treasure = {
      items,
      ryo: 75 + floor * 15 + Math.floor(Math.random() * 100),
      collected: false,
    };
  }

  return activities;
}

/**
 * Generate a semi-boss enemy for exit rooms
 */
function generateSemiBoss(floor: number, difficulty: number): Enemy {
  const enemy = generateEnemy(floor, 'ELITE', difficulty + 15);

  // Buff the semi-boss stats
  enemy.name = `Guardian ${enemy.name}`;
  enemy.tier = 'Guardian';
  enemy.primaryStats.willpower = Math.floor(enemy.primaryStats.willpower * 1.3);
  enemy.primaryStats.strength = Math.floor(enemy.primaryStats.strength * 1.2);
  enemy.primaryStats.spirit = Math.floor(enemy.primaryStats.spirit * 1.2);

  // Recalculate HP
  const hpBonus = enemy.primaryStats.willpower * 12 + 50;
  enemy.currentHp = hpBonus;

  return enemy;
}

// ============================================================================
// EXIT ROOM PROBABILITY
// ============================================================================

/**
 * Calculate minimum rooms before exit can appear
 * Formula: minRoomsBeforeExit = 3 + floor (Floor 1 = 4 rooms, Floor 10 = 13 rooms)
 */
function getMinRoomsBeforeExit(floor: number): number {
  return 3 + Math.min(floor, 15); // Cap at 18 rooms max
}

/**
 * Calculate exit probability for a room at given depth
 * After min rooms, each room has increasing chance to be EXIT
 */
function calculateExitProbability(roomsVisited: number, floor: number, depth: number): number {
  const minRooms = getMinRoomsBeforeExit(floor);

  if (roomsVisited < minRooms) {
    return 0;
  }

  // Base 20% chance, increases with rooms visited beyond minimum
  const roomsBeyondMin = roomsVisited - minRooms;
  const baseChance = 0.2;
  const incrementPerRoom = 0.1; // +10% per room beyond minimum

  return Math.min(0.8, baseChance + (roomsBeyondMin * incrementPerRoom));
}

/**
 * Determine if a new room should be the exit
 */
function shouldBeExitRoom(branchingFloor: BranchingFloor, depth: number): boolean {
  // If exit already exists, no more exit rooms
  if (branchingFloor.exitRoomId) {
    return false;
  }

  const probability = calculateExitProbability(
    branchingFloor.roomsVisited,
    branchingFloor.floor,
    depth
  );

  return Math.random() < probability;
}

// ============================================================================
// DYNAMIC ROOM GENERATION
// ============================================================================

/**
 * Generate children for a room dynamically
 * Called when player moves to a room that needs its grandchildren generated
 */
export function generateChildrenForRoom(
  branchingFloor: BranchingFloor,
  roomId: string
): BranchingFloor {
  const room = branchingFloor.rooms.find(r => r.id === roomId);
  if (!room || room.hasGeneratedChildren) {
    return branchingFloor;
  }

  const { floor, arc, difficulty } = branchingFloor;
  const newRooms: BranchingRoom[] = [];
  const childDepth = room.depth + 1;

  // Generate 2 children for this room
  const positions: RoomPosition[] = room.position === 'LEFT' || room.position === 'LEFT_OUTER' || room.position === 'LEFT_INNER'
    ? ['LEFT_OUTER', 'LEFT_INNER']
    : ['RIGHT_INNER', 'RIGHT_OUTER'];

  for (let i = 0; i < 2; i++) {
    // Check if this child should be the exit
    const isExit = shouldBeExitRoom(branchingFloor, childDepth);

    const childRoom = createRoom(
      2, // Children are always displayed as tier 2 (grandchildren in relative view)
      positions[i],
      room.id,
      floor,
      difficulty,
      arc,
      isExit ? BranchingRoomType.BOSS_GATE : undefined,
      childDepth
    );

    if (isExit) {
      childRoom.isExit = true;
      childRoom.name = getRandomRoomName(BranchingRoomType.BOSS_GATE, arc);
      childRoom.description = getRandomRoomDescription(BranchingRoomType.BOSS_GATE);
      childRoom.icon = ROOM_TYPE_CONFIGS[BranchingRoomType.BOSS_GATE].icon;

      // Replace activities with semi-boss (components only, artifacts from Elite Challenges)
      childRoom.activities = {
        combat: {
          enemy: generateSemiBoss(floor, difficulty),
          modifiers: [CombatModifierType.NONE],
          completed: false,
        },
        treasure: {
          items: [
            generateLoot(floor, difficulty + 15),
            generateLoot(floor, difficulty + 15),
          ],
          ryo: 100 + floor * 15,
          collected: false,
        },
      };

      // Update exitRoomId
      branchingFloor = {
        ...branchingFloor,
        exitRoomId: childRoom.id,
      };
    }

    newRooms.push(childRoom);
  }

  // Update the parent room's childIds and hasGeneratedChildren flag
  const updatedRooms = branchingFloor.rooms.map(r => {
    if (r.id === roomId) {
      return {
        ...r,
        childIds: newRooms.map(nr => nr.id),
        hasGeneratedChildren: true,
      };
    }
    return r;
  });

  return {
    ...branchingFloor,
    rooms: [...updatedRooms, ...newRooms],
    totalRooms: updatedRooms.length + newRooms.length,
  };
}

/**
 * Generate grandchildren for current room's children (called when entering a room)
 * This ensures we always have 2 levels of rooms visible ahead
 */
export function ensureGrandchildrenExist(
  branchingFloor: BranchingFloor,
  currentRoomId: string
): BranchingFloor {
  const currentRoom = branchingFloor.rooms.find(r => r.id === currentRoomId);
  if (!currentRoom) {
    return branchingFloor;
  }

  let updatedFloor = branchingFloor;

  // Generate children for each child of current room (to show grandchildren)
  for (const childId of currentRoom.childIds) {
    const childRoom = updatedFloor.rooms.find(r => r.id === childId);
    if (childRoom && !childRoom.hasGeneratedChildren) {
      updatedFloor = generateChildrenForRoom(updatedFloor, childId);
    }
  }

  return updatedFloor;
}

// ============================================================================
// FLOOR GENERATION
// ============================================================================

/**
 * Generate a complete branching floor with initial 1→2→4 structure
 * Exit room will be generated dynamically as player explores
 */
export function generateBranchingFloor(
  floor: number,
  difficulty: number,
  player: Player
): BranchingFloor {
  const arc = getStoryArc(floor);
  const rooms: BranchingRoom[] = [];
  const isFirstFloor = floor === 1;

  // Tier 0: Start room (Gateway) - ONLY on floor 1
  let startRoom: BranchingRoom | null = null;
  if (isFirstFloor) {
    startRoom = createRoom(0, 'CENTER', null, floor, difficulty, arc.name, BranchingRoomType.START, 0);
    startRoom.hasGeneratedChildren = true;
    rooms.push(startRoom);
  }

  // Tier 1: Two rooms branching from start - depth 1 (or depth 0 if no start room)
  const tier1Depth = isFirstFloor ? 1 : 0;
  const tier1Left = createRoom(1, 'LEFT', startRoom?.id ?? null, floor, difficulty, arc.name, undefined, tier1Depth);
  const tier1Right = createRoom(1, 'RIGHT', startRoom?.id ?? null, floor, difficulty, arc.name, undefined, tier1Depth);

  // Mark tier 1 rooms as accessible
  tier1Left.isAccessible = true;
  tier1Right.isAccessible = true;
  tier1Left.hasGeneratedChildren = true;
  tier1Right.hasGeneratedChildren = true;

  // On floors 2+, tier 1 rooms are the starting point (no parent, player chooses one)
  if (!isFirstFloor) {
    tier1Left.isCurrent = false;
    tier1Right.isCurrent = false;
  }

  rooms.push(tier1Left, tier1Right);

  // Connect tier 0 to tier 1 (only if start room exists)
  if (startRoom) {
    startRoom.childIds = [tier1Left.id, tier1Right.id];
  }

  // Tier 2: Four rooms (2 from each tier 1 room)
  const tier2Depth = isFirstFloor ? 2 : 1;
  const tier2Rooms: BranchingRoom[] = [];

  // Left branch children
  const tier2LeftOuter = createRoom(2, 'LEFT_OUTER', tier1Left.id, floor, difficulty, arc.name, undefined, tier2Depth);
  const tier2LeftInner = createRoom(2, 'LEFT_INNER', tier1Left.id, floor, difficulty, arc.name, undefined, tier2Depth);
  tier2Rooms.push(tier2LeftOuter, tier2LeftInner);
  tier1Left.childIds = [tier2LeftOuter.id, tier2LeftInner.id];

  // Right branch children
  const tier2RightInner = createRoom(2, 'RIGHT_INNER', tier1Right.id, floor, difficulty, arc.name, undefined, tier2Depth);
  const tier2RightOuter = createRoom(2, 'RIGHT_OUTER', tier1Right.id, floor, difficulty, arc.name, undefined, tier2Depth);
  tier2Rooms.push(tier2RightInner, tier2RightOuter);
  tier1Right.childIds = [tier2RightInner.id, tier2RightOuter.id];

  rooms.push(...tier2Rooms);

  // Determine starting room and cleared count
  const currentRoomId = isFirstFloor ? startRoom!.id : tier1Left.id;
  const clearedRooms = isFirstFloor ? 1 : 0;

  let generatedFloor: BranchingFloor = {
    id: `floor-${floor}-${Date.now()}`,
    floor,
    arc: arc.name,
    biome: arc.biome,
    rooms,
    currentRoomId,
    exitRoomId: null,
    totalRooms: rooms.length,
    clearedRooms,
    roomsVisited: isFirstFloor ? 1 : 0,
    difficulty,
  };

  // On Floor 2+, player starts at tier1, so we need to pre-generate tier3 rooms
  // (normally ensureGrandchildrenExist is called when moving to a room, but
  // since player starts here, we need to do it during generation)
  if (!isFirstFloor) {
    generatedFloor = ensureGrandchildrenExist(generatedFloor, currentRoomId);
  }

  return generatedFloor;
}

// ============================================================================
// ROOM NAVIGATION
// ============================================================================

/**
 * Check if a room is accessible from the current room
 */
export function isRoomAccessible(
  branchingFloor: BranchingFloor,
  targetRoomId: string
): boolean {
  const currentRoom = branchingFloor.rooms.find(r => r.id === branchingFloor.currentRoomId);
  if (!currentRoom) return false;

  // Can always access current room
  if (targetRoomId === branchingFloor.currentRoomId) return true;

  // Can only move to child rooms if current room is cleared
  if (!currentRoom.isCleared) return false;

  return currentRoom.childIds.includes(targetRoomId);
}

/**
 * Move to a new room
 * Also triggers dynamic generation of grandchildren for the new room
 */
export function moveToRoom(
  branchingFloor: BranchingFloor,
  targetRoomId: string
): BranchingFloor {
  const targetRoom = branchingFloor.rooms.find(r => r.id === targetRoomId);

  // Check if target room exists and is accessible
  if (!targetRoom || !targetRoom.isAccessible) {
    return branchingFloor;
  }

  // Update current room flags - preserve existing accessibility
  const updatedRooms = branchingFloor.rooms.map(room => ({
    ...room,
    isCurrent: room.id === targetRoomId,
  }));

  let updatedFloor: BranchingFloor = {
    ...branchingFloor,
    currentRoomId: targetRoomId,
    rooms: updatedRooms,
    roomsVisited: branchingFloor.roomsVisited + 1, // Increment rooms visited
  };

  // Generate grandchildren for this room's children (ensure 2 levels visible)
  updatedFloor = ensureGrandchildrenExist(updatedFloor, targetRoomId);

  return updatedFloor;
}

// ============================================================================
// ACTIVITY MANAGEMENT
// ============================================================================

/**
 * Get the current activity for a room
 */
export function getCurrentActivity(room: BranchingRoom): keyof RoomActivities | null {
  for (const activityKey of ACTIVITY_ORDER) {
    const activity = room.activities[activityKey];
    if (activity && !isActivityCompleted(activity)) {
      return activityKey;
    }
  }
  return null;
}

/**
 * Check if an activity is completed
 */
function isActivityCompleted(activity: RoomActivities[keyof RoomActivities]): boolean {
  if (!activity) return true;

  if ('completed' in activity) return activity.completed;
  if ('collected' in activity) return activity.collected;

  return false;
}

/**
 * Mark an activity as completed
 */
export function completeActivity(
  branchingFloor: BranchingFloor,
  roomId: string,
  activityKey: keyof RoomActivities
): BranchingFloor {
  const updatedRooms = branchingFloor.rooms.map(room => {
    if (room.id !== roomId) return room;

    const activity = room.activities[activityKey];
    if (!activity) return room;

    const updatedActivity = { ...activity };
    if ('completed' in updatedActivity) {
      updatedActivity.completed = true;
    }
    if ('collected' in updatedActivity) {
      updatedActivity.collected = true;
    }

    const updatedActivities = {
      ...room.activities,
      [activityKey]: updatedActivity,
    };

    // Check if all activities are now complete
    const allCompleted = ACTIVITY_ORDER.every(key => {
      const act = updatedActivities[key];
      return !act || isActivityCompleted(act);
    });

    // Update child rooms accessibility if room is now cleared
    let updatedChildIds = room.childIds;

    return {
      ...room,
      activities: updatedActivities,
      isCleared: allCompleted,
    };
  });

  // If the room was cleared, update child room accessibility
  const clearedRoom = updatedRooms.find(r => r.id === roomId);
  if (clearedRoom?.isCleared) {
    updatedRooms.forEach(room => {
      if (clearedRoom.childIds.includes(room.id)) {
        room.isAccessible = true;
      }
    });
  }

  // Count cleared rooms
  const clearedCount = updatedRooms.filter(r => r.isCleared).length;

  return {
    ...branchingFloor,
    rooms: updatedRooms,
    clearedRooms: clearedCount,
  };
}

/**
 * Check if the floor is complete (exit room cleared)
 */
export function isFloorComplete(branchingFloor: BranchingFloor): boolean {
  const exitRoom = branchingFloor.rooms.find(r => r.id === branchingFloor.exitRoomId);
  return exitRoom?.isCleared ?? false;
}

// ============================================================================
// ROOM STATE QUERIES
// ============================================================================

/**
 * Get a room by ID
 */
export function getRoomById(
  branchingFloor: BranchingFloor,
  roomId: string
): BranchingRoom | undefined {
  return branchingFloor.rooms.find(r => r.id === roomId);
}

/**
 * Get the current room
 */
export function getCurrentRoom(branchingFloor: BranchingFloor): BranchingRoom | undefined {
  return branchingFloor.rooms.find(r => r.id === branchingFloor.currentRoomId);
}

/**
 * Get child rooms of a room
 */
export function getChildRooms(
  branchingFloor: BranchingFloor,
  roomId: string
): BranchingRoom[] {
  const room = branchingFloor.rooms.find(r => r.id === roomId);
  if (!room) return [];

  return room.childIds
    .map(childId => branchingFloor.rooms.find(r => r.id === childId))
    .filter((r): r is BranchingRoom => r !== undefined);
}

/**
 * Get rooms by tier
 */
export function getRoomsByTier(
  branchingFloor: BranchingFloor,
  tier: RoomTier
): BranchingRoom[] {
  return branchingFloor.rooms.filter(r => r.tier === tier);
}

// ============================================================================
// COMBAT MODIFIER HELPERS
// ============================================================================

/**
 * Get combat setup for a room
 */
export function getCombatSetup(room: BranchingRoom): {
  enemy: Enemy | null;
  modifiers: CombatModifierType[];
  terrain: TerrainType;
} {
  const combat = room.activities.combat;

  return {
    enemy: combat?.enemy ?? null,
    modifiers: combat?.modifiers ?? [CombatModifierType.NONE],
    terrain: room.terrain,
  };
}
