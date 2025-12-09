/**
 * Battle Simulation CLI - Main Entry Point
 * Run with: npx ts-node src/simulation/index.ts
 */

import { ApproachType } from '../game/types';
import {
  SimulationConfig,
  SimulationOutput,
  SimulationRunResult,
  PlayerBuildConfig,
  DEFAULT_CONFIG,
  ProgressionConfig,
  DEFAULT_PROGRESSION_CONFIG
} from './types';
import { EnemyArchetype, getAllArchetypes } from './EnemyArchetypes';
import { generateAllBuilds, generateClanPresets, generateExtremeBuilds } from './BuildGenerator';
import { runBattles } from './BattleSimulator';
import { aggregateResults, generateSummary } from './StatisticsCollector';
import { printFullReport, printProgress, clearProgress, printHeader } from './ConsoleReporter';
import { exportToJson, exportSummaryToJson, exportToCsv } from './JsonExporter';
import { runFullProgressionSimulation, printProgressionSummary } from './ProgressionSimulator';

// ============================================================================
// SIMULATION RUNNER
// ============================================================================

/**
 * Run full simulation across all builds and archetypes
 */
export async function runFullSimulation(
  config: SimulationConfig = DEFAULT_CONFIG
): Promise<SimulationOutput> {
  const startTime = Date.now();

  // Generate builds to test
  const builds = generateAllBuilds(config.playerLevel);
  const archetypes = getAllArchetypes();

  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║         SHINOBI WAY - BATTLE SIMULATION                     ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  console.log(`Configuration:`);
  console.log(`  Battles per matchup: ${config.battlesPerConfig}`);
  console.log(`  Player Level: ${config.playerLevel}`);
  console.log(`  Floor: ${config.floorNumber}`);
  console.log(`  Difficulty: ${config.difficulty}`);
  console.log(`  Builds to test: ${builds.length}`);
  console.log(`  Enemy archetypes: ${archetypes.length}`);
  console.log(`  Total matchups: ${builds.length * archetypes.length}`);
  console.log(`  Total battles: ${builds.length * archetypes.length * config.battlesPerConfig}`);

  const results: SimulationRunResult[] = [];
  let completedMatchups = 0;
  const totalMatchups = builds.length * archetypes.length;

  // Run all matchups
  for (const build of builds) {
    for (const archetype of archetypes) {
      const matchupStart = Date.now();

      printProgress(completedMatchups, totalMatchups, 'Simulating');

      // Run battles for this matchup
      const battleResults = runBattles(build, archetype, config, null);

      // Aggregate results
      const aggregated = aggregateResults(battleResults, build.name, archetype);

      results.push({
        config,
        playerBuild: build,
        enemyArchetype: archetype,
        battles: battleResults,
        aggregated,
        duration: Date.now() - matchupStart
      });

      completedMatchups++;
    }
  }

  clearProgress();
  console.log(`\nSimulation complete! ${totalMatchups} matchups tested.`);

  // Generate summary
  const summary = generateSummary(
    results.map(r => r.aggregated),
    builds,
    archetypes
  );

  const totalDuration = Date.now() - startTime;

  const output: SimulationOutput = {
    metadata: {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      totalDuration,
      totalBattles: results.reduce((acc, r) => acc + r.battles.length, 0)
    },
    configurations: {
      simulationConfig: config,
      playerBuilds: builds,
      enemyArchetypes: archetypes
    },
    results,
    summary
  };

  return output;
}

/**
 * Run simulation for specific builds/archetypes
 */
export async function runCustomSimulation(
  builds: PlayerBuildConfig[],
  archetypes: EnemyArchetype[],
  config: SimulationConfig = DEFAULT_CONFIG
): Promise<SimulationOutput> {
  const startTime = Date.now();

  console.log('\nRunning custom simulation...');
  console.log(`  Builds: ${builds.map(b => b.name).join(', ')}`);
  console.log(`  Enemies: ${archetypes.join(', ')}`);

  const results: SimulationRunResult[] = [];

  for (const build of builds) {
    for (const archetype of archetypes) {
      const matchupStart = Date.now();

      const battleResults = runBattles(build, archetype, config, null);
      const aggregated = aggregateResults(battleResults, build.name, archetype);

      results.push({
        config,
        playerBuild: build,
        enemyArchetype: archetype,
        battles: battleResults,
        aggregated,
        duration: Date.now() - matchupStart
      });
    }
  }

  const summary = generateSummary(
    results.map(r => r.aggregated),
    builds,
    archetypes
  );

  return {
    metadata: {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      totalDuration: Date.now() - startTime,
      totalBattles: results.reduce((acc, r) => acc + r.battles.length, 0)
    },
    configurations: {
      simulationConfig: config,
      playerBuilds: builds,
      enemyArchetypes: archetypes
    },
    results,
    summary
  };
}

