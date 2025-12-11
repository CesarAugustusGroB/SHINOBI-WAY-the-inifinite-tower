// ============================================================================
// ELITE CHALLENGE SYSTEM
// Handles the escape mechanic for elite challenge encounters
// ============================================================================

import { Player, CharacterStats, Enemy } from '../types';

export interface EscapeResult {
  success: boolean;
  roll: number;
  chance: number;
  message: string;
}

/**
 * Calculate the escape chance based on player's speed stat.
 *
 * Formula: min(80%, 30% + (Speed × 2))
 *
 * | Speed | Escape Chance |
 * |-------|---------------|
 * | 10    | 50%           |
 * | 15    | 60%           |
 * | 20    | 70%           |
 * | 25+   | 80% (capped)  |
 */
export function calculateEscapeChance(playerStats: CharacterStats): number {
  const BASE_CHANCE = 30;
  const SPEED_MULTIPLIER = 2;
  const MAX_CHANCE = 80;

  const speedBonus = playerStats.primary.speed * SPEED_MULTIPLIER;
  return Math.min(MAX_CHANCE, BASE_CHANCE + speedBonus);
}

/**
 * Attempt to escape from an elite challenge.
 *
 * @param player - The player entity
 * @param playerStats - Calculated player stats including speed
 * @param enemy - The guardian enemy (unused for now, but available for future enhancements)
 * @returns EscapeResult with success status, roll, chance, and message
 */
export function attemptEliteEscape(
  player: Player,
  playerStats: CharacterStats,
  enemy: Enemy
): EscapeResult {
  const totalChance = calculateEscapeChance(playerStats);
  const roll = Math.floor(Math.random() * 100) + 1;
  const success = roll <= totalChance;

  return {
    success,
    roll,
    chance: totalChance,
    message: success
      ? `You slip away unnoticed! (Rolled ${roll} vs ${totalChance}%)`
      : `The Guardian blocks your escape! (Rolled ${roll} vs ${totalChance}%)`
  };
}

/**
 * Get a display-friendly description of the escape chance.
 */
export function getEscapeChanceDescription(playerStats: CharacterStats): {
  chance: number;
  speedValue: number;
  speedBonus: number;
} {
  const speedValue = playerStats.primary.speed;
  const speedBonus = speedValue * 2;
  const chance = calculateEscapeChance(playerStats);

  return {
    chance,
    speedValue,
    speedBonus
  };
}
