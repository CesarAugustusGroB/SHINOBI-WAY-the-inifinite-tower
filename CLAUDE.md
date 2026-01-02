# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Coding Guidelines

- Do not create tests unless explicitly asked to do so
- When adding new systems, components, or features that replace existing functionality, remove the legacy code that is no longer being used. Do not leave dead code in the codebase.
- When working on PLAN.md, only edit PLAN.md for planning purposes. Do not modify any other files until the user explicitly says "implement".
- Keep logging functionality in a separate file, isolated from main classes/systems.
- When asked for UI mockups, use ASCII-art box style with emoji icons like this:

```text
┌───────────────────────────────────────┐
│ [1]  Misty Harbor          [REVISIT] │
│      Settlement                      │
├───────────────────────────────────────┤
│              🏘️                      │
├───────────────────────────────────────┤
│ ⚠️ DANGER   ████████░░░░  4/7        │
│ 💰 WEALTH   ██████░░░░░░  3/7        │
├───────────────────────────────────────┤
│ 📋  ⚔️ 🛒 💤 🎯 📜                    │
└───────────────────────────────────────┘
```

## Project Overview

**SHINOBI WAY: THE INFINITE TOWER** is a Naruto-themed roguelike dungeon crawler built with React + TypeScript + Vite. Players explore regions using a Region → Location → Room hierarchy, manage a 9-stat character system, engage in turn-based combat with elemental interactions, and collect procedurally-generated loot.

## Quick Start Commands

```bash
# Install dependencies (required first time)
npm install

# Start development server (hot reload)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type check (no emit)
npx tsc --noEmit

# Run tests
npm test              # Run all tests once
npm run test:watch    # Watch mode

# Run battle simulation (balance testing)
npm run simulate                      # Full simulation
npm run simulate:quick                # Fewer battles
npm run simulate:progression          # Test progression curve
npm run simulate:progression:quick    # Quick progression test
```

**Environment Setup:**

- Set `GEMINI_API_KEY` in `.env.local` to enable AI-generated enemy images
- Default dev port: 5173 (Vite rotates if in use)

## Architecture Overview

### Directory Structure

```text
src/
├── App.tsx                        # Main orchestrator (900+ LOC), game state management
├── index.tsx                      # React entry point
├── game/                          # Game logic layer (no React dependencies)
│   ├── types.ts                   # Central type definitions (GameState, Player, etc.)
│   ├── constants/                 # Game data
│   │   ├── index.ts               # CLAN_STATS, SKILLS, etc.
│   │   ├── approaches.ts          # Combat approach definitions
│   │   ├── roomTypes.ts           # Room type configurations
│   │   ├── terrain.ts             # Terrain definitions
│   │   └── events/                # Story arc events
│   │       ├── academyArcEvents.ts
│   │       ├── examsArcEvents.ts
│   │       ├── rogueArcEvents.ts
│   │       ├── warArcEvents.ts
│   │       └── wavesArcEvents.ts
│   ├── systems/                   # Pure function game engines
│   │   ├── StatSystem.ts          # Stat calculations, damage formulas
│   │   ├── CombatCalculationSystem.ts # Pure combat math (damage, mitigation)
│   │   ├── CombatWorkflowSystem.ts    # Combat state management (turns, phases)
│   │   ├── EnemyAISystem.ts       # Enemy skill selection AI
│   │   ├── LootSystem.ts          # Item/skill generation
│   │   ├── LocationSystem.ts      # Room generation, branching exploration (1→2→4 pattern)
│   │   ├── RegionSystem.ts        # Region→Location hierarchy, card-based selection
│   │   ├── EliteChallengeSystem.ts # Elite challenge escape mechanics
│   │   ├── EnemySystem.ts         # Enemy generation, story arcs
│   │   ├── ApproachSystem.ts      # Combat approach mechanics
│   │   ├── EquipmentPassiveSystem.ts # Equipment passive triggers
│   │   ├── EventSystem.ts         # Event processing
│   │   └── __tests__/             # Vitest unit tests
│   ├── entities/                  # Entity creation helpers
│   │   ├── Player.ts
│   │   └── Enemy.ts
│   └── state/
│       └── useGameStore.ts        # Custom React hook for clan bonuses
├── components/                    # Reusable React UI components (organized by domain)
│   ├── combat/                    # Combat UI (ApproachSelector, SkillCard, GameLog, FloatingText)
│   ├── exploration/               # Maps & navigation (RegionMap, LocationMap, RoomCard, LocationCard)
│   ├── inventory/                 # Items & equipment (Bag, EquipmentPanel)
│   ├── character/                 # Player display (PlayerHUD, PrimaryStatsPanel, DerivedStatsPanel)
│   ├── modals/                    # Popups (RewardModal, EventResultModal)
│   ├── layout/                    # Containers (LeftSidebarPanel, RightSidebarPanel, CinematicViewscreen)
│   ├── events/                    # Event UI (EventChoicePanel)
│   └── shared/                    # Reusable primitives (Tooltip, StatBar)
├── utils/
│   └── colorHelpers.ts            # Rarity color utilities (getRarityTextColor, etc.)
├── scenes/                        # Full-screen scene views
│   ├── MainMenu.tsx
│   ├── CharacterSelect.tsx
│   ├── Combat.tsx
│   ├── Event.tsx
│   ├── EliteChallenge.tsx         # Elite challenge fight vs escape screen
│   ├── Loot.tsx
│   ├── Merchant.tsx
│   ├── Training.tsx
│   ├── ScrollDiscovery.tsx
│   ├── GameOver.tsx
│   └── GameGuide.tsx
└── hooks/
    ├── useGameLoop.ts             # Enemy turn processing delay
    └── useGenAI.ts                # Google GenAI integration
```

