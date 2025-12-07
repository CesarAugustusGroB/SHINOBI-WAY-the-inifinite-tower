/**
 * Battle Simulation System - Type Definitions
 * Pure TypeScript types for running automated combat simulations
 */

import {
  PrimaryAttributes,
  Skill,
  ElementType,
  Clan,
  ApproachType,
  Buff
} from '../game/types';

// ============================================================================
// SIMULATION CONFIGURATION
// ============================================================================

export interface SimulationConfig {
  battlesPerConfig: number;      // Number of battles to run (default: 1000)
  maxTurnsPerBattle: number;     // Prevent infinite loops (default: 100)
  playerLevel: number;           // Player level for stat calculations
  floorNumber: number;           // Floor for enemy scaling
  difficulty: number;            // Enemy difficulty 0-100
  enableApproaches: boolean;     // Whether to test approach modifiers
  approaches: ApproachType[];    // Which approaches to test
}

export const DEFAULT_CONFIG: SimulationConfig = {
  battlesPerConfig: 1000,
  maxTurnsPerBattle: 100,
  playerLevel: 10,
  floorNumber: 10,
  difficulty: 50,
  enableApproaches: true,
  approaches: [
    ApproachType.FRONTAL_ASSAULT,
    ApproachType.STEALTH_AMBUSH,
    ApproachType.GENJUTSU_SETUP,
    ApproachType.ENVIRONMENTAL_TRAP
  ]
};

// ============================================================================
// ENEMY ARCHETYPES
// ============================================================================

export enum EnemyArchetype {
  TANK = 'TANK',
  ASSASSIN = 'ASSASSIN',
  CASTER = 'CASTER',
  GENJUTSU = 'GENJUTSU',
  BALANCED = 'BALANCED'
}

export interface ArchetypeConfig {
  name: string;
  baseStats: PrimaryAttributes;
  element: ElementType;
  skillIds: string[];
  description: string;
  startingBuffs?: Buff[];  // Optional starting buffs (e.g., TANK reflection)
}

// ============================================================================
// PLAYER BUILD CONFIGURATION
// ============================================================================

export interface PlayerBuildConfig {
  name: string;
  clan: Clan;
  level: number;
  customStats?: Partial<PrimaryAttributes>;  // Override clan base stats
  skillIds: string[];                         // Skill IDs to use
  element: ElementType;
}

// ============================================================================
// BATTLE RESULT (Per Battle)
// ============================================================================

export interface BattleResult {
  battleId: number;
  won: boolean;
  turns: number;

  // Damage metrics
  totalDamageDealt: number;
  totalDamageReceived: number;

  // Accuracy metrics
  totalAttacks: number;
  critCount: number;
  missCount: number;
  evasionCount: number;

  // Survival metrics
  gutsTriggersPlayer: number;
  playerFinalHp: number;
  enemyFinalHp: number;

  // Resource metrics
  totalChakraUsed: number;

  // Skill tracking
  skillsUsed: Record<string, number>;

  // Approach tracking
  approachUsed: ApproachType | null;
  approachSucceeded: boolean | null;
}

// ============================================================================
// AGGREGATED STATISTICS
// ============================================================================

export interface AggregatedStats {
  // Configuration
  playerBuildName: string;
  enemyArchetype: EnemyArchetype;

  // Win/Loss
  totalBattles: number;
  wins: number;
  losses: number;
  winRate: number;

  // Turn metrics
  averageTurnsToWin: number;
  averageTurnsToLose: number;
  averageTurns: number;
  minTurns: number;
  maxTurns: number;

  // Damage metrics
  averageDamageDealtPerBattle: number;
  averageDamageReceivedPerBattle: number;
  totalDamageDealt: number;
  totalDamageReceived: number;
  damageEfficiency: number;  // dealt / received ratio

  // Accuracy metrics
  totalAttacks: number;
  totalCrits: number;
  totalMisses: number;
  totalEvasions: number;
  critRate: number;
  missRate: number;
  evasionRate: number;

  // Survival metrics
  gutsTriggersTotal: number;
  gutsTriggersPerBattle: number;
  averageRemainingHpOnWin: number;

  // Resource metrics
  averageChakraUsedPerBattle: number;
  totalChakraUsed: number;
  chakraEfficiency: number;  // damage per chakra

  // Skill breakdown
  skillUsageCount: Record<string, number>;
  skillWinContribution: Record<string, number>;

  // Approach breakdown (if enabled)
  approachStats?: Record<ApproachType, ApproachStatistics>;
}

export interface ApproachStatistics {
  attempts: number;
  successes: number;
  successRate: number;
  winsWithApproach: number;
  winRateWithApproach: number;
}

// ============================================================================
// SIMULATION RUN RESULT
// ============================================================================

export interface SimulationRunResult {
  config: SimulationConfig;
  playerBuild: PlayerBuildConfig;
  enemyArchetype: EnemyArchetype;
  battles: BattleResult[];
  aggregated: AggregatedStats;
  duration: number;  // milliseconds
}

// ============================================================================
// FULL SIMULATION OUTPUT
// ============================================================================

export interface SimulationOutput {
  metadata: {
    version: string;
    timestamp: string;
    totalDuration: number;
    totalBattles: number;
  };
  configurations: {
    simulationConfig: SimulationConfig;
    playerBuilds: PlayerBuildConfig[];
    enemyArchetypes: EnemyArchetype[];
  };
  results: SimulationRunResult[];
  summary: SimulationSummary;
}

export interface SimulationSummary {
  bestBuildPerArchetype: Record<EnemyArchetype, {
    buildName: string;
    winRate: number;
  }>;
  overallBestBuild: {
    buildName: string;
    averageWinRate: number;
  };
  worstMatchups: Array<{
    build: string;
    enemy: EnemyArchetype;
    winRate: number;
  }>;
  bestMatchups: Array<{
    build: string;
    enemy: EnemyArchetype;
    winRate: number;
  }>;
}

// ============================================================================
// SIMULATION COMBATANT (Minimal combat-ready entity)
// ============================================================================

export interface SimCombatant {
  name: string;
  primaryStats: PrimaryAttributes;
  currentHp: number;
  maxHp: number;
  currentChakra: number;
  maxChakra: number;
  element: ElementType;
  skills: Skill[];
  activeBuffs: Buff[];
}

// ============================================================================
// TURN LOG (For debugging)
// ============================================================================

export interface TurnLog {
  turn: number;
  actor: 'player' | 'enemy';
  action: string;
  damage: number;
  isCrit: boolean;
  isMiss: boolean;
  isEvaded: boolean;
  playerHp: number;
  enemyHp: number;
}
