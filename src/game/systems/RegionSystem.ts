/**
 * =============================================================================
 * REGION SYSTEM - Region-Based Exploration Management
 * =============================================================================
 *
 * Manages the hierarchical exploration: Region > Location > Room
 * For post-Academy arcs (Floors 11+)
 *
 * ## REGION STRUCTURE
 * - Regions contain 10-15 Locations
 * - Each Location has 10 Rooms in a diamond pattern (1→2→4→2→1)
 * - Room 10 is always an Intel Mission (elite fight)
 *
 * ## NAVIGATION RULES
 * - Forward-only: Cannot backtrack to previous locations (except loops)
 * - Intel System: Win Room 10 elite → choose next path. Skip → random path
 * - Path Types: forward, branch, loop, secret
 *
 * ## DANGER SCALING (from DIFFICULTY config)
 * - Entry (1-2), Early (3), Mid (3-4), Late (5-6), Boss (7)
 * - Danger affects enemy strength: scaling = DANGER_BASE + (danger × DANGER_PER_LEVEL)
 *
 * =============================================================================
 */

import {
  Region,
  Location,
  LocationPath,
  LocationType,
  LocationTerrainType,
  PathType,
  IntelMission,
  IntelReward,
  RegionConfig,
  LocationConfig,
  PathConfig,
  BranchingRoom,
  BranchingRoomType,
  BranchingFloor,
  RoomActivities,
  RoomTier,
  RoomPosition,
  Player,
  Enemy,
  ACTIVITY_ORDER,
  ElementType,
  // Card-based location selection types
  IntelPool,
  IntelRevealLevel,
  LocationDeck,
  DeckLocation,
  LocationCard,
  CardDisplayInfo,
  TierWeights,
  DangerTier,
  // Wealth and activity types
  LocationActivities,
  ActivityStatus,
} from '../types';
import { generateEnemy } from './EnemySystem';
import {
  getRoomTypeConfig,
  selectRandomRoomType,
  getRandomRoomName,
  getRandomRoomDescription,
  getRandomTerrain,
} from '../constants/roomTypes';
import { generateLoot, generateRandomArtifact, generateSkillForFloor, generateComponentByQuality } from './LootSystem';
import { EVENTS } from '../constants';
import {
  CombatModifierType,
  PrimaryStat,
  DEFAULT_MERCHANT_SLOTS,
  DEFAULT_TREASURE_QUALITY,
  TreasureQuality,
} from '../types';
import { DIFFICULTY } from '../config';
import {
  logIntelEvaluate,
  logCardDrawStart,
  logCardDraw,
  logCardDrawComplete,
} from '../utils/explorationDebug';

// ============================================================================
// ID GENERATION
// ============================================================================

const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};

// ============================================================================
// DANGER SCALING
// ============================================================================

/**
 * Convert danger level (1-7) to enemy stat multiplier.
 * Uses DIFFICULTY config constants for centralized scaling.
 * Danger 1: 0.75x, Danger 4: 1.05x, Danger 7: 1.35x
 */
export function getDangerScaling(dangerLevel: number): number {
  return DIFFICULTY.DANGER_BASE + (dangerLevel * DIFFICULTY.DANGER_PER_LEVEL);
}

/**
 * Convert danger level to floor equivalent for enemy generation.
 * This maps danger 1-7 to approximate floor ranges.
 * Exported for use in reward calculations across the game.
 */
export function dangerToFloor(dangerLevel: number, baseDifficulty: number): number {
  // Danger 1 ≈ Floor 11, Danger 7 ≈ Floor 25
  return 10 + (dangerLevel * 2) + Math.floor(baseDifficulty / 20);
}

/**
 * Get the effective scaling value for a location (replaces floor in all calculations).
 * This is the single source of truth for difficulty scaling.
 */
export function getEffectiveScale(location: Location, region: Region): number {
  return dangerToFloor(location.dangerLevel, region.baseDifficulty);
}

/**
 * Calculate XP gain based on danger level (replaces floor-based XP).
 * Formula: 25 + (effectiveFloor * 5)
 */
export function calculateLocationXP(dangerLevel: number, baseDifficulty: number): number {
  const effectiveFloor = dangerToFloor(dangerLevel, baseDifficulty);
  return 25 + (effectiveFloor * 5);
}

/**
 * Calculate Ryo gain based on danger level.
 * Formula: (effectiveFloor * 10) + random(0-16)
 */
export function calculateLocationRyo(dangerLevel: number, baseDifficulty: number): number {
  const effectiveFloor = dangerToFloor(dangerLevel, baseDifficulty);
  return (effectiveFloor * 10) + Math.floor(Math.random() * 17);
}

/**
 * Calculate merchant reroll cost based on danger level.
 * Formula: baseRerollCost + (effectiveFloor * scalingPerLevel)
 */
export function calculateMerchantRerollCost(
  dangerLevel: number,
  baseDifficulty: number,
  baseRerollCost: number,
  scalingPerLevel: number
): number {
  const effectiveFloor = dangerToFloor(dangerLevel, baseDifficulty);
  return baseRerollCost + (effectiveFloor * scalingPerLevel);
}

// ============================================================================
// WEALTH SYSTEM
// ============================================================================

/**
 * Get wealth multiplier for ryo rewards.
 * Level 1 = 0.5x, Level 4 = 1.0x, Level 7 = 1.5x
 * Formula: 0.33 + (wealthLevel * 0.167)
 */
export function getWealthMultiplier(wealthLevel: number): number {
  return 0.33 + (wealthLevel * 0.167);
}

/**
 * Get default wealth level based on LocationType.
 * Returns a value in the range for that type with some randomness.
 */
export function getDefaultWealthForLocationType(locationType: LocationType): 1 | 2 | 3 | 4 | 5 | 6 | 7 {
  const ranges: Record<LocationType, [number, number]> = {
    [LocationType.SETTLEMENT]: [5, 6],  // Trade hub, prosperous
    [LocationType.WILDERNESS]: [2, 3],  // Sparse resources
    [LocationType.STRONGHOLD]: [3, 4],  // Military, moderate
    [LocationType.LANDMARK]: [4, 5],    // Historical value
    [LocationType.SECRET]: [5, 6],      // Hidden treasures
    [LocationType.BOSS]: [6, 7],        // Hoarded wealth
  };

  const [min, max] = ranges[locationType] || [3, 4];
  const wealth = min + Math.floor(Math.random() * (max - min + 1));
  return Math.max(1, Math.min(7, wealth)) as 1 | 2 | 3 | 4 | 5 | 6 | 7;
}

