// ============================================================================
// SHINOBI WAY - THE INFINITE TOWER
// New Stat System: The Shinobi Triad (Body, Mind, Technique)
// ============================================================================

export enum GameState {
  MENU,
  CHAR_SELECT,
  EXPLORE_MAP,      // Legacy node map (kept for compatibility)
  BRANCHING_EXPLORE, // Primary branching room exploration view
  COMBAT,
  LOOT,
  MERCHANT,
  EVENT,
  TRAINING,         // Training scene for stat upgrades
  SCROLL_DISCOVERY, // Finding jutsu scrolls in exploration
  GAME_OVER,
  GUIDE
}

export enum ElementType {
  FIRE = 'Fire',
  WIND = 'Wind',
  LIGHTNING = 'Lightning',
  EARTH = 'Earth',
  WATER = 'Water',
  PHYSICAL = 'Physical',
  MENTAL = 'Mental' // For Genjutsu
}

// ============================================================================
// PRIMARY STATS - The 9 Core Attributes
// ============================================================================
export enum PrimaryStat {
  // THE BODY (Hardware) - Survival & Resources
  WILLPOWER = 'Willpower',   // Max HP, Guts chance, HP Regen
  CHAKRA = 'Chakra',         // Max Chakra capacity
  STRENGTH = 'Strength',     // Taijutsu Dmg, Physical Defense

  // THE MIND (Software) - Nature & Logic
  SPIRIT = 'Spirit',         // Elemental Dmg, Elemental Defense
  INTELLIGENCE = 'Intelligence', // Jutsu Requirements, Chakra Regen
  CALMNESS = 'Calmness',     // Genjutsu Defense, Status Resistance

  // THE TECHNIQUE (Application) - Precision & Speed
  SPEED = 'Speed',           // Initiative, Melee Hit, Evasion
  ACCURACY = 'Accuracy',     // Ranged Hit, Ranged Crit Multiplier
  DEXTERITY = 'Dexterity'    // Critical Hit Chance (all types)
}

// Legacy alias for backward compatibility
export const Stat = PrimaryStat;
export type Stat = PrimaryStat;

// ============================================================================
// DAMAGE SYSTEM
// ============================================================================
export enum DamageType {
  PHYSICAL = 'Physical',     // Taijutsu - mitigated by Strength
  ELEMENTAL = 'Elemental',   // Ninjutsu - mitigated by Spirit
  MENTAL = 'Mental',         // Genjutsu - mitigated by Calmness
  TRUE = 'True'              // Bypasses ALL defenses (rare/forbidden)
}

export enum DamageProperty {
  NORMAL = 'Normal',         // Subject to BOTH flat and % defenses
  PIERCING = 'Piercing',     // Ignores FLAT defense, only % applies
  ARMOR_BREAK = 'ArmorBreak' // Ignores % defense, only flat applies
}

export enum AttackMethod {
  MELEE = 'Melee',           // Hit chance uses SPEED vs SPEED
  RANGED = 'Ranged',         // Hit chance uses ACCURACY vs SPEED
  AUTO = 'Auto'              // Always hits (some DoTs, Genjutsu effects)
}

// ============================================================================
// PRIMARY ATTRIBUTES INTERFACE
// ============================================================================
export interface PrimaryAttributes {
  // THE BODY
  willpower: number;    // Grit, survival instinct
  chakra: number;       // Raw energy capacity
  strength: number;     // Physical conditioning

  // THE MIND
  spirit: number;       // Nature affinity
  intelligence: number; // Tactical acumen
  calmness: number;     // Mental fortitude

  // THE TECHNIQUE
  speed: number;        // Reflexes and flow
  accuracy: number;     // Precision and marksmanship
  dexterity: number;    // Lethal precision
}

// ============================================================================
// DERIVED STATS - Calculated from Primary Attributes
// ============================================================================
export interface DerivedStats {
  // Resource Pools
  maxHp: number;
  currentHp: number;
  maxChakra: number;
  currentChakra: number;

  // Regeneration (per turn)
  hpRegen: number;
  chakraRegen: number;

  // DEFENSE - Flat (subtracts from damage before %)
  physicalDefenseFlat: number;
  elementalDefenseFlat: number;
  mentalDefenseFlat: number;

  // DEFENSE - Percentage (damage reduction after flat)
  physicalDefensePercent: number;   // 0-1 scale
  elementalDefensePercent: number;  // 0-1 scale
  mentalDefensePercent: number;     // 0-1 scale

  // Status & Survival
  statusResistance: number;   // % chance to resist debuffs
  gutsChance: number;         // % chance to survive lethal blow at 1 HP
  
  // Offensive - Hit Rates (base %, modified by target's evasion)
  meleeHitRate: number;       // Base hit chance for melee
  rangedHitRate: number;      // Base hit chance for ranged

  // Evasion
  evasion: number;            // % chance to dodge attacks

  // Critical Strikes
  critChance: number;         // % chance to crit
  critDamageMelee: number;    // Multiplier for melee crits
  critDamageRanged: number;   // Multiplier for ranged crits (Accuracy bonus)

