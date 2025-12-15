/**
 * =============================================================================
 * BRANCHING FLOOR SYSTEM - Exploration & Room Management
 * =============================================================================
 *
 * This system manages the procedurally-generated dungeon floors with a
 * branching room structure. Players explore rooms, complete activities,
 * and eventually find the exit to advance to the next floor.
 *
 * ## FLOOR STRUCTURE
 *
 * The floor uses a dynamic 1→2→4 branching pattern:
 * ```
 *                    [START] (Tier 0, Floor 1 only)
 *                    /     \
 *               [LEFT]    [RIGHT] (Tier 1)
 *               /    \    /    \
 *            [L_O] [L_I][R_I] [R_O] (Tier 2)
 *              |     |    |     |
 *           [...dynamic generation continues...]
 * ```
 *
 * Rooms are generated dynamically as the player explores to ensure:
 * - Memory efficiency (only generate what's needed)
 * - Always 2 levels of rooms visible ahead
 * - Exit can appear at any depth after minimum rooms
 *
 * ## ACTIVITY ORDER
 * Each room can have multiple activities that must be completed in order:
 * 1. combat - Fight the room's enemy
 * 2. eliteChallenge - Optional elite fight for artifacts (15% chance in shrines/ruins)
 * 3. merchant - Buy items
 * 4. event - Story/choice event
 * 5. scrollDiscovery - Find and learn jutsu scrolls
 * 6. rest - Heal HP and restore chakra
 * 7. training - Spend HP/chakra to gain stats
 * 8. treasure - Collect components and ryo
 *
 * ## EXIT ROOM PROBABILITY
 * The exit room appears dynamically based on exploration progress:
 *
 * - Minimum rooms before exit: 3 + floor (capped at 18)
 *   - Floor 1: 4 rooms minimum
 *   - Floor 10: 13 rooms minimum
 *   - Floor 15+: 18 rooms minimum
 *
 * - After minimum is reached:
 *   - Base 20% chance per new room
 *   - +10% per additional room beyond minimum
 *   - Maximum 80% chance (always some exploration required)
 *
 * ## SEMI-BOSS (Exit Guardian)
 * Exit rooms contain a "Guardian" enemy with boosted stats:
 * - Willpower: ×1.3 (more HP)
 * - Strength: ×1.2 (more physical damage/defense)
 * - Spirit: ×1.2 (more elemental defense)
 *
 * ## ELITE CHALLENGES (Artifact Source)
 * - Only source of artifacts in the game
 * - 15% chance to appear in SHRINE or RUINS room types
 * - Elite enemy with +15 difficulty
 * - Guaranteed artifact drop on victory
 *
 * =============================================================================
 */

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
  PrimaryStat,
  ACTIVITY_ORDER,
  DEFAULT_MERCHANT_SLOTS,
  DEFAULT_TREASURE_QUALITY,
  TreasureQuality,
} from '../types';
import { generateEnemy } from './EnemySystem';
import { generateLoot, generateRandomArtifact, generateSkillForFloor, generateComponentByQuality } from './LootSystem';
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
// FLOOR TO DANGER LEVEL CONVERSION
// ============================================================================

/**
 * Convert floor number to danger level for enemy scaling.
 * Maps floors to danger levels 1-7:
 * - Floors 1-3 → Danger 1
 * - Floors 4-6 → Danger 2
 * - Floors 7-9 → Danger 3
 * - Floors 10-12 → Danger 4
 * - Floors 13-15 → Danger 5
 * - Floors 16-18 → Danger 6
 * - Floors 19+ → Danger 7
 */
function floorToDangerLevel(floor: number): number {
  return Math.min(7, Math.max(1, Math.ceil(floor / 3)));
}

/**
 * Determine story arc name based on floor range.
 * - Floors 1-10: WAVES_ARC (Land of Waves)
 * - Floors 11-20: EXAMS_ARC (Chunin Exams)
 * - Floors 21-30: ROGUE_ARC (Sasuke Retrieval)
 * - Floors 31+: WAR_ARC (Great Ninja War)
 */
function getArcNameFromFloor(floor: number): string {
  if (floor <= 10) return 'WAVES_ARC';
  if (floor <= 20) return 'EXAMS_ARC';
  if (floor <= 30) return 'ROGUE_ARC';
  return 'WAR_ARC';
}

/**
 * Get story arc data for a floor (name, label, biome).
 */
function getStoryArc(floor: number): { name: string; label: string; biome: string } {
  const arcName = getArcNameFromFloor(floor);
  const arcs: Record<string, { name: string; label: string; biome: string }> = {
    'WAVES_ARC': { name: 'WAVES_ARC', label: 'Land of Waves', biome: 'Mist Covered Bridge' },
    'EXAMS_ARC': { name: 'EXAMS_ARC', label: 'Chunin Exams', biome: 'Forest of Death' },
    'ROGUE_ARC': { name: 'ROGUE_ARC', label: 'Sasuke Retrieval', biome: 'Valley of the End' },
    'WAR_ARC': { name: 'WAR_ARC', label: 'Great Ninja War', biome: 'Divine Tree Roots' },
  };
  return arcs[arcName];
}

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
  depth: number = 0,
  player?: Player
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
  room.activities = generateActivities(room, config, floor, difficulty, arc, player);

  return room;
}

