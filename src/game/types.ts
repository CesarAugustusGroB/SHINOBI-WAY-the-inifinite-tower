// ============================================================================
// SHINOBI WAY - THE INFINITE TOWER
// New Stat System: The Shinobi Triad (Body, Mind, Technique)
// ============================================================================

import { LaunchProperties } from '../config/featureFlags';

export enum GameState {
  MENU,
  CHAR_SELECT,
  EXPLORE,          // Branching room exploration view
  ELITE_CHALLENGE,  // Elite challenge choice screen (fight vs escape)
  COMBAT,
  LOOT,
  MERCHANT,
  EVENT,
  TRAINING,         // Training scene for stat upgrades
  SCROLL_DISCOVERY, // Finding jutsu scrolls in exploration
  GAME_OVER,
  GUIDE,
  ASSET_COMPANION,  // AI asset generation companion tool
  // Region exploration system states
  REGION_MAP,       // Region overview showing all locations
  LOCATION_EXPLORE, // Inside a location (10-room diamond exploration)
  // Treasure system states
  TREASURE,              // Treasure choice screen (locked chests OR treasure hunter)
  TREASURE_HUNT_REWARD   // Map completion reward screen
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
  ARMOR_BREAK = 'ArmorBreak', // Ignores % defense, only flat applies
  TRUE = 'True'              // Bypasses ALL defense (rare/forbidden skills)
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
  BROKEN = 'Broken',      // Lowest tier - drops from treasure/enemies
  COMMON = 'Common',      // Upgraded from 2x Broken (same type)
  RARE = 'Rare',          // Synthesized from 2x Common (any types)
  EPIC = 'Epic',          // Upgraded from 2x Rare Artifact (same)
  LEGENDARY = 'Legendary',
  CURSED = 'Cursed'
}

// Treasure quality determines what tier of items drop from treasure rooms
export enum TreasureQuality {
  BROKEN = 'Broken',   // Default starting tier
  COMMON = 'Common',   // Upgraded quality
  RARE = 'Rare'        // Highest upgradeable quality
}

export enum SkillTier {
  // Jutsu Card Tier System (Part 1 Naruto)
  // Based on ninja rank and INT requirements
  BASIC = 'Basic',           // E-D rank, INT 0-6, Academy fundamentals
  ADVANCED = 'Advanced',     // C-B rank, INT 8-12, Chunin-level techniques
  HIDDEN = 'Hidden',         // B-A rank, INT 14-18, Jonin/Clan secrets
  FORBIDDEN = 'Forbidden',   // A-S rank, INT 16-20, Dangerous techniques
  KINJUTSU = 'Kinjutsu'      // S+ rank, INT 20-24, Ultimate forbidden
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

// Turn phase tracking for combat (Upkeep → Side → Main flow)
export interface TurnPhaseState {
  phase: 'UPKEEP' | 'SIDE' | 'MAIN' | 'END';
  sideActionsUsed: number;
  maxSideActions: number;   // Default: 2
  upkeepProcessed: boolean;
}

// Default turn phase state factory
export const createInitialTurnPhaseState = (): TurnPhaseState => ({
  phase: 'UPKEEP',
  sideActionsUsed: 0,
  maxSideActions: 2,
  upkeepProcessed: false,
});

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

// Drag-and-drop types for inventory management
export type DragSource =
  | { type: 'bag'; index: number }
  | { type: 'equipment'; slot: EquipmentSlot };

export interface DragData {
  item: Item;
  source: DragSource;
}

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

// Synthesis system constants - controlled by LaunchProperties
export const MAX_BAG_SLOTS = LaunchProperties.MAX_BAG_SIZE;
export const DISASSEMBLE_RETURN_RATE = 0.5; // 50% value return when breaking artifacts

// Merchant slot system constants
export const DEFAULT_MERCHANT_SLOTS = 1;
export const MAX_MERCHANT_SLOTS = 4;
export const DEFAULT_TREASURE_QUALITY = TreasureQuality.BROKEN;

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
  REGEN = 'Regen',             // Restores HP at start of turn
  CHAKRA_REGEN = 'ChakraRegen' // Restores Chakra at start of turn
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

