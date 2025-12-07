// ============================================================================
// ROOM TYPE DEFINITIONS FOR BRANCHING EXPLORATION SYSTEM
// ============================================================================

import {
  BranchingRoomType,
  CombatModifierType,
  RoomTypeConfig,
  TerrainType,
} from '../types';

// ============================================================================
// ROOM TYPE CONFIGURATIONS
// ============================================================================

export const ROOM_TYPE_CONFIGS: Record<BranchingRoomType, RoomTypeConfig> = {
  [BranchingRoomType.START]: {
    type: BranchingRoomType.START,
    name: 'Entrance',
    icon: '🚪',
    description: 'The path begins here.',
    hasCombat: false,
    hasMerchant: false,
    hasEvent: false,
    hasRest: false,
    hasTraining: false,
    hasTreasure: false,
    tier0Weight: 100,
    tier1Weight: 0,
    tier2Weight: 0,
  },

  [BranchingRoomType.VILLAGE]: {
    type: BranchingRoomType.VILLAGE,
    name: 'Village',
    icon: '🏘️',
    description: 'A small settlement. Merchants and travelers pass through.',
    hasCombat: 'optional',
    hasMerchant: true,
    hasEvent: true,
    hasRest: true,
    hasTraining: false,
    hasTreasure: false,
    tier0Weight: 0,
    tier1Weight: 25,
    tier2Weight: 15,
    combatModifiers: [CombatModifierType.NONE],
  },

  [BranchingRoomType.OUTPOST]: {
    type: BranchingRoomType.OUTPOST,
    name: 'Outpost',
    icon: '⚔️',
    description: 'A military checkpoint. Enemies patrol the area.',
    hasCombat: 'required',
    hasMerchant: true,
    hasEvent: false,
    hasRest: false,
    hasTraining: false,
    hasTreasure: true,
    tier0Weight: 0,
    tier1Weight: 30,
    tier2Weight: 25,
    combatModifiers: [CombatModifierType.PREPARED],
  },

  [BranchingRoomType.SHRINE]: {
    type: BranchingRoomType.SHRINE,
    name: 'Shrine',
    icon: '⛩️',
    description: 'A sacred place. Ancient power lingers here.',
    hasCombat: 'optional',
    hasMerchant: false,
    hasEvent: true,
    hasRest: true,
    hasTraining: false,
    hasTreasure: false,
    tier0Weight: 0,
    tier1Weight: 15,
    tier2Weight: 20,
    combatModifiers: [CombatModifierType.SANCTUARY],
  },

  [BranchingRoomType.CAMP]: {
    type: BranchingRoomType.CAMP,
    name: 'Camp',
    icon: '🔥',
    description: 'A resting spot. But danger may lurk nearby.',
    hasCombat: 'optional',
    hasMerchant: false,
    hasEvent: false,
    hasRest: true,
    hasTraining: true,
    hasTreasure: false,
    tier0Weight: 0,
    tier1Weight: 20,
    tier2Weight: 15,
    combatModifiers: [CombatModifierType.AMBUSH],
  },

  [BranchingRoomType.RUINS]: {
    type: BranchingRoomType.RUINS,
    name: 'Ruins',
    icon: '🏛️',
    description: 'Ancient structures hold forgotten treasures... and dangers.',
    hasCombat: 'optional',
    hasMerchant: false,
    hasEvent: true,
    hasRest: false,
    hasTraining: false,
    hasTreasure: true,
    tier0Weight: 0,
    tier1Weight: 10,
    tier2Weight: 25,
    combatModifiers: [CombatModifierType.CORRUPTED],
  },

  [BranchingRoomType.BRIDGE]: {
    type: BranchingRoomType.BRIDGE,
    name: 'Bridge',
    icon: '🌉',
    description: 'A narrow crossing. There is no turning back.',
    hasCombat: 'required',
    hasMerchant: false,
    hasEvent: false,
    hasRest: false,
    hasTraining: false,
    hasTreasure: false,
    tier0Weight: 0,
    tier1Weight: 0,
    tier2Weight: 10,
    combatModifiers: [CombatModifierType.TERRAIN_CLIFF],
  },

  [BranchingRoomType.BOSS_GATE]: {
    type: BranchingRoomType.BOSS_GATE,
    name: 'Boss Gate',
    icon: '👹',
    description: 'A powerful presence blocks the way forward.',
    hasCombat: 'required',
    hasMerchant: false,
    hasEvent: false,
    hasRest: false,
    hasTraining: false,
    hasTreasure: true,
    tier0Weight: 0,
    tier1Weight: 0,
    tier2Weight: 0, // Only spawned as exit room
    isExitEligible: true,
    combatModifiers: [CombatModifierType.NONE],
  },

  [BranchingRoomType.FOREST]: {
    type: BranchingRoomType.FOREST,
    name: 'Forest',
    icon: '🌲',
    description: 'Dense trees provide cover... for you and your enemies.',
    hasCombat: 'required',
    hasMerchant: false,
    hasEvent: true,
    hasRest: false,
    hasTraining: false,
    hasTreasure: false,
    tier0Weight: 0,
    tier1Weight: 20,
    tier2Weight: 20,
    combatModifiers: [CombatModifierType.TERRAIN_FOREST, CombatModifierType.AMBUSH],
  },

  [BranchingRoomType.CAVE]: {
    type: BranchingRoomType.CAVE,
    name: 'Cave',
    icon: '🕳️',
    description: 'Dark passages lead to hidden chambers.',
    hasCombat: 'optional',
    hasMerchant: false,
    hasEvent: false,
    hasRest: true,
    hasTraining: false,
    hasTreasure: true,
    tier0Weight: 0,
    tier1Weight: 15,
    tier2Weight: 20,
    combatModifiers: [CombatModifierType.AMBUSH],
  },

  [BranchingRoomType.BATTLEFIELD]: {
    type: BranchingRoomType.BATTLEFIELD,
    name: 'Battlefield',
    icon: '💀',
    description: 'The scars of war remain. Echoes of battle persist.',
    hasCombat: 'required',
    hasMerchant: false,
    hasEvent: false,
    hasRest: false,
    hasTraining: true,
    hasTreasure: true,
    tier0Weight: 0,
    tier1Weight: 10,
    tier2Weight: 15,
    combatModifiers: [CombatModifierType.CORRUPTED, CombatModifierType.PREPARED],
  },
};

