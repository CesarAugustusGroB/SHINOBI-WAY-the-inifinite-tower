/**
 * =============================================================================
 * COMBAT WORKFLOW SYSTEM - Turn-Based Combat State Orchestration
 * =============================================================================
 *
 * This system handles the flow of turn-based combat, orchestrating state
 * changes across player and enemy turns. It uses pure calculation functions
 * from CombatCalculationSystem for the actual math.
 *
 * ## Architecture
 *
 * The combat system is split into three files for maintainability:
 *
 * - **CombatWorkflowSystem.ts** (this file):
 *   Type definitions, combat state initialization, and re-exports
 *
 * - **PlayerTurnSystem.ts**:
 *   Player turn processing (useSkill, processUpkeep, applyApproachEffects)
 *
 * - **EnemyTurnSystem.ts**:
 *   Enemy turn processing (processEnemyTurn and all phase helpers)
 *
 * ## Combat Turn Order
 *
 * ### Player Turn (useSkill):
 * 1. Resource validation (chakra, HP costs)
 * 2. Stun check (prevents action if stunned)
 * 3. Damage calculation (via StatSystem.calculateDamage)
 * 4. First hit multiplier from approach (if first turn)
 * 5. Terrain element amplification
 * 6. Damage mitigation on enemy (via CombatCalculationSystem.applyMitigation)
 * 7. Effect application with resistance checks
 * 8. Cooldown update
 *
 * ### Enemy Turn (processEnemyTurn):
 * 1. Process DoT effects on enemy (Bleed, Burn, Poison)
 * 2. Process Regen effects on enemy
 * 3. Process DoT effects on player (with shield mitigation)
 * 4. Process Regen effects on player
 * 5. Check for DoT deaths (enemy first, then player)
 * 6. Guts check for player if lethal
 * 7. Enemy action (stunned, confused, or attack)
 * 8. Damage mitigation on player
 * 9. Apply enemy skill effects to player
 * 10. Player cooldown reduction
 * 11. Player chakra regeneration
 * 12. Apply terrain hazards to both combatants
 * 13. Final death checks
 *
 * =============================================================================
 */

import { Buff, Skill, TerrainDefinition } from '../types';
import { CombatModifiers } from './ApproachSystem';

// Re-export from PlayerTurnSystem
export { useSkill, processUpkeep, applyApproachEffects } from './PlayerTurnSystem';

// Re-export from EnemyTurnSystem
export { processEnemyTurn } from './EnemyTurnSystem';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Combat state with approach modifiers and terrain effects.
 * Tracks approach bonuses and terrain effects for the current combat.
 */
export interface CombatState {
  isFirstTurn: boolean;
  firstHitMultiplier: number;
  playerGoesFirst: boolean;
  playerInitiativeBonus: number;
  xpMultiplier: number;
  terrain: TerrainDefinition | null;
  approachApplied: boolean;
  /** From FREE_FIRST_SKILL artifact passive - first skill costs no resources */
  skipFirstSkillCost: boolean;
  /** Tracks if artifact GUTS passive has been used this combat (one-time) */
  artifactGutsUsed: boolean;
}

/**
 * Result of a player skill use, containing all state changes.
 */
export interface CombatResult {
  /** Total damage dealt to the enemy (after mitigation) */
  damageDealt: number;
  /** Enemy's HP after this action */
  newEnemyHp: number;
  /** Player's HP after this action (may decrease from HP costs or reflection) */
  newPlayerHp: number;
  /** Player's chakra after paying skill cost */
  newPlayerChakra: number;
  /** Enemy's updated buff list */
  newEnemyBuffs: Buff[];
  /** Player's updated buff list (may include new self-buffs) */
  newPlayerBuffs: Buff[];
  /** Combat log message describing what happened */
  logMessage: string;
  /** Log type for UI styling */
  logType: 'info' | 'combat' | 'gain' | 'danger';
  /** Updated skill list with cooldowns applied */
  skillsUpdate?: Skill[];
  /** True if enemy HP reached 0 */
  enemyDefeated: boolean;
  /** True if player HP reached 0 (can happen from reflection damage) */
  playerDefeated?: boolean;
}

/**
 * Result of processing the upkeep phase.
 */
export interface UpkeepResult {
  player: import('../types').Player;
  logs: string[];
  togglesDeactivated: string[];
}

/**
 * Result of processing the enemy's turn.
 */
export interface EnemyTurnResult {
  /** Player's HP after enemy turn (may be reduced by attack, DoT, or hazard) */
  newPlayerHp: number;
  /** Player's updated buff list (duration decremented, expired removed) */
  newPlayerBuffs: Buff[];
  /** Enemy's HP after enemy turn (may be reduced by DoT, confusion, or hazard) */
  newEnemyHp: number;
  /** Enemy's updated buff list (duration decremented, expired removed) */
  newEnemyBuffs: Buff[];
  /** All combat log messages from this turn */
  logMessages: string[];
  /** True if player was defeated this turn */
  playerDefeated: boolean;
  /** True if enemy was defeated this turn (from DoT, confusion, or hazard) */
  enemyDefeated: boolean;
  /** Updated player skills with cooldowns reduced */
  playerSkills: Skill[];
  /** True if artifact GUTS passive was triggered this turn (caller should update combatState) */
  artifactGutsTriggered?: boolean;
}

// ============================================================================
// COMBAT STATE INITIALIZATION
// ============================================================================

/**
 * Create initial combat state with approach modifiers.
 * Called at the start of each combat encounter.
 *
 * @param modifiers - Combat modifiers from the selected approach
 * @param terrain - Terrain definition for this combat (optional)
 * @returns Initial combat state
 */
export function createCombatState(
  modifiers?: CombatModifiers,
  terrain?: TerrainDefinition
): CombatState {
  return {
    isFirstTurn: true,
    firstHitMultiplier: modifiers?.firstHitMultiplier || 1.0,
    playerGoesFirst: modifiers?.playerGoesFirst || false,
    playerInitiativeBonus: modifiers?.playerInitiativeBonus || 0,
    xpMultiplier: modifiers?.xpMultiplier || 1.0,
    terrain: terrain || null,
    approachApplied: false,
    skipFirstSkillCost: false,
    artifactGutsUsed: false,
  };
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Signal to pass the turn.
 * This is just a signal function - the actual turn passing is handled in the component.
 */
export const passTurn = (): void => {
  // This is just a signal, the actual turn passing is handled in the component
};