  // Initiative (turn order in combat)
  initiative: number;
}

// ============================================================================
// COMBINED CHARACTER STATS
// ============================================================================
export interface CharacterStats {
  primary: PrimaryAttributes;
  derived: DerivedStats;
  effectivePrimary: PrimaryAttributes;
  equipmentBonuses?: ItemStatBonus;
}

// Legacy Attributes interface for backward compatibility during migration
export interface Attributes {
  hp: number;
  maxHp: number;
  chakra: number;
  maxChakra: number;
  // Map old stats to new
  str: number;      // -> strength
  int: number;      // -> intelligence
  spd: number;      // -> speed
  def: number;      // Deprecated - split into strength/spirit/calmness
  gen: number;      // -> calmness (genjutsu defense)
  acc: number;      // -> accuracy
  // New stats (added for transition)
  willpower?: number;
  spirit?: number;
  dexterity?: number;
  calmness?: number;
}

// ============================================================================
// CLANS & ELEMENTS
// ============================================================================
export enum Clan {
  UZUMAKI = 'Uzumaki',
  UCHIHA = 'Uchiha',
  HYUGA = 'Hyuga',
  LEE = 'Lee Disciple',
  YAMANAKA = 'Yamanaka'
}

export enum Rarity {
  COMMON = 'Common',
  RARE = 'Rare',
  EPIC = 'Epic',
  LEGENDARY = 'Legendary',
  CURSED = 'Cursed'
}

export enum SkillTier {
  // Legacy tiers (kept for backward compatibility)
  COMMON = 'Common',
  RARE = 'Rare',
  EPIC = 'Epic',
  LEGENDARY = 'Legendary',
  FORBIDDEN = 'Forbidden',
  // New tier system (Part 1 Naruto)
  BASIC = 'Basic',
  ADVANCED = 'Advanced',
  HIDDEN = 'Hidden',
  KINJUTSU = 'Kinjutsu'
}

// ============================================================================
// ACTION TYPE SYSTEM - Determines when/how skills can be used
// ============================================================================
export enum ActionType {
  MAIN = 'Main',       // Ends your turn - primary attacks and jutsu
  TOGGLE = 'Toggle',   // Activate once (ends turn), pays upkeep each turn
  SIDE = 'Side',       // Free action BEFORE Main, max 2 per turn
  PASSIVE = 'Passive'  // Always active, no action required
}

// Legacy ItemSlot - kept for migration compatibility
export enum ItemSlot {
  WEAPON = 'Weapon',
  HEAD = 'Head',
  BODY = 'Body',
  ACCESSORY = 'Accessory'
}

// ============================================================================
// SYNTHESIS SYSTEM - TFT-Style Component Crafting
// ============================================================================

// 4 Generic equipment slots (replaces typed slots)
export enum EquipmentSlot {
  SLOT_1 = 'Slot1',
  SLOT_2 = 'Slot2',
  SLOT_3 = 'Slot3',
  SLOT_4 = 'Slot4',
}

// Map legacy ItemSlot to EquipmentSlot for backwards compatibility
export const SLOT_MAPPING: Record<ItemSlot, EquipmentSlot> = {
  [ItemSlot.WEAPON]: EquipmentSlot.SLOT_1,
  [ItemSlot.HEAD]: EquipmentSlot.SLOT_2,
  [ItemSlot.BODY]: EquipmentSlot.SLOT_3,
  [ItemSlot.ACCESSORY]: EquipmentSlot.SLOT_4,
};

// Component identifiers - Naruto-themed crafting materials
export enum ComponentId {
  NINJA_STEEL = 'ninja_steel',           // +Strength (forged metal)
  SPIRIT_TAG = 'spirit_tag',             // +Spirit (ofuda/paper tags)
  CHAKRA_PILL = 'chakra_pill',           // +Chakra (soldier pills)
  IRON_SAND = 'iron_sand',               // +Willpower (Kazekage's sand)
  ANBU_MASK = 'anbu_mask',               // +Calmness (emotional control)
  TRAINING_WEIGHTS = 'training_weights', // +Dexterity (Rock Lee style)
  SWIFT_SANDALS = 'swift_sandals',       // +Speed (shinobi footwear)
  TACTICAL_SCROLL = 'tactical_scroll',   // +Intelligence (strategy guides)
  HASHIRAMA_CELL = 'hashirama_cell',     // Special - Kekkei Genkai synthesis
}

// Passive effect types for synthesized artifacts
export enum PassiveEffectType {
  // Damage over Time
  BLEED = 'bleed',
  BURN = 'burn',
  POISON = 'poison',

  // Resource manipulation
  CHAKRA_DRAIN = 'chakra_drain',
  CHAKRA_RESTORE = 'chakra_restore',
  LIFESTEAL = 'lifesteal',

  // Defensive
  REFLECT = 'reflect',
  SHIELD_ON_START = 'shield_on_start',
  INVULNERABLE_FIRST_TURN = 'invulnerable_first_turn',
  DAMAGE_REDUCTION = 'damage_reduction',
  REGEN = 'regen',
  GUTS = 'guts',