  // ACTION TYPE - Determines when/how skill can be used
  actionType: ActionType;        // MAIN/TOGGLE/SIDE/PASSIVE (required)
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

  // Bag - 12 fixed slots for components and artifacts
  bag: (Item | null)[];  // Fixed 12-slot array (null = empty slot)

  // Progression systems
  treasureQuality: TreasureQuality;  // What tier items drop from treasure (upgradeable)
  merchantSlots: number;              // How many items shown at merchant (1-4)
  locationsCleared: number;           // Global count of locations cleared (enemy scaling)
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

// ============================================================================
// EVENT SYSTEM
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

    // Player progression upgrades
    upgradeTreasureQuality?: boolean; // Permanently upgrade treasure quality (BROKEN → COMMON → RARE)
    addMerchantSlot?: boolean; // Add a merchant slot
    intelGain?: number; // Intel gained from this outcome (0-40 range)

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

export interface EventChoice {
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

export interface GameEvent {
  id: string;
  title: string;
  description: string;
  allowedArcs?: string[]; // Story arcs where this event can occur
  rarity?: Rarity; // How common is this event
  choices: EventChoice[];
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
// TERRAIN & EXPLORATION
// ============================================================================

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
// ROOM TYPE CONTENT
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
// Position types for rooms in the branching structure
// Base: CENTER, LEFT, RIGHT for tier 0-1
// Children: CHILD_0/CHILD_1 for the 2-child branching pattern
export type RoomPosition =
  | 'LEFT' | 'RIGHT' | 'CENTER'
  | 'LEFT_OUTER' | 'LEFT_INNER' | 'RIGHT_INNER' | 'RIGHT_OUTER'
  | 'CHILD_0' | 'CHILD_1';

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
  definition: GameEvent;
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

// ============================================================================
// TREASURE SYSTEM TYPES
// ============================================================================

export enum TreasureType {
  LOCKED_CHEST = 'LockedChest',      // Pick blind or reveal with chakra
  TREASURE_HUNTER = 'TreasureHunter' // Combat/dice roll for map pieces
}

export interface TreasureChoice {
  item: Item;
  isArtifact: boolean;
}

export interface TreasureActivity {
  type: TreasureType;
  choices: TreasureChoice[];       // 2-3 item choices
  ryoBonus: number;                // Ryo gained alongside item
  revealCost: number;              // Chakra cost to reveal (locked chest)
  isRevealed: boolean;             // Has player revealed choices?
  selectedIndex: number | null;    // Track selection
  collected: boolean;
  // Treasure hunter specific
  isHuntRoom: boolean;             // Is this a treasure hunt room?
  mapPieceAvailable: boolean;      // Can player get a map piece here?
}

export interface TreasureHunt {
  isActive: boolean;
  requiredPieces: number;          // 2-4 based on danger level
  collectedPieces: number;
  mapId: string;                   // Unique per location
}

export interface DiceRollResult {
  type: 'trap' | 'nothing' | 'piece';
  damage?: number;           // Only for trap
  piecesCollected?: number;  // Only for piece
  piecesRequired?: number;   // Only for piece
}

export interface InfoGatheringActivity {
  intelGain: number;        // Intel percentage gained (default 25)
  flavorText: string;       // Description of how intel is gathered
  completed: boolean;
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
  infoGathering?: InfoGatheringActivity;
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
  'treasure',        // Loot last
  'infoGathering'    // Intel gathering (+25%)
];

// ============================================================================
// WEIGHTED ACTIVITY SYSTEM
// ============================================================================

/**
 * Weight (0-100) for each activity type.
 * 0 = never appears, 100 = very likely (but not guaranteed)
 * Higher weights increase probability but don't guarantee appearance.
 */
export interface ActivityWeights {
  combat: number;
  eliteChallenge: number;
  merchant: number;
  event: number;
  scrollDiscovery: number;
  rest: number;
  training: number;
  treasure: number;
  infoGathering: number;
}

/**
 * Weights for how many activities a room type tends to have.
 * Values are relative weights, not percentages.
 * Example: { one: 20, two: 60, three: 20 } = 20% for 1, 60% for 2, 20% for 3
 */
export interface ActivityCountWeights {
  one: number;
  two: number;
  three: number;
}

/**
 * Complete activity configuration for a room type.
 * Replaces the old boolean-based activity flags.
 */
export interface RoomTypeActivityConfig {
  activityCountWeights: ActivityCountWeights;
  activityWeights: ActivityWeights;
}

/**
 * Activities that cannot appear together in the same room.
 * If activity A is selected, activities in its exclusion list are removed from the pool.
 */
export const ACTIVITY_EXCLUSIONS: Partial<Record<keyof RoomActivities, (keyof RoomActivities)[]>> = {
  combat: ['eliteChallenge'],
  eliteChallenge: ['combat'],
};

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

