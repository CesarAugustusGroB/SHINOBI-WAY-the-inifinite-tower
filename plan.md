# LocationCard Redesign Plan

## Overview

Redesign the LocationCard component with three new systems:

1. **Intel System** - Location-scoped intel determines card count + reveal status
2. **Wealth System** - Per-location gold multiplier (auto-generated from LocationType)
3. **Activity Icons** - Visual indicators for room activities (with special variants)

---

## 1. Intel System

### How It Works

Intel is gathered WITHIN a location and evaluated at completion to determine next card draw.

**Flow:**
1. Player enters location (intel starts at 0%, except first location = 50%)
2. Intel gathered during exploration
3. At location END, intel evaluated
4. Result determines card count + reveal status for NEXT location choice

### Intel Thresholds

| Intel Level | Cards | Revealed |
|-------------|-------|----------|
| 0-25%       | 1     | 0 (hidden) |
| 25-50%      | 2     | 1 |
| 50-75%      | 3     | 2 |
| 75-100%     | 3     | 3 (all) |

### Intel Sources

| Source | Gain |
|--------|------|
| Combat victory | +5% |
| Event completion | varies (~15% avg) |
| Info Gathering activity | +25% |

### Storage

- `currentIntel: number` (0-100) stored in App.tsx state
- Resets to 0 when entering new location
- First location in region starts at 50%

---

## 2. Wealth System

### How It Works

Wealth is a 1-7 scale property auto-generated from LocationType.

### Scale & Multiplier

| Level | Mult | Description |
|-------|------|-------------|
| 1 | 0.5x | Destitute |
| 2 | 0.67x | Poor |
| 3 | 0.83x | Modest |
| 4 | 1.0x | Average |
| 5 | 1.17x | Prosperous |
| 6 | 1.33x | Wealthy |
| 7 | 1.5x | Rich |

**Formula:** `multiplier = 0.33 + (wealthLevel * 0.167)`

### Wealth by LocationType

| Type | Wealth | Rationale |
|------|--------|-----------|
| SETTLEMENT | 5-6 | Trade hub |
| WILDERNESS | 2-3 | Sparse |
| STRONGHOLD | 3-4 | Military |
| LANDMARK | 4-5 | Historical |
| SECRET | 5-6 | Hidden treasures |
| BOSS | 6-7 | Hoarded wealth |

### What Wealth Affects

1. **Combat Ryo** - `calculateLocationRyo()` * multiplier
2. **Treasure Ryo** - treasure gold * multiplier
3. **Event Ryo** - event rewards * multiplier
4. **Merchant Discount** - `(wealthLevel - 1) * 5%` (0-30%)

---

## 3. Activity Icons

### Icon Mapping

| Activity | Icon | Special | Color |
|----------|------|---------|-------|
| Combat | ⚔️ | ⚔️✨ | orange |
| Merchant | 🛒 | 🛒✨ | yellow |
| Rest | 💤 | 💤✨ | green |
| Training | 🎯 | 🎯✨ | cyan |
| Event | 🎪 | 🎪✨ | purple |
| Scroll | 📜 | 📜✨ | blue |
| Treasure | 💎 | 💎✨ | amber |
| Elite | 👹 | 👹✨ | red |
| Boss | 💀 | 💀✨ | red |
| Info Gathering | 🔍 | 🔍✨ | teal |

**Special activities** (✨) have enhanced rewards/outcomes - logic TBD.

---

## 4. UI Mockups

### Revealed Card

```
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

### Hidden Card

```
┌───────────────────────────────────────┐
│ [2]  ? ? ?                           │
│      Unknown                         │
├───────────────────────────────────────┤
│              ❓                       │
├───────────────────────────────────────┤
│ ⚠️ DANGER   ░░░░░░░░░░░░  ?/?        │
│ 💰 WEALTH   ░░░░░░░░░░░░  ?/?        │
├───────────────────────────────────────┤
│ 📋  ? ? ? ? ?                        │
└───────────────────────────────────────┘
```

---

## 5. Type Changes

### CardDisplayInfo (update)

```typescript
interface CardDisplayInfo {
  // Existing
  name: string;
  subtitle: string;
  dangerLevel: number;
  locationType: LocationType;
  revisitBadge: boolean;