  // Offensive
  PIERCE_DEFENSE = 'pierce_defense',
  CONVERT_TO_ELEMENTAL = 'convert_to_elemental',
  EXECUTE_THRESHOLD = 'execute_threshold',
  COUNTER_ATTACK = 'counter_attack',

  // Utility
  FREE_FIRST_SKILL = 'free_first_skill',
  COOLDOWN_RESET_ON_KILL = 'cooldown_reset_on_kill',
  SEAL_CHANCE = 'seal_chance',

  // Kekkei Genkai (Hashirama Cell combinations)
  ALL_ELEMENTS = 'all_elements',
  CLAN_TRAIT_UCHIHA = 'clan_trait_uchiha',
  CLAN_TRAIT_UZUMAKI = 'clan_trait_uzumaki',
  CLAN_TRAIT_HYUGA = 'clan_trait_hyuga',
  CLAN_TRAIT_NARA = 'clan_trait_nara',
}

// Passive effect definition for artifacts
export interface PassiveEffect {
  type: PassiveEffectType;
  value?: number;          // e.g., 25 for 25% chance, 5 for 5% HP
  duration?: number;       // For DoTs/buffs in turns
  triggerCondition?: 'on_hit' | 'on_kill' | 'on_crit' | 'combat_start' | 'turn_start' | 'below_half_hp';
}

// Synthesis system constants
export const MAX_BAG_SLOTS = 8;
export const DISASSEMBLE_RETURN_RATE = 0.5; // 50% value return when breaking artifacts

// ============================================================================
// EFFECTS & BUFFS
// ============================================================================
export enum EffectType {
  STUN = 'Stun',
  DOT = 'DoT',
  BUFF = 'Buff',
  DEBUFF = 'Debuff',
  HEAL = 'Heal',
  DRAIN = 'Drain',
  CONFUSION = 'Confusion',
  SILENCE = 'Silence',
  BLEED = 'Bleed',        // Physical DoT
  BURN = 'Burn',          // Fire DoT
  POISON = 'Poison',      // Ignores some defense
  CHAKRA_DRAIN = 'ChakraDrain',
  
  // --- NEW EFFECTS ---
  SHIELD = 'Shield',           // Absorbs incoming damage (Temporary HP)
  INVULNERABILITY = 'Invuln',  // Takes 0 damage for duration
  CURSE = 'Curse',             // Increases damage taken by X%
  REFLECTION = 'Reflect',      // Returns % of damage taken
  REGEN = 'Regen'              // Restores HP at start of turn
}

export interface EffectDefinition {
  type: EffectType;
  value?: number;           // Damage amount or stat multiplier
  duration: number;         // Turns (-1 for permanent/toggle)
  targetStat?: PrimaryStat; // For Buff/Debuff
  chance: number;           // 0-1 probability
  damageType?: DamageType;  // For DoT effects
  damageProperty?: DamageProperty; // For DoT effects
}

export interface Buff {
  id: string;
  name: string;
  duration: number;
  effect: EffectDefinition;
  source: string;
}

// ============================================================================
// SKILLS / JUTSU
// ============================================================================
export interface SkillRequirements {
  intelligence?: number;  // Minimum INT to learn
  level?: number;         // Minimum player level
  clan?: Clan;            // Clan restriction
}

// Passive skill effect for PASSIVE action type skills
export interface PassiveSkillEffect {
  statBonus?: Partial<PrimaryAttributes>;
  damageBonus?: number;          // % bonus to all damage dealt
  defenseBonus?: number;         // % bonus to all defense
  regenBonus?: { hp?: number; chakra?: number };  // Per-turn regeneration
  specialEffect?: string;        // Unique effect identifier
}

export interface Skill {
  id: string;
  name: string;
  tier: SkillTier;
  description: string;

  // ACTION TYPE (NEW) - Determines when/how skill can be used
  actionType?: ActionType;       // MAIN/TOGGLE/SIDE/PASSIVE (default: MAIN)
  sideActionLimit?: number;      // Max uses per turn for SIDE skills (default: 1)

  // Costs
  chakraCost: number;
  hpCost: number;

  // Cooldown
  cooldown: number;
  currentCooldown: number;

  // Damage Calculation
  damageMult: number;
  scalingStat: PrimaryStat;     // Which stat scales the damage
  damageType: DamageType;       // Physical/Elemental/Mental/True
  damageProperty: DamageProperty; // Normal/Piercing/ArmorBreak
  attackMethod: AttackMethod;   // Melee/Ranged/Auto

  // Element (for elemental interactions)
  element: ElementType;

  // Toggle Skills (like Sharingan)
  isToggle?: boolean;
  isActive?: boolean;
  upkeepCost?: number;

  // Effects applied on hit
  effects?: EffectDefinition[];

  // Bonuses
  critBonus?: number;           // Extra % crit chance
  penetration?: number;         // % defense ignored (0-1)

  // Requirements
  requirements?: SkillRequirements;

  // Passive skill effect (for PASSIVE action type)
  passiveEffect?: PassiveSkillEffect;

  // Upgrade tracking
  level?: number;