  // Intel system (0-100%)
  currentIntel: number;
  intelGainedThisLocation: number;

  // Wealth system (1-7 scale)
  wealthLevel: 1 | 2 | 3 | 4 | 5 | 6 | 7;

  // Dynamic generation control
  roomGenerationMode: 'static' | 'dynamic';
  targetRoomCount: number;
  minRoomsBeforeExit: number;
  dangerLevel: 1 | 2 | 3 | 4 | 5 | 6 | 7;

  // Treasure hunt system
  treasureHunt: TreasureHunt | null;
  treasureProbabilityBoost: number;  // Extra chance for treasure rooms during hunt (0-1)
  huntDeclined: boolean;  // If true, all treasures become locked chests
}

// Room type configuration for generation
// Note: Activity generation is now handled by ROOM_TYPE_ACTIVITY_CONFIGS (weighted system)
export interface RoomTypeConfig {
  type: BranchingRoomType;
  name: string;
  icon: string;
  description: string;

  // Appearance weights by tier
  tier0Weight: number;
  tier1Weight: number;
  tier2Weight: number;

  // Combat configuration
  combatModifiers?: CombatModifierType[];
  isExitEligible?: boolean;
}

// ============================================================================
// REGION EXPLORATION SYSTEM
// ============================================================================
// Region > Location > Room hierarchy with intel-gated path navigation
// For post-Academy arcs (Floors 11+)

export enum LocationType {
  SETTLEMENT = 'settlement',     // Villages, camps - merchants, rest, social
  WILDERNESS = 'wilderness',     // Forests, beaches - exploration, medium danger
  STRONGHOLD = 'stronghold',     // Outposts, hideouts - combat heavy
  LANDMARK = 'landmark',         // Bridges, monuments - story events, balanced
  SECRET = 'secret',             // Hidden areas - special rewards, high danger
  BOSS = 'boss'                  // Final boss location - cannot skip
}

export enum PathType {
  FORWARD = 'forward',           // Standard progression path (always visible)
  BRANCH = 'branch',             // Alternative route at same danger level
  LOOP = 'loop',                 // Returns to earlier location (one-time use)
  SECRET = 'secret'              // Hidden path (requires intel to reveal)
}

// Terrain type for locations (affects combat modifiers)
export enum LocationTerrainType {
  NEUTRAL = 'neutral',
  WATER_ADJACENT = 'water_adjacent',
  FOREST = 'forest',
  MIST = 'mist',
  UNDERGROUND = 'underground',
  HAZARDOUS = 'hazardous',
  FORTIFIED = 'fortified',
  CORRUPTED = 'corrupted',
  SACRED = 'sacred'
}

// ============================================================================
// PATH & NAVIGATION
// ============================================================================

export interface LocationPath {
  id: string;
  targetLocationId: string;
  pathType: PathType;
  isRevealed: boolean;           // Hidden until intel gathered
  isUsed: boolean;               // For loop paths (one-time use)
  description: string;
  dangerHint?: string;           // Vague hint about destination danger
}

export interface UnlockCondition {
  type: 'intel' | 'item' | 'karma' | 'story_flag' | 'always';
  requirement: string | number;
}

// ============================================================================
// LOCATION
// ============================================================================
// Each location contains 10 rooms in a diamond pattern (1→2→4→2→1)
// Player visits 5 rooms per location before reaching Room 10 (elite/boss fight)

export interface LocationFlags {
  isEntry: boolean;              // Starting location for region
  isBoss: boolean;               // Final boss location
  isSecret: boolean;             // Hidden location (requires unlock)
  hasMerchant: boolean;          // Merchant available in this location
  hasRest: boolean;              // Rest point available
  hasTraining: boolean;          // Training available
  hasInfoGathering?: boolean;    // Info gathering available (intel bonus)
}

export interface LocationTerrainEffect {
  type: string;                  // e.g., 'water_damage_bonus', 'fire_damage_penalty'
  value: number;                 // Modifier value (0.2 = +20%)
}

/**
 * Location icon with optional image asset and emoji fallback.
 * Supports both plain emoji strings (legacy) and asset objects.
 */
export interface LocationIconAsset {
  asset?: string;    // Path to image asset (e.g., '/assets/icons/locations/misty_beach.png')
  fallback: string;  // Emoji fallback (e.g., '🌫️')
}

export type LocationIcon = string | LocationIconAsset;

export interface Location {
  id: string;
  name: string;
  description: string;
  type: LocationType;
  icon: LocationIcon;

