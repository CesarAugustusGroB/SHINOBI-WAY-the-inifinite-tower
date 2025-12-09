/**
 * Progression Simulator - Simulates full game runs with level/skill progression
 *
 * Features:
 * - Starts at level 1 with basic skillset
 * - Levels up every N battles (configurable)
 * - Acquires new skills every M battles (based on INT requirement)
 * - Tracks win rate by level to identify difficulty breakpoints
 */

import { Clan, PrimaryAttributes, ElementType, SkillTier } from '../game/types';
import { CLAN_STATS, CLAN_GROWTH, SKILLS } from '../game/constants';
import { runBattles } from './BattleSimulator';
import { EnemyArchetype, getAllArchetypes } from './EnemyArchetypes';
import {
  ProgressionConfig,
  ProgressionState,
  ProgressionBattle,
  ProgressionRunResult,
  ProgressionSummary,
  DEFAULT_PROGRESSION_CONFIG,
  PlayerBuildConfig,
  SimulationConfig,
  DEFAULT_CONFIG
} from './types';

// ============================================================================
// STAT CALCULATION
// ============================================================================

/**
 * Calculate primary stats for a clan at a specific level
 */
function calculateStatsAtLevel(clan: Clan, level: number): PrimaryAttributes {
  const baseStats = CLAN_STATS[clan];
  const growth = CLAN_GROWTH[clan];

  return {
    willpower: baseStats.willpower + (growth.willpower || 0) * (level - 1),
    chakra: baseStats.chakra + (growth.chakra || 0) * (level - 1),
    strength: baseStats.strength + (growth.strength || 0) * (level - 1),
    spirit: baseStats.spirit + (growth.spirit || 0) * (level - 1),
    intelligence: baseStats.intelligence + (growth.intelligence || 0) * (level - 1),
    calmness: baseStats.calmness + (growth.calmness || 0) * (level - 1),
    speed: baseStats.speed + (growth.speed || 0) * (level - 1),
    accuracy: baseStats.accuracy + (growth.accuracy || 0) * (level - 1),
    dexterity: baseStats.dexterity + (growth.dexterity || 0) * (level - 1)
  };
}

// ============================================================================
// SKILL SELECTION
// ============================================================================

/**
 * Get all skills from SKILLS database as an array
 */
function getAllSkillsArray() {
  return Object.values(SKILLS);
}

/**
 * Build skill pool based on intelligence requirements
 */
function buildSkillPool(): string[] {
  return getAllSkillsArray()
    .filter(skill => {
      // Exclude basic attack (starting skill)
      if (skill.id === 'basic_atk') return false;
      // Include skills with INT requirement or no requirement
      return true;
    })
    .map(skill => skill.id);
}

/**
 * Get skills available based on current intelligence
 */
function getAvailableSkills(
  intelligence: number,
  currentSkillIds: string[],
  skillPool: string[]
): string[] {
  return skillPool.filter(skillId => {
    const skill = SKILLS[skillId.toUpperCase()] ||
      Object.values(SKILLS).find(s => s.id === skillId);
    if (!skill) return false;

    // Already known
    if (currentSkillIds.includes(skillId)) return false;

    // Check intelligence requirement
    if (skill.requirements?.intelligence &&
        intelligence < skill.requirements.intelligence) {
      return false;
    }

    // Don't include clan-locked skills for wrong clans (handled in caller)
    if (skill.requirements?.clan) return false;

    return true;
  });
}

/**
 * Tier priority for skill selection
 */
function getTierPriority(tier: SkillTier): number {
  switch (tier) {
    case SkillTier.FORBIDDEN: return 5;
    case SkillTier.LEGENDARY: return 4;
    case SkillTier.EPIC: return 3;
    case SkillTier.RARE: return 2;
    case SkillTier.COMMON: return 1;
    default: return 0;
  }
}

/**
 * Select best available skill (prioritize by tier)
 */
