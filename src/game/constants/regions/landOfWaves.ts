/**
 * =============================================================================
 * LAND OF WAVES REGION
 * =============================================================================
 *
 * First region in the post-Academy exploration system.
 * A coastal region under the brutal control of shipping magnate Gato.
 *
 * ## REGION STRUCTURE
 * - 13 Locations total (10 main + 3 secret)
 * - Entry: The Docks, Misty Beach
 * - Boss: Gato's Compound
 *
 * ## DANGER PROGRESSION
 * Entry (1-2) → Early (3-4) → Mid (3-5) → Late (4-6) → Boss (7)
 *
 * =============================================================================
 */

import {
  RegionConfig,
  LocationConfig,
  LocationType,
  LocationTerrainType,
  PathType,
  ElementType,
} from '../../types';

// ============================================================================
// LOCATION DEFINITIONS
// ============================================================================

const THE_DOCKS: LocationConfig = {
  id: 'the_docks',
  name: 'The Docks',
  description: 'A bustling harbor where fishermen and merchants gather. The gateway to Wave Country. Gato\'s enforcers patrol openly.',
  type: LocationType.SETTLEMENT,
  icon: {
    asset: '/assets/icons/locations/the_docks.png',
    fallback: '⚓',
  },
  dangerLevel: 2,
  terrain: LocationTerrainType.WATER_ADJACENT,
  terrainEffects: [{ type: 'water_damage_bonus', value: 0.2 }],
  biome: 'Coastal Harbor',
  enemyPool: ['dock_worker', 'corrupt_guard', 'smuggler'],
  lootTable: 'waves_settlement',
  atmosphereEvents: ['suspicious_cargo', 'overheard_conversation', 'dock_brawl'],
  tiedStoryEvents: ['meet_tazuna'],
  forwardPaths: [
    { id: 'docks_to_forest', targetId: 'coastal_forest', pathType: PathType.FORWARD, description: 'A well-worn path through the trees', dangerHint: 'Bandits lurk in the shadows' },
    { id: 'docks_to_beach', targetId: 'misty_beach', pathType: PathType.BRANCH, description: 'Follow the shoreline south', dangerHint: 'The mist is thick here' },
  ],
  flags: {
    isEntry: true,
    isBoss: false,
    isSecret: false,
    hasMerchant: true,
    hasRest: true,
    hasTraining: false,
  },
  intelMissionConfig: {
    eliteId: 'dock_enforcer',
    flavorText: 'A scarred enforcer blocks the road out of town. "No one leaves without paying tribute to Gato."',
    skipAllowed: true,
    revealedPathIds: ['docks_to_forest', 'docks_to_beach'],
    secretHint: 'The enforcer mentions a hidden cove used by smugglers...',
  },
};

const MISTY_BEACH: LocationConfig = {
  id: 'misty_beach',
  name: 'Misty Beach',
  description: 'Fog rolls in from the sea, obscuring everything. Wrecked boats dot the shoreline. Perfect for ambushes.',
  type: LocationType.WILDERNESS,
  icon: {
    asset: '/assets/icons/locations/misty_beach.png',
    fallback: '🌫️',
  },
  dangerLevel: 1,
  terrain: LocationTerrainType.WATER_ADJACENT,
  terrainEffects: [
    { type: 'water_damage_bonus', value: 0.15 },
    { type: 'visibility_penalty', value: -0.2 },
  ],
  biome: 'Foggy Shoreline',
  enemyPool: ['beach_bandit', 'sea_spirit', 'stranded_ronin'],
  lootTable: 'waves_wilderness',
  atmosphereEvents: ['washed_up_treasure', 'stranded_sailor', 'ghost_ship_sighting'],
  forwardPaths: [
    { id: 'beach_to_forest', targetId: 'coastal_forest', pathType: PathType.FORWARD, description: 'Head inland through the mist', dangerHint: 'The forest is dense' },
  ],
  secretPaths: [
    { id: 'beach_to_ship', targetId: 'sunken_ship', pathType: PathType.SECRET, description: 'Wade out to a half-submerged vessel', dangerHint: 'What treasures lie within?' },
  ],
  flags: {
    isEntry: true,
    isBoss: false,
    isSecret: false,
    hasMerchant: false,
    hasRest: true,
    hasTraining: false,
  },
  intelMissionConfig: {
    eliteId: 'beach_guardian',
    flavorText: 'The mist parts to reveal a shimmering figure. The Sea Spirit guards these shores.',
    skipAllowed: true,
    revealedPathIds: ['beach_to_forest'],
    secretHint: 'Legends speak of a sunken ship visible at low tide...',
  },
};

