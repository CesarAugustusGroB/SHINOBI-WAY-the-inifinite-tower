# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**SHINOBI WAY: THE INFINITE TOWER** is a Naruto-themed roguelike dungeon crawler built with React + TypeScript. Players climb a procedurally-generated tower, manage a 9-stat character system, engage in turn-based combat with elemental interactions, and collect procedurally-generated loot.

**Key Stats:**
- ~3,500 LOC total
- 5 playable clans with distinct stat distributions
- 20+ procedurally-generated skills with status effects
- 5 story arcs (Academy → Chunin Exams → War Arc)
- 75+ floor roguelike progression

---

## Quick Start Commands

```bash
# Install dependencies (required first time)
npm install

# Start development server (hot reload on changes)
npm run dev

# Build for production
npm run build

# Preview production build locally
npm run preview
```

**Environment Setup:**
- Set `GEMINI_API_KEY` in `.env.local` to enable AI-generated enemy images
- Without this key, image generation features will fail gracefully

**Default Dev Port:** Vite rotates through ports starting at 5173 if port is in use. Check terminal output for actual URL.

---

## Architecture Overview

### Directory Structure

```
src/
├── game/                          # Game logic layer (no React dependencies)
│   ├── types.ts                   # Central type definitions (60+ interfaces, enums)
│   ├── constants/                 # Game data: CLAN_STATS, SKILLS, EVENTS, BOSS_NAMES
│   ├── systems/                   # Pure function game engines
│   │   ├── StatSystem.ts          # Stat calculations, damage formulas, buffs
│   │   ├── CombatSystem.ts        # Turn-based combat, enemy AI
│   │   ├── LootSystem.ts          # Item/skill generation, equipment
│   │   ├── RoomSystem.ts          # Procedural floor generation
│   │   └── EnemySystem.ts         # Enemy generation, story arc progression
│   └── state/                     # Game state management
│       └── useGameStore.ts        # Custom React hook for centralized state
├── components/                    # Reusable React UI components
│   ├── StatBar.tsx                # HP/Chakra progress bars
│   ├── SkillCard.tsx              # Skill display with tooltips
│   ├── CinematicViewscreen.tsx    # Enemy image overlay
│   ├── CharacterSheet.tsx         # Character stats panel
│   ├── GameLog.tsx                # Combat event log
│   └── Card.tsx, Tooltip.tsx
├── scenes/                        # Full-screen scene views
│   ├── MainMenu.tsx
│   ├── CharacterSelect.tsx        # Clan selection
│   ├── Exploration.tsx            # Floor room choices
│   ├── Combat.tsx                 # Turn-based battle UI
│   ├── Event.tsx                  # Choice-based encounters
│   ├── Loot.tsx                   # Reward screen
│   └── GameOver.tsx
├── hooks/                         # Custom React hooks
│   ├── useGameLoop.ts             # Enemy turn processing delay
│   └── useGenAI.ts                # Google GenAI integration
├── App.tsx                        # Main orchestrator (600+ LOC)
└── index.tsx                      # React entry point
```

### Core Game Systems

#### 1. **Stat System** (`src/game/systems/StatSystem.ts`)
- **Primary Attributes:** 9 core stats per character
  - `Willpower`, `Chakra`, `Strength`, `Spirit`, `Intelligence`, `Calmness`, `Speed`, `Accuracy`, `Dexterity`
- **Derived Stats:** Calculated from primary attributes
  - `maxHp`, `maxChakra`, `hpRegen`, `chakraRegen`, `physicalDefense`, `elementalDefense`, `mentalDefense`, `hitRate`, `critChance`, `evasion`, `initiative`
- **Key Functions:**
  - `calculateDerivedStats(primary, equipmentBonuses)` - Converts primary → derived
  - `calculateDamage(...)` - Complex damage calculation with elements, crits, defense
  - `checkGuts()` - Survival mechanic (Willpower-based chance to stay alive at 1 HP)