  // Visual
  image?: string;
  icon?: string;                // Emoji/icon for quick reference
}

// ============================================================================
// ITEMS & EQUIPMENT
// ============================================================================
export interface ItemStatBonus {
  // Primary stat bonuses
  willpower?: number;
  chakra?: number;
  strength?: number;
  spirit?: number;
  intelligence?: number;
  calmness?: number;
  speed?: number;
  accuracy?: number;
  dexterity?: number;
  
  // Direct derived stat bonuses (rare items)
  flatHp?: number;
  flatChakra?: number;
  flatPhysicalDef?: number;
  flatElementalDef?: number;
  flatMentalDef?: number;
  percentPhysicalDef?: number;
  percentElementalDef?: number;
  percentMentalDef?: number;
  critChance?: number;
  critDamage?: number;
}

export interface Item {
  id: string;
  name: string;
  type?: ItemSlot;           // Legacy: typed slot (optional for components/artifacts)
  rarity: Rarity;
  stats: ItemStatBonus;
  value: number;
  description?: string;
  requirements?: SkillRequirements;

  // Synthesis system fields
  isComponent: boolean;                    // true = basic component, false = artifact/legacy item
  componentId?: ComponentId;               // Only for components
  recipe?: [ComponentId, ComponentId];     // Only for artifacts - the components used to craft
  passive?: PassiveEffect;                 // Only for artifacts - special effect
  icon?: string;                           // Emoji or icon identifier for display
}

// ============================================================================
// PLAYER & ENEMY
// ============================================================================
export interface Player {
  clan: Clan;
  level: number;
  exp: number;
  maxExp: number;

  // Stats
  primaryStats: PrimaryAttributes;

  // Resources (tracked separately from derived for current values)
  currentHp: number;
  currentChakra: number;

  // Flavor
  element: ElementType;
  ryo: number;

  // Loadout - 4 generic equipment slots (synthesis system)
  equipment: Record<EquipmentSlot, Item | null>;
  skills: Skill[];
  activeBuffs: Buff[];

  // Synthesis system - component inventory
  componentBag: Item[];  // Max MAX_BAG_SLOTS (8) components for crafting
}

export interface Enemy {
  name: string;
  tier: string;
  
  // Stats
  primaryStats: PrimaryAttributes;
  currentHp: number;
  currentChakra: number;
  
  // Combat
  element: ElementType;
  skills: Skill[];
  activeBuffs: Buff[];
  
  // Flags
  isBoss?: boolean;
  image?: string;
  dropRateBonus?: number;
}

// ============================================================================
// COMBAT RESULT
// ============================================================================
export interface DamageResult {
  rawDamage: number;          // Before any mitigation
  flatReduction: number;      // Damage blocked by flat defense
  percentReduction: number;   // Damage blocked by % defense
  finalDamage: number;        // After all mitigation
  isCrit: boolean;
  isMiss: boolean;
  isEvaded: boolean;
  elementMultiplier: number;
  gutsTriggered?: boolean;    // Did target survive via Guts?
}

// ============================================================================
// GAME EVENTS & ROOMS
// ============================================================================
export interface LogEntry {
  id: number;
  text: string;
  type: 'info' | 'combat' | 'loot' | 'danger' | 'gain' | 'event';
  details?: string;
}

export interface EventChoice {
  label: string;
  type: 'HEAL_HP' | 'HEAL_CHAKRA' | 'HEAL_ALL' | 'GAMBLE_HP' | 'FIGHT_GHOST' | 'TRADE' | 'LEAVE' | 'TRAP_DMG' | 'GAIN_XP' | 'CHALLENGE_GUARDIAN';
  value?: number;
  chance?: number;
  description?: string;
}

export interface GameEventDefinition {
  id: string;
  title: string;
  description: string;
  choices: EventChoice[];
  allowedArcs?: string[]; // Story arcs where this event can occur
}

export interface Room {
  type: 'COMBAT' | 'ELITE' | 'BOSS' | 'EVENT' | 'REST' | 'AMBUSH';
  description: string;
  enemy?: Enemy;
  eventDefinition?: GameEventDefinition;
}

// ============================================================================
// ENHANCED EVENT SYSTEM
// ============================================================================
export enum RiskLevel {
  SAFE = 'SAFE',
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  EXTREME = 'EXTREME'
}

export interface RequirementCheck {
  minStat?: { stat: PrimaryStat; value: number };
  requiredClan?: Clan;
}

export interface EventCost {
  ryo?: number;
}

export interface EventOutcome {
  weight: number; // Probability weight (sum should = 100 across outcomes)

  effects: {
    // Stats & progression
    statChanges?: Partial<PrimaryAttributes>;
    exp?: number;
    ryo?: number;

    // HP/Chakra changes
    hpChange?: number | { percent: number };
    chakraChange?: number | { percent: number };

    // Loot
    items?: Item[];
    skills?: Skill[];

    // Persistent buffs
    buffs?: Buff[];

    // Combat triggers
    triggerCombat?: {
      floor: number;
      difficulty: number;
      archetype: string;
      name?: string;
    };

    // Logging
    logMessage: string;
    logType: 'gain' | 'danger' | 'info' | 'loot';
  };
}