function selectBestSkill(availableSkillIds: string[]): string | null {
  if (availableSkillIds.length === 0) return null;

  const skills = availableSkillIds
    .map(id => {
      const skill = SKILLS[id.toUpperCase()] ||
        Object.values(SKILLS).find(s => s.id === id);
      return skill ? { id, skill } : null;
    })
    .filter((s): s is { id: string; skill: typeof SKILLS[keyof typeof SKILLS] } => s !== null)
    .sort((a, b) => getTierPriority(b.skill.tier) - getTierPriority(a.skill.tier));

  if (skills.length === 0) return null;

  // Pick from top tier with some randomness
  const topTier = skills[0].skill.tier;
  const topTierSkills = skills.filter(s => s.skill.tier === topTier);

  return topTierSkills[Math.floor(Math.random() * topTierSkills.length)].id;
}

// ============================================================================
// ENEMY SELECTION
// ============================================================================

const ALL_ARCHETYPES = getAllArchetypes();

/**
 * Select random enemy archetype (can add weighting based on level later)
 */
function selectEnemyArchetype(_playerLevel: number): EnemyArchetype {
  return ALL_ARCHETYPES[Math.floor(Math.random() * ALL_ARCHETYPES.length)];
}

// ============================================================================
// BUILD CREATION
// ============================================================================

/**
 * Create player build from current progression state
 */
function createBuildFromState(
  clan: Clan,
  state: ProgressionState
): PlayerBuildConfig {
  // Determine element based on clan
  const clanElements: Record<Clan, ElementType> = {
    [Clan.UCHIHA]: ElementType.FIRE,
    [Clan.UZUMAKI]: ElementType.WIND,
    [Clan.HYUGA]: ElementType.PHYSICAL,
    [Clan.LEE]: ElementType.PHYSICAL,
    [Clan.YAMANAKA]: ElementType.MENTAL
  };

  return {
    name: `${clan}_Lv${state.currentLevel}`,
    clan,
    level: state.currentLevel,
    customStats: calculateStatsAtLevel(clan, state.currentLevel),
    skillIds: state.currentSkillIds,
    element: clanElements[clan]
  };
}

// ============================================================================
// MAIN SIMULATION
// ============================================================================

/**
 * Run a single progression simulation for a clan
 */
export function runProgressionSimulation(
  clan: Clan,
  config: ProgressionConfig,
  runId: number
): ProgressionRunResult {
  // Build skill pool if not provided
  const skillPool = config.skillPool.length > 0
    ? config.skillPool
    : buildSkillPool();

  // Initialize state
  let state: ProgressionState = {
    currentLevel: config.startLevel,
    currentSkillIds: [...config.startingSkillIds],
    battleCount: 0,
    battlesUntilLevelUp: config.battlesPerLevelUp,
    battlesUntilSkillGain: config.battlesPerSkillGain,
    currentIntelligence: calculateStatsAtLevel(clan, config.startLevel).intelligence
  };

  const battles: ProgressionBattle[] = [];
  const winRateByLevel: Record<number, { wins: number; total: number }> = {};

  // Main battle loop
  while (state.battleCount < config.maxBattles && state.currentLevel <= config.maxLevel) {
    // Select random enemy
    const enemyArchetype = selectEnemyArchetype(state.currentLevel);

    // Create player build at current state
    const playerBuild = createBuildFromState(clan, state);

    // Create simulation config for this battle
    const battleConfig: SimulationConfig = {
      ...DEFAULT_CONFIG,
      battlesPerConfig: 1,  // Single battle
      playerLevel: state.currentLevel,
      floorNumber: state.currentLevel,  // Scale floor with level
      difficulty: Math.min(100, 30 + state.currentLevel)  // Scale difficulty
    };

    // Run single battle using existing simulator
    const battleResults = runBattles(playerBuild, enemyArchetype, battleConfig, null);
    const result = battleResults[0];

    state.battleCount++;
    state.battlesUntilLevelUp--;
    state.battlesUntilSkillGain--;

    let leveledUp = false;
    let skillGained: string | null = null;

    // Track win rate by level
    if (!winRateByLevel[state.currentLevel]) {
      winRateByLevel[state.currentLevel] = { wins: 0, total: 0 };
    }
    winRateByLevel[state.currentLevel].total++;
    if (result.won) {
      winRateByLevel[state.currentLevel].wins++;
    }

    // Process level up
    if (state.battlesUntilLevelUp <= 0) {
      state.currentLevel++;
      state.battlesUntilLevelUp = config.battlesPerLevelUp;
      state.currentIntelligence = calculateStatsAtLevel(clan, state.currentLevel).intelligence;
      leveledUp = true;
    }

    // Process skill gain
    if (state.battlesUntilSkillGain <= 0 && state.currentSkillIds.length < config.maxSkills) {
      const available = getAvailableSkills(
        state.currentIntelligence,
        state.currentSkillIds,
        skillPool
      );

      if (available.length > 0) {
        const newSkillId = selectBestSkill(available);
        if (newSkillId) {
          state.currentSkillIds.push(newSkillId);
          skillGained = newSkillId;
        }
      }
      state.battlesUntilSkillGain = config.battlesPerSkillGain;
    }

    battles.push({
      battleNumber: state.battleCount,
      levelAtBattle: state.currentLevel,
      skillsAtBattle: [...state.currentSkillIds],
      enemyArchetype,
      won: result.won,
      turns: result.turns,
      damageDealt: result.totalDamageDealt,
      damageReceived: result.totalDamageReceived,
      leveledUp,
      skillGained
    });
  }

  // Calculate results
  const wins = battles.filter(b => b.won).length;
  const skillsAcquired = state.currentSkillIds.filter(
    s => !config.startingSkillIds.includes(s)
  );

  return {
    runId,
    clan,
    finalLevel: state.currentLevel,
    totalBattles: state.battleCount,
    wins,
    losses: state.battleCount - wins,
    winRate: state.battleCount > 0 ? wins / state.battleCount : 0,
    winRateByLevel,
    skillsAcquired,
    battles
  };
}

