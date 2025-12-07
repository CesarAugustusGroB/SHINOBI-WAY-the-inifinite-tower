/**
 * Console Reporter - ASCII output formatting for simulation results
 */

import { AggregatedStats, SimulationSummary, SimulationOutput } from './types';
import { EnemyArchetype, ARCHETYPE_CONFIGS } from './EnemyArchetypes';

// ============================================================================
// FORMATTING HELPERS
// ============================================================================

function formatPercent(value: number, decimals: number = 1): string {
  return (value * 100).toFixed(decimals) + '%';
}

function formatNumber(value: number, decimals: number = 1): string {
  return value.toFixed(decimals);
}

function padRight(str: string, length: number): string {
  return str.padEnd(length);
}

function padLeft(str: string, length: number): string {
  return str.padStart(length);
}

/**
 * Create an ASCII progress bar
 */
function createProgressBar(value: number, max: number = 1, width: number = 20): string {
  const percent = Math.min(1, Math.max(0, value / max));
  const filled = Math.round(percent * width);
  const empty = width - filled;
  return '[' + '█'.repeat(filled) + '░'.repeat(empty) + ']';
}

/**
 * Create a mini sparkline for distribution
 */
function createSparkline(values: number[]): string {
  if (values.length === 0) return '';

  const max = Math.max(...values);
  if (max === 0) return '▁'.repeat(values.length);

  const chars = '▁▂▃▄▅▆▇█';
  return values.map(v => {
    const index = Math.round((v / max) * (chars.length - 1));
    return chars[index];
  }).join('');
}

// ============================================================================
// REPORT SECTIONS
// ============================================================================

/**
 * Print header
 */
export function printHeader(title: string): void {
  const line = '='.repeat(60);
  console.log('\n' + line);
  console.log(title.toUpperCase());
  console.log(line);
}

/**
 * Print section header
 */
export function printSection(title: string): void {
  console.log('\n' + title.toUpperCase() + ':');
}

/**
 * Print single matchup result
 */