const COASTAL_FOREST: LocationConfig = {
  id: 'coastal_forest',
  name: 'Coastal Forest',
  description: 'Dense trees crowd together, blocking out the sun. Bandits and worse are known to lurk here.',
  type: LocationType.WILDERNESS,
  icon: '🌲',
  dangerLevel: 3,
  terrain: LocationTerrainType.FOREST,
  terrainEffects: [
    { type: 'evasion_bonus', value: 0.1 },
    { type: 'ambush_chance', value: 0.2 },
  ],
  biome: 'Dense Forest',
  enemyPool: ['forest_bandit', 'wild_boar', 'missing_nin'],
  lootTable: 'waves_wilderness',
  atmosphereEvents: ['animal_attack', 'hidden_cache', 'bandit_camp'],
  forwardPaths: [
    { id: 'forest_to_village', targetId: 'fishing_village', pathType: PathType.FORWARD, description: 'Smoke rises from a village ahead', dangerHint: 'The villagers seem friendly' },
    { id: 'forest_to_cave', targetId: 'smugglers_cave', pathType: PathType.BRANCH, description: 'A hidden trail leads underground', dangerHint: 'Danger and riches await' },
  ],
  loopPaths: [
    { id: 'forest_to_docks', targetId: 'the_docks', pathType: PathType.LOOP, description: 'A shortcut back to the harbor', dangerHint: 'Return to safety' },
  ],
  flags: {
    isEntry: false,
    isBoss: false,
    isSecret: false,
    hasMerchant: false,
    hasRest: false,
    hasTraining: true,
  },
  intelMissionConfig: {
    eliteId: 'forest_hunter',
    flavorText: 'A Demon Brothers scout blocks your path. "You won\'t be reporting back to the Leaf."',
    skipAllowed: true,
    revealedPathIds: ['forest_to_village', 'forest_to_cave'],
    loopHint: 'There\'s a faster route back to the docks...',
  },
};

const SMUGGLERS_CAVE: LocationConfig = {
  id: 'smugglers_cave',
  name: 'Smuggler\'s Cave',
  description: 'A hidden network of caves used by criminals. Dangerous but potentially profitable.',
  type: LocationType.STRONGHOLD,
  icon: '🕳️',
  dangerLevel: 4,
  terrain: LocationTerrainType.UNDERGROUND,
  terrainEffects: [
    { type: 'fire_damage_penalty', value: -0.2 },
    { type: 'stealth_bonus', value: 0.15 },
  ],
  biome: 'Underground Cavern',
  enemyPool: ['cave_smuggler', 'trap_master', 'guard_dog'],
  lootTable: 'waves_stronghold',
  atmosphereEvents: ['hidden_stash', 'cave_in', 'smuggler_deal'],
  forwardPaths: [
    { id: 'cave_to_camp', targetId: 'riverside_camp', pathType: PathType.FORWARD, description: 'An exit near the river', dangerHint: 'A camp lies beyond' },
    { id: 'cave_to_village', targetId: 'fishing_village', pathType: PathType.BRANCH, description: 'A tunnel to the village outskirts', dangerHint: 'Emerge behind the village' },
  ],
  secretPaths: [
    { id: 'cave_to_cove', targetId: 'hidden_cove', pathType: PathType.SECRET, description: 'A concealed underwater passage', dangerHint: 'What secrets lie below?' },
  ],
  loopPaths: [
    { id: 'cave_to_beach', targetId: 'misty_beach', pathType: PathType.LOOP, description: 'A passage back to the beach', dangerHint: 'Return to the shore' },
  ],
  flags: {
    isEntry: false,
    isBoss: false,
    isSecret: false,
    hasMerchant: true,
    hasRest: false,
    hasTraining: false,
  },
  intelMissionConfig: {
    eliteId: 'cave_boss',
    flavorText: 'The Smuggler King sits on a throne of stolen goods. "You\'ve seen too much to leave alive."',
    skipAllowed: true,
    revealedPathIds: ['cave_to_camp', 'cave_to_village'],
    secretHint: 'An underwater passage leads to a hidden cove...',
    loopHint: 'There\'s a way back to the beach...',
  },
};