// ============================================================================
// AGGREGATION
// ============================================================================

/**
 * Aggregate multiple progression runs into a summary
 */
export function aggregateProgressionRuns(
  runs: ProgressionRunResult[],
  clan: Clan
): ProgressionSummary {
  if (runs.length === 0) {
    return {
      clan,
      totalRuns: 0,
      averageFinalLevel: 0,
      survivalRate: 0,
      winRateByLevel: {},
      averageWinRate: 0,
      levelBreakpoints: [],
      skillAcquisitionStats: {}
    };
  }

  // Average final level
  const avgFinalLevel = runs.reduce((acc, r) => acc + r.finalLevel, 0) / runs.length;

  // Survival rate (% that reached max level)
  const maxLevelRuns = runs.filter(r => r.finalLevel >= 50).length;
  const survivalRate = maxLevelRuns / runs.length;

  // Average win rate
  const avgWinRate = runs.reduce((acc, r) => acc + r.winRate, 0) / runs.length;

  // Aggregate win rate by level
  const levelWins: Record<number, { wins: number; total: number }> = {};
  for (const run of runs) {
    for (const [levelStr, data] of Object.entries(run.winRateByLevel)) {
      const level = parseInt(levelStr);
      if (!levelWins[level]) {
        levelWins[level] = { wins: 0, total: 0 };
      }
      levelWins[level].wins += data.wins;
      levelWins[level].total += data.total;
    }
  }

  const winRateByLevel: Record<number, number> = {};
  for (const [level, data] of Object.entries(levelWins)) {
    winRateByLevel[parseInt(level)] = data.total > 0 ? data.wins / data.total : 0;
  }

  // Find level breakpoints (significant win rate drops)
  const levelBreakpoints: { level: number; winRateDrop: number }[] = [];
  const sortedLevels = Object.keys(winRateByLevel).map(Number).sort((a, b) => a - b);

  for (let i = 1; i < sortedLevels.length; i++) {
    const prevLevel = sortedLevels[i - 1];
    const currLevel = sortedLevels[i];
    const drop = winRateByLevel[prevLevel] - winRateByLevel[currLevel];

    if (drop > 0.10) {  // >10% drop is significant
      levelBreakpoints.push({ level: currLevel, winRateDrop: drop });
    }
  }

  // Skill acquisition statistics
  const skillCounts: Record<string, number> = {};
  for (const run of runs) {
    for (const skillId of run.skillsAcquired) {
      skillCounts[skillId] = (skillCounts[skillId] || 0) + 1;
    }
  }

  const skillAcquisitionStats: Record<string, number> = {};
  for (const [skillId, count] of Object.entries(skillCounts)) {
    skillAcquisitionStats[skillId] = count / runs.length;
  }

  return {
    clan,
    totalRuns: runs.length,
    averageFinalLevel: avgFinalLevel,
    survivalRate,
    winRateByLevel,
    averageWinRate: avgWinRate,
    levelBreakpoints: levelBreakpoints.sort((a, b) => b.winRateDrop - a.winRateDrop),
    skillAcquisitionStats
  };
}

