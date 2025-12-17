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
 * The floor uses a 1→2→2 branching pattern:
 * ```
 *                    [START] (Tier 0, Floor 1 only)
 *                    /     \
 *               [LEFT]    [RIGHT] (Tier 1)
 *               /   \      /   \
 *           [CHILD_0] [CHILD_1] (Tier 2, 2 children per parent)
 *              |         |
 *           [...dynamic generation continues with 2 children each...]
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
 * ## EXIT ROOM PROBABILITY
 * The exit room appears dynamically based on exploration progress:
 *
**/

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
import { calculateXP, calculateRyo } from './ScalingSystem';

// Re-export scaling functions for backward compatibility
export { dangerToFloor, getWealthMultiplier, applyWealthToRyo } from './ScalingSystem';

// ============================================================================
// ID GENERATION
// ============================================================================

const generateId = (): string => {
  return `room-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};

// ============================================================================
// QUALITY UPGRADE HELPER
// ============================================================================

/**
 * Maybe upgrade treasure quality with 50% chance.
 * BROKEN → COMMON → RARE (caps at RARE).
 */
function maybeUpgradeQuality(baseQuality: TreasureQuality): TreasureQuality {
  if (Math.random() >= 0.5) return baseQuality;
  if (baseQuality === TreasureQuality.BROKEN) return TreasureQuality.COMMON;
  if (baseQuality === TreasureQuality.COMMON) return TreasureQuality.RARE;
  return baseQuality; // Already RARE, no upgrade
}

// ============================================================================
// DYNAMIC BRANCHING HELPERS
// ============================================================================

/**
 * Get the number of children for a room.
 * Fixed at 2 children per room for consistent branching.
 */
export function getChildCount(): number {
  return 2;
}

/**
 * Get the positions array for a given number of children.
 * Uses CHILD_0 and CHILD_1 for the 2-child branching pattern.
 *
 * @param childCount - Number of children (fixed at 2)
 * @returns Array of RoomPosition values
 */
export function getChildPositions(childCount: number): RoomPosition[] {
  const positions: RoomPosition[] = [];
  for (let i = 0; i < Math.min(childCount, 2); i++) {
    positions.push(`CHILD_${i}` as RoomPosition);
  }
  return positions;
}

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
// ============================================================================
// ACTIVITY GENERATION HELPERS
// ============================================================================

/**
 * Generate combat activity for a room.
 */
function generateCombatActivity(
  room: BranchingRoom,
  config: typeof ROOM_TYPE_CONFIGS[BranchingRoomType],
  floor: number,
  difficulty: number,
  arc: string,
  player?: Player
): RoomActivities['combat'] | undefined {
  if (config.hasCombat !== 'required' && (config.hasCombat !== 'optional' || Math.random() >= 0.5)) {
    return undefined;
  }

  const isElite = room.tier === 2 && Math.random() < 0.3;
  const enemyType = isElite ? 'ELITE' : 'NORMAL';
  const dangerLevel = floorToDangerLevel(floor);
  const enemy = generateEnemy(dangerLevel, player?.locationsCleared ?? 0, enemyType, difficulty, arc);

  const modifiers: CombatModifierType[] = config.combatModifiers
    ? [config.combatModifiers[Math.floor(Math.random() * config.combatModifiers.length)]]
    : [CombatModifierType.NONE];

  return { enemy, modifiers, completed: false };
}

/**
 * Generate merchant activity for a room.
 */
function generateMerchantActivity(
  config: typeof ROOM_TYPE_CONFIGS[BranchingRoomType],
  floor: number,
  difficulty: number,
  player?: Player
): RoomActivities['merchant'] | undefined {
  if (!config.hasMerchant) return undefined;

  const itemCount = player?.merchantSlots ?? DEFAULT_MERCHANT_SLOTS;
  const items: Item[] = [];
  for (let i = 0; i < itemCount; i++) {
    items.push(generateLoot(floor, difficulty));
  }

  return {
    items,
    discountPercent: Math.random() < 0.2 ? 15 : 0,
    completed: false,
  };
}