  // Difficulty (1-7 scale)
  dangerLevel: 1 | 2 | 3 | 4 | 5 | 6 | 7;

  // Location size (minimum rooms before exit can appear)
  minRooms: number;  // 5-20 based on LocationType

  // Environment
  terrain: LocationTerrainType;
  terrainEffects: LocationTerrainEffect[];
  biome: string;
  backgroundImage?: string;

  // Room structure (10 rooms, diamond pattern)
  rooms: BranchingRoom[];
  currentRoomId: string | null;
  roomsCleared: number;

  // Content pools
  enemyPool: string[];           // Enemy IDs that can spawn here
  lootTable: string;             // Loot table ID for this location

  // Events
  atmosphereEvents: string[];    // Random ambient events
  tiedStoryEvents?: string[];    // Story events tied to this location

  // Navigation
  forwardPaths: string[];        // Path IDs for forward progression
  loopPaths?: string[];          // Path IDs for backtracking
  secretPaths?: string[];        // Path IDs for hidden routes

  // State
  flags: LocationFlags;
  isDiscovered: boolean;         // Has player found this location?
  isAccessible: boolean;         // Can player travel here now?
  isCompleted: boolean;          // Has player cleared this location?
  isCurrent: boolean;            // Is player currently here?

  // Unlock requirements (for secret locations)
  unlockCondition?: UnlockCondition;

  // Wealth system (auto-generated from LocationType)
  wealthLevel: 1 | 2 | 3 | 4 | 5 | 6 | 7;

  // Room generation config (optional, for LocationSystem integration)
  roomGenerationMode?: 'static' | 'dynamic';
  targetRoomCount?: number;
}

// ============================================================================
// REGION
// ============================================================================
// A region contains 10-15 locations connected by paths
// Player progresses forward-only until reaching the boss

export interface RegionLootTheme {
  primaryElement: ElementType;   // Main element theme (affects loot/enemies)
  equipmentFocus: string[];      // Stat focus for equipment drops
  goldMultiplier: number;        // Ryo drop modifier (poor regions = 0.8)
}

export interface Region {
  id: string;
  name: string;
  description: string;
  theme: string;                 // Narrative theme description

  // Navigation
  entryLocationIds: string[];    // Starting location options (1-2)
  bossLocationId: string;        // Final boss location
  currentLocationId: string | null;

  // All locations in this region
  locations: Location[];

  // All paths connecting locations
  paths: LocationPath[];

  // Progression tracking
  locationsCompleted: number;
  totalLocations: number;
  visitedLocationIds: string[];
  discoveredSecretIds: string[]; // Secret locations discovered

  // State
  isCompleted: boolean;

  // Theming
  arc: string;                   // Story arc (e.g., 'WAVES_ARC')
  biome: string;                 // Visual biome
  lootTheme: RegionLootTheme;