const FISHING_VILLAGE: LocationConfig = {
  id: 'fishing_village',
  name: 'Fishing Village',
  description: 'A poor but peaceful village. Gato\'s thugs have been seen nearby, collecting "taxes".',
  type: LocationType.SETTLEMENT,
  icon: '🏘️',
  dangerLevel: 1,
  terrain: LocationTerrainType.NEUTRAL,
  terrainEffects: [],
  biome: 'Rural Village',
  enemyPool: ['village_thug', 'corrupt_merchant', 'hired_muscle'],
  lootTable: 'waves_settlement',
  atmosphereEvents: ['villager_plea', 'hidden_resistance', 'tax_collection'],
  tiedStoryEvents: ['protect_village', 'meet_inari'],
  forwardPaths: [
    { id: 'village_to_bridge', targetId: 'bridge_construction', pathType: PathType.FORWARD, description: 'The main road to the bridge', dangerHint: 'The bridge is heavily guarded' },
    { id: 'village_to_camp', targetId: 'riverside_camp', pathType: PathType.BRANCH, description: 'A detour along the river', dangerHint: 'Travelers camp here' },
  ],
  flags: {
    isEntry: false,
    isBoss: false,
    isSecret: false,
    hasMerchant: true,
    hasRest: true,
    hasTraining: false,
  },
  intelMissionConfig: {
    eliteId: 'village_defender',
    flavorText: 'A retired shinobi stands guard. "Prove you\'re not one of Gato\'s men."',
    skipAllowed: true,
    revealedPathIds: ['village_to_bridge', 'village_to_camp'],
  },
};

const RIVERSIDE_CAMP: LocationConfig = {
  id: 'riverside_camp',
  name: 'Riverside Camp',
  description: 'A makeshift camp by the river. Travelers share information and supplies here.',
  type: LocationType.WILDERNESS,
  icon: '🔥',
  dangerLevel: 3,
  terrain: LocationTerrainType.WATER_ADJACENT,
  terrainEffects: [{ type: 'water_damage_bonus', value: 0.1 }],
  biome: 'River Banks',
  enemyPool: ['river_bandit', 'camp_raider', 'desperate_traveler'],
  lootTable: 'waves_wilderness',
  atmosphereEvents: ['campfire_tales', 'river_crossing', 'supply_trade'],
  forwardPaths: [
    { id: 'camp_to_bridge', targetId: 'bridge_construction', pathType: PathType.FORWARD, description: 'Continue to the bridge', dangerHint: 'The construction site looms' },
    { id: 'camp_to_outpost', targetId: 'bandit_outpost', pathType: PathType.BRANCH, description: 'A dangerous shortcut', dangerHint: 'Bandits control this route' },
  ],
  loopPaths: [
    { id: 'camp_to_forest', targetId: 'coastal_forest', pathType: PathType.LOOP, description: 'Back through the forest', dangerHint: 'Retreat to earlier ground' },
  ],
  flags: {
    isEntry: false,
    isBoss: false,
    isSecret: false,
    hasMerchant: false,
    hasRest: true,
    hasTraining: true,
  },
  intelMissionConfig: {
    eliteId: 'camp_guardian',
    flavorText: 'A grizzled mercenary eyes you warily. "Only the strong survive on this road."',
    skipAllowed: true,
    revealedPathIds: ['camp_to_bridge', 'camp_to_outpost'],
    loopHint: 'You could retreat through the forest...',
  },
};