/**
 * Generate event activity for a room.
 */
function generateEventActivity(
  config: typeof ROOM_TYPE_CONFIGS[BranchingRoomType],
  arc: string
): RoomActivities['event'] | undefined {
  if (!config.hasEvent) return undefined;

  const arcEvents = EVENTS.filter(e => !e.allowedArcs || e.allowedArcs.includes(arc));
  const event = arcEvents.length > 0
    ? arcEvents[Math.floor(Math.random() * arcEvents.length)]
    : EVENTS[0];

  if (!event) return undefined;

  return { definition: event, completed: false };
}

/**
 * Generate scroll discovery activity for a room.
 */
function generateScrollDiscoveryActivity(
  config: typeof ROOM_TYPE_CONFIGS[BranchingRoomType],
  floor: number
): RoomActivities['scrollDiscovery'] | undefined {
  if (!config.hasScrollDiscovery && (!config.hasEvent || Math.random() >= 0.25)) {
    return undefined;
  }

  const skill = generateSkillForFloor(floor);
  return {
    availableScrolls: [skill],
    cost: { chakra: 15 + floor * 2 },
    completed: false,
  };
}

/**
 * Generate elite challenge activity for a room.
 * This is the ONLY source of artifacts in the game.
 */
function generateEliteChallengeActivity(
  room: BranchingRoom,
  floor: number,
  difficulty: number,
  arc: string,
  player?: Player
): RoomActivities['eliteChallenge'] | undefined {
  const isValidRoom = room.type === BranchingRoomType.SHRINE || room.type === BranchingRoomType.RUINS;
  if (!isValidRoom || Math.random() >= 0.15) return undefined;

  const eliteDangerLevel = floorToDangerLevel(floor + 1);
  const eliteEnemy = generateEnemy(eliteDangerLevel, player?.locationsCleared ?? 0, 'ELITE', difficulty + 15, arc);
  eliteEnemy.name = `${eliteEnemy.name} (Artifact Guardian)`;

  return {
    enemy: eliteEnemy,
    artifact: generateRandomArtifact(floor, difficulty + 20),
    completed: false,
  };
}

/**
 * Generate rest activity for a room.
 */
function generateRestActivity(
  config: typeof ROOM_TYPE_CONFIGS[BranchingRoomType]
): RoomActivities['rest'] | undefined {
  if (!config.hasRest) return undefined;

  return {
    healPercent: 30 + Math.floor(Math.random() * 20),
    chakraRestorePercent: 40 + Math.floor(Math.random() * 20),
    completed: false,
  };
}

/**
 * Generate training activity for a room.
 */
function generateTrainingActivity(
  config: typeof ROOM_TYPE_CONFIGS[BranchingRoomType],
  floor: number
): RoomActivities['training'] | undefined {
  if (!config.hasTraining) return undefined;

  const allStats: PrimaryStat[] = [
    PrimaryStat.WILLPOWER, PrimaryStat.CHAKRA, PrimaryStat.STRENGTH,
    PrimaryStat.SPIRIT, PrimaryStat.INTELLIGENCE, PrimaryStat.CALMNESS,
    PrimaryStat.SPEED, PrimaryStat.ACCURACY, PrimaryStat.DEXTERITY,
  ];

  const shuffled = [...allStats].sort(() => Math.random() - 0.5);
  const selectedStats = shuffled.slice(0, 3);

  const baseHpCost = 10 + floor * 2;
  const baseChakraCost = 5 + floor;
  const baseGain = 1 + Math.floor(floor / 10);

  return {
    options: selectedStats.map(stat => ({
      stat,
      intensities: {
        light: { cost: { hp: baseHpCost, chakra: baseChakraCost }, gain: baseGain },
        medium: { cost: { hp: baseHpCost * 2, chakra: baseChakraCost * 2 }, gain: baseGain * 2 },
        intense: { cost: { hp: baseHpCost * 3, chakra: baseChakraCost * 3 }, gain: baseGain * 3 },
      },
    })),
    completed: false,
  };
}

