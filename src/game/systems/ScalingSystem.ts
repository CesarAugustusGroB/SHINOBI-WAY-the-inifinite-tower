/**
 * ScalingSystem - Centralized scaling and reward calculations
 *
 * This system provides a single source of truth for all difficulty scaling
 * and reward calculations. Previously these functions were duplicated
 * across RegionSystem and LocationSystem.
 *
 * Key concepts:
 * - dangerLevel (1-7): Primary difficulty indicator within a region
 * - baseDifficulty: Region-wide difficulty modifier
 * - effectiveFloor: Computed value used in all scaling formulas
 * - wealthLevel (1-7): Affects ryo rewards (0.5x to 1.5x multiplier)
 */

import { DIFFICULTY } from '../config';
import { randomInt } from '../utils/rng';
import { LaunchProperties } from '../../config/featureFlags';

// ============================================================================
// DANGER TO FLOOR CONVERSION
// ============================================================================

/**
 * Convert danger level to effective floor for scaling calculations.
 * This bridges the danger-based system with floor-based reward formulas.
 *
 * Formula: 10 + (dangerLevel * 2) + floor(baseDifficulty / 20)
 *
 * Examples:
 * - Danger 1, baseDifficulty 20 → Floor 13
 * - Danger 4, baseDifficulty 40 → Floor 20
 * - Danger 7, baseDifficulty 40 → Floor 26
 *
 * @param dangerLevel - Location danger (1-7)
 * @param baseDifficulty - Region base difficulty modifier
 * @returns Effective floor value for scaling calculations
 */
export function dangerToFloor(dangerLevel: number, baseDifficulty: number): number {
  return 10 + (dangerLevel * 2) + Math.floor(baseDifficulty / 20);
}

/**
 * Get danger scaling multiplier.
 * Uses DIFFICULTY config constants for centralized scaling.
 * Danger 1: 0.75x, Danger 4: 1.05x, Danger 7: 1.35x
 *
 * @param dangerLevel - Location danger (1-7)
 * @returns Scaling multiplier
 */
export function getDangerScaling(dangerLevel: number): number {
  return DIFFICULTY.DANGER_BASE + (dangerLevel * DIFFICULTY.DANGER_PER_LEVEL);
}

// ============================================================================
// WEALTH SYSTEM
// ============================================================================

/**
 * Get wealth multiplier for ryo rewards.
 * Level 1 = 0.5x, Level 4 = 1.01x, Level 7 = 1.52x
 * Formula: 0.5 + ((wealthLevel - 1) * 0.17)
 *
 * @param wealthLevel - Location wealth (1-7)
 * @returns Multiplier for ryo calculations
 */
export function getWealthMultiplier(wealthLevel: number): number {
  return 0.5 + ((wealthLevel - 1) * 0.17);
}

/**
 * Apply wealth multiplier to a base ryo amount.
 *
 * @param baseRyo - Base ryo before wealth modifier
 * @param wealthLevel - Location wealth (1-7)
 * @returns Adjusted ryo amount
 */
export function applyWealthToRyo(baseRyo: number, wealthLevel: number): number {
  return Math.floor(baseRyo * getWealthMultiplier(wealthLevel));
}

// ============================================================================
// REWARD CALCULATIONS
// ============================================================================

/**
 * Calculate XP gain based on danger level.
 * Formula: 25 + (effectiveFloor * 5)
 *
 * @param dangerLevel - Location danger (1-7)
 * @param baseDifficulty - Region base difficulty modifier
 * @returns XP amount
 */
export function calculateXP(dangerLevel: number, baseDifficulty: number): number {
  const effectiveFloor = dangerToFloor(dangerLevel, baseDifficulty);
  const baseXP = 25 + (effectiveFloor * 5);
  return Math.floor(baseXP * LaunchProperties.XP_MULTIPLIER);
}

/**
 * Calculate base Ryo gain (without wealth modifier).
 * Formula: (effectiveFloor * 10) + random(0-16)
 *
 * @param dangerLevel - Location danger (1-7)
 * @param baseDifficulty - Region base difficulty modifier
 * @returns Base ryo amount
 */
export function calculateBaseRyo(dangerLevel: number, baseDifficulty: number): number {
  const effectiveFloor = dangerToFloor(dangerLevel, baseDifficulty);
  const baseRyo = (effectiveFloor * 10) + randomInt(0, 16);
  return Math.floor(baseRyo * LaunchProperties.RYO_MULTIPLIER);
}

/**
 * Calculate Ryo gain with wealth modifier applied.
 * Formula: ((effectiveFloor * 10) + random(0-16)) * wealthMultiplier
 *
 * @param dangerLevel - Location danger (1-7)
 * @param baseDifficulty - Region base difficulty modifier
 * @param wealthLevel - Location wealth (1-7)
 * @returns Ryo amount with wealth applied
 */
export function calculateRyo(dangerLevel: number, baseDifficulty: number, wealthLevel: number): number {
  const baseRyo = calculateBaseRyo(dangerLevel, baseDifficulty);
  return applyWealthToRyo(baseRyo, wealthLevel);
}

// ============================================================================
// MERCHANT CALCULATIONS
// ============================================================================

/**
 * Calculate merchant reroll cost based on danger level.
 * Formula: baseRerollCost + (effectiveFloor * scalingPerLevel)
 *
 * @param dangerLevel - Location danger (1-7)
 * @param baseDifficulty - Region base difficulty modifier
 * @param baseRerollCost - Base cost for reroll
 * @param scalingPerLevel - Cost increase per effective floor
 * @returns Reroll cost in ryo
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

/**
 * Get merchant discount based on wealth level.
 * Higher wealth = bigger discounts (0% to 30%)
 * Formula: (wealthLevel - 1) * 0.05
 *
 * @param wealthLevel - Location wealth (1-7)
 * @returns Discount percentage (0.0 to 0.30)
 */
export function getMerchantDiscount(wealthLevel: number): number {
  return (wealthLevel - 1) * 0.05;
}