/**
 * Apply wealth multiplier to a ryo amount.
 */
export function applyWealthToRyo(baseRyo: number, wealthLevel: number): number {
  return Math.floor(baseRyo * getWealthMultiplier(wealthLevel));
}

/**
 * Get merchant discount based on wealth level.
 * Higher wealth = bigger discounts (0% to 30%)
 * Formula: (wealthLevel - 1) * 0.05
 */
export function getMerchantDiscount(wealthLevel: number): number {
  return (wealthLevel - 1) * 0.05;
}

// ============================================================================
// INTEL SYSTEM
// ============================================================================

/**
 * Intel gain constants
 */
export const INTEL_GAIN = {
  COMBAT_VICTORY: 5,      // +5% per combat
  INFO_GATHERING: 25,     // +25% for info gathering activity
  EVENT_DEFAULT: 15,      // ~15% average for events (can vary)
} as const;

/**
 * Evaluate intel level to determine card count and reveal count.
 * 0-25%:  1 card, 0 revealed (hidden)
 * 25-50%: 2 cards, 1 revealed
 * 50-75%: 3 cards, 2 revealed
 * 75-100%: 3 cards, 3 revealed (all)
 */
export function evaluateIntel(intel: number): { cardCount: number; revealedCount: number } {
  let result: { cardCount: number; revealedCount: number };
  if (intel < 25) {
    result = { cardCount: 1, revealedCount: 0 };
  } else if (intel < 50) {
    result = { cardCount: 2, revealedCount: 1 };
  } else if (intel < 75) {
    result = { cardCount: 3, revealedCount: 2 };
  } else {
    result = { cardCount: 3, revealedCount: 3 };
  }
  logIntelEvaluate(intel, result.cardCount, result.revealedCount);
  return result;
}

/**
 * Get activities present in a location based on its rooms.
 * Returns activity status for each activity type.
 */
export function getLocationActivities(location: Location): LocationActivities {
  const activities: LocationActivities = {
    combat: false,
    merchant: false,
    rest: false,
    training: false,
    event: false,
    scrollDiscovery: false,
    treasure: false,
    eliteChallenge: false,
    infoGathering: false,
  };

  // Check all rooms for activities
  for (const room of location.rooms) {
    if (!room.activities) continue;

    if (room.activities.combat) activities.combat = 'normal';
    if (room.activities.merchant) activities.merchant = 'normal';
    if (room.activities.rest) activities.rest = 'normal';
    if (room.activities.training) activities.training = 'normal';
    if (room.activities.event) activities.event = 'normal';
    if (room.activities.scrollDiscovery) activities.scrollDiscovery = 'normal';
    if (room.activities.treasure) activities.treasure = 'normal';
    if (room.activities.eliteChallenge) activities.eliteChallenge = 'normal';
    if (room.activities.infoGathering) activities.infoGathering = 'normal';
  }

  // Check location flags for special activities
  if (location.flags.isBoss) activities.eliteChallenge = 'normal';
  if (location.intelMission?.elite) activities.eliteChallenge = 'normal';

  return activities;
}

// ============================================================================
// ROOM GENERATION (Adapted from LocationSystem)
// ============================================================================

/**
 * Diamond pattern room structure for a location:
 * Room 1 (entrance) → Rooms 2,3 → Rooms 4,5,6,7 → Rooms 8,9 → Room 10 (intel)
 * Player visits 5 rooms total (one path through the diamond)
 */
const DIAMOND_STRUCTURE: Record<number, { tier: RoomTier; position: RoomPosition; parentIds: number[]; childIds: number[] }> = {
  1: { tier: 0, position: 'CENTER', parentIds: [], childIds: [2, 3] },
  2: { tier: 1, position: 'LEFT', parentIds: [1], childIds: [4, 5] },
  3: { tier: 1, position: 'RIGHT', parentIds: [1], childIds: [6, 7] },
  4: { tier: 2, position: 'LEFT_OUTER', parentIds: [2], childIds: [8] },
  5: { tier: 2, position: 'LEFT_INNER', parentIds: [2], childIds: [8, 9] },
  6: { tier: 2, position: 'RIGHT_INNER', parentIds: [3], childIds: [8, 9] },
  7: { tier: 2, position: 'RIGHT_OUTER', parentIds: [3], childIds: [9] },
  8: { tier: 1, position: 'LEFT', parentIds: [4, 5, 6], childIds: [10] },
  9: { tier: 1, position: 'RIGHT', parentIds: [5, 6, 7], childIds: [10] },
  10: { tier: 0, position: 'CENTER', parentIds: [8, 9], childIds: [] },
};

/**
 * Create a single room for a location.
 * Adapted from LocationSystem.createRoom
 */
function createLocationRoom(
  roomIndex: number,
  locationId: string,
  locationType: LocationType,
  dangerLevel: number,
  difficulty: number,
  arc: string,
  isIntelRoom: boolean,
  player?: Player
): BranchingRoom {
  const structure = DIAMOND_STRUCTURE[roomIndex];

  // Select room type based on location type and room position
  let roomType: BranchingRoomType;
  if (isIntelRoom) {
    roomType = BranchingRoomType.BOSS_GATE;
  } else {
    roomType = selectRoomTypeForLocation(locationType, structure.tier);
  }

  const config = getRoomTypeConfig(roomType);
  const locationsCleared = player?.locationsCleared ?? 0;

  const room: BranchingRoom = {
    id: `${locationId}-room-${roomIndex}`,
    tier: structure.tier,
    position: structure.position,
    parentId: structure.parentIds.length > 0 ? `${locationId}-room-${structure.parentIds[0]}` : null,
    childIds: structure.childIds.map(id => `${locationId}-room-${id}`),

    type: roomType,
    name: getRandomRoomName(roomType, arc),
    description: getRandomRoomDescription(roomType),
    terrain: getRandomTerrain(roomType),
    icon: config.icon,

    activities: {},
    currentActivityIndex: 0,

    isVisible: roomIndex <= 3, // Only first 3 rooms visible initially
    isAccessible: roomIndex === 1, // Only entrance accessible
    isCleared: false,
    isExit: isIntelRoom,
    isCurrent: roomIndex === 1,

    depth: roomIndex,
    hasGeneratedChildren: true, // Pre-generated structure
  };

  // Generate activities
  room.activities = generateLocationActivities(room, config, dangerLevel, locationsCleared, difficulty, arc, player);

  return room;
}