/**
 * Generate treasure activity for a room.
 */
function generateTreasureActivity(
  config: typeof ROOM_TYPE_CONFIGS[BranchingRoomType],
  floor: number,
  difficulty: number,
  player?: Player
): RoomActivities['treasure'] | undefined {
  if (!config.hasTreasure) return undefined;

  const quality = maybeUpgradeQuality(player?.treasureQuality ?? DEFAULT_TREASURE_QUALITY);

  return {
    items: [generateComponentByQuality(floor, difficulty + 5, quality)],
    ryo: 50 + floor * 10 + Math.floor(Math.random() * 67),
    collected: false,
  };
}

/**
 * Generate info gathering activity for a room.
 */
function generateInfoGatheringActivity(
  config: typeof ROOM_TYPE_CONFIGS[BranchingRoomType]
): RoomActivities['infoGathering'] | undefined {
  if (!config.hasInfoGathering) return undefined;

  const flavorTexts = [
    'You gather information from locals.',
    'Ancient inscriptions reveal secrets.',
    'A passing traveler shares rumors.',
    'You overhear valuable intelligence.',
    'Careful observation reveals hidden details.',
  ];

  return {
    intelGain: 25,
    flavorText: flavorTexts[Math.floor(Math.random() * flavorTexts.length)],
    completed: false,
  };
}

// ============================================================================
// MAIN ACTIVITY GENERATION ORCHESTRATOR
// ============================================================================

/**
 * Generate all activities for a room based on room type configuration.
 * Delegates to specialized helper functions for each activity type.
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

  const combat = generateCombatActivity(room, config, floor, difficulty, arc, player);
  if (combat) activities.combat = combat;

  const merchant = generateMerchantActivity(config, floor, difficulty, player);
  if (merchant) activities.merchant = merchant;

  const event = generateEventActivity(config, arc);
  if (event) activities.event = event;

  const scrollDiscovery = generateScrollDiscoveryActivity(config, floor);
  if (scrollDiscovery) activities.scrollDiscovery = scrollDiscovery;

  const eliteChallenge = generateEliteChallengeActivity(room, floor, difficulty, arc, player);
  if (eliteChallenge) activities.eliteChallenge = eliteChallenge;

  const rest = generateRestActivity(config);
  if (rest) activities.rest = rest;

  const training = generateTrainingActivity(config, floor);
  if (training) activities.training = training;

  const treasure = generateTreasureActivity(config, floor, difficulty, player);
  if (treasure) activities.treasure = treasure;

  const infoGathering = generateInfoGatheringActivity(config);
  if (infoGathering) activities.infoGathering = infoGathering;

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
// danger level while ensuring players always explore a meaningful amount.
//
// Formula: minRooms = 2 + dangerLevel (D1→3, D4→6, D7→9)
// After minimum: 30% base + 5% per additional room (capped at 80%)
//
// Example progression:
// - Danger 1: Min 3 rooms, exit appears around rooms 3-13
// - Danger 4: Min 6 rooms, exit appears around rooms 6-16
// - Danger 7: Min 9 rooms, exit appears around rooms 9-19
// ============================================================================

/**
 * Calculate minimum rooms player must visit before exit can appear.
 * Uses danger level (1-7) for reasonable minimums in location-based exploration.
 *
 * @param dangerLevel - Location danger level (1-7)
 * @returns Minimum room count before exit is possible
 */
function getMinRoomsBeforeExit(dangerLevel: number): number {
  return 2 + dangerLevel; // Results: D1→3, D4→6, D7→9
}

/**
 * Calculate probability that a new room becomes the exit.
 * Uses a ramping probability system to prevent infinite exploration.
 *
 * ## Probability Curve:
 * - Below minimum: 0% (no exit possible)
 * - At minimum: 30% base chance
 * - Each room beyond: +5% cumulative
 * - Maximum: 80% (always some uncertainty)
 *
 * @param roomsVisited - Total rooms player has entered
 * @param dangerLevel - Location danger level (affects minimum)
 * @returns Probability 0.0-0.8 that next room is the exit
 */
