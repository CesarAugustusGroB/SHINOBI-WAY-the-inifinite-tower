# Feature Plan: Dual Treasure System

## Features Overview

| Feature | Description |
|---------|-------------|
| **Locked Treasure** | Choice-based treasure - pick blind (random) OR spend chakra to reveal all options then choose |
| **Treasure Hunter** | Multi-part map collection across treasure rooms in a location, combat/dice rolls for pieces, scaled rewards |

**Key Design:** Both systems share the same treasure icon. Player doesn't know which type until entering the activity (surprise element).

---

## Feature 1: Locked Treasure Chests

### Mechanics

```
┌─────────────────────────────────────────────────────────────┐
│                    TREASURE FOUND                           │
├─────────────────────────────────────────────────────────────┤
│   [?]  [?]  [?]     ← 3 hidden choices                     │
│                                                             │
│   [A] Pick Randomly (Free)     → Get random item           │
│   [B] Reveal All (15 Chakra)   → See all, then choose      │
└─────────────────────────────────────────────────────────────┘
```

**Flow:**
1. Generate 2-3 item choices (based on wealth level)
2. Display as hidden cards by default
3. Player can:
   - **Pick blind** → Random selection from choices (free)
   - **Spend chakra** → Reveal all items, then freely choose one

**Chakra Cost Formula:**
```
revealCost = 10 + (floor * 2) + (choiceCount * 5)
```

### Types

```typescript
interface TreasureActivity {
  choices: TreasureChoice[];
  ryoBonus: number;
  revealCost: number;        // Chakra cost to reveal
  isRevealed: boolean;       // Has player revealed?
  selectedIndex: number | null;
  collected: boolean;
}

interface TreasureChoice {
  item: Item;
  isArtifact: boolean;
}
```

---

## Feature 2: Treasure Hunter Maps

### Mechanics

**Trigger:** First treasure room in a location starts the Treasure Hunt

```
┌─────────────────────────────────────────────────────────────┐
│          🗺️ TREASURE HUNTER INITIATED                       │
├─────────────────────────────────────────────────────────────┤
│   An ancient map fragment glows before you...               │
│                                                             │
│   Map Progress: [■□□□] 1/4 pieces                          │
│                                                             │
│   [A] Fight Guardian → Guaranteed piece + normal treasure   │
│   [B] Roll the Dice  → 70% piece, 30% trap/nothing         │
└─────────────────────────────────────────────────────────────┘
```

**System Flow:**
1. First treasure room → Initialize map hunt (2-4 pieces required based on danger)
2. Activating hunt → Increases treasure room probability for this location
3. Each treasure room offers: Combat OR Dice Roll for map piece
4. Complete map → Bonus reward screen based on pieces + wealth

### Map Piece Requirements

| Danger Level | Required Pieces |
|--------------|-----------------|
| 1-2 | 2 pieces |
| 3-4 | 3 pieces |
| 5-7 | 4 pieces |

### Treasure Probability Boost

```typescript
// When treasure hunt active
baseTreasureChance = 0.25;  // 25% normally
huntBoostChance = 0.25;     // +25% during hunt = 50% total
```

### Combat vs Dice Roll

| Choice | Outcome |
|--------|---------|
| **Combat** | Fight scaled mini-boss → Guaranteed piece + normal treasure |
| **Dice Roll** | Roll 1-100: 1-30 = trap (damage), 31-70 = nothing, 71-100 = piece |

**Trap Damage Formula:** `5% + (dangerLevel * 3)%` of max HP

| Danger | Trap Damage |
|--------|-------------|
| 1 | 8% max HP |
| 4 | 17% max HP |
| 7 | 26% max HP |

### Map Completion Rewards

| Pieces | Wealth 1-2 | Wealth 3-4 | Wealth 5-6 | Wealth 7 |
|--------|------------|------------|------------|----------|
| 2 | Component + 100 ryo | RARE Component + 150 ryo | Skill Scroll | Artifact |
| 3 | RARE Component + 150 ryo | Skill Scroll + 200 ryo | Artifact | Artifact + Scroll |
| 4 | Skill Scroll + 200 ryo | Artifact | Artifact + 300 ryo | Artifact + Scroll + 500 ryo |

### Types

```typescript
interface TreasureHunt {
  isActive: boolean;
  requiredPieces: number;
  collectedPieces: number;
  mapId: string;  // Unique per location
}

// Add to BranchingFloor
interface BranchingFloor {
  // ... existing
  treasureHunt: TreasureHunt | null;
  treasureProbabilityBoost: number;
}
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/game/types.ts` | TreasureActivity, TreasureChoice, TreasureHunt, BranchingFloor |
| `src/game/systems/LocationSystem.ts` | generateTreasureActivity, treasure hunt logic |
| `src/hooks/useActivityHandler.ts` | Handle reveal/blind pick, map piece collection |
| `src/scenes/TreasureChoice.tsx` | **CREATE** - New scene for treasure UI |
| `src/scenes/TreasureHuntReward.tsx` | **CREATE** - Map completion reward screen |
| `src/App.tsx` | GameState.TREASURE, treasure handlers |
| `src/game/constants/roomTypes.ts` | Treasure probability config |

---

## Implementation Steps

### Phase 1: Types & Data

1. Add `TreasureChoice` interface
2. Update `TreasureActivity` interface
3. Add `TreasureHunt` interface
4. Add `treasureHunt` to `BranchingFloor`
5. Add `GameState.TREASURE` and `GameState.TREASURE_HUNT_REWARD`

### Phase 2: Generation Logic

1. Rewrite `generateTreasureActivity()` for choice-based system
2. Add `initializeTreasureHunt()` function
3. Add `getTreasureHuntReward()` function
4. Modify room generation to boost treasure probability when hunt active

### Phase 3: UI Components

**Use `/frontend-design` skill for all UI work**

1. Create `TreasureChoice.tsx` scene (blind/reveal mechanics)
2. Create `TreasureHuntReward.tsx` scene (map completion)
3. Add map progress indicator component

### Phase 4: Activity Handler

1. Handle treasure reveal (chakra cost)
2. Handle blind selection (random)
3. Handle map piece combat/dice roll
4. Handle map completion trigger

---

## Legacy Code Removal

**Code to Remove:**
- `src/game/systems/LocationSystem.ts`: Old `generateTreasureActivity()` (lines 490-505)
- `src/game/types.ts`: Old `TreasureActivity` interface (replace entirely)

**Code to Update:**
- `src/hooks/useActivityHandler.ts`: Replace treasure case handler
- Any direct references to `treasure.items` array (now `treasure.choices`)

**Migration Notes:**
- Old treasure format: `{ items: Item[], ryo: number, collected: boolean }`
- New treasure format: `{ choices: TreasureChoice[], ryoBonus: number, revealCost: number, ... }`
- Existing saves will need migration or fresh start