  // Scaling
  baseDifficulty: number;        // Starting difficulty for region
}

// ============================================================================
// REGION CONFIGURATION (for data files)
// ============================================================================

export interface LocationConfig {
  id: string;
  name: string;
  description: string;
  type: LocationType;
  icon: LocationIcon;
  dangerLevel: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  minRooms?: number;  // Optional - if not provided, auto-calculated from type
  terrain: LocationTerrainType;
  terrainEffects: LocationTerrainEffect[];
  biome: string;
  enemyPool: string[];
  lootTable: string;
  atmosphereEvents: string[];
  tiedStoryEvents?: string[];
  forwardPaths: PathConfig[];
  loopPaths?: PathConfig[];
  secretPaths?: PathConfig[];
  flags: LocationFlags;
  unlockCondition?: UnlockCondition;
}

export interface PathConfig {
  id: string;
  targetId: string;
  pathType: PathType;
  description: string;
  dangerHint?: string;
}

export interface RegionConfig {
  id: string;
  name: string;
  description: string;
  theme: string;
  entryLocationIds: string[];
  bossLocationId: string;
  locations: LocationConfig[];
  arc: string;
  biome: string;
  lootTheme: RegionLootTheme;
  baseDifficulty: number;
}

// ============================================================================
// CARD-BASED LOCATION SELECTION SYSTEM
// ============================================================================
// Replaces node-map with 3-card selection from a weighted deck

/**
 * Global intel pool - accumulates from exploration activities
 * Higher intel reveals more info on location cards
 */
export interface IntelPool {
  totalIntel: number;      // Accumulated from exploration
  maxIntel: number;        // Cap (default: 10)
}

/**
 * Intel reveal levels for location cards
 */
export enum IntelRevealLevel {
  NONE = 0,     // "???" placeholder, danger hidden
  PARTIAL = 1,  // Danger level + location type shown
  FULL = 2,     // One bonus feature (special loot/event)
}

/**
 * Location entry in the deck with drawing metadata
 */
export interface DeckLocation {
  locationId: string;
  dangerLevel: number;
  isCompleted: boolean;
  baseWeight: number;        // Higher for lower danger (10 - dangerLevel)
  completionPenalty: number; // 0.3 if completed, 1.0 otherwise
}

/**
 * Deck state for weighted location drawing
 */
export interface LocationDeck {
  regionId: string;
  locations: DeckLocation[];
}

/**
 * A single drawn card representing a location choice
 */
export interface LocationCard {
  locationId: string;
  location: Location;
  intelLevel: IntelRevealLevel;
  isRevisit: boolean;        // Has player completed this before?
}

/**
 * Activity state for location cards
 * false = not present, 'normal' = present, 'special' = enhanced version
 */
export type ActivityStatus = false | 'normal' | 'special';

export interface LocationActivities {
  combat: ActivityStatus;
  merchant: ActivityStatus;
  rest: ActivityStatus;
  training: ActivityStatus;
  event: ActivityStatus;
  scrollDiscovery: ActivityStatus;
  treasure: ActivityStatus;
  eliteChallenge: ActivityStatus;
  infoGathering: ActivityStatus;
}

/**
 * Display info for a card based on intel level
 */
export interface CardDisplayInfo {
  name: string;              // "???" if no intel
  subtitle: string;          // Location type or "Unknown Territory"
  dangerLevel: number | null;
  locationType: LocationType | null;
  specialFeature: string | null; // Only at FULL intel
  showMystery: boolean;
  revisitBadge: boolean;

  // NEW - Wealth and activities
  wealthLevel: number | null;
  activities: LocationActivities | null;
  isBoss: boolean;
  isSecret: boolean;

  // Location size info
  minRooms: number | null;  // Revealed at PARTIAL intel or higher
}

/**
 * Progress-based tier weights for drawing cards
 * Progress 0-25%:   Low (danger 1-2) = 80%, Mid (3-4) = 18%, High (5-7) = 2%
 * Progress 25-50%:  Low = 40%, Mid = 50%, High = 10%
 * Progress 50-75%:  Low = 15%, Mid = 45%, High = 40%
 * Progress 75-100%: Low = 5%, Mid = 25%, High = 70%
 */
export type DangerTier = 'low' | 'mid' | 'high';

export interface TierWeights {
  low: number;   // Danger 1-2
  mid: number;   // Danger 3-4
  high: number;  // Danger 5-7
}