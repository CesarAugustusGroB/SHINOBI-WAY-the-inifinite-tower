/**
 * Statistics Collector - Aggregates battle results into meaningful statistics
 */

import { ApproachType } from '../game/types';
import {
  BattleResult,
  AggregatedStats,
  ApproachStatistics,
  SimulationSummary,
  PlayerBuildConfig
} from './types';
import { EnemyArchetype } from './EnemyArchetypes';

// ============================================================================
// AGGREGATION FUNCTIONS
// ============================================================================

/**
 * Aggregate multiple battle results into statistics
 */
export function aggregateResults(
  results: BattleResult[],
  playerBuildName: string,
  enemyArchetype: EnemyArchetype
): AggregatedStats {
  if (results.length === 0) {
    return createEmptyStats(playerBuildName, enemyArchetype);
  }

  const totalBattles = results.length;
  const wins = results.filter(r => r.won).length;
  const losses = totalBattles - wins;

  // Turn metrics
  const winningBattles = results.filter(r => r.won);
  const losingBattles = results.filter(r => !r.won);

  const turnsToWin = winningBattles.map(r => r.turns);
  const turnsToLose = losingBattles.map(r => r.turns);
  const allTurns = results.map(r => r.turns);

  // Damage metrics
  const totalDamageDealt = sum(results.map(r => r.totalDamageDealt));
  const totalDamageReceived = sum(results.map(r => r.totalDamageReceived));

  // Accuracy metrics
  const totalAttacks = sum(results.map(r => r.totalAttacks));
  const totalCrits = sum(results.map(r => r.critCount));
  const totalMisses = sum(results.map(r => r.missCount));
  const totalEvasions = sum(results.map(r => r.evasionCount));

  // Survival metrics
  const gutsTriggersTotal = sum(results.map(r => r.gutsTriggersPlayer));
  const winningHp = winningBattles.map(r => r.playerFinalHp);

  // Resource metrics
  const totalChakraUsed = sum(results.map(r => r.totalChakraUsed));

  // Skill usage
  const skillUsageCount: Record<string, number> = {};
  const skillWinContribution: Record<string, number> = {};

  for (const result of results) {
    for (const [skillId, count] of Object.entries(result.skillsUsed)) {
      skillUsageCount[skillId] = (skillUsageCount[skillId] || 0) + count;
      if (result.won) {
        skillWinContribution[skillId] = (skillWinContribution[skillId] || 0) + 1;
      }
    }
  }

  // Approach statistics
  const approachStats = calculateApproachStats(results);

  return {
    playerBuildName,
    enemyArchetype,

    // Win/Loss
    totalBattles,
    wins,
    losses,
    winRate: wins / totalBattles,

    // Turn metrics
    averageTurnsToWin: average(turnsToWin),
    averageTurnsToLose: average(turnsToLose),
    averageTurns: average(allTurns),
    minTurns: Math.min(...allTurns),
    maxTurns: Math.max(...allTurns),

    // Damage metrics
    totalDamageDealt,
    totalDamageReceived,
    averageDamageDealtPerBattle: totalDamageDealt / totalBattles,
    averageDamageReceivedPerBattle: totalDamageReceived / totalBattles,
    damageEfficiency: totalDamageReceived > 0 ? totalDamageDealt / totalDamageReceived : totalDamageDealt,

    // Accuracy metrics
    totalAttacks,
    totalCrits,
    totalMisses,
    totalEvasions,
    critRate: totalAttacks > 0 ? totalCrits / totalAttacks : 0,
    missRate: totalAttacks > 0 ? totalMisses / totalAttacks : 0,
    evasionRate: totalAttacks > 0 ? totalEvasions / totalAttacks : 0,

    // Survival metrics
    gutsTriggersTotal,
    gutsTriggersPerBattle: gutsTriggersTotal / totalBattles,
    averageRemainingHpOnWin: average(winningHp),

    // Resource metrics
    totalChakraUsed,
    averageChakraUsedPerBattle: totalChakraUsed / totalBattles,
    chakraEfficiency: totalChakraUsed > 0 ? totalDamageDealt / totalChakraUsed : totalDamageDealt,

    // Skill breakdown
    skillUsageCount,
    skillWinContribution,

    // Approach breakdown
    approachStats
  };
}

/**
 * Calculate approach-specific statistics
 */
function calculateApproachStats(
  results: BattleResult[]
): Record<ApproachType, ApproachStatistics> | undefined {
  const approachResults = results.filter(r => r.approachUsed !== null);

  if (approachResults.length === 0) {
    return undefined;
  }

  const stats: Record<ApproachType, ApproachStatistics> = {} as any;

  // Group by approach
  const byApproach = new Map<ApproachType, BattleResult[]>();

  for (const result of approachResults) {
    if (result.approachUsed) {
      if (!byApproach.has(result.approachUsed)) {
        byApproach.set(result.approachUsed, []);
      }
      byApproach.get(result.approachUsed)!.push(result);
    }
  }

  // Calculate stats per approach
  for (const [approach, battles] of byApproach) {
    const attempts = battles.length;
    const successes = battles.filter(r => r.approachSucceeded).length;
    const winsWithApproach = battles.filter(r => r.won).length;

    stats[approach] = {
      attempts,
      successes,
      successRate: attempts > 0 ? successes / attempts : 0,
      winsWithApproach,
      winRateWithApproach: attempts > 0 ? winsWithApproach / attempts : 0
    };
  }

  return stats;
}