// ============================================================================
// COMBAT MODIFIER EFFECTS
// ============================================================================

export interface CombatModifierEffect {
  name: string;
  description: string;
  playerEffects: {
    initiativeModifier?: number;
    damageMultiplierFirstTurn?: number;
    healBeforeCombat?: number;
    speedModifier?: number;
    evasionModifier?: number;
  };
  enemyEffects: {
    initiativeModifier?: number;
    damageMultiplierFirstTurn?: number;
    speedModifier?: number;
  };
  environmentEffects?: {
    poisonDamagePerTurn?: number;
    fallDamageOnMiss?: number;
  };
}

export const COMBAT_MODIFIER_EFFECTS: Record<CombatModifierType, CombatModifierEffect> = {
  [CombatModifierType.NONE]: {
    name: 'Normal',
    description: 'Standard combat conditions.',
    playerEffects: {},
    enemyEffects: {},
  },

  [CombatModifierType.AMBUSH]: {
    name: 'Ambush',
    description: 'The enemy strikes first!',
    playerEffects: { initiativeModifier: -50 },
    enemyEffects: { initiativeModifier: 50, damageMultiplierFirstTurn: 1.25 },
  },

  [CombatModifierType.PREPARED]: {
    name: 'Prepared',
    description: 'You have the advantage. Strike first!',
    playerEffects: { initiativeModifier: 50, damageMultiplierFirstTurn: 1.2 },
    enemyEffects: {},
  },

  [CombatModifierType.SANCTUARY]: {
    name: 'Sanctuary',
    description: 'Sacred ground heals your wounds.',
    playerEffects: { healBeforeCombat: 0.2 },
    enemyEffects: {},
  },

  [CombatModifierType.CORRUPTED]: {
    name: 'Corrupted',
    description: 'Dark chakra poisons everything.',
    playerEffects: {},
    enemyEffects: {},
    environmentEffects: { poisonDamagePerTurn: 5 },
  },

  [CombatModifierType.TERRAIN_SWAMP]: {
    name: 'Swamp',
    description: 'Murky waters slow all movement.',
    playerEffects: { speedModifier: -10 },
    enemyEffects: { speedModifier: -10 },
  },

  [CombatModifierType.TERRAIN_FOREST]: {
    name: 'Forest',
    description: 'Dense foliage provides cover.',
    playerEffects: { evasionModifier: 0.15 },
    enemyEffects: {},
  },

  [CombatModifierType.TERRAIN_CLIFF]: {
    name: 'Cliff',
    description: 'One wrong step means a fall.',
    playerEffects: {},
    enemyEffects: {},
    environmentEffects: { fallDamageOnMiss: 0.1 },
  },
};