  // NEW
  wealthLevel: number;
  activities: {
    combat: false | 'normal' | 'special';
    merchant: false | 'normal' | 'special';
    rest: false | 'normal' | 'special';
    training: false | 'normal' | 'special';
    event: false | 'normal' | 'special';
    scrollDiscovery: false | 'normal' | 'special';
    treasure: false | 'normal' | 'special';
    eliteChallenge: false | 'normal' | 'special';
    infoGathering: false | 'normal' | 'special';
  };
  isBoss: boolean;
  isSecret: boolean;
}
```

### Location (update)

```typescript
export interface Location {
  // ... existing fields
  wealthLevel: number;  // Auto-generated from LocationType
}
```

### RegionLootTheme (update)

```typescript
export interface RegionLootTheme {
  primaryElement: ElementType;
  equipmentFocus: string[];
  // REMOVED: goldMultiplier (now per-location)
}
```

---

## 6. Implementation Steps

### Phase 1: Types & Constants

**types.ts:**
- Add `wealthLevel: number` to Location interface
- Add `currentIntel: number` to track during exploration
- Update CardDisplayInfo with new fields
- Remove `goldMultiplier` from RegionLootTheme

**roomTypes.ts:**
- Add `infoGathering` to ACTIVITY_ORDER

### Phase 2: RegionSystem.ts

**Wealth functions:**
- `getWealthMultiplier(wealthLevel): number`
- `getDefaultWealthForLocationType(type): number`
- `applyWealthToRyo(baseRyo, wealthLevel): number`
- `getMerchantDiscount(wealthLevel): number`

**Intel functions:**
- `evaluateIntel(intel): { cardCount, revealedCount }`
- `getLocationActivities(location): ActivityState`

**Updates:**
- `generateLocation()` - auto-assign wealth from LocationType
- `getCardDisplayInfo()` - include wealth, activities
- `drawLocationCards()` - use intel-based count/reveal

### Phase 3: App.tsx

**Intel tracking:**
- Add `currentIntel` state
- Reset on location enter
- Increment on combat (+5%), events (var), info gathering (+25%)
- Evaluate on location complete

**Wealth application:**
- `handleCombatVictory`: ryo * wealthMultiplier
- Treasure collection: ryo * wealthMultiplier
- Event rewards: ryo * wealthMultiplier
- Merchant scene: apply discount

### Phase 4: UI Components

**RegionMap.tsx:**
- Redesign LocationCardDisplay
- Handle 1-3 cards dynamically
- Hidden vs revealed card states
- Grid layout adjustments

**LocationCard.tsx:**
- Danger bar (existing)
- Wealth bar (new, gold/yellow theme)
- Activity icons row

---

## 7. Files to Modify

| File | Changes |
|------|---------|
| `src/game/types.ts` | Location, CardDisplayInfo, RegionLootTheme |
| `src/game/systems/RegionSystem.ts` | Wealth + intel functions |
| `src/game/constants/roomTypes.ts` | Add infoGathering activity |
| `src/App.tsx` | Intel state, wealth multipliers |
| `src/components/exploration/RegionMap.tsx` | Card display, grid, hidden/revealed |
| `src/components/exploration/LocationCard.tsx` | Wealth bar, activity icons |

---

## 8. Questions Resolved

- ✅ Intel gathered within location, evaluated at location end
- ✅ Intel affects BOTH card count (1-3) AND reveal status
- ✅ First location starts at 50% intel
- ✅ Intel stored in App.tsx state (resets each location)
- ✅ Intel sources: combat (+5%), events (varies), info gathering (+25%)
- ✅ Show wealth/activities on revealed cards only
- ✅ Hidden cards show mystery placeholder
- ✅ Wealth auto-generated from LocationType
- ✅ Merchant discount (not price change) based on wealth
- ✅ Special activities marked with ✨ icon (logic TBD)
