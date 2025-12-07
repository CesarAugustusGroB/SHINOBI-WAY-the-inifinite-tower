/**
 * JSON Exporter - Export simulation results to JSON file
 */

import * as fs from 'fs';
import * as path from 'path';
import { SimulationOutput } from './types';

// ============================================================================
// JSON EXPORT FUNCTIONS
// ============================================================================

/**
 * Export simulation output to JSON file
 */
export function exportToJson(
  output: SimulationOutput,
  filename?: string
): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const defaultFilename = `simulation-results-${timestamp}.json`;
  const finalFilename = filename || defaultFilename;

  // Ensure output directory exists
  const outputDir = path.join(process.cwd(), 'simulation-output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const filepath = path.join(outputDir, finalFilename);

  // Convert Map objects to plain objects for JSON serialization
  const serializable = prepareForJson(output);

  // Write to file
  fs.writeFileSync(filepath, JSON.stringify(serializable, null, 2));

  console.log(`\nResults exported to: ${filepath}`);
  return filepath;
}

/**
 * Prepare output for JSON serialization
 * Converts Map objects to plain objects
 */
function prepareForJson(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (obj instanceof Map) {
    const result: Record<string, any> = {};
    for (const [key, value] of obj) {
      result[key] = prepareForJson(value);
    }
    return result;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => prepareForJson(item));
  }

  if (typeof obj === 'object') {
    const result: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = prepareForJson(value);
    }
    return result;
  }

  return obj;
}

/**
 * Export simplified summary only
 */
export function exportSummaryToJson(
  output: SimulationOutput,
  filename?: string
): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const defaultFilename = `simulation-summary-${timestamp}.json`;
  const finalFilename = filename || defaultFilename;

  // Ensure output directory exists
  const outputDir = path.join(process.cwd(), 'simulation-output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const filepath = path.join(outputDir, finalFilename);

  // Create simplified output
  const summary = {
    metadata: output.metadata,
    configurations: {
      battlesPerConfig: output.configurations.simulationConfig.battlesPerConfig,
      playerLevel: output.configurations.simulationConfig.playerLevel,
      floorNumber: output.configurations.simulationConfig.floorNumber,
      difficulty: output.configurations.simulationConfig.difficulty
    },
    matchups: output.results.map(r => ({
      player: r.playerBuild.name,
      enemy: r.enemyArchetype,
      winRate: r.aggregated.winRate,
      avgTurns: r.aggregated.averageTurns,
      critRate: r.aggregated.critRate,
      damageEfficiency: r.aggregated.damageEfficiency
    })),
    summary: output.summary
  };

  fs.writeFileSync(filepath, JSON.stringify(summary, null, 2));

  console.log(`\nSummary exported to: ${filepath}`);
  return filepath;
}

/**
 * Export CSV for spreadsheet analysis
 */
export function exportToCsv(
  output: SimulationOutput,
  filename?: string
): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const defaultFilename = `simulation-results-${timestamp}.csv`;
  const finalFilename = filename || defaultFilename;

  // Ensure output directory exists
  const outputDir = path.join(process.cwd(), 'simulation-output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const filepath = path.join(outputDir, finalFilename);

  // CSV header
  const headers = [
    'Player Build',
    'Enemy Archetype',
    'Win Rate',
    'Total Battles',
    'Wins',
    'Losses',
    'Avg Turns to Win',
    'Avg Turns to Lose',
    'Avg Damage Dealt',
    'Avg Damage Received',
    'Damage Efficiency',
    'Crit Rate',
    'Miss Rate',
    'Evasion Rate',
    'Guts Triggers',
    'Avg Chakra Used',
    'Chakra Efficiency'
  ];

  // CSV rows
  const rows = output.results.map(r => {
    const s = r.aggregated;
    return [
      s.playerBuildName,
      s.enemyArchetype,
      s.winRate.toFixed(4),
      s.totalBattles,
      s.wins,
      s.losses,
      s.averageTurnsToWin.toFixed(2),
      s.averageTurnsToLose.toFixed(2),
      s.averageDamageDealtPerBattle.toFixed(2),
      s.averageDamageReceivedPerBattle.toFixed(2),
      s.damageEfficiency.toFixed(2),
      s.critRate.toFixed(4),
      s.missRate.toFixed(4),
      s.evasionRate.toFixed(4),
      s.gutsTriggersTotal,
      s.averageChakraUsedPerBattle.toFixed(2),
      s.chakraEfficiency.toFixed(2)
    ].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\n');
  fs.writeFileSync(filepath, csvContent);

  console.log(`\nCSV exported to: ${filepath}`);
  return filepath;
}

/**
 * Load simulation results from JSON file
 */
export function loadFromJson(filepath: string): SimulationOutput | null {
  try {
    const content = fs.readFileSync(filepath, 'utf-8');
    return JSON.parse(content) as SimulationOutput;
  } catch (error) {
    console.error(`Error loading JSON from ${filepath}:`, error);
    return null;
  }
}