/**
 * Generate activities for a room based on its configuration.
 * Activities are determined by the room type config and random chance.
 *
 * ## Activity Generation Rules:
 *
 * - **Combat**: Required or optional based on config, 50% for optional
 * - **Elite Challenge**: 15% in SHRINE/RUINS, drops artifacts
 * - **Merchant**: Uses player.merchantSlots for item count, 20% chance of 15% discount
 * - **Event**: Filtered by current story arc
 * - **Scroll Discovery**: 25% chance if room has events
 * - **Rest**: 30-50% HP heal, 40-60% chakra restore
 * - **Training**: 3 random stats with light/medium/intense intensity
 * - **Treasure**: Uses player.treasureQuality for component quality + ryo (scales with floor)
 *
 * @param room - The room being populated with activities
 * @param config - Room type configuration (from ROOM_TYPE_CONFIGS)
 * @param floor - Current floor number for scaling
 * @param difficulty - Difficulty modifier for enemy/loot generation
 * @param arc - Current story arc name for event filtering
 * @param player - Player for treasure quality and merchant slots (optional for backward compat)
 * @returns RoomActivities object with all generated activities
 */
function generateActivities(
  room: BranchingRoom,
  config: typeof ROOM_TYPE_CONFIGS[BranchingRoomType],
  floor: number,
  difficulty: number,
  arc: string,
  player?: Player
): RoomActivities {
  const activities: RoomActivities = {};

  // Combat (first if present)
  if (config.hasCombat === 'required' || (config.hasCombat === 'optional' && Math.random() < 0.5)) {
    const isElite = room.tier === 2 && Math.random() < 0.3;
    const enemyType = isElite ? 'ELITE' : 'NORMAL';
    const dangerLevel = floorToDangerLevel(floor);
    const enemy = generateEnemy(dangerLevel, player?.locationsCleared ?? 0, enemyType, difficulty, arc);

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

  // Merchant - uses player.merchantSlots for item count (defaults to 1)
  if (config.hasMerchant) {
    const itemCount = player?.merchantSlots ?? DEFAULT_MERCHANT_SLOTS;
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

  // Event - Use enhanced events with requirements, costs, and weighted outcomes
  if (config.hasEvent) {
    const arcEvents = EVENTS.filter(
      e => !e.allowedArcs || e.allowedArcs.includes(arc)
    );
    const event = arcEvents.length > 0
      ? arcEvents[Math.floor(Math.random() * arcEvents.length)]
      : EVENTS[0];

    if (event) {
      activities.event = {
        definition: event,
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
    const eliteDangerLevel = floorToDangerLevel(floor + 1);
    const eliteEnemy = generateEnemy(eliteDangerLevel, player?.locationsCleared ?? 0, 'ELITE', difficulty + 15, arc);
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

  // Treasure - 1 item with 50% chance to upgrade quality by one tier
  if (config.hasTreasure) {
    let quality = player?.treasureQuality ?? DEFAULT_TREASURE_QUALITY;

    // 50% chance to upgrade quality by one tier
    if (Math.random() < 0.5) {
      if (quality === TreasureQuality.BROKEN) quality = TreasureQuality.COMMON;
      else if (quality === TreasureQuality.COMMON) quality = TreasureQuality.RARE;
    }

    activities.treasure = {
      items: [generateComponentByQuality(floor, difficulty + 5, quality)],
      ryo: 75 + floor * 15 + Math.floor(Math.random() * 100),
      collected: false,
    };
  }

  return activities;
}

/**
 * Generate a semi-boss "Guardian" enemy for exit rooms.
 * Guardians are enhanced elite enemies that guard the floor exit.
 *
 * ## Guardian Stat Multipliers:
 * - Willpower: ×1.3 (30% more HP and HP regen)
 * - Strength: ×1.2 (20% more physical damage/defense)
 * - Spirit: ×1.2 (20% more elemental defense)
 *
 * ## HP Recalculation:
 * After stat boost, HP is recalculated using the standard formula:
 * HP = (willpower × 12) + 50
 *
 * This ensures the Guardian has significantly more health than regular
 * elite enemies, making them a meaningful floor-ending challenge.
 *
 * @param floor - Current floor for base stat scaling
 * @param difficulty - Difficulty modifier (extra +15 applied)
 * @param locationsCleared - Global count of locations cleared (for scaling)
 * @param arc - Story arc name for theming
 * @returns Enhanced Enemy with Guardian tier and boosted stats
 */
function generateGuardian(floor: number, difficulty: number, locationsCleared: number, arc: string): Enemy {
  const dangerLevel = floorToDangerLevel(floor);
  const enemy = generateEnemy(dangerLevel, locationsCleared, 'ELITE', difficulty + 15, arc);

  // Apply Guardian stat multipliers
  enemy.name = `Guardian ${enemy.name}`;
  enemy.tier = 'Guardian';
  enemy.primaryStats.willpower = Math.floor(enemy.primaryStats.willpower * 1.3);
  enemy.primaryStats.strength = Math.floor(enemy.primaryStats.strength * 1.2);
  enemy.primaryStats.spirit = Math.floor(enemy.primaryStats.spirit * 1.2);

  // Recalculate HP based on boosted willpower
  const hpBonus = enemy.primaryStats.willpower * 12 + 50;
  enemy.currentHp = hpBonus;

  return enemy;
}

// ============================================================================
// EXIT ROOM PROBABILITY
// ============================================================================
//
// The exit room system creates a dynamic floor length that scales with
// progression while ensuring players always explore a meaningful amount.
//
// Formula: minRooms = 3 + floor (capped at 18)
// After minimum: 20% base + 10% per additional room (capped at 80%)
//
// Example progression:
// - Floor 1: Min 4 rooms, exit appears around rooms 4-8
// - Floor 5: Min 8 rooms, exit appears around rooms 8-12
// - Floor 15+: Min 18 rooms, exit appears around rooms 18-24
// ============================================================================

/**
 * Calculate minimum rooms player must visit before exit can appear.
 * This ensures each floor has a minimum exploration requirement.
 *
 * @param floor - Current floor number
 * @returns Minimum room count before exit is possible
 */
function getMinRoomsBeforeExit(floor: number): number {
  // Cap at 15 to prevent excessive floor length on high floors
  return 3 + Math.min(floor, 15); // Results: Floor 1→4, Floor 10→13, Floor 15+→18
}

/**
 * Calculate probability that a new room becomes the exit.
 * Uses a ramping probability system to prevent infinite exploration.
 *
 * ## Probability Curve:
 * - Below minimum: 0% (no exit possible)
 * - At minimum: 20% base chance
 * - Each room beyond: +10% cumulative
 * - Maximum: 80% (always some uncertainty)
 *
 * @param roomsVisited - Total rooms player has entered
 * @param floor - Current floor number (affects minimum)
 * @param depth - Room depth in tree (unused, kept for flexibility)
 * @returns Probability 0.0-0.8 that next room is the exit
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
  roomId: string,
  player?: Player
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
      childDepth,
      player
    );

    if (isExit) {
      childRoom.isExit = true;
      childRoom.name = getRandomRoomName(BranchingRoomType.BOSS_GATE, arc);
      childRoom.description = getRandomRoomDescription(BranchingRoomType.BOSS_GATE);
      childRoom.icon = ROOM_TYPE_CONFIGS[BranchingRoomType.BOSS_GATE].icon;

      // Replace activities with semi-boss (1 item with 50% quality boost)
      let quality = player?.treasureQuality ?? DEFAULT_TREASURE_QUALITY;
      if (Math.random() < 0.5) {
        if (quality === TreasureQuality.BROKEN) quality = TreasureQuality.COMMON;
        else if (quality === TreasureQuality.COMMON) quality = TreasureQuality.RARE;
      }
      const treasureItems = [generateComponentByQuality(floor, difficulty + 15, quality)];

      childRoom.activities = {
        combat: {
          enemy: generateGuardian(floor, difficulty, player?.locationsCleared ?? 0, arc),
          modifiers: [CombatModifierType.NONE],
          completed: false,
        },
        treasure: {
          items: treasureItems,
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
  currentRoomId: string,
  player?: Player
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
      updatedFloor = generateChildrenForRoom(updatedFloor, childId, player);
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
    startRoom = createRoom(0, 'CENTER', null, floor, difficulty, arc.name, BranchingRoomType.START, 0, player);
    startRoom.hasGeneratedChildren = true;
    rooms.push(startRoom);
  }

  // Tier 1: Two rooms branching from start - depth 1 (or depth 0 if no start room)
  const tier1Depth = isFirstFloor ? 1 : 0;
  const tier1Left = createRoom(1, 'LEFT', startRoom?.id ?? null, floor, difficulty, arc.name, undefined, tier1Depth, player);
  const tier1Right = createRoom(1, 'RIGHT', startRoom?.id ?? null, floor, difficulty, arc.name, undefined, tier1Depth, player);

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
  const tier2LeftOuter = createRoom(2, 'LEFT_OUTER', tier1Left.id, floor, difficulty, arc.name, undefined, tier2Depth, player);
  const tier2LeftInner = createRoom(2, 'LEFT_INNER', tier1Left.id, floor, difficulty, arc.name, undefined, tier2Depth, player);
  tier2Rooms.push(tier2LeftOuter, tier2LeftInner);
  tier1Left.childIds = [tier2LeftOuter.id, tier2LeftInner.id];

  // Right branch children
  const tier2RightInner = createRoom(2, 'RIGHT_INNER', tier1Right.id, floor, difficulty, arc.name, undefined, tier2Depth, player);
  const tier2RightOuter = createRoom(2, 'RIGHT_OUTER', tier1Right.id, floor, difficulty, arc.name, undefined, tier2Depth, player);
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
    generatedFloor = ensureGrandchildrenExist(generatedFloor, currentRoomId, player);
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
  targetRoomId: string,
  player?: Player
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
  updatedFloor = ensureGrandchildrenExist(updatedFloor, targetRoomId, player);

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