// ============================================================================
// ROOM NAMES BY TYPE AND BIOME
// ============================================================================

export const ROOM_NAMES: Record<BranchingRoomType, Record<string, string[]>> = {
  [BranchingRoomType.START]: {
    default: ['Gateway', 'Entrance Hall', 'Starting Point'],
  },
  [BranchingRoomType.VILLAGE]: {
    ACADEMY_ARC: ['Training Village', 'Genin Outskirts', 'Academy District'],
    WAVES_ARC: ['Fishing Village', 'Coastal Settlement', 'Wave Harbor'],
    EXAMS_ARC: ['Hidden Outpost', 'Forest Village', 'Shinobi Hamlet'],
    ROGUE_ARC: ['Desert Oasis', 'Sand Village Outskirts', 'Trading Post'],
    WAR_ARC: ['Refugee Camp', 'Battle-worn Settlement', 'Survivors\' Haven'],
    default: ['Small Village', 'Quiet Settlement', 'Remote Hamlet'],
  },
  [BranchingRoomType.OUTPOST]: {
    ACADEMY_ARC: ['Guard Post', 'Patrol Station', 'Border Checkpoint'],
    WAVES_ARC: ['Lighthouse Station', 'Dock Patrol', 'Harbor Guard'],
    EXAMS_ARC: ['Chunin Station', 'Forest Watchtower', 'Exam Checkpoint'],
    ROGUE_ARC: ['Hunter Outpost', 'Bounty Station', 'Akatsuki Hideout'],
    WAR_ARC: ['War Front', 'Military Base', 'Allied Command'],
    default: ['Military Outpost', 'Guard Station', 'Watchtower'],
  },
  [BranchingRoomType.SHRINE]: {
    ACADEMY_ARC: ['Will of Fire Shrine', 'Memorial Stone', 'Academy Altar'],
    WAVES_ARC: ['Sea Spirit Shrine', 'Ocean Prayer Hall', 'Tidal Temple'],
    EXAMS_ARC: ['Forest Spirit Altar', 'Ancient Tree Shrine', 'Sacred Grove'],
    ROGUE_ARC: ['Wind Temple', 'Sand Shrine', 'Desert Sanctuary'],
    WAR_ARC: ['War Memorial', 'Fallen Heroes\' Shrine', 'Unity Altar'],
    default: ['Ancient Shrine', 'Sacred Place', 'Holy Ground'],
  },
  [BranchingRoomType.CAMP]: {
    default: ['Traveler\'s Rest', 'Hidden Campsite', 'Resting Spot', 'Bonfire Site'],
  },
  [BranchingRoomType.RUINS]: {
    ACADEMY_ARC: ['Old Academy Wing', 'Forgotten Archive', 'Sealed Library'],
    WAVES_ARC: ['Sunken Temple', 'Coral Ruins', 'Ancient Docks'],
    EXAMS_ARC: ['Abandoned Tower', 'Crumbling Shrine', 'Lost Laboratory'],
    ROGUE_ARC: ['Desert Tomb', 'Sand-buried Temple', 'Forgotten Oasis'],
    WAR_ARC: ['War Ruins', 'Destroyed Village', 'Collapsed Fortress'],
    default: ['Ancient Ruins', 'Forgotten Place', 'Crumbling Structure'],
  },
  [BranchingRoomType.BRIDGE]: {
    WAVES_ARC: ['Great Naruto Bridge', 'Mist-Covered Crossing', 'Tidal Bridge'],
    default: ['Narrow Bridge', 'Rope Crossing', 'Stone Span'],
  },
  [BranchingRoomType.BOSS_GATE]: {
    ACADEMY_ARC: ['Chunin Trial Gate', 'Graduation Arena', 'Final Test'],
    WAVES_ARC: ['Demon\'s Domain', 'Zabuza\'s Lair', 'Mist Barrier'],
    EXAMS_ARC: ['Tower Entrance', 'Preliminary Arena', 'Forest\'s End'],
    ROGUE_ARC: ['Akatsuki Hideout', 'Hunter\'s Den', 'Rogue\'s Final Stand'],
    WAR_ARC: ['War\'s End Gate', 'Final Battlefield', 'Destiny\'s Door'],
    default: ['Boss Gate', 'Guardian\'s Door', 'The Final Challenge'],
  },
  [BranchingRoomType.FOREST]: {
    ACADEMY_ARC: ['Training Woods', 'Practice Forest', 'Academy Grove'],
    WAVES_ARC: ['Coastal Forest', 'Sea Woods', 'Misty Thicket'],
    EXAMS_ARC: ['Forest of Death', 'Deadly Thicket', 'Giant Tree Grove'],
    ROGUE_ARC: ['Oasis Palms', 'Desert Edge', 'Rocky Canyon'],
    WAR_ARC: ['Battlefield Woods', 'Scarred Forest', 'Ash Grove'],
    default: ['Dense Forest', 'Wild Woods', 'Untamed Thicket'],
  },
  [BranchingRoomType.CAVE]: {
    ACADEMY_ARC: ['Training Cavern', 'Underground Dojo', 'Hidden Tunnel'],
    WAVES_ARC: ['Sea Cave', 'Coral Grotto', 'Tidal Cavern'],
    EXAMS_ARC: ['Beast\'s Den', 'Underground Passage', 'Dark Hollow'],
    ROGUE_ARC: ['Sand Cave', 'Desert Tunnel', 'Hidden Oasis Cave'],
    WAR_ARC: ['Bomb Shelter', 'Underground Base', 'Escape Tunnel'],
    default: ['Dark Cave', 'Hidden Cavern', 'Underground Chamber'],
  },
  [BranchingRoomType.BATTLEFIELD]: {
    ACADEMY_ARC: ['Old Training Ground', 'Former Sparring Arena', 'Battle Circle'],
    WAVES_ARC: ['Dock Battle Site', 'Bridge War Zone', 'Coastal Conflict'],
    EXAMS_ARC: ['Preliminary Arena', 'Combat Zone', 'Tournament Ground'],
    ROGUE_ARC: ['Hunter\'s Killing Ground', 'Bounty Arena', 'Execution Site'],
    WAR_ARC: ['Great Ninja War Site', 'Allied Front', 'Fallen Shinobi Field'],
    default: ['Ancient Battlefield', 'War-torn Ground', 'Combat Arena'],
  },
};

