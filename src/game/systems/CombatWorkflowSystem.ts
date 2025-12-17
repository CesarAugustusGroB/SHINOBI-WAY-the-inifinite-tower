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
 * The combat system is split into four files for maintainability:
 *
 * - **combat-types.ts**:
 *   Shared type definitions (CombatState, CombatResult, etc.)
 *   Prevents circular imports between turn systems
 *
 * - **CombatWorkflowSystem.ts** (this file):
 *   Combat state initialization and re-exports from all combat modules
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

import { TerrainDefinition } from '../types';
import { CombatModifiers } from './ApproachSystem';

// Re-export types from combat-types.ts (single source of truth)
export type { CombatState, CombatResult, UpkeepResult, EnemyTurnResult } from './combat-types';
import type { CombatState } from './combat-types';

// Re-export from PlayerTurnSystem
export { useSkill, processUpkeep, applyApproachEffects } from './PlayerTurnSystem';

// Re-export from EnemyTurnSystem
export { processEnemyTurn } from './EnemyTurnSystem';

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
