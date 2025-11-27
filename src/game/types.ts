// ============================================================================
// SHINOBI WAY - THE INFINITE TOWER
// New Stat System: The Shinobi Triad (Body, Mind, Technique)
// ============================================================================

export enum GameState {
  MENU,
  CHAR_SELECT,
  EXPLORE,
  COMBAT,
  LOOT,
  EVENT,
  GAME_OVER,
  VICTORY
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
  COMMON = 'Common',
  RARE = 'Rare',
  EPIC = 'Epic',
  LEGENDARY = 'Legendary',
  FORBIDDEN = 'Forbidden'
}

export enum ItemSlot {
  WEAPON = 'Weapon',
  HEAD = 'Head',
  BODY = 'Body',
  ACCESSORY = 'Accessory'
}

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

export interface Skill {
  id: string;
  name: string;
  tier: SkillTier;
  description: string;
  
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
  
  // Upgrade tracking
  level?: number;
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
  type: ItemSlot;
  rarity: Rarity;
  stats: ItemStatBonus;
  value: number;
  description?: string;
  requirements?: SkillRequirements;
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
  
  // Loadout
  equipment: Record<ItemSlot, Item | null>;
  skills: Skill[];
  activeBuffs: Buff[];
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
}

export interface Room {
  type: 'COMBAT' | 'ELITE' | 'BOSS' | 'EVENT' | 'REST' | 'AMBUSH';
  description: string;
  enemy?: Enemy;
  eventDefinition?: GameEventDefinition;
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