const SUNKEN_SHIP: LocationConfig = {
  id: 'sunken_ship',
  name: 'Sunken Ship',
  description: 'A merchant vessel lies half-submerged in the shallows. Its cargo hold still beckons treasure hunters.',
  type: LocationType.SECRET,
  icon: '🚢',
  dangerLevel: 5,
  terrain: LocationTerrainType.HAZARDOUS,
  terrainEffects: [
    { type: 'water_damage_bonus', value: 0.3 },
    { type: 'fire_damage_penalty', value: -0.5 },
    { type: 'movement_penalty', value: 0.2 },
  ],
  biome: 'Shipwreck',
  enemyPool: ['drowned_sailor', 'water_spirit', 'treasure_guardian'],
  lootTable: 'waves_secret',
  atmosphereEvents: ['trapped_air_pocket', 'spectral_captain', 'treasure_cache'],
  forwardPaths: [
    { id: 'ship_to_forest', targetId: 'coastal_forest', pathType: PathType.FORWARD, description: 'Return to solid ground', dangerHint: 'Back to the forest' },
  ],
  secretPaths: [
    { id: 'ship_to_shrine', targetId: 'drowned_shrine', pathType: PathType.SECRET, description: 'Dive deeper into the water', dangerHint: 'Ancient evil waits below' },
  ],
  flags: {
    isEntry: false,
    isBoss: false,
    isSecret: true,
    hasMerchant: false,
    hasRest: false,
    hasTraining: false,
  },
  unlockCondition: { type: 'intel', requirement: 'sunken_ship_discovered' },
  intelMissionConfig: {
    eliteId: 'ship_captain',
    flavorText: 'The ghostly captain guards his lost treasure eternally. "None shall take my gold!"',
    skipAllowed: true,
    revealedPathIds: ['ship_to_forest'],
    secretHint: 'The captain whispers of a drowned shrine to dark gods...',
  },
};

const BRIDGE_CONSTRUCTION: LocationConfig = {
  id: 'bridge_construction',
  name: 'Bridge Construction',
  description: 'Tazuna\'s great bridge stretches across the water. Workers toil under constant threat.',
  type: LocationType.LANDMARK,
  icon: '🌉',
  dangerLevel: 4,
  terrain: LocationTerrainType.WATER_ADJACENT,
  terrainEffects: [
    { type: 'water_damage_bonus', value: 0.25 },
    { type: 'fall_hazard', value: 0.1 },
  ],
  biome: 'Great Bridge',
  enemyPool: ['bridge_saboteur', 'hired_assassin', 'corrupt_foreman'],
  lootTable: 'waves_landmark',
  atmosphereEvents: ['bridge_sabotage', 'worker_strike', 'gato_threat'],
  tiedStoryEvents: ['protect_bridge', 'final_showdown_setup'],
  forwardPaths: [
    { id: 'bridge_to_compound', targetId: 'gatos_compound', pathType: PathType.FORWARD, description: 'The final confrontation awaits', dangerHint: 'Gato\'s fortress looms' },
    { id: 'bridge_to_manor', targetId: 'abandoned_manor', pathType: PathType.BRANCH, description: 'An old manor on the hill', dangerHint: 'Ghosts haunt this place' },
  ],
  flags: {
    isEntry: false,
    isBoss: false,
    isSecret: false,
    hasMerchant: true,
    hasRest: false,
    hasTraining: true,
  },
  intelMissionConfig: {
    eliteId: 'bridge_guardian',
    flavorText: 'A massive foreman blocks the way. "This bridge ain\'t for leaf ninja."',
    skipAllowed: true,
    revealedPathIds: ['bridge_to_compound', 'bridge_to_manor'],
    bossInfo: 'Gato awaits in his compound with his army...',
  },
};

const BANDIT_OUTPOST: LocationConfig = {
  id: 'bandit_outpost',
  name: 'Bandit Outpost',
  description: 'Gato\'s hired muscle operates from this fortified position. A direct assault route.',
  type: LocationType.STRONGHOLD,
  icon: '⚔️',
  dangerLevel: 5,
  terrain: LocationTerrainType.FORTIFIED,
  terrainEffects: [
    { type: 'enemy_defense_bonus', value: 0.15 },
    { type: 'ambush_chance', value: 0.3 },
  ],
  biome: 'Fortified Camp',
  enemyPool: ['bandit_captain', 'elite_mercenary', 'war_dog'],
  lootTable: 'waves_stronghold',
  atmosphereEvents: ['prisoner_rescue', 'supply_raid', 'commander_duel'],
  forwardPaths: [
    { id: 'outpost_to_compound', targetId: 'gatos_compound', pathType: PathType.FORWARD, description: 'A direct assault route', dangerHint: 'The compound is heavily fortified' },
    { id: 'outpost_to_manor', targetId: 'abandoned_manor', pathType: PathType.BRANCH, description: 'Circle around through the manor', dangerHint: 'A less guarded approach' },
  ],
  loopPaths: [
    { id: 'outpost_to_camp', targetId: 'riverside_camp', pathType: PathType.LOOP, description: 'Retreat to the camp', dangerHint: 'Fall back and regroup' },
  ],
  flags: {
    isEntry: false,
    isBoss: false,
    isSecret: false,
    hasMerchant: false,
    hasRest: false,
    hasTraining: false,
  },
  intelMissionConfig: {
    eliteId: 'outpost_commander',
    flavorText: 'The Bandit Captain draws his blade. "Gato pays well for ninja heads."',
    skipAllowed: true,
    revealedPathIds: ['outpost_to_compound', 'outpost_to_manor'],
    loopHint: 'You could retreat to the riverside camp...',
  },
};