// ============================================================================
// CONSOLE OUTPUT
// ============================================================================

/**
 * Print progression summary to console
 */
export function printProgressionSummary(summaries: ProgressionSummary[]): void {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║         PROGRESSION SIMULATION RESULTS                      ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  for (const summary of summaries) {
    console.log(`\n═══ ${summary.clan} ═══`);
    console.log(`  Runs: ${summary.totalRuns}`);
    console.log(`  Average Final Level: ${summary.averageFinalLevel.toFixed(1)}`);
    console.log(`  Survival Rate (Lv50): ${(summary.survivalRate * 100).toFixed(1)}%`);
    console.log(`  Average Win Rate: ${(summary.averageWinRate * 100).toFixed(1)}%`);

    // Win rate by level ranges
    console.log('\n  Win Rate by Level:');
    const levels = Object.keys(summary.winRateByLevel).map(Number).sort((a, b) => a - b);

    // Group by ranges of 10
    for (let start = 1; start <= 50; start += 10) {
      const end = Math.min(start + 9, 50);
      const rangeLevels = levels.filter(l => l >= start && l <= end);
      if (rangeLevels.length > 0) {
        const avgRate = rangeLevels.reduce((acc, l) => acc + summary.winRateByLevel[l], 0) / rangeLevels.length;
        console.log(`    Lv ${start.toString().padStart(2)}-${end.toString().padStart(2)}: ${(avgRate * 100).toFixed(1).padStart(5)}%`);
      }
    }

    // Breakpoints
    if (summary.levelBreakpoints.length > 0) {
      console.log('\n  Difficulty Breakpoints (>10% drop):');
      for (const bp of summary.levelBreakpoints.slice(0, 5)) {
        console.log(`    Level ${bp.level}: -${(bp.winRateDrop * 100).toFixed(1)}% win rate`);
      }
    }

    // Top skills acquired
    const sortedSkills = Object.entries(summary.skillAcquisitionStats)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    if (sortedSkills.length > 0) {
      console.log('\n  Top Skills Acquired:');
      for (const [skillId, rate] of sortedSkills) {
        const skill = SKILLS[skillId.toUpperCase()] ||
          Object.values(SKILLS).find(s => s.id === skillId);
        const name = skill?.name || skillId;
        console.log(`    ${name}: ${(rate * 100).toFixed(0)}% of runs`);
      }
    }
  }
}

// ============================================================================
// MAIN RUNNER
// ============================================================================

/**
 * Run full progression simulation for all clans
 */
export async function runFullProgressionSimulation(
  config: ProgressionConfig = DEFAULT_PROGRESSION_CONFIG
): Promise<ProgressionSummary[]> {
  const clans = [Clan.UZUMAKI, Clan.UCHIHA, Clan.HYUGA, Clan.LEE, Clan.YAMANAKA];
  const summaries: ProgressionSummary[] = [];

  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║         PROGRESSION SIMULATION                              ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  console.log('Configuration:');
  console.log(`  Start Level: ${config.startLevel}`);
  console.log(`  Max Level: ${config.maxLevel}`);
  console.log(`  Battles per Level Up: ${config.battlesPerLevelUp}`);
  console.log(`  Battles per Skill Gain: ${config.battlesPerSkillGain}`);
  console.log(`  Max Battles per Run: ${config.maxBattles}`);
  console.log(`  Runs per Clan: ${config.runsToSimulate}`);
  console.log(`  Total Runs: ${clans.length * config.runsToSimulate}`);

  for (const clan of clans) {
    console.log(`\nRunning ${clan}...`);
    const runs: ProgressionRunResult[] = [];

    for (let i = 0; i < config.runsToSimulate; i++) {
      if ((i + 1) % 10 === 0 || i === 0) {
        process.stdout.write(`\r  Run ${i + 1}/${config.runsToSimulate}`);
      }
      const result = runProgressionSimulation(clan, config, i);
      runs.push(result);
    }
    console.log(`\r  Completed ${config.runsToSimulate} runs`);

    const summary = aggregateProgressionRuns(runs, clan);
    summaries.push(summary);
  }

  return summaries;
}