// ============================================================================
// ROOM DESCRIPTIONS BY TYPE
// ============================================================================

export const ROOM_DESCRIPTIONS: Record<BranchingRoomType, string[]> = {
  [BranchingRoomType.START]: [
    'Your journey begins here.',
    'The path stretches before you.',
    'Take your first steps into danger.',
  ],
  [BranchingRoomType.VILLAGE]: [
    'Smoke rises from chimneys. Life continues despite the danger.',
    'Villagers watch you with wary eyes.',
    'A merchant waves you over. Perhaps they have something useful.',
  ],
  [BranchingRoomType.OUTPOST]: [
    'Armed guards patrol the perimeter.',
    'Weapons are stockpiled here. Danger is expected.',
    'The military presence is strong. Combat seems inevitable.',
  ],
  [BranchingRoomType.SHRINE]: [
    'Ancient chakra resonates through the air.',
    'A peaceful aura surrounds this sacred place.',
    'Prayers have been offered here for generations.',
  ],
  [BranchingRoomType.CAMP]: [
    'A campfire crackles in the clearing.',
    'Someone has been here recently. The ashes are still warm.',
    'A safe place to rest... or so it seems.',
  ],
  [BranchingRoomType.RUINS]: [
    'Crumbling walls tell tales of ancient battles.',
    'Something valuable might remain among the debris.',
    'The spirits of the past linger here.',
  ],
  [BranchingRoomType.BRIDGE]: [
    'A narrow path with no room for retreat.',
    'The crossing looks treacherous.',
    'Only one way forward.',
  ],
  [BranchingRoomType.BOSS_GATE]: [
    'A powerful presence blocks your path.',
    'This is no ordinary enemy.',
    'The true test awaits beyond this gate.',
  ],
  [BranchingRoomType.FOREST]: [
    'Trees tower overhead, blocking the sun.',
    'Sounds echo strangely in the dense foliage.',
    'Perfect cover for an ambush.',
  ],
  [BranchingRoomType.CAVE]: [
    'Darkness swallows all light.',
    'Dripping water echoes in the depths.',
    'Something glitters in the shadows.',
  ],
  [BranchingRoomType.BATTLEFIELD]: [
    'The ground is scarred by countless battles.',
    'Weapons and armor litter the field.',
    'The spirits of fallen warriors watch.',
  ],
};