/**
 * Select appropriate room type based on location type.
 */
function selectRoomTypeForLocation(locationType: LocationType, tier: RoomTier): BranchingRoomType {
  const typeMap: Record<LocationType, BranchingRoomType[]> = {
    [LocationType.SETTLEMENT]: [BranchingRoomType.VILLAGE, BranchingRoomType.CAMP, BranchingRoomType.SHRINE],
    [LocationType.WILDERNESS]: [BranchingRoomType.FOREST, BranchingRoomType.CAVE, BranchingRoomType.RUINS],
    [LocationType.STRONGHOLD]: [BranchingRoomType.OUTPOST, BranchingRoomType.BATTLEFIELD, BranchingRoomType.BRIDGE],
    [LocationType.LANDMARK]: [BranchingRoomType.BRIDGE, BranchingRoomType.SHRINE, BranchingRoomType.RUINS],
    [LocationType.SECRET]: [BranchingRoomType.SHRINE, BranchingRoomType.RUINS, BranchingRoomType.CAVE],
    [LocationType.BOSS]: [BranchingRoomType.BATTLEFIELD, BranchingRoomType.BOSS_GATE],
  };

  const options = typeMap[locationType] || [BranchingRoomType.VILLAGE];
  return options[Math.floor(Math.random() * options.length)];
}

/**
 * Generate activities for a location room.
 * Adapted from LocationSystem.generateActivities
 */