const ABANDONED_MANOR: LocationConfig = {
  id: 'abandoned_manor',
  name: 'Abandoned Manor',
  description: 'An old noble\'s estate, now empty. Or is it? Strange sounds echo in the halls.',
  type: LocationType.LANDMARK,
  icon: '🏚️',
  dangerLevel: 3,
  terrain: LocationTerrainType.NEUTRAL,
  terrainEffects: [{ type: 'mental_damage_bonus', value: 0.2 }],
  biome: 'Ruined Estate',
  enemyPool: ['vengeful_ghost', 'manor_guardian', 'cursed_servant'],
  lootTable: 'waves_landmark',
  atmosphereEvents: ['ghostly_wailing', 'hidden_passage', 'noble_treasure'],
  forwardPaths: [
    { id: 'manor_to_compound', targetId: 'gatos_compound', pathType: PathType.FORWARD, description: 'The compound lies beyond', dangerHint: 'The final battle approaches' },
  ],
  flags: {
    isEntry: false,
    isBoss: false,
    isSecret: false,
    hasMerchant: false,
    hasRest: true,
    hasTraining: false,
  },
  intelMissionConfig: {
    eliteId: 'manor_spirit',
    flavorText: 'A Vengeful Ghost rises from the shadows. "You dare disturb my eternal rest?"',
    skipAllowed: true,
    revealedPathIds: ['manor_to_compound'],
  },
};

const HIDDEN_COVE: LocationConfig = {
  id: 'hidden_cove',
  name: 'Hidden Cove',
  description: 'A secret inlet used by smugglers. Rare goods and dark secrets can be found here.',
  type: LocationType.SECRET,
  icon: '🏝️',
  dangerLevel: 4,
  terrain: LocationTerrainType.WATER_ADJACENT,
  terrainEffects: [
    { type: 'water_damage_bonus', value: 0.2 },
    { type: 'stealth_bonus', value: 0.2 },
  ],
  biome: 'Secret Harbor',
  enemyPool: ['cove_smuggler', 'sea_creature', 'hidden_guard'],
  lootTable: 'waves_secret',
  atmosphereEvents: ['smuggler_meeting', 'rare_cargo', 'sea_monster'],
  forwardPaths: [
    { id: 'cove_to_outpost', targetId: 'bandit_outpost', pathType: PathType.FORWARD, description: 'A path to the outpost', dangerHint: 'Bandits guard this route' },
  ],
  secretPaths: [
    { id: 'cove_to_shrine', targetId: 'drowned_shrine', pathType: PathType.SECRET, description: 'An underwater passage', dangerHint: 'Darkness waits below' },
  ],
  flags: {
    isEntry: false,
    isBoss: false,
    isSecret: true,
    hasMerchant: true,
    hasRest: false,
    hasTraining: false,
  },
  unlockCondition: { type: 'intel', requirement: 'hidden_cove_discovered' },
  intelMissionConfig: {
    eliteId: 'cove_priestess',
    flavorText: 'A Sea Priestess bars your way. "These waters are sacred. Turn back or drown."',
    skipAllowed: true,
    revealedPathIds: ['cove_to_outpost'],
    secretHint: 'An underwater passage leads to an ancient shrine...',
  },
};