**Damage Formula:**
```
Base Damage = skill.damageMult × attacker's relevant stat
Hit Chance = 85% + (attacker_stat - defender_stat) × 1.5%
Crit Chance = 5% + (Dexterity × 0.4%)
Element Effectiveness = 1.5x (strong) / 0.5x (weak) / 1.0x (neutral)
Defense = Flat reduction FIRST, then percentage reduction (capped at 75%)
Final = (Base - FlatDefense) × (1 - PercentDefense)
```

#### 2. **Combat System** (`src/game/systems/CombatSystem.ts`)
- `useSkill(player, enemy, skill)` - Player attack logic
- `processEnemyTurn(player, enemy)` - AI enemy turn
- **Enemy AI:** Currently random skill selection (not intelligent, can be improved)
- **Turn Delay:** 800ms delay for dramatic effect when enemy takes turn
- **Flow:** PLAYER → validateResourcess → calculateDamage → ENEMY_TURN → 800ms delay → AI skill → update state → check victory/defeat

#### 3. **Room & Enemy Generation** (`src/game/systems/RoomSystem.ts` & `EnemySystem.ts`)
- **Room Types:** COMBAT, ELITE, BOSS, EVENT, REST, AMBUSH
- **Enemy Archetypes:** TANK, ASSASSIN, BALANCED, CASTER, GENJUTSU (each with distinct stat profiles)
- **Scaling:** `floor × 0.08` multiplier + `difficulty × 0.0025` multiplier
- **Story Arcs:** 5 distinct progressions (Academy → War Arc) with themed enemies/bosses
- **Boss Fights:** Floor 8 (Haku), 17, 25, etc. have fixed boss names and single-encounter rooms

#### 4. **Loot System** (`src/game/systems/LootSystem.ts`)
- **Item Generation:** Stats scale with floor/difficulty/rarity
- **Rarity Tiers:** Common → Rare → Epic → Legendary (0.5-5% base drop rates)
- **Equipment Slots:** Weapon (Strength), Head (Calmness), Body (Willpower), Accessory (Speed/Spirit)
- **Item Bonuses:** Flat stat bonuses or percent multipliers
- **Skill Loot:** Learned or upgraded based on drop

#### 5. **Game State Management** (`src/App.tsx` & `useGameStore.ts`)
- **Centralized State Hook:** Custom `useGameStore()` wraps React `useState`
- **State Flow:** App root → scene components via props → callbacks for mutations
- **Key State:** `gameState` (enum), `floor`, `player`, `enemy`, `logs`, `difficulty`, `turnState`
- **Alternative Approach:** Could use `useReducer()` for cleaner state transitions if complexity grows

---

## Game Balance Reference

### Enemy Scaling Formula
```
enemy_stat = (base_stat × (1 + floor × 0.08)) × (0.75 + difficulty × 0.0025)
```
- Floor 50 enemy: ~4x stronger than floor 1
- Difficulty 100: 2.5x HP/stats vs difficulty 0

### Resource Costs & Generation
- **HP:** 50 base + (Willpower × 12) + equipment bonuses
- **Chakra:** 30 base + (Chakra stat × 8) + equipment bonuses
- **Skill Chakra Cost:** 10-30 typically, ultimate skills 40-50
- **Regeneration:** Scales with Intelligence and Calmness

### Soft Caps (Diminishing Returns)
- Defense formula: `stat / (stat + 120)` caps defense at ~75% max
- Prevents late-game balance issues from stat stacking

### Progression
- **XP per Enemy:** Base 25 + (floor × 5) + tier bonuses
- **Level Up Requirement:** 100 × level XP needed
- **Loot Rarity:** Increases with floor depth (Legendaries rarer early, more common late)

---

## Key Type Definitions to Know

Located in `src/game/types.ts`:

```typescript
// Game states (mutually exclusive scene views)
enum GameState {
  MENU, CHAR_SELECT, EXPLORE, COMBAT, EVENT, LOOT, GAME_OVER
}

// Player and Enemy interfaces (mostly share stats)
interface Player {
  clan: Clan;
  level: number;
  exp: number;
  primaryStats: PrimaryAttributes;
  currentHp: number;
  currentChakra: number;
  equipment: Record<EquipSlot, Item | null>;
  skills: Skill[];
  activeBuffs: Buff[];
}

interface Skill {
  id: string;
  name: string;
  damageType: DamageType;
  damageMult: number;           // Scales with relevant stat
  chakraCost: number;
  hpCost: number;
  cooldown: number;
  currentCooldown: number;
  effects: EffectDefinition[];  // Status effects/buffs applied
  description: string;
}

// Element triangle
enum ElementType {
  Fire > Wind > Lightning > Earth > Water > Fire
  // Physical, Mental ignore the cycle
}

// Rarity affects stat bonuses
enum Rarity { COMMON, RARE, EPIC, LEGENDARY, CURSED }

// Damage types (different defense mechanics)
enum DamageType { PHYSICAL, ELEMENTAL, MENTAL, TRUE }

// Status effects
enum EffectType {
  STUN, BURN, POISON, BLEED, DOT, BUFF, DEBUFF,
  CONFUSION, SILENCE, CHAKRA_DRAIN, GUTS
}
```

---

## Common Development Tasks

### Adding a New Skill
1. Add skill definition to `SKILLS` constant in `src/game/constants/index.ts`
2. Use existing `Skill` interface (no new types needed)
3. Set `damageMult` to scale with appropriate stat (Strength, Intelligence, etc.)
4. Add status effects via `EffectDefinition[]` if skill has debuffs/buffs
5. Skill automatically available for enemies and players based on tier/clan

### Adding a New Enemy
1. Define archetype stats in `EnemySystem.ts` `ARCHETYPES` object
2. Add to boss mapping in `BOSS_NAMES` if it's a story boss
3. Assign skills from existing `SKILLS` pool (or create new skills first)
4. System automatically scales enemy stats based on floor/difficulty

### Adding Status Effects
1. Add `EffectType` to enum in `types.ts` if new type needed
2. Create `EffectDefinition` object with effect type, value, duration
3. Add effect logic to `processEnemyTurn()` or `calculateDamage()` as needed
4. Status effects apply via `activeBuffs` array on Player/Enemy

### Modifying Game Balance
1. Edit `STAT_FORMULAS` in `types.ts` for base calculations
2. Edit `CLAN_STATS` and `CLAN_GROWTH` in `constants/index.ts` for character progression
3. Edit floor/difficulty multipliers in `EnemySystem.ts` for scaling
4. Test with `npm run dev` (no build required for dev changes)

### Adding a New Scene
1. Create component in `src/scenes/YourScene.tsx`
2. Add `enum` value to `GameState` in `types.ts`
3. Import scene in `App.tsx` and add conditional render
4. Add state setters and transition logic as needed
5. Follow pattern of existing scenes (functional components, prop-based data)

---

## Important Patterns & Anti-Patterns

### ✅ Do This
- Keep game logic in `/game/systems/` (testable, reusable)
- Use TypeScript interfaces for all data structures
- Pass data down, callbacks up (React unidirectional flow)
- Use pure functions for damage calculations
- Prefer enums over string literals for game states

### ❌ Don't Do This
- Don't add React dependencies to game systems (breaks portability)
- Don't hardcode balance values in components (use `constants/`)
- Don't mutate objects directly; create new objects with `{ ...old, updated: newValue }`
- Don't create new Skill/Item objects without proper ID generation
- Don't use `any` type; always specify proper TypeScript interfaces

---

## Testing Strategy

Currently no automated test suite exists. To manually test:

1. **Character Progression:** Start new game → level up → verify stat scaling
2. **Combat Balance:** Fight enemies at different floors → verify difficulty curve
3. **Element Effectiveness:** Use elemental skills → verify effectiveness bonuses
4. **Loot Scaling:** Check dropped items at floor 1 vs floor 50 → verify stat scaling
5. **Status Effects:** Apply debuffs → verify damage reduction/effects apply correctly
6. **Edge Cases:**
   - Skill with 0 cooldown (should not be blocked)
   - Defense exceeding 75% (verify cap)
   - Guts survival at 1 HP (rare, test multiple times)