function calculateExitProbability(roomsVisited: number, dangerLevel: number): number {
  const minRooms = getMinRoomsBeforeExit(dangerLevel);

  if (roomsVisited < minRooms) {
    return 0;
  }

  // Base 30% chance, increases with rooms visited beyond minimum
  const roomsBeyondMin = roomsVisited - minRooms;
  const baseChance = 0.3;
  const incrementPerRoom = 0.05; // +5% per room beyond minimum

  return Math.min(0.8, baseChance + (roomsBeyondMin * incrementPerRoom));
}

/**
 * Determine if a new room should be the exit
 */
function shouldBeExitRoom(branchingFloor: BranchingFloor): boolean {
  // If exit already exists, no more exit rooms
  if (branchingFloor.exitRoomId) {
    return false;
  }

  const probability = calculateExitProbability(
    branchingFloor.roomsVisited,
    branchingFloor.dangerLevel
  );

  return Math.random() < probability;
}

// ============================================================================
// DYNAMIC ROOM GENERATION
// ============================================================================

/**
 * Configure a room as an exit room with guardian enemy and treasure.
 * Returns a new room object instead of mutating the input.
 */
function configureAsExitRoom(
  room: BranchingRoom,
  floor: number,
  difficulty: number,
  arc: string,
  player?: Player
): BranchingRoom {
  const quality = maybeUpgradeQuality(player?.treasureQuality ?? DEFAULT_TREASURE_QUALITY);

  return {
    ...room,
    isExit: true,
    name: getRandomRoomName(BranchingRoomType.BOSS_GATE, arc),
    description: getRandomRoomDescription(BranchingRoomType.BOSS_GATE),
    icon: ROOM_TYPE_CONFIGS[BranchingRoomType.BOSS_GATE].icon,
    activities: {
      combat: {
        enemy: generateGuardian(floor, difficulty, player?.locationsCleared ?? 0, arc),
        modifiers: [CombatModifierType.NONE],
        completed: false,
      },
      treasure: {
        items: [generateComponentByQuality(floor, difficulty + 15, quality)],
        ryo: 67 + floor * 10,
        collected: false,
      },
    },
  };
}

/**
 * Link child rooms to their parent and update the parent's state.
 */
function linkChildrenToParent(
  rooms: BranchingRoom[],
  parentId: string,
  childIds: string[]
): BranchingRoom[] {
  return rooms.map(r => {
    if (r.id === parentId) {
      return { ...r, childIds, hasGeneratedChildren: true };
    }
    return r;
  });
}

/**
 * Generate children for a room dynamically (2-4 children).
 * Uses lazy loading - children are only generated when their parent is visited.
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
  let updatedFloor = branchingFloor;

  // Generate 2-4 children for this room (dynamic branching)
  const childCount = getChildCount();
  const positions = getChildPositions(childCount);

  for (let i = 0; i < childCount; i++) {
    const isExit = shouldBeExitRoom(updatedFloor);

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

    const finalRoom = isExit
      ? configureAsExitRoom(childRoom, floor, difficulty, arc, player)
      : childRoom;

    if (isExit) {
      updatedFloor = { ...updatedFloor, exitRoomId: finalRoom.id };
    }

    newRooms.push(finalRoom);
  }

  const updatedRooms = linkChildrenToParent(updatedFloor.rooms, roomId, newRooms.map(r => r.id));

  return {
    ...updatedFloor,
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
 * Configuration for generating a branching floor.
 * Used by RegionSystem when creating floors from Location configs.
 */
export interface FloorGenerationConfig {
  floor: number;
  arc: string;
  biome: string;
  dangerLevel: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  wealthLevel: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  roomGenerationMode: 'static' | 'dynamic';
  targetRoomCount: number;
  difficulty: number;
  initialIntel?: number;  // Defaults to 0
  player?: Player;
}