function generateLocationActivities(
  room: BranchingRoom,
  config: ReturnType<typeof getRoomTypeConfig>,
  dangerLevel: number,
  locationsCleared: number,
  difficulty: number,
  arc: string,
  player?: Player
): RoomActivities {
  const activities: RoomActivities = {};
  // Floor value for loot generation (legacy compatibility)
  const floor = dangerToFloor(dangerLevel, difficulty);

  // Combat
  if (config.hasCombat === 'required' || (config.hasCombat === 'optional' && Math.random() < 0.5)) {
    const isElite = room.tier === 2 && Math.random() < 0.3;
    const enemyType = isElite ? 'ELITE' : 'NORMAL';
    const enemy = generateEnemy(dangerLevel, locationsCleared, enemyType, difficulty, arc);

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
    const itemCount = player?.merchantSlots ?? DEFAULT_MERCHANT_SLOTS;
    const items = Array.from({ length: itemCount }, () => generateLoot(floor, difficulty));

    activities.merchant = {
      items,
      discountPercent: Math.random() < 0.2 ? 15 : 0,
      completed: false,
    };
  }

  // Event
  if (config.hasEvent) {
    const arcEvents = EVENTS.filter(e => !e.allowedArcs || e.allowedArcs.includes(arc));
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

  // Scroll Discovery
  if (config.hasScrollDiscovery || (config.hasEvent && Math.random() < 0.25)) {
    const skill = generateSkillForFloor(floor);
    activities.scrollDiscovery = {
      availableScrolls: [skill],
      cost: { chakra: 15 + floor * 2 },
      completed: false,
    };
  }

  // Elite Challenge (15% in shrines/ruins)
  if ((room.type === BranchingRoomType.SHRINE || room.type === BranchingRoomType.RUINS) && Math.random() < 0.15) {
    const eliteEnemy = generateEnemy(dangerLevel + 1, locationsCleared, 'ELITE', difficulty + 15, arc);
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

  // Training
  if (config.hasTraining) {
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

    activities.training = {
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

  // Treasure
  if (config.hasTreasure) {
    let quality = player?.treasureQuality ?? DEFAULT_TREASURE_QUALITY;
    if (Math.random() < 0.5) {
      if (quality === TreasureQuality.BROKEN) quality = TreasureQuality.COMMON;
      else if (quality === TreasureQuality.COMMON) quality = TreasureQuality.RARE;
    }

    activities.treasure = {
      items: [generateComponentByQuality(floor, difficulty + 5, quality)],
      ryo: 50 + floor * 10 + Math.floor(Math.random() * 67),
      collected: false,
    };
  }

  // Info Gathering (+25% intel)
  if (config.hasInfoGathering) {
    const flavorTexts = [
      'You gather information from locals.',
      'Ancient inscriptions reveal secrets.',
      'A passing traveler shares rumors.',
      'You overhear valuable intelligence.',
      'Careful observation reveals hidden details.',
    ];
    activities.infoGathering = {
      intelGain: INTEL_GAIN.INFO_GATHERING,
      flavorText: flavorTexts[Math.floor(Math.random() * flavorTexts.length)],
      completed: false,
    };
  }

  return activities;
}

// ============================================================================
// INTEL MISSION GENERATION
// ============================================================================

/**
 * Generate an elite enemy for intel missions.
 * Similar to Guardian but scaled by danger level.
 */
function generateIntelElite(dangerLevel: number, locationsCleared: number, difficulty: number, locationName: string, arc: string): Enemy {
  const enemy = generateEnemy(dangerLevel, locationsCleared, 'ELITE', difficulty + dangerLevel * 3, arc);

  // Apply scaling based on danger
  const scaling = getDangerScaling(dangerLevel);
  enemy.primaryStats.willpower = Math.floor(enemy.primaryStats.willpower * scaling * 1.2);
  enemy.primaryStats.strength = Math.floor(enemy.primaryStats.strength * scaling);
  enemy.primaryStats.spirit = Math.floor(enemy.primaryStats.spirit * scaling);

  // Recalculate HP
  enemy.currentHp = enemy.primaryStats.willpower * 12 + 50;

  enemy.name = `${locationName} Elite`;
  enemy.tier = 'Elite';

  return enemy;
}

/**
 * Generate a boss enemy for boss locations.
 */
function generateRegionBoss(dangerLevel: number, locationsCleared: number, difficulty: number, regionName: string, arc: string): Enemy {
  const enemy = generateEnemy(dangerLevel + 2, locationsCleared, 'BOSS', difficulty + 30, arc);

  // Boss scaling
  enemy.primaryStats.willpower = Math.floor(enemy.primaryStats.willpower * 1.5);
  enemy.primaryStats.strength = Math.floor(enemy.primaryStats.strength * 1.3);
  enemy.primaryStats.spirit = Math.floor(enemy.primaryStats.spirit * 1.3);
  enemy.primaryStats.speed = Math.floor(enemy.primaryStats.speed * 1.2);

  // Recalculate HP
  enemy.currentHp = enemy.primaryStats.willpower * 15 + 100;

  enemy.name = `${regionName} Boss`;
  enemy.tier = 'Boss';
  enemy.isBoss = true;

  return enemy;
}

/**
 * Create intel mission for a location.
 */
function createIntelMission(
  locationConfig: LocationConfig,
  regionConfig: RegionConfig,
  difficulty: number,
  locationsCleared: number
): IntelMission {
  const isBoss = locationConfig.flags.isBoss;
  const config = locationConfig.intelMissionConfig;

  // Generate enemy
  const enemy = isBoss
    ? generateRegionBoss(locationConfig.dangerLevel, locationsCleared, difficulty, regionConfig.name, regionConfig.arc)
    : generateIntelElite(locationConfig.dangerLevel, locationsCleared, difficulty, locationConfig.name, regionConfig.arc);

  // Build intel reward
  const intelReward: IntelReward | null = config.revealedPathIds.length > 0 ? {
    revealedPaths: config.revealedPathIds.map(pathId => {
      const pathConfig = [...(locationConfig.forwardPaths || []), ...(locationConfig.secretPaths || [])]
        .find(p => p.id === pathId);
      const targetLoc = regionConfig.locations.find(l => l.id === pathConfig?.targetId);

      return {
        pathId,
        destinationName: targetLoc?.name || 'Unknown',
        destinationIcon: targetLoc?.icon || '❓',
        dangerLevel: targetLoc?.dangerLevel || 1,
        hint: pathConfig?.dangerHint || 'The path ahead...',
      };
    }),
    secretHint: config.secretHint,
    loopHint: config.loopHint,
  } : null;

  return {
    elite: isBoss ? undefined : enemy,
    boss: isBoss ? enemy : undefined,
    flavorText: config.flavorText,
    skipAllowed: config.skipAllowed,
    completed: false,
    skipped: false,
    intelReward,
    lootReward: [generateRandomArtifact(dangerToFloor(locationConfig.dangerLevel, difficulty), difficulty + 10)],
    bossInfo: config.bossInfo,
  };
}

// ============================================================================
// LOCATION GENERATION
// ============================================================================

/**
 * Generate all 10 rooms for a location.
 */
function generateLocationRooms(
  locationId: string,
  locationConfig: LocationConfig,
  difficulty: number,
  arc: string,
  player?: Player
): BranchingRoom[] {
  const rooms: BranchingRoom[] = [];

  for (let i = 1; i <= 10; i++) {
    const room = createLocationRoom(
      i,
      locationId,
      locationConfig.type,
      locationConfig.dangerLevel,
      difficulty,
      arc,
      i === 10, // Room 10 is intel mission
      player
    );
    rooms.push(room);
  }

  // Set entrance room as current and cleared
  if (rooms.length > 0) {
    rooms[0].isCurrent = true;
    rooms[0].isAccessible = true;
  }

  return rooms;
}

/**
 * Create a Location from config.
 */
function createLocation(
  config: LocationConfig,
  regionConfig: RegionConfig,
  difficulty: number,
  player?: Player
): Location {
  const locationId = `location-${config.id}-${generateId()}`;

  return {
    id: locationId,
    name: config.name,
    description: config.description,
    type: config.type,
    icon: config.icon,
    dangerLevel: config.dangerLevel,

    terrain: config.terrain,
    terrainEffects: config.terrainEffects,
    biome: config.biome,

    rooms: generateLocationRooms(locationId, config, difficulty, regionConfig.arc, player),
    currentRoomId: null, // Set when entering location
    roomsCleared: 0,

    enemyPool: config.enemyPool,
    lootTable: config.lootTable,
    atmosphereEvents: config.atmosphereEvents,
    tiedStoryEvents: config.tiedStoryEvents,

    intelMission: createIntelMission(config, regionConfig, difficulty, player?.locationsCleared ?? 0),

    forwardPaths: config.forwardPaths.map(p => p.id),
    loopPaths: config.loopPaths?.map(p => p.id),
    secretPaths: config.secretPaths?.map(p => p.id),

    flags: config.flags,
    isDiscovered: config.flags.isEntry,
    isAccessible: config.flags.isEntry,
    isCompleted: false,
    isCurrent: false,

    unlockCondition: config.unlockCondition,

    // Wealth system - auto-generated from LocationType
    wealthLevel: getDefaultWealthForLocationType(config.type),
  };
}

// ============================================================================
// PATH GENERATION
// ============================================================================

/**
 * Create all paths for a region from config.
 */
function createRegionPaths(regionConfig: RegionConfig): LocationPath[] {
  const paths: LocationPath[] = [];

  for (const locationConfig of regionConfig.locations) {
    // Forward paths
    for (const pathConfig of locationConfig.forwardPaths) {
      paths.push({
        id: pathConfig.id,
        targetLocationId: pathConfig.targetId,
        pathType: pathConfig.pathType,
        isRevealed: true, // All paths revealed at start
        isUsed: false,
        description: pathConfig.description,
        dangerHint: pathConfig.dangerHint,
      });
    }

    // Loop paths
    if (locationConfig.loopPaths) {
      for (const pathConfig of locationConfig.loopPaths) {
        paths.push({
          id: pathConfig.id,
          targetLocationId: pathConfig.targetId,
          pathType: PathType.LOOP,
          isRevealed: true, // All paths revealed at start
          isUsed: false,
          description: pathConfig.description,
          dangerHint: pathConfig.dangerHint,
        });
      }
    }

    // Secret paths
    if (locationConfig.secretPaths) {
      for (const pathConfig of locationConfig.secretPaths) {
        paths.push({
          id: pathConfig.id,
          targetLocationId: pathConfig.targetId,
          pathType: PathType.SECRET,
          isRevealed: true, // All paths revealed at start
          isUsed: false,
          description: pathConfig.description,
          dangerHint: pathConfig.dangerHint,
        });
      }
    }
  }

  return paths;
}

// ============================================================================
// REGION GENERATION
// ============================================================================

/**
 * Generate a complete Region from config.
 */
export function generateRegion(
  regionConfig: RegionConfig,
  difficulty: number,
  player: Player
): Region {
  // Create all locations
  const locations = regionConfig.locations.map(locConfig =>
    createLocation(locConfig, regionConfig, difficulty, player)
  );

  // Create all paths
  const paths = createRegionPaths(regionConfig);

  return {
    id: `region-${regionConfig.id}-${generateId()}`,
    name: regionConfig.name,
    description: regionConfig.description,
    theme: regionConfig.theme,

    entryLocationIds: regionConfig.entryLocationIds,
    bossLocationId: regionConfig.bossLocationId,
    currentLocationId: null,

    locations,
    paths,

    locationsCompleted: 0,
    totalLocations: locations.filter(l => !l.flags.isSecret).length,
    visitedLocationIds: [],

    hasIntel: false,
    revealedPathIds: [],
    discoveredSecretIds: [],

    isCompleted: false,

    arc: regionConfig.arc,
    biome: regionConfig.biome,
    lootTheme: regionConfig.lootTheme,
    baseDifficulty: regionConfig.baseDifficulty,
  };
}

// ============================================================================
// LOCATION NAVIGATION
// ============================================================================

/**
 * Enter a location from the region map.
 */
export function enterLocation(region: Region, locationId: string): Region {
  const location = region.locations.find(l => l.id === locationId);
  if (!location || !location.isAccessible) {
    return region;
  }

  // Set current room to entrance
  const entranceRoom = location.rooms.find(r => r.depth === 1);

  const updatedLocations = region.locations.map(loc => {
    if (loc.id === locationId) {
      return {
        ...loc,
        isCurrent: true,
        currentRoomId: entranceRoom?.id || null,
        rooms: loc.rooms.map((room, idx) => ({
          ...room,
          isCurrent: idx === 0,
          isAccessible: idx === 0,
        })),
      };
    }
    return { ...loc, isCurrent: false };
  });

  return {
    ...region,
    currentLocationId: locationId,
    locations: updatedLocations,
    visitedLocationIds: region.visitedLocationIds.includes(locationId)
      ? region.visitedLocationIds
      : [...region.visitedLocationIds, locationId],
  };
}

/**
 * Enter a location from a drawn card (bypasses accessibility check).
 * Card deck system already controls which locations can be drawn.
 */
export function enterLocationFromCard(region: Region, locationId: string): Region {
  const location = region.locations.find(l => l.id === locationId);
  if (!location) {
    return region;
  }

  // Set current room to entrance
  const entranceRoom = location.rooms.find(r => r.depth === 1);

  const updatedLocations = region.locations.map(loc => {
    if (loc.id === locationId) {
      return {
        ...loc,
        isCurrent: true,
        isAccessible: true, // Mark as accessible when entering from card
        currentRoomId: entranceRoom?.id || null,
        rooms: loc.rooms.map((room, idx) => ({
          ...room,
          isCurrent: idx === 0,
          isAccessible: idx === 0,
        })),
      };
    }
    return { ...loc, isCurrent: false };
  });

  return {
    ...region,
    currentLocationId: locationId,
    locations: updatedLocations,
    visitedLocationIds: region.visitedLocationIds.includes(locationId)
      ? region.visitedLocationIds
      : [...region.visitedLocationIds, locationId],
  };
}

/**
 * Get the current location.
 */
export function getCurrentLocation(region: Region): Location | undefined {
  return region.locations.find(l => l.id === region.currentLocationId);
}

/**
 * Get the current room in the current location.
 */
export function getCurrentRoom(region: Region): BranchingRoom | undefined {
  const location = getCurrentLocation(region);
  if (!location || !location.currentRoomId) return undefined;
  return location.rooms.find(r => r.id === location.currentRoomId);
}

// ============================================================================
// ROOM NAVIGATION (Within Location)
// ============================================================================

/**
 * Move to a room within the current location.
 */
export function moveToRoom(region: Region, roomId: string): Region {
  const location = getCurrentLocation(region);
  if (!location) return region;

  const targetRoom = location.rooms.find(r => r.id === roomId);
  if (!targetRoom || !targetRoom.isAccessible) return region;

  const updatedRooms = location.rooms.map(room => ({
    ...room,
    isCurrent: room.id === roomId,
    isVisible: room.isVisible || room.id === roomId,
  }));

  // Make children visible
  const targetIndex = updatedRooms.findIndex(r => r.id === roomId);
  if (targetIndex >= 0) {
    const target = updatedRooms[targetIndex];
    target.childIds.forEach(childId => {
      const childRoom = updatedRooms.find(r => r.id === childId);
      if (childRoom) childRoom.isVisible = true;
    });
  }

  const updatedLocation = {
    ...location,
    currentRoomId: roomId,
    rooms: updatedRooms,
  };

  return {
    ...region,
    locations: region.locations.map(l => l.id === location.id ? updatedLocation : l),
  };
}

// ============================================================================
// ACTIVITY MANAGEMENT
// ============================================================================

/**
 * Get the current activity for a room.
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

function isActivityCompleted(activity: RoomActivities[keyof RoomActivities]): boolean {
  if (!activity) return true;
  if ('completed' in activity) return activity.completed;
  if ('collected' in activity) return activity.collected;
  return false;
}

/**
 * Complete an activity in a room.
 */
export function completeActivity(
  region: Region,
  roomId: string,
  activityKey: keyof RoomActivities
): Region {
  const location = getCurrentLocation(region);
  if (!location) return region;

  const updatedRooms = location.rooms.map(room => {
    if (room.id !== roomId) return room;

    const activity = room.activities[activityKey];
    if (!activity) return room;

    const updatedActivity = { ...activity };
    if ('completed' in updatedActivity) updatedActivity.completed = true;
    if ('collected' in updatedActivity) updatedActivity.collected = true;

    const updatedActivities = { ...room.activities, [activityKey]: updatedActivity };

    const allCompleted = ACTIVITY_ORDER.every(key => {
      const act = updatedActivities[key];
      return !act || isActivityCompleted(act);
    });

    return {
      ...room,
      activities: updatedActivities,
      isCleared: allCompleted,
    };
  });

  // Update child accessibility
  const clearedRoom = updatedRooms.find(r => r.id === roomId);
  if (clearedRoom?.isCleared) {
    clearedRoom.childIds.forEach(childId => {
      const child = updatedRooms.find(r => r.id === childId);
      if (child) child.isAccessible = true;
    });
  }

  const clearedCount = updatedRooms.filter(r => r.isCleared).length;

  const updatedLocation = {
    ...location,
    rooms: updatedRooms,
    roomsCleared: clearedCount,
  };

  return {
    ...region,
    locations: region.locations.map(l => l.id === location.id ? updatedLocation : l),
  };
}

// ============================================================================
// INTEL MISSION SYSTEM
// ============================================================================

/**
 * Get the intel mission enemy.
 */
export function getIntelMissionEnemy(region: Region): Enemy | undefined {
  const location = getCurrentLocation(region);
  if (!location?.intelMission) return undefined;
  return location.intelMission.elite || location.intelMission.boss;
}

/**
 * Complete the intel mission (player won the fight).
 */
export function completeIntelMission(region: Region): Region {
  const location = getCurrentLocation(region);
  if (!location?.intelMission) return region;

  const updatedIntel: IntelMission = {
    ...location.intelMission,
    completed: true,
    skipped: false,
  };

  // Reveal paths from intel reward
  const revealedPaths = updatedIntel.intelReward?.revealedPaths.map(p => p.pathId) || [];

  const updatedLocation = {
    ...location,
    intelMission: updatedIntel,
    isCompleted: true,
  };

  // Update paths to revealed
  const updatedPaths = region.paths.map(path => {
    if (revealedPaths.includes(path.id)) {
      return { ...path, isRevealed: true };
    }
    return path;
  });

  return {
    ...region,
    locations: region.locations.map(l => l.id === location.id ? updatedLocation : l),
    paths: updatedPaths,
    hasIntel: true,
    revealedPathIds: [...region.revealedPathIds, ...revealedPaths],
    locationsCompleted: region.locationsCompleted + 1,
  };
}

/**
 * Skip the intel mission (player chose not to fight).
 */
export function skipIntelMission(region: Region): Region {
  const location = getCurrentLocation(region);
  if (!location?.intelMission || !location.intelMission.skipAllowed) return region;

  const updatedIntel: IntelMission = {
    ...location.intelMission,
    completed: false,
    skipped: true,
  };

  const updatedLocation = {
    ...location,
    intelMission: updatedIntel,
    isCompleted: true,
  };

  return {
    ...region,
    locations: region.locations.map(l => l.id === location.id ? updatedLocation : l),
    hasIntel: false,
    locationsCompleted: region.locationsCompleted + 1,
  };
}

/**
 * Check if player has earned path choice (completed intel, not skipped).
 */
export function hasEarnedPathChoice(region: Region): boolean {
  const location = getCurrentLocation(region);
  if (!location?.intelMission) return false;
  return location.intelMission.completed && !location.intelMission.skipped;
}

// ============================================================================
// PATH CHOICE
// ============================================================================

/**
 * Get available paths from current location.
 */
export function getAvailablePaths(region: Region): LocationPath[] {
  const location = getCurrentLocation(region);
  if (!location) return [];

  const allPathIds = [
    ...location.forwardPaths,
    ...(location.loopPaths || []),
    ...(location.secretPaths || []),
  ];

  return region.paths.filter(path => {
    if (!allPathIds.includes(path.id)) return false;
    if (!path.isRevealed) return false;
    if (path.pathType === PathType.LOOP && path.isUsed) return false;

    // Check if target location is accessible (not already completed, unless it's a loop)
    const targetLoc = region.locations.find(l => l.id === path.targetLocationId);
    if (!targetLoc) return false;
    if (path.pathType !== PathType.LOOP && targetLoc.isCompleted) return false;

    return true;
  });
}

/**
 * Choose a path and move to the target location.
 */
export function choosePath(region: Region, pathId: string): Region {
  const path = region.paths.find(p => p.id === pathId);
  if (!path) return region;

  const targetLocation = region.locations.find(l => l.id === path.targetLocationId);
  if (!targetLocation) return region;

  // Mark loop paths as used
  const updatedPaths = region.paths.map(p => {
    if (p.id === pathId && p.pathType === PathType.LOOP) {
      return { ...p, isUsed: true };
    }
    return p;
  });

  // Update current location
  const updatedLocations = region.locations.map(loc => {
    if (loc.id === path.targetLocationId) {
      return {
        ...loc,
        isDiscovered: true,
        isAccessible: true,
        isCurrent: false, // Will be set when entering
      };
    }
    if (loc.isCurrent) {
      return { ...loc, isCurrent: false };
    }
    return loc;
  });

  return {
    ...region,
    locations: updatedLocations,
    paths: updatedPaths,
    currentLocationId: null, // Back to region map
    hasIntel: false, // Reset intel for next location
  };
}

/**
 * Get a random path (when intel was skipped).
 */
export function getRandomPath(region: Region): LocationPath | null {
  const location = getCurrentLocation(region);
  if (!location) return null;

  // Only forward and branch paths for random selection
  const forwardPaths = region.paths.filter(p =>
    location.forwardPaths.includes(p.id) &&
    (p.pathType === PathType.FORWARD || p.pathType === PathType.BRANCH)
  );

  if (forwardPaths.length === 0) return null;
  return forwardPaths[Math.floor(Math.random() * forwardPaths.length)];
}

// ============================================================================
// REGION STATE QUERIES
// ============================================================================

/**
 * Check if the region is complete (boss defeated).
 */
export function isRegionComplete(region: Region): boolean {
  const bossLocation = region.locations.find(l => l.id === region.bossLocationId);
  return bossLocation?.isCompleted ?? false;
}

/**
 * Get location by ID.
 */
export function getLocationById(region: Region, locationId: string): Location | undefined {
  return region.locations.find(l => l.id === locationId);
}

/**
 * Get all discovered locations.
 */
export function getDiscoveredLocations(region: Region): Location[] {
  return region.locations.filter(l => l.isDiscovered);
}

/**
 * Get all accessible locations.
 */
export function getAccessibleLocations(region: Region): Location[] {
  return region.locations.filter(l => l.isAccessible && !l.isCompleted);
}

// ============================================================================
// BRANCHING FLOOR ADAPTER
// ============================================================================

/**
 * Convert a Location's room data into a BranchingFloor-compatible structure.
 * This allows reusing LocationMap for location exploration.
 */
export function locationToBranchingFloor(region: Region): BranchingFloor | null {
  const location = getCurrentLocation(region);
  if (!location) return null;

  // Find current room ID (first isCurrent or first accessible)
  const currentRoom = location.rooms.find(r => r.isCurrent)
    || location.rooms.find(r => r.isAccessible && !r.isCleared)
    || location.rooms[0];

  const currentRoomId = currentRoom?.id || location.rooms[0]?.id || '';

  // Find exit room (Room 10 / intel mission room)
  const exitRoom = location.rooms.find(r => r.isExit);

  // Count cleared and visited rooms
  const clearedRooms = location.rooms.filter(r => r.isCleared).length;
  const roomsVisited = location.roomsCleared || clearedRooms;

  return {
    id: `location-floor-${location.id}`,
    floor: location.dangerLevel + 10, // Convert danger to approximate floor for display
    arc: region.arc,
    biome: location.biome || location.name,
    rooms: location.rooms,
    currentRoomId,
    exitRoomId: exitRoom?.id || null,
    totalRooms: location.rooms.length,
    clearedRooms,
    roomsVisited,
    difficulty: region.baseDifficulty,
  };
}

/**
 * Sync BranchingFloor changes back to Region state.
 * Called after LocationSystem operations (moveToRoom, completeActivity).
 */
export function syncFloorToRegion(region: Region, floor: BranchingFloor): Region {
  const location = getCurrentLocation(region);
  if (!location) return region;

  // Update location with the modified rooms from the floor
  const updatedLocation: Location = {
    ...location,
    rooms: floor.rooms,
    currentRoomId: floor.currentRoomId,
    roomsCleared: floor.clearedRooms,
  };

  return {
    ...region,
    locations: region.locations.map(l =>
      l.id === location.id ? updatedLocation : l
    ),
  };
}

// ============================================================================
// CARD-BASED LOCATION SELECTION SYSTEM
// ============================================================================
// Replaces node-map with 3-card selection from a weighted deck

/**
 * Get danger tier from danger level.
 */
function getDangerTier(dangerLevel: number): DangerTier {
  if (dangerLevel <= 2) return 'low';
  if (dangerLevel <= 4) return 'mid';
  return 'high';
}

/**
 * Get tier weights based on region progress percentage.
 *
 * Progress 0-25%:   Low (danger 1-2) = 80%, Mid (3-4) = 18%, High (5-7) = 2%
 * Progress 25-50%:  Low = 40%, Mid = 50%, High = 10%
 * Progress 50-75%:  Low = 15%, Mid = 45%, High = 40%
 * Progress 75-100%: Low = 5%, Mid = 25%, High = 70%
 */
function getTierWeights(progressPercent: number): TierWeights {
  if (progressPercent < 25) {
    return { low: 0.80, mid: 0.18, high: 0.02 };
  } else if (progressPercent < 50) {
    return { low: 0.40, mid: 0.50, high: 0.10 };
  } else if (progressPercent < 75) {
    return { low: 0.15, mid: 0.45, high: 0.40 };
  } else {
    return { low: 0.05, mid: 0.25, high: 0.70 };
  }
}

/**
 * Weighted random selection from an array of items with weights.
 */
function weightedRandomSelect<T extends { calculatedWeight: number }>(items: T[]): T {
  const totalWeight = items.reduce((sum, item) => sum + item.calculatedWeight, 0);
  if (totalWeight === 0) {
    // Fallback to uniform random if all weights are 0
    return items[Math.floor(Math.random() * items.length)];
  }

  let random = Math.random() * totalWeight;
  for (const item of items) {
    random -= item.calculatedWeight;
    if (random <= 0) {
      return item;
    }
  }
  return items[items.length - 1]; // Fallback
}

/**
 * Initialize a location deck from a region.
 * All locations are added to the deck with base weights based on danger level.
 */
export function initializeLocationDeck(region: Region): LocationDeck {
  return {
    regionId: region.id,
    locations: region.locations.map(loc => ({
      locationId: loc.id,
      dangerLevel: loc.dangerLevel,
      isCompleted: loc.isCompleted,
      baseWeight: 10 - loc.dangerLevel, // Lower danger = higher base weight
      completionPenalty: loc.isCompleted ? 0.3 : 1.0,
    })),
  };
}

/**
 * Update deck after a location is completed.
 * Completed locations return to deck with reduced weight.
 */
export function updateDeckAfterCompletion(deck: LocationDeck, locationId: string): LocationDeck {
  return {
    ...deck,
    locations: deck.locations.map(loc => {
      if (loc.locationId === locationId) {
        return {
          ...loc,
          isCompleted: true,
          completionPenalty: 0.3, // 30% of original weight
        };
      }
      return loc;
    }),
  };
}

/**
 * Calculate intel reveal level for a location card.
 *
 * - NONE (0 intel): Mystery card
 * - PARTIAL (1+ intel): Name and danger visible
 * - FULL (3+ intel OR previously visited): One special feature shown
 */
export function calculateIntelLevel(intelPool: IntelPool, location: Location): IntelRevealLevel {
  const intel = intelPool.totalIntel;

  // FULL reveal requires 3+ intel OR location was previously visited
  if (intel >= 3 || location.isCompleted) {
    return IntelRevealLevel.FULL;
  }

  // PARTIAL reveal requires 1+ intel
  if (intel >= 1) {
    return IntelRevealLevel.PARTIAL;
  }

  // No intel = mysterious placeholder
  return IntelRevealLevel.NONE;
}

/**
 * Get the location type display label.
 */
function getLocationTypeLabel(type: LocationType): string {
  const labels: Record<LocationType, string> = {
    [LocationType.SETTLEMENT]: 'Settlement',
    [LocationType.WILDERNESS]: 'Wilderness',
    [LocationType.STRONGHOLD]: 'Stronghold',
    [LocationType.LANDMARK]: 'Landmark',
    [LocationType.SECRET]: 'Secret Area',
    [LocationType.BOSS]: 'Boss Lair',
  };
  return labels[type] || 'Unknown';
}

/**
 * Determine the special feature to display for a location at FULL intel.
 * Returns the highest priority feature.
 */
function determineSpecialFeature(location: Location): string | null {
  // Priority order for special features
  if (location.flags.isBoss) return 'REGION BOSS';
  if (location.flags.isSecret) return 'SECRET AREA';
  if (location.flags.hasMerchant) return 'Merchant Available';
  if (location.flags.hasTraining) return 'Training Grounds';
  if (location.flags.hasRest) return 'Rest Point';
  if (location.tiedStoryEvents && location.tiedStoryEvents.length > 0) return 'Story Event';
  return null;
}

/**
 * Get display info for a card based on intel level.
 * Determines what information is shown to the player.
 */
export function getCardDisplayInfo(card: LocationCard): CardDisplayInfo {
  const { location, intelLevel, isRevisit } = card;

  switch (intelLevel) {
    case IntelRevealLevel.NONE:
      return {
        name: '???',
        subtitle: 'Unknown Territory',
        dangerLevel: null,
        locationType: null,
        specialFeature: null,
        showMystery: true,
        revisitBadge: false,
        wealthLevel: null,
        activities: null,
        isBoss: false,
        isSecret: false,
      };

    case IntelRevealLevel.PARTIAL:
      return {
        name: location.name,
        subtitle: getLocationTypeLabel(location.type),
        dangerLevel: location.dangerLevel,
        locationType: location.type,
        specialFeature: null,
        showMystery: false,
        revisitBadge: isRevisit,
        wealthLevel: location.wealthLevel,
        activities: getLocationActivities(location),
        isBoss: location.type === LocationType.BOSS,
        isSecret: location.type === LocationType.SECRET,
      };

    case IntelRevealLevel.FULL:
      return {
        name: location.name,
        subtitle: getLocationTypeLabel(location.type),
        dangerLevel: location.dangerLevel,
        locationType: location.type,
        specialFeature: determineSpecialFeature(location),
        showMystery: false,
        revisitBadge: isRevisit,
        wealthLevel: location.wealthLevel,
        activities: getLocationActivities(location),
        isBoss: location.type === LocationType.BOSS,
        isSecret: location.type === LocationType.SECRET,
      };

    default:
      return {
        name: '???',
        subtitle: 'Unknown',
        dangerLevel: null,
        locationType: null,
        specialFeature: null,
        showMystery: true,
        revisitBadge: false,
        wealthLevel: null,
        activities: null,
        isBoss: false,
        isSecret: false,
      };
  }
}

/**
 * Draw location cards from the deck.
 * Uses progress-weighted random selection based on danger tiers.
 *
 * @param region - The current region
 * @param deck - The location deck
 * @param intelPool - Player's intel pool
 * @param count - Number of cards to draw (default: 3)
 * @returns Array of drawn LocationCards
 */
export function drawLocationCards(
  region: Region,
  deck: LocationDeck,
  intelPool: IntelPool,
  count: number = 3,
  revealedCount?: number // NEW: Override reveal count from currentIntel system
): LocationCard[] {
  logCardDrawStart(region.id, count, revealedCount);
  // Calculate progress percentage
  const progressPercent = region.totalLocations > 0
    ? (region.locationsCompleted / region.totalLocations) * 100
    : 0;

  const tierWeights = getTierWeights(progressPercent);
  const drawnCards: LocationCard[] = [];

  // Calculate weights for all locations
  const weightedLocations = deck.locations.map(deckLoc => {
    const location = region.locations.find(l => l.id === deckLoc.locationId);
    if (!location) {
      return { ...deckLoc, calculatedWeight: 0, location: null };
    }

    const tier = getDangerTier(deckLoc.dangerLevel);
    let weight = tierWeights[tier] * deckLoc.baseWeight;

    // Apply completion modifier (completed = 30% base weight)
    weight *= deckLoc.completionPenalty;

    // Boss location only available at 75%+ progress
    if (location.flags.isBoss && progressPercent < 75) {
      weight = 0;
    }

    // Secret locations require discovery first
    if (location.flags.isSecret && !location.isDiscovered) {
      weight = 0;
    }

    return { ...deckLoc, calculatedWeight: weight, location };
  }).filter(item => item.location !== null && item.calculatedWeight > 0);

  // Draw cards
  for (let i = 0; i < count; i++) {
    if (weightedLocations.length === 0) break;

    const selected = weightedRandomSelect(weightedLocations);
    const location = region.locations.find(l => l.id === selected.locationId)!;

    // NEW: Use revealedCount to determine intel level if provided
    // First N cards are FULL, rest are NONE
    let intelLevel: IntelRevealLevel;
    if (revealedCount !== undefined) {
      intelLevel = i < revealedCount ? IntelRevealLevel.FULL : IntelRevealLevel.NONE;
    } else {
      intelLevel = calculateIntelLevel(intelPool, location);
    }

    logCardDraw(i, location.name, intelLevel, i < (revealedCount ?? 0));

    drawnCards.push({
      locationId: selected.locationId,
      location,
      intelLevel,
      isRevisit: selected.isCompleted,
    });

    // Note: We don't remove from weightedLocations to allow same location
    // to appear multiple times (as per requirements)
  }

  // If we couldn't draw enough cards, fill with whatever is available
  while (drawnCards.length < count && weightedLocations.length > 0) {
    const randomIndex = Math.floor(Math.random() * weightedLocations.length);
    const selected = weightedLocations[randomIndex];
    const location = region.locations.find(l => l.id === selected.locationId)!;

    // NEW: Use revealedCount for fallback cards too
    let intelLevel: IntelRevealLevel;
    if (revealedCount !== undefined) {
      intelLevel = drawnCards.length < revealedCount ? IntelRevealLevel.FULL : IntelRevealLevel.NONE;
    } else {
      intelLevel = calculateIntelLevel(intelPool, location);
    }

    drawnCards.push({
      locationId: selected.locationId,
      location,
      intelLevel,
      isRevisit: selected.isCompleted,
    });
  }

  logCardDrawComplete(drawnCards.map(c => ({
    name: c.location.name,
    intelLevel: c.intelLevel
  })));

  return drawnCards;
}

/**
 * Create initial intel pool for a new region.
 */
export function createInitialIntelPool(): IntelPool {
  return {
    totalIntel: 0,
    maxIntel: 10,
  };
}

/**
 * Add intel to the pool (called after completing intel missions).
 */
export function addIntel(intelPool: IntelPool, amount: number = 1): IntelPool {
  return {
    ...intelPool,
    totalIntel: Math.min(intelPool.totalIntel + amount, intelPool.maxIntel),
  };
}

/**
 * Prepare a location for revisit by stripping one-time content.
 * Called when a completed location is selected again.
 */
export function prepareLocationForRevisit(location: Location): Location {
  return {
    ...location,
    rooms: location.rooms.map(room => ({
      ...room,
      activities: {
        // Keep repeatable activities
        combat: room.activities.combat ? { ...room.activities.combat, completed: false } : undefined,
        merchant: room.activities.merchant,
        rest: room.activities.rest,
        training: room.activities.training,
        // Remove one-time activities
        event: undefined,
        treasure: undefined,
        scrollDiscovery: undefined,
        eliteChallenge: undefined,
      },
      isCleared: false,
      isAccessible: room.depth === 1, // Only entrance accessible
      isCurrent: room.depth === 1,
    })),
    // Reset progress
    roomsCleared: 0,
    currentRoomId: null,
    isCompleted: false,
    // No intel mission on revisit
    intelMission: null,
  };
}