### Core Game States

Located in `src/game/types.ts`:

```typescript
enum GameState {
  MENU,
  CHAR_SELECT,
  EXPLORE,            // Branching room exploration view (legacy)
  ELITE_CHALLENGE,    // Elite challenge choice screen (fight vs escape)
  COMBAT,
  LOOT,
  MERCHANT,
  EVENT,
  TRAINING,           // Training scene for stat upgrades
  SCROLL_DISCOVERY,   // Finding jutsu scrolls in exploration
  GAME_OVER,
  GUIDE,
  REGION_MAP,         // Region overview - card-based location selection
  LOCATION_EXPLORE    // Inside a location (10-room diamond exploration)
}
```

### Region-Based Exploration System

The game uses a **Region → Location → Room** hierarchy (`RegionSystem.ts`):

- **Region:** A themed area (e.g., Land of Waves) containing multiple locations
- **Location:** A specific area within a region with a danger level (1-7)
- **Room:** Individual rooms within a location using branching exploration

**Key Concepts:**
- `dangerLevel` (1-7) replaces floors for difficulty scaling
- `region.baseDifficulty` provides region-wide difficulty modifier
- `dangerToFloor(dangerLevel, baseDifficulty)` converts to effective scaling value

**Room Activities:** Each room can have multiple activities in order:

  ```typescript
  ACTIVITY_ORDER = ['combat', 'eliteChallenge', 'merchant', 'event', 'scrollDiscovery', 'rest', 'training', 'treasure']
  ```

**Key Functions in `RegionSystem.ts`:**
  - `generateRegion()` - Creates a region with locations
  - `enterLocation()` - Player enters a location
  - `getCurrentLocation()` - Gets current location
  - `dangerToFloor()` - Converts danger level to scaling value
  - `calculateLocationXP/Ryo()` - Reward calculations

### Key State Flow in App.tsx

1. **Region Map:** Player selects location → `handleEnterLocation(location)`
2. **Location Explorer:** Player navigates rooms using LocationMap
3. **Room Selection:** Player clicks room → `handleLocationRoomEnter(room)`
4. **Activity Processing:** Based on activity type, triggers combat/event/etc.
5. **Combat Flow:** `COMBAT` → victory → rewards → `returnToMap()`
6. **Location Complete:** When room 10 cleared, intel mission available

## Key Type Definitions

```typescript
// Primary stats (9 core attributes)
enum PrimaryStat {
  WILLPOWER, CHAKRA, STRENGTH,     // Body
  SPIRIT, INTELLIGENCE, CALMNESS,   // Mind
  SPEED, ACCURACY, DEXTERITY        // Technique
}

// Damage types
enum DamageType { PHYSICAL, ELEMENTAL, MENTAL, TRUE }

// Element cycle: Fire > Wind > Lightning > Earth > Water > Fire

// Rarity tiers
enum Rarity { COMMON, RARE, EPIC, LEGENDARY, CURSED }
```

### Synthesis System (TFT-Style Crafting)