/**
 * Generate a branching floor from a configuration object.
 * Used by RegionSystem when converting Locations to BranchingFloors.
 */
export function generateBranchingFloorFromConfig(config: FloorGenerationConfig): BranchingFloor {
  const {
    floor,
    arc,
    biome,
    dangerLevel,
    wealthLevel,
    roomGenerationMode,
    targetRoomCount,
    difficulty,
    initialIntel = 0,
    player,
  } = config;

  const rooms: BranchingRoom[] = [];
  const isFirstFloor = floor === 1;

  // Tier 0: Start room (Gateway) - ONLY on floor 1
  let startRoom: BranchingRoom | null = null;
  if (isFirstFloor) {
    startRoom = createRoom(0, 'CENTER', null, floor, difficulty, arc, BranchingRoomType.START, 0, player);
    startRoom.hasGeneratedChildren = true;
    rooms.push(startRoom);
  }

  // Tier 1: Two rooms branching from start
  const tier1Depth = isFirstFloor ? 1 : 0;
  const tier1Left = createRoom(1, 'LEFT', startRoom?.id ?? null, floor, difficulty, arc, undefined, tier1Depth, player);
  const tier1Right = createRoom(1, 'RIGHT', startRoom?.id ?? null, floor, difficulty, arc, undefined, tier1Depth, player);

  tier1Left.isAccessible = true;
  tier1Right.isAccessible = true;
  tier1Left.hasGeneratedChildren = true;
  tier1Right.hasGeneratedChildren = true;

  if (!isFirstFloor) {
    tier1Left.isCurrent = false;
    tier1Right.isCurrent = false;
  }

  rooms.push(tier1Left, tier1Right);

  if (startRoom) {
    startRoom.childIds = [tier1Left.id, tier1Right.id];
  }

  // Tier 2: Dynamic 2-4 rooms per tier 1 parent
  const tier2Depth = isFirstFloor ? 2 : 1;
  const tier2Rooms: BranchingRoom[] = [];

  // Generate children for left branch (2-4 children)
  const leftChildCount = getChildCount();
  const leftPositions = getChildPositions(leftChildCount);
  const leftChildren: BranchingRoom[] = [];
  for (let i = 0; i < leftChildCount; i++) {
    const childRoom = createRoom(2, leftPositions[i], tier1Left.id, floor, difficulty, arc, undefined, tier2Depth, player);
    leftChildren.push(childRoom);
  }
  tier2Rooms.push(...leftChildren);
  tier1Left.childIds = leftChildren.map(r => r.id);

  // Generate children for right branch (2-4 children)
  const rightChildCount = getChildCount();
  const rightPositions = getChildPositions(rightChildCount);
  const rightChildren: BranchingRoom[] = [];
  for (let i = 0; i < rightChildCount; i++) {
    const childRoom = createRoom(2, rightPositions[i], tier1Right.id, floor, difficulty, arc, undefined, tier2Depth, player);
    rightChildren.push(childRoom);
  }
  tier2Rooms.push(...rightChildren);
  tier1Right.childIds = rightChildren.map(r => r.id);

  rooms.push(...tier2Rooms);

  const currentRoomId = isFirstFloor ? startRoom!.id : tier1Left.id;
  const clearedRooms = isFirstFloor ? 1 : 0;

  let generatedFloor: BranchingFloor = {
    id: `floor-${floor}-${Date.now()}`,
    floor,
    arc,
    biome,
    rooms,
    currentRoomId,
    exitRoomId: null,
    totalRooms: rooms.length,
    clearedRooms,
    roomsVisited: isFirstFloor ? 1 : 0,
    difficulty,
    currentIntel: initialIntel,
    intelGainedThisLocation: 0,
    wealthLevel,
    roomGenerationMode,
    targetRoomCount,
    minRoomsBeforeExit: getMinRoomsBeforeExit(floor),
    dangerLevel,
  };

  if (!isFirstFloor) {
    generatedFloor = ensureGrandchildrenExist(generatedFloor, currentRoomId, player);
  }

  return generatedFloor;
}

