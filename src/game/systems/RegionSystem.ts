/**
 * =============================================================================
 * REGION SYSTEM - Region-Based Exploration Management
 * =============================================================================
 *
 * Manages the hierarchical exploration: Region > Location > Room
 *
 * ## REGION STRUCTURE
 * - Regions contain 10-15 Locations connected by paths
 * - Card-based location selection with intel-gated revelation
 *
 * ## NAVIGATION RULES
 * - Forward-only: Cannot backtrack to previous locations (except loops)
 * - Intel System: Accumulated intel affects card draw and reveal
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
  PathType,
  RegionConfig,
  LocationConfig,
  BranchingFloor,
  Player,
  Enemy,
  // Card-based location selection types
  IntelPool,
  IntelRevealLevel,
  LocationDeck,
  LocationCard,
  CardDisplayInfo,
  TierWeights,
  DangerTier,
  // Wealth and activity types
  LocationActivities,
} from '../types';
import { generateEnemy } from './EnemySystem';
import {
  dangerToFloor,
  getDangerScaling,
  calculateXP,
  calculateBaseRyo,
} from './ScalingSystem';
import {
  logIntelEvaluate,
  logCardDrawStart,
  logCardDraw,
  logCardDrawComplete,
} from '../utils/explorationDebug';
import { generateBranchingFloorFromConfig } from './LocationSystem';

// ============================================================================
// ID GENERATION
// ============================================================================

const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};

// ============================================================================
// SCALING FUNCTIONS (re-exported from ScalingSystem)
// ============================================================================

// Re-export scaling functions for backward compatibility
export {
  dangerToFloor,
  getDangerScaling,
  getWealthMultiplier,
  applyWealthToRyo,
  calculateMerchantRerollCost,
  getMerchantDiscount,
} from './ScalingSystem';

// Alias functions to match existing API
export function calculateLocationXP(dangerLevel: number, baseDifficulty: number): number {
  return calculateXP(dangerLevel, baseDifficulty);
}

export function calculateLocationRyo(dangerLevel: number, baseDifficulty: number): number {
  return calculateBaseRyo(dangerLevel, baseDifficulty);
}

/**
 * Get the effective scaling value for a location (replaces floor in all calculations).
 * This is the single source of truth for difficulty scaling.
 */
export function getEffectiveScale(location: Location, region: Region): number {
  return dangerToFloor(location.dangerLevel, region.baseDifficulty);
}

// ============================================================================
// WEALTH SYSTEM (location-specific functions)
// ============================================================================

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
 * Get default minimum rooms based on LocationType.
 * Returns a value in the range for that type with some randomness.
 * Range: 5-20 rooms
 */
export function getDefaultMinRoomsForLocationType(locationType: LocationType): number {
  const ranges: Record<LocationType, [number, number]> = {
    [LocationType.SETTLEMENT]: [5, 8],    // Small, focused areas
    [LocationType.WILDERNESS]: [8, 12],   // Medium exploration
    [LocationType.STRONGHOLD]: [10, 15],  // Large military complexes
    [LocationType.LANDMARK]: [8, 12],     // Medium historical sites
    [LocationType.SECRET]: [12, 18],      // Extensive hidden areas
    [LocationType.BOSS]: [15, 20],        // Large boss dungeons
  };

  const [min, max] = ranges[locationType] || [8, 12];
  return min + Math.floor(Math.random() * (max - min + 1));
}

// ============================================================================
// INTEL SYSTEM
// ============================================================================

/**
 * Intel gain constants.
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
 * Get activities available in a location based on its flags.
 * Note: Actual room activities are generated dynamically by LocationSystem.
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

  // Check location flags for activities
  if (location.flags.isBoss) activities.eliteChallenge = 'normal';
  if (location.flags.hasMerchant) activities.merchant = 'normal';
  if (location.flags.hasTraining) activities.training = 'normal';
  if (location.flags.hasRest) activities.rest = 'normal';

  return activities;
}

// ============================================================================
// ROOM 10 ENEMY GENERATION (Elite/Boss)
// ============================================================================

/**
 * Generate an elite enemy for Room 10 of a location.
 * Similar to Guardian but scaled by danger level.
 */