- **Components:** Basic crafting materials that drop from enemies (Ninja Steel, Spirit Tag, Chakra Pill, etc.)
- **Artifacts:** Crafted items with passive effects, created by combining two components
- **Bag System:** `player.componentBag` holds up to 8 items (components or artifacts)
- **Key Functions in `LootSystem.ts`:**
  - `synthesize(compA, compB)` - Combine two components into an artifact
  - `disassemble(artifact)` - Break artifact back into components (50% value)
  - `addToBag(player, item)` - Store item in bag

## Core Game Mechanics

### Stat Calculation Pipeline

Stats are calculated in order (each step builds on the previous):

```text
Base Stats → Equipment Bonuses → Passive Skill Bonuses → Active Buffs → Derived Stats
```

**Derived Stats** (calculated in `StatSystem.ts`):

| Derived Stat | Formula |
|--------------|---------|
| Max HP | `willpower × 10 + strength × 2` |
| Max Chakra | `chakra × 8 + spirit × 2` |
| Physical ATK | `strength × 2 + dexterity × 0.5` |
| Elemental ATK | `spirit × 2 + intelligence × 0.5` |
| Mental ATK | `intelligence × 1.5 + calmness × 1` |
| Crit Rate | `dexterity × 0.5 + accuracy × 0.3` (capped 75%) |
| Crit Damage | `150% + (dexterity × 0.5)%` |

### Defense System

Defense has two components with soft-cap diminishing returns:

```typescript
flatDefense = willpower × 0.5 + strength × 0.3
percentDefense = calmness × 0.2 + willpower × 0.1 (capped 60%)

// Soft-cap formula for flat reduction:
effectiveFlat = flatDef × (100 / (100 + flatDef))
```

### Combat Damage Flow

**Turn Order:**

1. DoT Processing (Bleed, Burn, Poison tick)
2. Stun Check (skip turn if stunned)
3. Skill Selection & Execution
4. Post-action Effects (Guts survival check)

**Damage Mitigation Pipeline** (processed in order):

1. Invulnerability → blocks all damage
2. Curse Mark → doubles incoming damage
3. Reflection → returns % to attacker
4. Shield → absorbs damage first

### Combat System Architecture

The combat system uses a **dual-system architecture** separating concerns:

| System | Purpose | Characteristics |
|--------|---------|-----------------|
| `CombatCalculationSystem.ts` | Pure combat math | No side effects, deterministic, testable |
| `CombatWorkflowSystem.ts` | Combat state flow | Orchestrates turns, applies mutations |

**Why separated:**

- Calculation functions can be reused (tooltips, AI preview, damage calculations)
- Workflow handles state transitions and combat logging
- Pure functions are easier to unit test

**Data flow:**

```text
Skill Input → CombatCalculation (pure math) → CombatActionResult → CombatWorkflow (apply state)
```

### Enemy Scaling Formula

```typescript
// Danger level (1-7) converts to effective floor for scaling
effectiveFloor = 10 + (dangerLevel × 2) + floor(baseDifficulty / 20)

// Scaling formula
floorMult = 1 + (effectiveFloor × 0.08)  // +8% per effective level
diffMult = 0.50 + (difficulty / 200)      // 50%-100% based on difficulty
totalScaling = floorMult × diffMult
```

**Example:** Danger 4, baseDifficulty 40 → effectiveFloor 20 → `2.6 × 0.70 = 1.82×` base stats

### Enemy Archetypes

| Archetype | High Stats | Combat Style |
|-----------|------------|--------------|
| TANK | Willpower 22, Strength 18 | High HP, defense |
| ASSASSIN | Speed 22, Dexterity 18 | Fast, high crit |
| BALANCED | All stats 12-14 | No weaknesses |
| CASTER | Spirit 22, Chakra 18 | Elemental damage |
| GENJUTSU | Calmness 22, Intelligence 18 | Mental attacks |

### Location Room Structure

Each location contains 10 rooms in a diamond pattern:
- Rooms 1-9: Regular exploration with activities
- Room 10: Intel Mission (elite fight for path choice reward)

### Equipment Passive Triggers

| Trigger | When It Fires |
|---------|---------------|
| `combat_start` | Battle begins |
| `on_hit` | Player deals damage |
| `on_crit` | Player lands critical hit |
| `turn_start` | Player's turn begins |
| `on_kill` | Player defeats enemy |
| `below_half_hp` | Player HP drops below 50% |

### Story Arcs by Region

