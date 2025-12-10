/**
 * =============================================================================
 * COMBAT SYSTEM - Re-Export Barrel (Backward Compatibility)
 * =============================================================================
 *
 * This file re-exports from CombatCalculationSystem and CombatWorkflowSystem
 * to maintain backward compatibility with existing imports.
 *
 * For new code, prefer importing directly from:
 * - CombatCalculationSystem.ts - Pure calculation functions (mitigation, terrain, buffs)
 * - CombatWorkflowSystem.ts - Combat flow and state management (useSkill, processEnemyTurn)
 *
 * =============================================================================
 */

export * from './CombatCalculationSystem';
export * from './CombatWorkflowSystem';
