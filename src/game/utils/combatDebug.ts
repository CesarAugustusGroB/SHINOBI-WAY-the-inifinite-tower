/**
 * Combat Debug Utility
 * Provides structured logging for tracking combat flow
 *
 * Enable/disable via FeatureFlags.DEBUG_COMBAT_LOG in src/config/featureFlags.ts
 */

import { FeatureFlags } from '../../config/featureFlags';

// Alias for backward compatibility - controlled by FeatureFlags
export const COMBAT_DEBUG = FeatureFlags.DEBUG_COMBAT_LOG;

// Color codes for console styling
const COLORS = {
  scene: 'color: #00ff00; font-weight: bold',      // Green - scene transitions
  turn: 'color: #00bfff; font-weight: bold',       // Blue - turn changes
  action: 'color: #ffa500; font-weight: bold',     // Orange - player actions
  damage: 'color: #ff4444; font-weight: bold',     // Red - damage dealt
  victory: 'color: #ffff00; font-weight: bold',    // Yellow - victory/rewards
  system: 'color: #ff00ff; font-weight: bold',     // Magenta - system events
  info: 'color: #888888',                          // Gray - general info
};

type DebugCategory = keyof typeof COLORS;

/**
 * Log a debug message with category styling
 */
export function combatLog(category: DebugCategory, message: string, data?: any): void {
  if (!COMBAT_DEBUG) return;

  const timestamp = new Date().toISOString().split('T')[1].slice(0, -1);
  const prefix = `[COMBAT ${timestamp}]`;

  if (data !== undefined) {
    console.log(`%c${prefix} [${category.toUpperCase()}] ${message}`, COLORS[category], data);
  } else {
    console.log(`%c${prefix} [${category.toUpperCase()}] ${message}`, COLORS[category]);
  }
}

/**
 * Log scene transition
 */
export function logSceneEnter(sceneName: string, context?: Record<string, any>): void {
  combatLog('scene', `=== ENTERING ${sceneName} ===`, context);
}

/**
 * Log scene exit
 */
export function logSceneExit(sceneName: string, reason?: string): void {
  combatLog('scene', `=== EXITING ${sceneName} ${reason ? `(${reason})` : ''} ===`);
}

/**
 * Log turn state change
 */
export function logTurnChange(from: string, to: string, reason?: string): void {
  combatLog('turn', `Turn: ${from} -> ${to}${reason ? ` | Reason: ${reason}` : ''}`);
}

/**
 * Log player action (skill use)
 */
export function logPlayerAction(skillName: string, result: {
  damageDealt?: number;
  enemyHpBefore?: number;
  enemyHpAfter?: number;
  wasCrit?: boolean;
  wasMiss?: boolean;
}): void {
  combatLog('action', `Player used: ${skillName}`, result);
}

/**
 * Log enemy action
 */
export function logEnemyAction(enemyName: string, skillName: string, result: {
  damageDealt?: number;
  playerHpBefore?: number;
  playerHpAfter?: number;
}): void {
  combatLog('action', `${enemyName} used: ${skillName}`, result);
}

/**
 * Log damage calculation
 */
export function logDamage(source: string, target: string, damage: number, details?: Record<string, any>): void {
  combatLog('damage', `${source} -> ${target}: ${damage} damage`, details);
}

/**
 * Log victory event
 */
export function logVictory(enemy: string, rewards: {
  xpGain: number;
  ryoGain: number;
  levelUp?: boolean;
}): void {
  combatLog('victory', `=== VICTORY vs ${enemy} ===`, rewards);
}

/**
 * Log combat start
 */
export function logCombatStart(player: {
  name: string;
  hp: number;
  maxHp: number;
  chakra: number;
}, enemy: {
  name: string;
  hp: number;
  tier: string;
}): void {
  combatLog('scene', '=== COMBAT STARTED ===', {
    player: `${player.name} (${player.hp}/${player.maxHp} HP, ${player.chakra} CP)`,
    enemy: `${enemy.name} [${enemy.tier}] (${enemy.hp} HP)`
  });
}

/**
 * Log reward modal display
 */
export function logRewardModal(action: 'show' | 'close', rewards?: {
  xpGain: number;
  ryoGain: number;
  levelUp?: boolean;
}): void {
  if (action === 'show') {
    combatLog('victory', '=== REWARD MODAL SHOWN ===', rewards);
  } else {
    combatLog('victory', '=== REWARD MODAL CLOSED ===');
  }
}

/**
 * Log combat flow checkpoint
 */
export function logFlowCheckpoint(checkpoint: string, data?: any): void {
  combatLog('system', `[CHECKPOINT] ${checkpoint}`, data);
}