export interface EnhancedEventChoice {
  label: string;
  description: string;

  // Risk indicator (shown to player)
  riskLevel: RiskLevel;
  hintText?: string; // Vague clue about outcome

  // Requirements (choice disabled if not met)
  requirements?: RequirementCheck;

  // Costs (paid upfront)
  costs?: EventCost;

  // Multiple outcomes with weighted probability
  outcomes: EventOutcome[];

  // Clan-specific bonus (multiplier to weight on favorable outcome)
  clanBonus?: {
    clan: Clan;
    weightMultiplier: number;
  };
}

export interface EnhancedGameEventDefinition {
  id: string;
  title: string;
  description: string;
  allowedArcs?: string[]; // Story arcs where this event can occur
  rarity?: Rarity; // How common is this event
  choices: EnhancedEventChoice[];
}

// ============================================================================
// STAT CALCULATION FORMULAS (Constants for the calculator)
// ============================================================================
export const STAT_FORMULAS = {
  // Resource Pools
  HP_PER_WILLPOWER: 12,
  HP_BASE: 50,
  CHAKRA_PER_CHAKRA: 8,
  CHAKRA_BASE: 30,

  // Regeneration
  HP_REGEN_PERCENT: 0.02,        // 2% of max HP per turn based on willpower
  CHAKRA_REGEN_PER_INT: 0.2,    // Chakra regen per INT point

  // Defense Scaling (Diminishing Returns Formula)
  // Formula: stat / (stat + SOFT_CAP) = % reduction
  PHYSICAL_DEF_SOFT_CAP: 200,    // BUFFED: Was 120 - harder to cap
  ELEMENTAL_DEF_SOFT_CAP: 200,   // BUFFED: Was 120
  MENTAL_DEF_SOFT_CAP: 150,      // BUFFED: Was 100

  // Flat Defense - HALVED for better damage scaling
  FLAT_PHYS_DEF_PER_STR: 0.3,    // NERFED: Was 0.6 - HALVED
  FLAT_ELEM_DEF_PER_SPIRIT: 0.3, // NERFED: Was 0.6 - HALVED
  FLAT_MENTAL_DEF_PER_CALM: 0.25,// NERFED: Was 0.5 - HALVED

  // Evasion & Hit - More reliable attacks
  EVASION_SOFT_CAP: 250,         // BUFFED: Was 150 - harder to dodge
  BASE_HIT_CHANCE: 92,           // BUFFED: Was 85 - more reliable
  HIT_PER_STAT_DIFF: 1.5,        // Per point of SPD/ACC vs target SPD

  // Critical - Slight buff to reward precision
  BASE_CRIT_CHANCE: 8,           // BUFFED: Was 5
  CRIT_PER_DEX: 0.5,             // BUFFED: Was 0.4
  BASE_CRIT_MULT: 1.75,          // BUFFED: Was 1.5
  RANGED_CRIT_BONUS_PER_ACC: 0.008, // Extra crit multiplier for ranged

  // Survival
  GUTS_SOFT_CAP: 200,           // Willpower / (Willpower + 200) = guts chance
  STATUS_RESIST_SOFT_CAP: 80,   // Calmness / (Calmness + 80) = resist chance

  // Initiative
  INIT_BASE: 10,
  INIT_PER_SPEED: 1,
} as const;

// ============================================================================
// EXPLORATION SYSTEM - Node-Based Floor Navigation
// ============================================================================

export enum NodeType {
  // Core types
  START = 'START',
  EXIT = 'EXIT',
  COMBAT = 'COMBAT',
  ELITE = 'ELITE',
  BOSS = 'BOSS',
  REST = 'REST',
  EVENT = 'EVENT',

  // New exploration types
  MYSTERY = 'MYSTERY',       // "???" until revealed
  HIDDEN = 'HIDDEN',         // Invisible without high stats
  TRAP = 'TRAP',             // DEX check to avoid damage
  SHRINE = 'SHRINE',         // Stat-gated blessings
  TRAINING = 'TRAINING',     // Permanent stat boost (costs HP/Chakra)
  TRIAL = 'TRIAL',           // Stat challenge for major reward
  ANOMALY = 'ANOMALY',       // Random effect, Spirit reveals nature
  SENSEI = 'SENSEI',         // Skill teaching (INT requirement)
  AMBUSH_POINT = 'AMBUSH_POINT', // Player ambushes enemies here
  CACHE = 'CACHE'            // Guaranteed loot room
}

export enum TerrainType {
  // Academy Biome
  OPEN_GROUND = 'OPEN_GROUND',
  ROOFTOPS = 'ROOFTOPS',
  TRAINING_FIELD = 'TRAINING_FIELD',
  ALLEYWAY = 'ALLEYWAY',

  // Waves Biome
  FOG_BANK = 'FOG_BANK',
  BRIDGE = 'BRIDGE',
  WATER_SURFACE = 'WATER_SURFACE',
  SHORELINE = 'SHORELINE',

