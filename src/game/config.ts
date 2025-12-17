/**
 * Game Configuration Constants
 * Centralized location for timing, balance, and limit values
 */

// Timing constants (in milliseconds)
export const TIMING = {
  ENEMY_TURN_DELAY: 800,
  FLOATING_TEXT_DURATION: 1500,
  COMBAT_ANIMATION_DELAY: 300,
  AUTO_PASS_DELAY: 2500, // Delay before auto-passing turn when auto-combat is enabled
} as const;

// Unified difficulty scaling configuration
export const DIFFICULTY = {
  // Global ease factor - multiplies enemy stats (0.85 = 15% easier)
  ENEMY_EASE_FACTOR: 0.85,

  // Difficulty slider scaling
  DIFFICULTY_BASE: 0.50,         // Minimum multiplier at difficulty 0
  DIFFICULTY_DIVISOR: 200,       // difficulty / 200 added to base

  // Danger level scaling (enemy generation)
  DANGER_BASE: 0.65,             // Base multiplier at danger 0
  DANGER_PER_LEVEL: 0.15,        // +15% per danger level (D1=0.80, D4=1.25, D7=1.70)

  // Progression scaling (locations cleared globally)
  PROGRESSION_PER_LOCATION: 0.04, // +4% per location cleared

  // Loot scaling (uses effective floor from dangerToFloor)
  FLOOR_SCALING: 0.08,           // +8% per effective floor for loot
} as const;

// Game balance constants
export const BALANCE = {

  // Equipment
  PRIMARY_SLOT_MULTIPLIER: 1.5, // Primary slot gets 50% stat bonus

  // Combat - Hit & Evasion
  MAX_DEFENSE_PERCENT: 0.75,
  BASE_HIT_CHANCE: 0.85,
  BASE_CRIT_CHANCE: 0.05,
  CRIT_DAMAGE_MULT: 1.5,
  HIT_RATE_SCALING: 0.3,          // Hit rate per Speed/Accuracy point
  EVASION_SCALING: 0.5,           // Enemy evasion per Speed point
  FLAT_DEFENSE_MAX_REDUCTION: 0.6, // Flat defense can't reduce more than 60%

  // Combat - DoT mitigation
  DOT_FLAT_DEFENSE_MULT: 0.5,     // DoT gets 50% of flat defense
  DOT_FLAT_CAP: 0.4,              // DoT flat defense capped at 40% of damage
  DOT_PERCENT_DEFENSE_MULT: 0.5,  // DoT gets 50% of percent defense

  // HP Regen scaling
  HP_REGEN_WILLPOWER_DIVISOR: 20, // Divide willpower by this for HP regen

  // Experience
  BASE_EXP_GAIN: 25,
  EXP_PER_FLOOR: 5,
  LEVEL_UP_BASE: 100,

  // Economy
  BASE_RYO_PER_FLOOR: 15,
  RYO_VARIANCE: 25,
  SELL_PRICE_RATIO: 0.6,

  // Regeneration
  HP_REGEN_BASE: 0.02,
  CHAKRA_REGEN_BASE: 0.05,
} as const;

// Enemy generation constants
export const ENEMY_BALANCE = {
  // Elite bonuses
  ELITE_WILLPOWER_MULT: 1.4,      // Elite gets +40% willpower
  ELITE_STRENGTH_MULT: 1.3,       // Elite gets +30% strength
  ELITE_SPIRIT_MULT: 1.3,         // Elite gets +30% spirit
} as const;

// Loot and crafting balance
export const LOOT_BALANCE = {
  // Quality rolls
  COMMON_QUALITY_BASE: 0.4,       // Common items start at 40% quality
  COMMON_QUALITY_RANGE: 0.2,      // Common quality varies by ±20%
  RARE_QUALITY_BASE: 0.9,         // Rare items start at 90% quality
  RARE_QUALITY_RANGE: 0.3,        // Rare quality varies by ±30%

  // Item enhancement
  ENHANCED_STAT_MULT: 1.25,       // Enhanced items get +25% stats
  ENHANCED_VALUE_MULT: 1.5,       // Enhanced items get +50% value

  // Synthesis
  SYNTHESIS_VALUE_MULT: 1.5,      // Synthesized items worth 1.5x components

  // Artifact upgrade
  UPGRADE_STAT_RETENTION: 0.75,   // Keep 75% of combined stats when upgrading
} as const;

// System limits
export const LIMITS = {
  MAX_LOG_ENTRIES: 50,
  MAX_SKILLS: 4,
  MAX_BUFF_DURATION: 10,
} as const;

// Tier XP bonuses
export const TIER_XP_BONUS: Record<string, number> = {
  Guardian: 300,
  Jonin: 20,
  'Kage Level': 200,
  'S-Rank': 100,
} as const;

// Crafting costs for the new equipment system
export const CRAFTING_COSTS = {
  // Upgrade: 2× Broken (same type) → Common
  UPGRADE_BROKEN_BASE: 100,
  UPGRADE_BROKEN_PER_FLOOR: 15,

  // Synthesize: Common + Common (same or different) → Rare Artifact
  SYNTHESIZE_BASE: 200,
  SYNTHESIZE_PER_FLOOR: 30,

  // Upgrade: 2× Rare Artifact (same) → Epic Artifact
  UPGRADE_ARTIFACT_BASE: 400,
  UPGRADE_ARTIFACT_PER_FLOOR: 75,
} as const;

// Merchant system constants
export const MERCHANT = {
  // Cost to buy additional merchant slots (index = slot number - 1)
  SLOT_COSTS: [0, 150, 350, 600] as const,

  // Reroll inventory cost
  REROLL_BASE_COST: 30,
  REROLL_FLOOR_SCALING: 8,

  // Item price multiplier (1.8 = 80% more expensive)
  ITEM_PRICE_MULTIPLIER: 1.8,

  // Treasure quality upgrade costs
  QUALITY_UPGRADE_COSTS: {
    COMMON: 300,  // BROKEN → COMMON
    RARE: 700,    // COMMON → RARE
  },
} as const;