const DROWNED_SHRINE: LocationConfig = {
  id: 'drowned_shrine',
  name: 'Drowned Shrine',
  description: 'An ancient temple now beneath the waves. Powerful chakra resonates here. Dark gods were once worshipped.',
  type: LocationType.SECRET,
  icon: '🏛️',
  dangerLevel: 6,
  terrain: LocationTerrainType.CORRUPTED,
  terrainEffects: [
    { type: 'water_damage_bonus', value: 0.4 },
    { type: 'fire_damage_penalty', value: -0.6 },
    { type: 'mental_damage_bonus', value: 0.3 },
  ],
  biome: 'Underwater Temple',
  enemyPool: ['shrine_demon', 'corrupted_priest', 'eldritch_guardian'],
  lootTable: 'waves_secret',
  atmosphereEvents: ['dark_ritual', 'forbidden_knowledge', 'ancient_curse'],
  forwardPaths: [
    { id: 'shrine_to_compound', targetId: 'gatos_compound', pathType: PathType.FORWARD, description: 'A hidden approach to the compound', dangerHint: 'Emerge behind enemy lines' },
  ],
  flags: {
    isEntry: false,
    isBoss: false,
    isSecret: true,
    hasMerchant: false,
    hasRest: false,
    hasTraining: true,
  },
  unlockCondition: { type: 'intel', requirement: 'drowned_shrine_discovered' },
  intelMissionConfig: {
    eliteId: 'shrine_demon',
    flavorText: 'A Drowned Demon rises from the depths. "Mortals... your souls will fuel my return!"',
    skipAllowed: true,
    revealedPathIds: ['shrine_to_compound'],
    bossInfo: 'This path leads directly behind Gato\'s defenses...',
  },
};

const GATOS_COMPOUND: LocationConfig = {
  id: 'gatos_compound',
  name: 'Gato\'s Compound',
  description: 'The shipping magnate\'s fortress. A monument to greed built on suffering. All roads lead here.',
  type: LocationType.BOSS,
  icon: '👹',
  dangerLevel: 7,
  terrain: LocationTerrainType.FORTIFIED,
  terrainEffects: [
    { type: 'enemy_defense_bonus', value: 0.2 },
    { type: 'enemy_attack_bonus', value: 0.1 },
  ],
  biome: 'Fortified Mansion',
  enemyPool: ['elite_guard', 'ronin', 'assassin', 'gato'],
  lootTable: 'waves_boss',
  atmosphereEvents: ['gato_speech', 'servant_whispers', 'display_of_power'],
  tiedStoryEvents: ['final_confrontation', 'gato_defeat'],
  forwardPaths: [], // Boss location - no forward paths
  flags: {
    isEntry: false,
    isBoss: true,
    isSecret: false,
    hasMerchant: false,
    hasRest: false,
    hasTraining: false,
  },
  intelMissionConfig: {
    bossId: 'gato',
    flavorText: 'Gato sits on his throne of stolen wealth, surrounded by guards. "So, the leaf village sent children to stop me? How... disappointing."',
    skipAllowed: false, // MUST fight the boss
    revealedPathIds: [],
  },
};

// ============================================================================
// REGION CONFIG
// ============================================================================

export const LAND_OF_WAVES_CONFIG: RegionConfig = {
  id: 'land_of_waves',
  name: 'Land of Waves',
  description: 'A poor coastal country under the thumb of the shipping magnate Gato. The great bridge may be its salvation... or its doom.',
  theme: 'Misty coast, poverty, tyranny, hope in the face of despair',

  entryLocationIds: ['the_docks', 'misty_beach'],
  bossLocationId: 'gatos_compound',

  locations: [
    THE_DOCKS,
    MISTY_BEACH,
    COASTAL_FOREST,
    SMUGGLERS_CAVE,
    FISHING_VILLAGE,
    RIVERSIDE_CAMP,
    SUNKEN_SHIP,
    BRIDGE_CONSTRUCTION,
    BANDIT_OUTPOST,
    ABANDONED_MANOR,
    HIDDEN_COVE,
    DROWNED_SHRINE,
    GATOS_COMPOUND,
  ],

  arc: 'WAVES_ARC',
  biome: 'Mist Covered Bridge',

  lootTheme: {
    primaryElement: ElementType.WATER,
    equipmentFocus: ['speed', 'dexterity', 'spirit'],
    goldMultiplier: 0.8, // Poor region
  },

  baseDifficulty: 40,
};

export default LAND_OF_WAVES_CONFIG;