export function printMatchupResult(stats: AggregatedStats): void {
  const enemyConfig = ARCHETYPE_CONFIGS[stats.enemyArchetype];

  printHeader(`${stats.playerBuildName} vs ${enemyConfig?.name || stats.enemyArchetype}`);

  // Win Rate
  const winBar = createProgressBar(stats.winRate);
  console.log(`\nWIN RATE: ${winBar} ${formatPercent(stats.winRate)}`);
  console.log(`  Wins: ${stats.wins} | Losses: ${stats.losses} | Total: ${stats.totalBattles}`);

  // Turn Metrics
  printSection('Turn Metrics');
  console.log(`  Avg Turns to Win:  ${formatNumber(stats.averageTurnsToWin)}`);
  console.log(`  Avg Turns to Lose: ${formatNumber(stats.averageTurnsToLose)}`);
  console.log(`  Range: ${stats.minTurns} - ${stats.maxTurns}`);

  // Damage Metrics
  printSection('Damage');
  console.log(`  Dealt/Battle:    ${formatNumber(stats.averageDamageDealtPerBattle, 0)}`);
  console.log(`  Received/Battle: ${formatNumber(stats.averageDamageReceivedPerBattle, 0)}`);
  console.log(`  Efficiency:      ${formatNumber(stats.damageEfficiency, 2)}x`);

  // Accuracy Metrics
  printSection('Accuracy');
  console.log(`  Crit Rate:    ${formatPercent(stats.critRate)} (${stats.totalCrits} crits)`);
  console.log(`  Miss Rate:    ${formatPercent(stats.missRate)} (${stats.totalMisses} misses)`);
  console.log(`  Evasion Rate: ${formatPercent(stats.evasionRate)} (${stats.totalEvasions} evaded)`);

  // Survival Metrics
  printSection('Survival');
  console.log(`  Guts Triggers: ${stats.gutsTriggersTotal} (${formatNumber(stats.gutsTriggersPerBattle, 2)}/battle)`);
  console.log(`  Avg HP on Win: ${formatNumber(stats.averageRemainingHpOnWin, 0)}`);

  // Resource Metrics
  printSection('Chakra');
  console.log(`  Used/Battle: ${formatNumber(stats.averageChakraUsedPerBattle, 0)}`);
  console.log(`  Efficiency:  ${formatNumber(stats.chakraEfficiency, 2)} dmg/chakra`);

  // Skill Usage
  if (Object.keys(stats.skillUsageCount).length > 0) {
    printSection('Skill Usage');
    const sortedSkills = Object.entries(stats.skillUsageCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    for (const [skillId, count] of sortedSkills) {
      const winContrib = stats.skillWinContribution[skillId] || 0;
      console.log(`  ${padRight(skillId, 20)} ${padLeft(count.toString(), 5)} uses (${winContrib} wins)`);
    }
  }

  // Approach Stats
  if (stats.approachStats) {
    printSection('Approach Effectiveness');
    for (const [approach, data] of Object.entries(stats.approachStats)) {
      console.log(`  ${approach}:`);
      console.log(`    Success Rate: ${formatPercent(data.successRate)}`);
      console.log(`    Win Rate:     ${formatPercent(data.winRateWithApproach)}`);
    }
  }
}

/**
 * Print comparison table of all matchups
 */
export function printComparisonTable(allStats: AggregatedStats[]): void {
  printHeader('Matchup Comparison Table');

  // Group by build
  const byBuild = new Map<string, AggregatedStats[]>();
  for (const stat of allStats) {
    if (!byBuild.has(stat.playerBuildName)) {
      byBuild.set(stat.playerBuildName, []);
    }
    byBuild.get(stat.playerBuildName)!.push(stat);
  }

  // Get all archetypes
  const archetypes = [...new Set(allStats.map(s => s.enemyArchetype))];

  // Print header row
  const buildColWidth = 20;
  const statColWidth = 12;

  let header = padRight('BUILD', buildColWidth);
  for (const arch of archetypes) {
    header += padLeft(arch.slice(0, 10), statColWidth);
  }
  header += padLeft('AVERAGE', statColWidth);

  console.log('\n' + header);
  console.log('-'.repeat(header.length));

  // Print each build row
  for (const [buildName, stats] of byBuild) {
    let row = padRight(buildName.slice(0, 18), buildColWidth);

    let totalWinRate = 0;
    for (const arch of archetypes) {
      const stat = stats.find(s => s.enemyArchetype === arch);
      const winRate = stat?.winRate || 0;
      totalWinRate += winRate;
      row += padLeft(formatPercent(winRate), statColWidth);
    }

    const avgWinRate = totalWinRate / archetypes.length;
    row += padLeft(formatPercent(avgWinRate), statColWidth);

    console.log(row);
  }
}

/**
 * Print simulation summary
 */
export function printSummary(summary: SimulationSummary): void {
  printHeader('Simulation Summary');

  // Overall best build
  printSection('Overall Best Build');
  console.log(`  ${summary.overallBestBuild.buildName}`);
  console.log(`  Average Win Rate: ${formatPercent(summary.overallBestBuild.averageWinRate)}`);

  // Best build per archetype
  printSection('Best Build vs Each Enemy');
  for (const [archetype, data] of Object.entries(summary.bestBuildPerArchetype)) {
    console.log(`  vs ${padRight(archetype, 12)} ${padRight(data.buildName, 20)} ${formatPercent(data.winRate)}`);
  }

  // Best matchups
  printSection('Best Matchups');
  for (const matchup of summary.bestMatchups) {
    console.log(`  ${padRight(matchup.build, 20)} vs ${padRight(matchup.enemy, 12)} ${formatPercent(matchup.winRate)}`);
  }

  // Worst matchups
  printSection('Worst Matchups');
  for (const matchup of summary.worstMatchups) {
    console.log(`  ${padRight(matchup.build, 20)} vs ${padRight(matchup.enemy, 12)} ${formatPercent(matchup.winRate)}`);
  }
}

/**
 * Print full simulation report
 */
export function printFullReport(output: SimulationOutput): void {
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║         SHINOBI WAY - BATTLE SIMULATION REPORT             ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  // Metadata
  printSection('Simulation Info');
  console.log(`  Timestamp:      ${output.metadata.timestamp}`);
  console.log(`  Total Battles:  ${output.metadata.totalBattles.toLocaleString()}`);
  console.log(`  Duration:       ${(output.metadata.totalDuration / 1000).toFixed(2)}s`);
  console.log(`  Battles/Second: ${Math.round(output.metadata.totalBattles / (output.metadata.totalDuration / 1000)).toLocaleString()}`);

  // Configuration
  printSection('Configuration');
  console.log(`  Battles per config: ${output.configurations.simulationConfig.battlesPerConfig}`);
  console.log(`  Player Level:       ${output.configurations.simulationConfig.playerLevel}`);
  console.log(`  Floor Number:       ${output.configurations.simulationConfig.floorNumber}`);
  console.log(`  Difficulty:         ${output.configurations.simulationConfig.difficulty}`);
  console.log(`  Approaches:         ${output.configurations.simulationConfig.enableApproaches ? 'Enabled' : 'Disabled'}`);

  // Comparison table
  printComparisonTable(output.results.map(r => r.aggregated));

  // Summary
  printSummary(output.summary);

  // Detailed results for each matchup
  printHeader('Detailed Matchup Results');
  for (const result of output.results) {
    printMatchupResult(result.aggregated);
  }

  console.log('\n' + '='.repeat(60));
  console.log('END OF REPORT');
  console.log('='.repeat(60) + '\n');
}

/**
 * Print progress during simulation
 */
export function printProgress(current: number, total: number, label: string): void {
  const percent = Math.round((current / total) * 100);
  const bar = createProgressBar(current, total, 30);
  process.stdout.write(`\r${label}: ${bar} ${percent}% (${current}/${total})`);
}

/**
 * Clear progress line
 */
export function clearProgress(): void {
  process.stdout.write('\r' + ' '.repeat(80) + '\r');
}