// ============================================================================
// TERRAIN BY ROOM TYPE
// ============================================================================

export const ROOM_TERRAIN_MAP: Record<BranchingRoomType, TerrainType[]> = {
  [BranchingRoomType.START]: [TerrainType.OPEN_GROUND],
  [BranchingRoomType.VILLAGE]: [TerrainType.OPEN_GROUND, TerrainType.ALLEYWAY],
  [BranchingRoomType.OUTPOST]: [TerrainType.TRAINING_FIELD, TerrainType.ROOFTOPS],
  [BranchingRoomType.SHRINE]: [TerrainType.CHAKRA_NEXUS, TerrainType.STONE_PILLARS],
  [BranchingRoomType.CAMP]: [TerrainType.OPEN_GROUND, TerrainType.DENSE_FOLIAGE],
  [BranchingRoomType.RUINS]: [TerrainType.STONE_PILLARS, TerrainType.GIANT_ROOTS],
  [BranchingRoomType.BRIDGE]: [TerrainType.BRIDGE, TerrainType.CLIFF_EDGE],
  [BranchingRoomType.BOSS_GATE]: [TerrainType.CHAKRA_NEXUS, TerrainType.VOID_SPACE],
  [BranchingRoomType.FOREST]: [TerrainType.DENSE_FOLIAGE, TerrainType.TREE_CANOPY],
  [BranchingRoomType.CAVE]: [TerrainType.GIANT_ROOTS, TerrainType.ROOT_NETWORK],
  [BranchingRoomType.BATTLEFIELD]: [TerrainType.CORRUPTED_ZONE, TerrainType.OPEN_GROUND],
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get a random room name for the given type and arc
 */
export function getRandomRoomName(type: BranchingRoomType, arc: string): string {
  const namesForType = ROOM_NAMES[type];
  const arcNames = namesForType[arc] || namesForType['default'] || ['Unknown Room'];
  return arcNames[Math.floor(Math.random() * arcNames.length)];
}

/**
 * Get a random description for the room type
 */
export function getRandomRoomDescription(type: BranchingRoomType): string {
  const descriptions = ROOM_DESCRIPTIONS[type] || ['A mysterious place.'];
  return descriptions[Math.floor(Math.random() * descriptions.length)];
}

/**
 * Get a random terrain for the room type
 */
export function getRandomTerrain(type: BranchingRoomType): TerrainType {
  const terrains = ROOM_TERRAIN_MAP[type] || [TerrainType.OPEN_GROUND];
  return terrains[Math.floor(Math.random() * terrains.length)];
}

/**
 * Get room type config
 */
export function getRoomTypeConfig(type: BranchingRoomType): RoomTypeConfig {
  return ROOM_TYPE_CONFIGS[type];
}

/**
 * Select a random room type based on tier weights
 */
export function selectRandomRoomType(tier: 0 | 1 | 2, excludeTypes: BranchingRoomType[] = []): BranchingRoomType {
  const weightKey = `tier${tier}Weight` as 'tier0Weight' | 'tier1Weight' | 'tier2Weight';

  const eligibleTypes = Object.values(ROOM_TYPE_CONFIGS).filter(
    config => config[weightKey] > 0 && !excludeTypes.includes(config.type)
  );

  if (eligibleTypes.length === 0) {
    // Fallback
    return tier === 0 ? BranchingRoomType.START : BranchingRoomType.OUTPOST;
  }

  const totalWeight = eligibleTypes.reduce((sum, config) => sum + config[weightKey], 0);
  let random = Math.random() * totalWeight;

  for (const config of eligibleTypes) {
    random -= config[weightKey];
    if (random <= 0) {
      return config.type;
    }
  }

  return eligibleTypes[eligibleTypes.length - 1].type;
}