// ============================================================================
// CLI MAIN
// ============================================================================

async function main() {
  // Parse command line arguments
  const args = process.argv.slice(2);

  // Check for progression mode
  const isProgression = args.includes('--progression') || args.includes('-p');

  if (isProgression) {
    // Run progression simulation
    let progressionConfig: ProgressionConfig = { ...DEFAULT_PROGRESSION_CONFIG };

    // Parse progression-specific arguments
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];

      if (arg === '--runs' || arg === '-r') {
        progressionConfig.runsToSimulate = parseInt(args[++i]) || 100;
      } else if (arg === '--max-level') {
        progressionConfig.maxLevel = parseInt(args[++i]) || 50;
      } else if (arg === '--battles-per-level') {
        progressionConfig.battlesPerLevelUp = parseInt(args[++i]) || 2;
      } else if (arg === '--battles-per-skill') {
        progressionConfig.battlesPerSkillGain = parseInt(args[++i]) || 3;
      } else if (arg === '--quick' || arg === '-q') {
        progressionConfig.runsToSimulate = 10;
        progressionConfig.maxBattles = 100;
      } else if (arg === '--help' || arg === '-h') {
        printHelp();
        return;
      }
    }

    try {
      const summaries = await runFullProgressionSimulation(progressionConfig);
      printProgressionSummary(summaries);
      console.log('\nProgression simulation complete!');
    } catch (error) {
      console.error('Progression simulation failed:', error);
      process.exit(1);
    }
    return;
  }

  // Standard battle simulation
  let config: SimulationConfig = { ...DEFAULT_CONFIG };

  // Parse arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--battles' || arg === '-b') {
      config.battlesPerConfig = parseInt(args[++i]) || 1000;
    } else if (arg === '--level' || arg === '-l') {
      config.playerLevel = parseInt(args[++i]) || 10;
    } else if (arg === '--floor' || arg === '-f') {
      config.floorNumber = parseInt(args[++i]) || 10;
    } else if (arg === '--difficulty' || arg === '-d') {
      config.difficulty = parseInt(args[++i]) || 50;
    } else if (arg === '--quick' || arg === '-q') {
      config.battlesPerConfig = 100;
    } else if (arg === '--help' || arg === '-h') {
      printHelp();
      return;
    }
  }

  try {
    // Run simulation
    const output = await runFullSimulation(config);

    // Print results
    printFullReport(output);

    // Export results
    exportToJson(output);
    exportSummaryToJson(output);
    exportToCsv(output);

    console.log('\nSimulation complete!');

  } catch (error) {
    console.error('Simulation failed:', error);
    process.exit(1);
  }
}

function printHelp(): void {
  console.log(`
SHINOBI WAY - Battle Simulation

Usage: npx tsx src/simulation/index.ts [options]

=== BATTLE MODE (default) ===
Options:
  -b, --battles <n>     Number of battles per matchup (default: 1000)
  -l, --level <n>       Player level (default: 10)
  -f, --floor <n>       Floor number for enemy scaling (default: 10)
  -d, --difficulty <n>  Enemy difficulty 0-100 (default: 50)
  -q, --quick           Quick mode (100 battles per matchup)
  -h, --help            Show this help message

Examples:
  npx tsx src/simulation/index.ts
  npx tsx src/simulation/index.ts --battles 500 --level 15
  npx tsx src/simulation/index.ts --quick

=== PROGRESSION MODE ===
Simulates full game runs from level 1 with leveling and skill acquisition.

Options:
  -p, --progression         Enable progression mode
  -r, --runs <n>            Number of runs per clan (default: 100)
  --max-level <n>           Max level to simulate (default: 50)
  --battles-per-level <n>   Battles before level up (default: 2)
  --battles-per-skill <n>   Battles before skill gain (default: 3)
  -q, --quick               Quick mode (10 runs, 100 battles max)

Examples:
  npx tsx src/simulation/index.ts --progression
  npx tsx src/simulation/index.ts -p --runs 50 --max-level 30
  npx tsx src/simulation/index.ts -p -q

Output:
  Results are exported to simulation-output/ as:
  - simulation-results-<timestamp>.json (full data)
  - simulation-summary-<timestamp>.json (summary only)
  - simulation-results-<timestamp>.csv (spreadsheet format)
`);
}

// Run if executed directly
main().catch(console.error);

// Export for programmatic use
export type { SimulationConfig, SimulationOutput, PlayerBuildConfig } from './types';
export { EnemyArchetype } from './types';
export { generateAllBuilds, generateClanPresets, generateExtremeBuilds } from './BuildGenerator';
export { getAllArchetypes } from './EnemyArchetypes';