/**
 * Create empty stats object
 */
function createEmptyStats(
  playerBuildName: string,
  enemyArchetype: EnemyArchetype
): AggregatedStats {
  return {
    playerBuildName,
    enemyArchetype,
    totalBattles: 0,
    wins: 0,
    losses: 0,
    winRate: 0,
    averageTurnsToWin: 0,
    averageTurnsToLose: 0,
    averageTurns: 0,
    minTurns: 0,
    maxTurns: 0,
    totalDamageDealt: 0,
    totalDamageReceived: 0,
    averageDamageDealtPerBattle: 0,
    averageDamageReceivedPerBattle: 0,
    damageEfficiency: 0,
    totalAttacks: 0,
    totalCrits: 0,
    totalMisses: 0,
    totalEvasions: 0,
    critRate: 0,
    missRate: 0,
    evasionRate: 0,
    gutsTriggersTotal: 0,
    gutsTriggersPerBattle: 0,
    averageRemainingHpOnWin: 0,
    totalChakraUsed: 0,
    averageChakraUsedPerBattle: 0,
    chakraEfficiency: 0,
    skillUsageCount: {},
    skillWinContribution: {}
  };
}

// ============================================================================
// SUMMARY GENERATION
// ============================================================================

/**
 * Generate simulation summary from all aggregated stats
 */
export function generateSummary(
  allStats: AggregatedStats[],
  builds: PlayerBuildConfig[],
  archetypes: EnemyArchetype[]
): SimulationSummary {
  // Best build per archetype
  const bestBuildPerArchetype: Record<EnemyArchetype, { buildName: string; winRate: number }> = {} as any;

  for (const archetype of archetypes) {
    const statsForArchetype = allStats.filter(s => s.enemyArchetype === archetype);
    if (statsForArchetype.length > 0) {
      const best = statsForArchetype.reduce((a, b) => a.winRate > b.winRate ? a : b);
      bestBuildPerArchetype[archetype] = {
        buildName: best.playerBuildName,
        winRate: best.winRate
      };
    }
  }

  // Overall best build (average win rate across all archetypes)
  const buildWinRates = new Map<string, number[]>();
  for (const stat of allStats) {
    if (!buildWinRates.has(stat.playerBuildName)) {
      buildWinRates.set(stat.playerBuildName, []);
    }
    buildWinRates.get(stat.playerBuildName)!.push(stat.winRate);
  }

  let overallBest = { buildName: '', averageWinRate: 0 };
  for (const [buildName, rates] of buildWinRates) {
    const avg = average(rates);
    if (avg > overallBest.averageWinRate) {
      overallBest = { buildName, averageWinRate: avg };
    }
  }

  // Best and worst matchups
  const sortedByWinRate = [...allStats].sort((a, b) => b.winRate - a.winRate);

  const bestMatchups = sortedByWinRate.slice(0, 5).map(s => ({
    build: s.playerBuildName,
    enemy: s.enemyArchetype,
    winRate: s.winRate
  }));

  const worstMatchups = sortedByWinRate.slice(-5).reverse().map(s => ({
    build: s.playerBuildName,
    enemy: s.enemyArchetype,
    winRate: s.winRate
  }));

  return {
    bestBuildPerArchetype,
    overallBestBuild: overallBest,
    bestMatchups,
    worstMatchups
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function sum(arr: number[]): number {
  return arr.reduce((a, b) => a + b, 0);
}

function average(arr: number[]): number {
  if (arr.length === 0) return 0;
  return sum(arr) / arr.length;
}

/**
 * Calculate standard deviation
 */
export function standardDeviation(arr: number[]): number {
  if (arr.length === 0) return 0;
  const avg = average(arr);
  const squareDiffs = arr.map(value => Math.pow(value - avg, 2));
  return Math.sqrt(average(squareDiffs));
}

/**
 * Create a histogram of values
 */
export function createHistogram(values: number[], buckets: number = 10): number[] {
  if (values.length === 0) return Array(buckets).fill(0);

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const bucketSize = range / buckets;

  const histogram = Array(buckets).fill(0);

  for (const value of values) {
    const bucket = Math.min(buckets - 1, Math.floor((value - min) / bucketSize));
    histogram[bucket]++;
  }

  return histogram;
}

/**
 * Calculate percentile
 */
export function percentile(arr: number[], p: number): number {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const index = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)];
}
