# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Coding Guidelines

- Do not create tests unless explicitly asked to do so

## Project Overview

**SHINOBI WAY: THE INFINITE TOWER** is a Naruto-themed roguelike dungeon crawler built with React + TypeScript + Vite. Players climb a procedurally-generated tower with branching room exploration, manage a 9-stat character system, engage in turn-based combat with elemental interactions, and collect procedurally-generated loot.

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

# Run battle simulation (balance testing)
npm run simulate

# Quick simulation (fewer battles)
npm run simulate:quick
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
│   │   ├── CombatSystem.ts        # Turn-based combat, enemy AI
│   │   ├── LootSystem.ts          # Item/skill generation
│   │   ├── RoomSystem.ts          # Legacy room generation
│   │   ├── FloorSystem.ts         # Node-based floor generation
│   │   ├── BranchingFloorSystem.ts # NEW: 1→2→4 branching room system
│   │   ├── EnemySystem.ts         # Enemy generation, story arcs
│   │   ├── ApproachSystem.ts      # Combat approach mechanics
│   │   ├── DiscoverySystem.ts     # Node visibility/discovery
│   │   └── EventSystem.ts         # Event processing
│   ├── entities/                  # Entity creation helpers
│   │   ├── Player.ts
│   │   └── Enemy.ts
│   └── state/
│       └── useGameStore.ts        # Custom React hook for clan bonuses
├── components/                    # Reusable React UI components
│   ├── BranchingExplorationMap.tsx # Branching room map UI
│   ├── ExplorationMap.tsx         # Node-based map UI
│   ├── ApproachSelector.tsx       # Combat approach selection
│   ├── CharacterSheet.tsx         # Character stats panel
│   ├── PlayerHUD.tsx              # Player HP/Chakra display
│   ├── SkillCard.tsx              # Skill display with tooltips
│   ├── RoomCard.tsx               # Room selection cards
│   └── ...                        # Other UI components
├── scenes/                        # Full-screen scene views
│   ├── MainMenu.tsx
│   ├── CharacterSelect.tsx
│   ├── Combat.tsx
│   ├── Event.tsx
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
  EXPLORE_MAP,        // Legacy node map (kept for compatibility)
  BRANCHING_EXPLORE,  // Primary branching room exploration view
  COMBAT,
  LOOT,
  MERCHANT,
  EVENT,
  TRAINING,           // Training scene for stat upgrades
  SCROLL_DISCOVERY,   // Finding jutsu scrolls in exploration
  GAME_OVER,
  GUIDE
}
```

### Branching Floor System

The game uses a branching room exploration system (`BranchingFloorSystem.ts`):

- **Structure:** 1→2→4 branching (entrance → 2 paths → 4 final rooms → exit)
- **Room Activities:** Each room can have multiple activities in order:

  ```typescript
  ACTIVITY_ORDER = ['combat', 'eliteChallenge', 'merchant', 'event', 'scrollDiscovery', 'rest', 'training', 'treasure']
  ```

- **Key Functions:**
  - `generateBranchingFloor()` - Creates floor layout
  - `moveToRoom()` - Player navigation
  - `getCurrentActivity()` - Gets next incomplete activity
  - `completeActivity()` - Marks activity done
  - `isFloorComplete()` - Checks if exit accessible

### Key State Flow in App.tsx

1. **Room Selection:** Player clicks room → `handleBranchingRoomEnter(room)`
2. **Activity Processing:** Based on activity type, triggers combat/event/etc.
3. **Combat Flow:** `COMBAT` → victory → `LOOT` → `returnToMap()`
4. **After Combat:** `returnToMap()` checks for remaining activities and re-enters room if needed
5. **Floor Complete:** When all rooms cleared, exit becomes accessible

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

### Enemy Scaling Formula

```typescript
floorMult = 1 + (floor × 0.08)     // +8% per floor
diffMult = 0.75 + (difficulty / 100) // 75%-175% based on difficulty
totalScaling = floorMult × diffMult
```

**Example:** Floor 10, Difficulty 50 → `1.8 × 1.25 = 2.25×` base stats

### Enemy Archetypes

| Archetype | High Stats | Combat Style |
|-----------|------------|--------------|
| TANK | Willpower 22, Strength 18 | High HP, defense |
| ASSASSIN | Speed 22, Dexterity 18 | Fast, high crit |
| BALANCED | All stats 12-14 | No weaknesses |
| CASTER | Spirit 22, Chakra 18 | Elemental damage |
| GENJUTSU | Calmness 22, Intelligence 18 | Mental attacks |

### Exit Room Probability

```typescript
minRooms = min(3 + floor, 18)  // Required rooms before exit can spawn
baseChance = 20%               // After minRooms cleared
perRoomBonus = 10%             // Additional chance per extra room
```

### Equipment Passive Triggers

| Trigger | When It Fires |
|---------|---------------|
| `combat_start` | Battle begins |
| `on_hit` | Player deals damage |
| `on_crit` | Player lands critical hit |
| `turn_start` | Player's turn begins |
| `on_kill` | Player defeats enemy |
| `below_half_hp` | Player HP drops below 50% |

### Story Arcs by Floor

| Floor | Arc Name | Biome |
|-------|----------|-------|
| 1-10 | Academy Graduation | Village Hidden in Leaves |
| 11-25 | Land of Waves | Mist Covered Bridge |
| 26-50 | Chunin Exams | Forest of Death |
| 51-75 | Sasuke Retrieval | Valley of the End |
| 76+ | Great Ninja War | Divine Tree Roots |

## Common Development Tasks

### Adding a New Skill

1. Add to `SKILLS` in `src/game/constants/index.ts`
2. Use `Skill` interface from `types.ts`
3. Set `damageMult` to scale with appropriate stat

### Adding Events

1. Create event in appropriate arc file (`src/game/constants/events/`)
2. Use `GameEventDefinition` interface
3. Include `allowedArcs` array if arc-specific

### Modifying Game Balance

- Stat formulas: `src/game/systems/StatSystem.ts`
- Clan stats: `src/game/constants/index.ts` (CLAN_STATS, CLAN_GROWTH)
- Enemy scaling: `src/game/systems/EnemySystem.ts`

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

No automated tests. Manual testing:

1. Start game → select clan → verify stats
2. Enter combat room → win → verify remaining activities trigger
3. Check element effectiveness in combat
4. Verify loot scaling with floor depth

## Git Workflow

- **Main branch:** `main`
- **Development:** `develop`
- Commit style: `feat:`, `fix:`, `refactor:`, `docs:`
