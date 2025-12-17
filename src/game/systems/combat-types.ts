/**
 * =============================================================================
 * COMBAT TYPES - Shared Type Definitions for Combat System
 * =============================================================================
 *
 * This file contains all shared type definitions used across the combat system.
 * Extracted to prevent circular imports between:
 * - CombatWorkflowSystem.ts (orchestration and re-exports)
 * - PlayerTurnSystem.ts (player turn processing)
 * - EnemyTurnSystem.ts (enemy turn processing)
 *
 * =============================================================================
 */

import { Buff, Player, Skill, TerrainDefinition } from '../types';

// ============================================================================
// COMBAT STATE
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

// ============================================================================
// RESULT TYPES
// ============================================================================

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
  player: Player;
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