export function generateLocationElite(dangerLevel: number, locationsCleared: number, difficulty: number, locationName: string, arc: string): Enemy {
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
 * Generate a boss enemy for boss locations (Room 10).
 */
export function generateRegionBoss(dangerLevel: number, locationsCleared: number, difficulty: number, regionName: string, arc: string): Enemy {
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

// ============================================================================
// LOCATION GENERATION
// ============================================================================

/**
 * Create a Location from config.
 * Note: Rooms are NOT pre-generated here. They are generated dynamically
 * via locationToBranchingFloor() when the player enters the location.
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

    // Location size - use config value or auto-generate from LocationType
    minRooms: config.minRooms ?? getDefaultMinRoomsForLocationType(config.type),

    terrain: config.terrain,
    terrainEffects: config.terrainEffects,
    biome: config.biome,

    // Rooms are generated dynamically when entering location via locationToBranchingFloor()
    rooms: [],
    currentRoomId: null,
    roomsCleared: 0,

    enemyPool: config.enemyPool,
    lootTable: config.lootTable,
    atmosphereEvents: config.atmosphereEvents,
    tiedStoryEvents: config.tiedStoryEvents,

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
 * Note: Room generation is handled by LocationSystem via locationToBranchingFloor().
 */
export function enterLocation(region: Region, locationId: string): Region {
  const location = region.locations.find(l => l.id === locationId);
  if (!location || !location.isAccessible) {
    return region;
  }

  const updatedLocations = region.locations.map(loc => {
    if (loc.id === locationId) {
      return { ...loc, isCurrent: true };
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
 * Note: Room generation is handled by LocationSystem via locationToBranchingFloor().
 */
export function enterLocationFromCard(region: Region, locationId: string): Region {
  const location = region.locations.find(l => l.id === locationId);
  if (!location) {
    return region;
  }

  const updatedLocations = region.locations.map(loc => {
    if (loc.id === locationId) {
      return {
        ...loc,
        isCurrent: true,
        isAccessible: true, // Mark as accessible when entering from card
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
 * Generate a BranchingFloor for a Location using dynamic room generation.
 * Uses LocationSystem's generateBranchingFloorFromConfig for room creation.
 */
export function locationToBranchingFloor(region: Region): BranchingFloor | null {
  const location = getCurrentLocation(region);
  if (!location) return null;

  const effectiveFloor = dangerToFloor(location.dangerLevel, region.baseDifficulty);

  return generateBranchingFloorFromConfig({
    floor: effectiveFloor,
    arc: region.arc,
    biome: location.biome || location.name,
    dangerLevel: location.dangerLevel,
    wealthLevel: location.wealthLevel,
    roomGenerationMode: 'dynamic',
    targetRoomCount: 10,
    difficulty: region.baseDifficulty,
    initialIntel: 0,
  });
}

/**
 * Mark the current location as completed.
 * Called when the exit room of a BranchingFloor is cleared.
 */
export function markLocationComplete(region: Region): Region {
  const location = getCurrentLocation(region);
  if (!location) return region;

  const updatedLocation: Location = {
    ...location,
    isCompleted: true,
  };

  return {
    ...region,
    locations: region.locations.map(l =>
      l.id === location.id ? updatedLocation : l
    ),
    locationsCompleted: region.locationsCompleted + 1,
  };
}

/**
 * Exit the current location and return to region map.
 * Called after completing a location or choosing to leave.
 */
export function exitLocation(region: Region): Region {
  const location = getCurrentLocation(region);
  if (!location) return region;

  const updatedLocations = region.locations.map(loc => ({
    ...loc,
    isCurrent: false,
  }));

  return {
    ...region,
    currentLocationId: null,
    locations: updatedLocations,
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
        minRooms: null,
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
        minRooms: location.minRooms,
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
        minRooms: location.minRooms,
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
        minRooms: null,
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