| Region | Danger | Arc Name | Biome |
|--------|--------|----------|-------|
| 1 | 1-7 | Land of Waves | Mist Covered Bridge |
| 2 | 1-7 | Chunin Exams | Forest of Death |
| 3 | 1-7 | Sasuke Retrieval | Valley of the End |
| 4 | 1-7 | Great Ninja War | Divine Tree Roots |

Each region has its own `baseDifficulty` that scales with progression.

## Common Development Tasks

### Adding a New Skill

1. Add to `SKILLS` in `src/game/constants/index.ts`
2. Use `Skill` interface from `types.ts`
3. Set `damageMult` to scale with appropriate stat

### Adding Events

1. Create event in appropriate arc file (`src/game/constants/events/`)
2. Use `GameEvent` interface
3. Include `allowedArcs` array if arc-specific

### Modifying Game Balance

- Stat formulas: `src/game/systems/StatSystem.ts`
- Clan stats: `src/game/constants/index.ts` (CLAN_STATS, CLAN_GROWTH)
- Enemy scaling: `src/game/systems/EnemySystem.ts`

### Adding a Custom Art Style

Custom art styles for the Asset Companion are stored in `src/config/artStyles/`.

1. Create a style file in `src/config/artStyles/`:

```typescript
// src/config/artStyles/dark-fantasy.ts
import type { StylePreset } from '../assetCompanionConfig';

export const darkFantasyStyle: StylePreset = {
  id: 'dark-fantasy',
  name: 'Dark Fantasy',
  description: 'Gritty medieval fantasy with muted colors',
  category: 'anime',  // 'anime' | 'pixel' | 'stylized' | 'icon' | 'portrait' | 'ui'
  promptTemplate: `Dark fantasy style with muted earth tones...`,
};
```

1. Add to `src/config/artStyles/index.ts`:

```typescript
import { darkFantasyStyle } from './dark-fantasy';

export const CUSTOM_STYLES: StylePreset[] = [
  darkFantasyStyle,
];
```

The style will automatically appear in the Asset Companion since `STYLE_PRESETS` merges built-in + custom styles.

## Important Patterns

### Do This

- Keep game logic in `/game/systems/` (testable, no React)
- Use TypeScript enums (e.g., `PrimaryStat.STRENGTH`) not string literals
- Create new objects with spread `{ ...old, updated: value }`
- Pass data down, callbacks up (React unidirectional flow)

### Don't Do This

- Don't add React dependencies to game systems
- Don't mutate objects directly
- Don't use `any` type
- Don't hardcode balance values in components

## Debugging Tips

1. **State not updating:** Check for object mutation vs new object creation
2. **Position bugs:** Verify `currentRoomId` and `selectedBranchingRoom` sync in `App.tsx`
3. **Missing activities:** Check `ACTIVITY_ORDER` and `getCurrentActivity()` logic
4. **Type errors:** Ensure enums are used (e.g., `Clan.UCHIHA` not `'UCHIHA'`)

## Testing

**Automated tests** (Vitest) in `src/game/systems/__tests__/`:

```bash
npm test              # Run all tests
npm run test:watch    # Watch mode for development
```

Tests cover: StatSystem, CombatCalculation, LootSystem, LocationSystem, ApproachSystem, EventSystem, EquipmentPassiveSystem, EnemyAISystem, EnemySystem

**Manual testing checklist:**

1. Start game → select clan → verify stats
2. Enter combat room → win → verify remaining activities trigger
3. Check element effectiveness in combat
4. Verify loot scaling with danger level

## Available Skills

The project has specialized skills in `.claude/skills/` for common tasks:

| Skill | Use When |
|-------|----------|
| `jutsu-creator` | Adding new jutsu/abilities to the game |
| `combat-system-creator` | Modifying combat mechanics (CombatCalculationSystem + CombatWorkflowSystem) |
| `combat-ui-pattern-a` | Implementing Split-Panel Combat UI components |
| `exploration-creator` | Adding regions, locations, rooms, or intel missions |
| `art-style-creator` | Creating art style definitions for Asset Companion |
| `frontend-design` | Building distinctive, production-grade frontend interfaces |
| `nano-banana-builder` | Building web apps with Google Gemini image generation APIs |
| `threejs-builder` | Creating Three.js 3D web applications and scenes |
| `skill-creator` | Creating new Claude Code skills |

## Git Workflow

- **Main branch:** `main`
- **Development:** `develop`
- Commit style: `feat:`, `fix:`, `refactor:`, `docs:`
- **Before committing:** Update `CHANGELOG.md` with a summary of changes under the `[Unreleased]` section
