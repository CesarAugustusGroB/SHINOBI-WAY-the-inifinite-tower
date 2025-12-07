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

// Game balance constants
export const BALANCE = {
  // Scaling factors
  FLOOR_SCALING: 0.08,
  DIFFICULTY_SCALING: 0.0025,

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