  // Forest of Death Biome
  DENSE_FOLIAGE = 'DENSE_FOLIAGE',
  TREE_CANOPY = 'TREE_CANOPY',
  SWAMP = 'SWAMP',
  GIANT_ROOTS = 'GIANT_ROOTS',

  // Valley of the End Biome
  WATERFALL = 'WATERFALL',
  CLIFF_EDGE = 'CLIFF_EDGE',
  STONE_PILLARS = 'STONE_PILLARS',
  RAPIDS = 'RAPIDS',

  // War Arc Biome
  ROOT_NETWORK = 'ROOT_NETWORK',
  CORRUPTED_ZONE = 'CORRUPTED_ZONE',
  CHAKRA_NEXUS = 'CHAKRA_NEXUS',
  VOID_SPACE = 'VOID_SPACE'
}

export enum ApproachType {
  FRONTAL_ASSAULT = 'FRONTAL_ASSAULT',   // Direct combat, no modifiers
  STEALTH_AMBUSH = 'STEALTH_AMBUSH',     // Sneak attack, first hit 2.5x
  GENJUTSU_SETUP = 'GENJUTSU_SETUP',     // Mental trap, enemy confused
  ENVIRONMENTAL_TRAP = 'ENVIRONMENTAL',   // Use terrain, enemy loses HP
  SHADOW_BYPASS = 'SHADOW_BYPASS'        // Skip combat entirely (rare)
}

export type NodeVisibility = 'VISIBLE' | 'OBSCURED' | 'HIDDEN';

export type PathDifficulty = 'SAFE' | 'NORMAL' | 'RISKY' | 'DANGEROUS';

// ============================================================================
// TERRAIN DEFINITIONS
// ============================================================================

export interface TerrainEffects {
  // Exploration effects
  stealthModifier: number;        // +/- to stealth approach chance
  visibilityRange: number;        // How many nodes ahead player can see (1-3)
  hiddenRoomBonus: number;        // % bonus to finding hidden rooms
  movementCost: number;           // Multiplier (1.0 = normal, 1.5 = slow)

  // Combat effects
  initiativeModifier: number;     // +/- to initiative
  evasionModifier: number;        // +/- to evasion (as decimal, e.g., 0.10 = +10%)
  elementAmplify?: ElementType;   // Element boosted by 25%
  elementAmplifyPercent?: number; // Custom amplify amount

  // Hazards (applied each turn in combat)
  hazard?: {
    type: 'DAMAGE' | 'CHAKRA_DRAIN' | 'POISON' | 'FALL';
    value: number;
    chance: number;              // 0-1 probability per turn
    affectsPlayer: boolean;
    affectsEnemy: boolean;
  };
}

export interface TerrainDefinition {
  id: TerrainType;
  name: string;
  description: string;
  biome: string;
  effects: TerrainEffects;
}

// ============================================================================
// APPROACH DEFINITIONS
// ============================================================================

export interface ApproachRequirements {
  minStat?: { stat: PrimaryStat; value: number };
  requiredSkill?: string;         // Skill ID required
  allowedTerrains?: TerrainType[]; // Only available on these terrains
}

export interface ApproachSuccessCalc {
  baseChance: number;             // Starting success rate
  scalingStat: PrimaryStat;       // Which stat increases success
  scalingFactor: number;          // % added per stat point
  terrainBonus: boolean;          // Whether terrain stealth modifier applies
  maxChance: number;              // Cap (usually 95)
}

export interface ApproachEffects {
  // Turn order
  initiativeBonus: number;
  guaranteedFirst: boolean;

  // First hit bonus
  firstHitMultiplier: number;     // 2.5 for stealth ambush

  // Buffs/Debuffs
  playerBuffs: EffectDefinition[];
  enemyDebuffs: EffectDefinition[];

  // Special
  skipCombat: boolean;            // For bypass
  enemyHpReduction: number;       // % HP removed pre-fight (0-1)

  // Costs
  chakraCost: number;
  hpCost: number;

  // XP modifier
  xpMultiplier: number;           // 1.0 = 100%, 1.15 = 115%
}

export interface ApproachOption {
  type: ApproachType;
  name: string;
  description: string;

  requirements: ApproachRequirements;
  successCalc: ApproachSuccessCalc;

  // Effects on success
  successEffects: ApproachEffects;

  // Effects on failure (reverts to frontal-like)
  failureEffects?: Partial<ApproachEffects>;
}

// ============================================================================
// FLOOR LAYOUT & NODES
// ============================================================================

export interface NodePosition {
  x: number;  // 0-100 normalized position
  y: number;  // 0-100 normalized position
}

export interface Connection {
  fromId: string;
  toId: string;
  difficulty: PathDifficulty;
}

export interface ExplorationNode {
  id: string;
  type: NodeType;
  terrain: TerrainType;
  visibility: NodeVisibility;
  position: NodePosition;
  connections: string[];          // IDs of connected nodes

  // Content (varies by type)
  enemy?: Enemy;
  event?: GameEventDefinition;

  // For MYSTERY nodes
  revealedType?: NodeType;        // True type once revealed
  intelligenceToReveal?: number;  // INT needed to scout remotely

