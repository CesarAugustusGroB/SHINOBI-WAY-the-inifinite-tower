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

  // Combat
  MAX_DEFENSE_PERCENT: 0.75,
  BASE_HIT_CHANCE: 0.85,
  BASE_CRIT_CHANCE: 0.05,
  CRIT_DAMAGE_MULT: 1.5,

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