/**
 * Generate a complete branching floor with initial 1→2→(2-4) dynamic structure.
 * Convenience wrapper around generateBranchingFloorFromConfig.
 */
export function generateBranchingFloor(
  floor: number,
  difficulty: number,
  player: Player
): BranchingFloor {
  const arc = getStoryArc(floor);
  const dangerLevel = floorToDangerLevel(floor) as 1 | 2 | 3 | 4 | 5 | 6 | 7;

  return generateBranchingFloorFromConfig({
    floor,
    arc: arc.name,
    biome: arc.biome,
    dangerLevel,
    wealthLevel: 4, // Default medium wealth
    roomGenerationMode: 'dynamic',
    targetRoomCount: 10,
    difficulty,
    initialIntel: floor === 1 ? 50 : 0, // First floor starts at 50%
    player,
  });
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

  // Only increment roomsVisited if actually moving to a different room
  // (re-entering current room for remaining activities shouldn't count)
  const isNewRoom = branchingFloor.currentRoomId !== targetRoomId;

  // Update current room flags - preserve existing accessibility
  const updatedRooms = branchingFloor.rooms.map(room => ({
    ...room,
    isCurrent: room.id === targetRoomId,
  }));

  let updatedFloor: BranchingFloor = {
    ...branchingFloor,
    currentRoomId: targetRoomId,
    rooms: updatedRooms,
    roomsVisited: isNewRoom ? branchingFloor.roomsVisited + 1 : branchingFloor.roomsVisited,
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

// ============================================================================
// INTEL SYSTEM
// ============================================================================

/**
 * Intel gain constants - how much intel is gained from each source
 */
export const INTEL_GAIN = {
  COMBAT: 5,           // Small gain from combat encounters
  EVENT: 15,           // Moderate gain from story events
  INFO_GATHERING: 25,  // Large gain from info gathering rooms
  TRAINING: 10,        // Small gain from training (overhearing others)
};

/**
 * Add intel to the current floor.
 * Intel is capped at 100%.
 */
export function addIntel(floor: BranchingFloor, amount: number): BranchingFloor {
  const newIntel = Math.min(100, floor.currentIntel + amount);
  return {
    ...floor,
    currentIntel: newIntel,
    intelGainedThisLocation: floor.intelGainedThisLocation + amount,
  };
}

/**
 * Evaluate intel percentage to determine card draw and reveal.
 * - 0-24%: 1 card, 0 revealed (mystery)
 * - 25-49%: 2 cards, 1 revealed
 * - 50-74%: 3 cards, 2 revealed
 * - 75-100%: 3 cards, all revealed
 */
export function evaluateIntel(intel: number): { cardCount: number; revealedCount: number } {
  if (intel < 25) {
    return { cardCount: 1, revealedCount: 0 };
  } else if (intel < 50) {
    return { cardCount: 2, revealedCount: 1 };
  } else if (intel < 75) {
    return { cardCount: 3, revealedCount: 2 };
  } else {
    return { cardCount: 3, revealedCount: 3 };
  }
}

// ============================================================================
// REWARD CALCULATIONS (using ScalingSystem)
// ============================================================================

/**
 * Calculate XP gain for completing a room/location.
 * Uses the floor's danger level and difficulty for scaling.
 * Formula: 25 + (effectiveFloor * 5)
 */
export function calculateLocationXP(floor: BranchingFloor): number {
  return calculateXP(floor.dangerLevel, floor.difficulty);
}

/**
 * Calculate Ryo gain for completing a room/location.
 * Applies wealth multiplier to base ryo.
 * Formula: ((effectiveFloor * 10) + random(0-16)) * wealthMultiplier
 */
export function calculateLocationRyo(floor: BranchingFloor): number {
  return calculateRyo(floor.dangerLevel, floor.difficulty, floor.wealthLevel);
}
