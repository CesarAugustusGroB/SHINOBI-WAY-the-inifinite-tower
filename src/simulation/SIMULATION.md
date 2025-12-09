# Battle Simulation System

Automated combat simulation system for balance testing and analysis.

## Quick Start

```bash
# Standard battle simulation (1000 battles per matchup)
npm run simulate

# Quick test (100 battles per matchup)
npm run simulate:quick

# Progression simulation (level 1 to 50 runs)
npm run simulate:progression

# Quick progression test (10 runs, 100 battles max)
npm run simulate:progression:quick
```

## Battle Mode (Default)

Tests all player builds against all enemy archetypes at a fixed level.

### Usage

```bash
npx tsx src/simulation/index.ts [options]
```

### Options

| Flag | Description | Default |
|------|-------------|---------|
| `-b, --battles <n>` | Battles per matchup | 1000 |
| `-l, --level <n>` | Player level | 10 |
| `-f, --floor <n>` | Floor number (enemy scaling) | 10 |
| `-d, --difficulty <n>` | Enemy difficulty (0-100) | 50 |
| `-q, --quick` | Quick mode (100 battles) | - |
| `-h, --help` | Show help | - |

### Examples

```bash
# Full simulation at level 20
npx tsx src/simulation/index.ts --level 20

# Quick test with 500 battles
npx tsx src/simulation/index.ts --battles 500

# High difficulty test
npx tsx src/simulation/index.ts --difficulty 80 --floor 25
```

### Output

Results are exported to `simulation-output/`:
- `simulation-results-<timestamp>.json` - Full battle data
- `simulation-summary-<timestamp>.json` - Summary statistics
- `simulation-results-<timestamp>.csv` - Spreadsheet format

## Progression Mode

Simulates complete game runs from level 1, including leveling and skill acquisition.

### Usage

```bash
npx tsx src/simulation/index.ts --progression [options]
```

### Options

| Flag | Description | Default |
|------|-------------|---------|
| `-p, --progression` | Enable progression mode | - |
| `-r, --runs <n>` | Runs per clan | 100 |
| `--max-level <n>` | Maximum level to reach | 50 |
| `--battles-per-level <n>` | Battles before level up | 2 |
| `--battles-per-skill <n>` | Battles before skill gain | 3 |
| `-q, --quick` | Quick mode (10 runs, 100 battles) | - |

### Examples

```bash
# Full progression simulation
npm run simulate:progression

# Custom configuration
npx tsx src/simulation/index.ts -p --runs 50 --max-level 30

# Fast iteration test
npx tsx src/simulation/index.ts -p -q
```

### What It Tracks

- **Win rate by level** - Identifies difficulty spikes
- **Difficulty breakpoints** - Levels where win rate drops >10%
- **Skill acquisition** - Which skills are learned and when
- **Survival rate** - % of runs reaching max level

### Sample Output

```
=== PROGRESSION SIMULATION RESULTS ===

=== UCHIHA ===
  Runs: 100
  Average Final Level: 42.3
  Survival Rate (Lv50): 68.0%
  Average Win Rate: 72.7%

  Win Rate by Level:
    Lv  1-10:  47.0%
    Lv 11-20:  85.0%
    Lv 21-30:  79.0%
    Lv 31-40:  78.0%
    Lv 41-50:  74.5%

  Difficulty Breakpoints (>10% drop):
    Level 20: -30.0% win rate
    Level 12: -25.0% win rate

  Top Skills Acquired:
    Rasenshuriken: 70% of runs
    Kirin: 50% of runs
```

## Enemy Archetypes

The simulation tests against 5 enemy archetypes:

| Archetype | Description |
|-----------|-------------|
| TANK | High HP, damage reflection, low speed |
| ASSASSIN | High speed/crit, low HP |
| CASTER | High spirit, elemental damage |
| GENJUTSU | Mental damage, confusion effects |
| BALANCED | Average stats across the board |

## Player Builds

Generated builds include:

- **Clan Presets** - Default builds for each clan (Uzumaki, Uchiha, Hyuga, Lee, Yamanaka)
- **Extreme Builds** - Min/max stat distributions
- **Hybrid Builds** - Mixed offensive/defensive stats

## Understanding Results

### Win Rate Confidence Intervals

Results include 95% confidence intervals using Wilson score:

```
Win Rate: 65.2% ± 3.1% [62.1% - 68.3%]
```

At 1000 battles, expect ±3% margin of error at 50% win rate.

### Key Metrics

| Metric | Description |
|--------|-------------|
| Win Rate | % of battles won |
| Damage Efficiency | Damage dealt / damage received |
| Chakra Efficiency | Damage dealt / chakra used |
| Crit Rate | % of attacks that crit |
| Guts Triggers | Times survived lethal damage |

### Approach Statistics

When approaches are enabled, tracks:
- Success rate per approach type
- Win rate when approach succeeds vs fails

## Programmatic Usage

```typescript
import { runFullSimulation, runCustomSimulation } from './simulation';
import { generateClanPresets } from './simulation/BuildGenerator';
import { EnemyArchetype } from './simulation/types';

// Run full simulation
const results = await runFullSimulation({
  battlesPerConfig: 500,
  playerLevel: 15,
  difficulty: 60
});

// Run custom matchup
const builds = generateClanPresets(10);
const output = await runCustomSimulation(
  builds,
  [EnemyArchetype.TANK, EnemyArchetype.ASSASSIN],
  { battlesPerConfig: 1000 }
);
```

## File Structure

```
src/simulation/
├── index.ts              # CLI entry point
├── types.ts              # Type definitions
├── BattleSimulator.ts    # Core battle logic
├── BuildGenerator.ts     # Player build generation
├── EnemyArchetypes.ts    # Enemy configurations
├── SkillSelectionAI.ts   # AI skill selection
├── StatisticsCollector.ts # Result aggregation
├── ConsoleReporter.ts    # Console output
├── JsonExporter.ts       # File export
└── ProgressionSimulator.ts # Progression mode
```

## Tips for Balance Testing

1. **Compare clans** - Run progression mode to see which clans struggle at different levels
2. **Find breakpoints** - Look for levels where win rate drops sharply
3. **Test matchups** - Some builds counter specific archetypes
4. **Iterate quickly** - Use `--quick` during development
5. **Statistical significance** - Use 1000+ battles for reliable results