---

## Git Workflow Notes

**Current Branch:** `develop`

**Main Branch:** `main` (use for PRs)

**Commit Style:** Descriptive messages with emojis
- `feat: Add new feature description`
- `fix: Correct specific bug`
- `refactor: Improve code structure`
- `docs: Update documentation`

Recent commits show feature additions (SkillCard, CinematicViewscreen, boss artwork).

---

## Performance Considerations

- **Large Arrays:** `logs` array capped at 50 entries (circular buffer in `addLog()`)
- **Derived Stats:** Memoized via `useMemo()` in `App.tsx` to prevent recalculation
- **Re-renders:** Enemy turn delay prevents janky animations (800ms setTimeout)
- **Image Generation:** AI image generation is async; prevents UI blocking
- **Vite Build:** ~2.5 second build time (fast enough for development)

**Potential Optimizations:**
- Virtualize GameLog if it grows beyond 50 entries
- Profile CombatSystem for performance if floor scaling becomes complex
- Consider lazy-loading large asset images

---

## Debugging Tips

**Common Issues:**

1. **Images not loading:** Check asset file names match exactly (case-sensitive on Linux/Mac)
2. **GEMINI_API_KEY errors:** Ensure `.env.local` is set; key must be valid for image generation
3. **State not updating:** Check for object mutation instead of creating new state (e.g., `{ ...prev }`)
4. **Skill not dealing damage:** Verify skill.damageMult is > 0 and relevant stat is not 0
5. **Enemy stuck in turn:** Check `turnState` is correctly reset in all branches; 800ms delay should complete
6. **Types breaking:** Check `types.ts` for interface changes; may need updates in multiple system files

**Console Logging:**
```typescript
// In game systems:
console.log('Damage calculation:', { baseDamage, critMultiplier, finalDamage });

// In React components:
console.log('Turn state changed:', turnState, { player, enemy });
```

---

## Known Limitations & Future Improvements

**Current Gaps:**
- Enemy AI is random (no pathfinding, strategy, or difficulty awareness)
- No persistence (game lost on refresh)
- No multiplayer (designed for single-player only)
- Image generation requires API key (no fallback placeholder)
- No controller/touch input (keyboard + mouse only)

**Potential Extensions:**
1. **Intelligent AI:** Upgrade `processEnemyTurn()` to prioritize high-impact skills
2. **Persistence:** Save/load game state to localStorage
3. **Modifiers:** Rare items with special effects (curse, blessing, element shifting)
4. **New Story Arcs:** Extend beyond War Arc with post-game content
5. **Difficulty Modes:** Hard/Nightmare modes with altered scaling formulas
6. **Achievements:** Track milestones (reach floor 50, defeat all bosses, etc.)

---

## Useful Resources

- **Naruto Wiki:** Reference for clan names, jutsus, and lore
- **Game Balance Tools:** Spreadsheet tools for testing stat formulas
- **React Patterns:** This codebase follows hooks-based functional components
- **TypeScript Handbook:** For type system questions
- **Vite Docs:** For build/dev server troubleshooting

---

## Questions? Common Tasks:

- **"How do I add a new clan?"** → Add to `CLAN_STATS` and `CLAN_GROWTH` in constants, create new option in `CharacterSelect.tsx`
- **"How do I make enemies harder?"** → Lower `difficulty` threshold in `EnemySystem.ts` floor scaling formula
- **"How do I add a status effect?"** → Add `EffectType` enum value, apply in `calculateDamage()`, handle in `processEnemyTurn()`
- **"Why is my change not showing?"** → Check that dev server is running; if using a cached build, clear `.vite/` folder
- **"How do I test a specific floor?"** → Temporarily edit `setFloor(1)` to desired value in `startGame()` callback