  // For HIDDEN nodes
  detectionThreshold?: number;    // Stat threshold to detect

  // For SHRINE nodes
  blessings?: ShrineBlessing[];

  // For TRAINING nodes
  trainingOptions?: TrainingOption[];

  // For TRIAL nodes
  trial?: TrialDefinition;

  // For ANOMALY nodes
  anomalyRevealed?: boolean;
  trueNature?: 'BENEFICIAL' | 'NEUTRAL' | 'HARMFUL';

  // State
  isVisited: boolean;
  isCleared: boolean;             // Combat completed or effect resolved
  isRevealed: boolean;            // Whether node is visible on the map
}

export interface FloorLayout {
  floor: number;
  arc: string;
  biome: string;

  nodes: ExplorationNode[];
  connections: Connection[];

  entryNodeId: string;
  exitNodeId: string;

  // Metadata
  hiddenNodeCount: number;
  totalCombatNodes: number;
}

// ============================================================================
// NEW ROOM TYPE CONTENT
// ============================================================================

export interface ShrineBlessing {
  id: string;
  name: string;
  description: string;

  requirement?: { stat: PrimaryStat; value: number };

  effect: {
    permanentStatBonus?: Partial<PrimaryAttributes>;
    tempBuff?: Buff;
    healPercent?: number;
    chakraRestorePercent?: number;
  };

  cost?: {
    hp?: number;
    chakra?: number;
    ryo?: number;
  };
}

export interface TrainingOption {
  id: string;
  name: string;
  targetStat: PrimaryStat;

  // Training intensity
  intensity: 'LIGHT' | 'MODERATE' | 'INTENSE' | 'EXTREME';

  // Requirements
  willpowerRequired: number;

  // Costs
  hpCost: number;
  chakraCost: number;

  // Reward
  statGain: number;               // Permanent stat increase
}

export interface TrialDefinition {
  id: string;
  name: string;
  description: string;

  // Challenge type
  challengeType: 'ENDURANCE' | 'PRECISION' | 'WILLPOWER' | 'SPEED' | 'WISDOM';
  primaryStat: PrimaryStat;
  secondaryStat?: PrimaryStat;

  // Thresholds
  threshold: number;              // Pass/fail line

  // Rewards
  passReward: {
    exp?: number;
    statBonus?: Partial<PrimaryAttributes>;
    skill?: Skill;
    item?: Item;
  };

  failPenalty: {
    hpLoss?: number;
    debuff?: Buff;
  };
}

// ============================================================================
// EXPLORATION STATE
// ============================================================================

export interface ExplorationState {
  floorLayout: FloorLayout;
  currentNodeId: string;
  visitedNodes: string[];
  revealedNodes: string[];
  discoveredHiddenNodes: string[];

  // Current context
  currentTerrain: TerrainType;

  // Approach selection
  selectedApproach: ApproachType | null;
  approachResult: 'SUCCESS' | 'FAILURE' | null;

  // Discovery tracking
  secretsFound: number;
  loreDiscovered: string[];
}

// ============================================================================
// COMBAT SETUP (Terrain + Approach modifiers)
// ============================================================================

export interface CombatSetup {
  terrain: TerrainType;
  terrainEffects: TerrainEffects;

  approach: ApproachType;
  approachSuccess: boolean;

  // Calculated modifiers for combat
  playerModifiers: {
    initiativeBonus: number;
    firstHitMultiplier: number;
    evasionBonus: number;
    precompatBuffs: Buff[];
  };

  enemyModifiers: {
    hpReductionPercent: number;
    initialDebuffs: Buff[];
  };

  // Environment
  activeHazards: TerrainEffects['hazard'][];
  elementAmplification?: { element: ElementType; percent: number };

  // XP/Loot modifiers
  xpMultiplier: number;
  lootMultiplier: number;
  wasHiddenRoom: boolean;
}

// ============================================================================
// BRANCHING ROOM EXPLORATION SYSTEM
// ============================================================================

export enum BranchingRoomType {
  START = 'START',           // Entry room (always cleared)
  VILLAGE = 'VILLAGE',       // Settlement with merchant/NPCs
  OUTPOST = 'OUTPOST',       // Military post with combat + weapon merchant
  SHRINE = 'SHRINE',         // Sacred place with blessings
  CAMP = 'CAMP',             // Resting spot with training
  RUINS = 'RUINS',           // Ancient location with treasure/traps
  BRIDGE = 'BRIDGE',         // Chokepoint with toll/guardian
  BOSS_GATE = 'BOSS_GATE',   // Exit room with semi-boss
  FOREST = 'FOREST',         // Wild area with ambush chance
  CAVE = 'CAVE',             // Underground with hidden treasure
  BATTLEFIELD = 'BATTLEFIELD' // Combat-focused area
}

export enum CombatModifierType {
  NONE = 'NONE',
  AMBUSH = 'AMBUSH',             // Enemy goes first
  PREPARED = 'PREPARED',         // Player gets +20% damage first turn
  SANCTUARY = 'SANCTUARY',       // Player healed 20% before fight
  CORRUPTED = 'CORRUPTED',       // Both take poison damage per turn
  TERRAIN_SWAMP = 'TERRAIN_SWAMP',     // -10 Speed for all
  TERRAIN_FOREST = 'TERRAIN_FOREST',   // +15% evasion
  TERRAIN_CLIFF = 'TERRAIN_CLIFF'      // Miss = 10% fall damage
}

export type RoomTier = 0 | 1 | 2;
export type RoomPosition = 'LEFT' | 'RIGHT' | 'CENTER' | 'LEFT_OUTER' | 'LEFT_INNER' | 'RIGHT_INNER' | 'RIGHT_OUTER';

// Activity interfaces for multi-activity rooms
export interface CombatActivity {
  enemy: Enemy;
  modifiers: CombatModifierType[];
  completed: boolean;
}

export interface MerchantActivity {
  items: Item[];
  discountPercent?: number;
  completed: boolean;
}

export interface EventActivity {
  definition: GameEventDefinition;
  completed: boolean;
}

export interface RestActivity {
  healPercent: number;
  chakraRestorePercent: number;
  completed: boolean;
}

export type TrainingIntensity = 'light' | 'medium' | 'intense';

export interface TrainingIntensityData {
  cost: { hp: number; chakra: number };
  gain: number;
}

export interface TrainingStatOption {
  stat: PrimaryStat;
  intensities: {
    light: TrainingIntensityData;
    medium: TrainingIntensityData;
    intense: TrainingIntensityData;
  };
}

export interface TrainingActivity {
  options: TrainingStatOption[];  // Multiple stats to choose from
  completed: boolean;
  selectedStat?: PrimaryStat;     // Track what was chosen
  selectedIntensity?: TrainingIntensity;
}

export interface TreasureActivity {
  items: Item[];
  ryo: number;
  collected: boolean;
}

export interface ScrollDiscoveryActivity {
  availableScrolls: Skill[];
  cost?: { ryo?: number; chakra?: number };
  completed: boolean;
}

export interface EliteChallengeActivity {
  enemy: Enemy;      // Elite-tier enemy guardian
  artifact: Item;    // The artifact reward
  completed: boolean;
}

export interface RoomActivities {
  combat?: CombatActivity;
  eliteChallenge?: EliteChallengeActivity;
  merchant?: MerchantActivity;
  event?: EventActivity;
  scrollDiscovery?: ScrollDiscoveryActivity;
  rest?: RestActivity;
  training?: TrainingActivity;
  treasure?: TreasureActivity;
}

// Order in which activities are processed
export const ACTIVITY_ORDER: (keyof RoomActivities)[] = [
  'combat',          // Always first if present
  'eliteChallenge',  // Elite challenge after regular combat
  'merchant',        // Shop opens after combat
  'event',           // Story/dialogue
  'scrollDiscovery', // Jutsu scroll discovery
  'rest',            // Healing
  'training',        // Stat boost
  'treasure'         // Loot last
];

export interface RoomRevealRequirement {
  skill?: string;          // Skill ID required to reveal
  item?: string;           // Item ID required
  stat?: { name: PrimaryStat; value: number }; // Stat threshold
}

export interface BranchingRoom {
  id: string;
  tier: RoomTier;
  position: RoomPosition;
  parentId: string | null;
  childIds: string[];

  // Display
  type: BranchingRoomType;
  name: string;
  description: string;
  terrain: TerrainType;
  backgroundImage?: string;
  icon?: string;

  // Activities (sequential)
  activities: RoomActivities;
  currentActivityIndex: number;

  // State
  isVisible: boolean;
  isAccessible: boolean;
  isCleared: boolean;
  isExit: boolean;
  isCurrent: boolean;

  // Dynamic generation tracking
  depth: number;                    // Absolute depth from floor start (0, 1, 2, 3...)
  hasGeneratedChildren: boolean;    // Track if children have been created

  // Hidden room requirements (for future)
  revealRequirement?: RoomRevealRequirement;
}

export interface BranchingFloor {
  id: string;
  floor: number;
  arc: string;
  biome: string;

  rooms: BranchingRoom[];
  currentRoomId: string;
  exitRoomId: string | null;  // null until exit room is generated

  // Metadata
  totalRooms: number;
  clearedRooms: number;

  // For dynamic exit generation
  roomsVisited: number;       // Track total rooms visited for exit probability
  difficulty: number;         // Store difficulty for generating new rooms
}

// Room type configuration for generation
export interface RoomTypeConfig {
  type: BranchingRoomType;
  name: string;
  icon: string;
  description: string;

  // What activities this room type can have
  hasCombat: boolean | 'optional' | 'required';
  hasMerchant: boolean;
  hasEvent: boolean;
  hasRest: boolean;
  hasTraining: boolean;
  hasTreasure: boolean;
  hasScrollDiscovery?: boolean; // Rooms where jutsu scrolls can be found

  // Appearance weights by tier
  tier0Weight: number;
  tier1Weight: number;
  tier2Weight: number;

  // Combat configuration
  combatModifiers?: CombatModifierType[];
  isExitEligible?: boolean;
}