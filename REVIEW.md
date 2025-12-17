# Comprehensive Architecture & Clean Code Review

**Date:** December 17, 2025
**Codebase:** SHINOBI WAY: THE INFINITE TOWER
**Overall Assessment:** 6.5/10 - Good foundation with significant refactoring opportunities

---

## Summary

The SHINOBI WAY codebase demonstrates **solid foundational architecture** with proper separation between game logic (`src/game/systems/`) and UI (`src/components/`). The dual-system combat architecture (CombatCalculationSystem + CombatWorkflowSystem) is well-designed. However, there are **critical issues** requiring attention: **App.tsx at 2,314 lines is severely overloaded**, `processEnemyTurn()` is a 341-line monolith, and significant code duplication exists across exploration systems.

---

## Architecture Concerns

### Critical

| Issue | Location | Description |
|-------|----------|-------------|
| **God Component** | `src/App.tsx` (2,314 LOC) | Manages 26 state variables, 40+ handlers, two competing exploration systems. Should be 300-400 lines max. |
| **Monolithic Function** | `src/game/systems/CombatWorkflowSystem.ts:613-954` | `processEnemyTurn()` is 341 lines with 8+ responsibilities and 13 return statements. |
| **Duplicated Exploration Logic** | `src/App.tsx:628-780` vs `src/App.tsx:993-1145` | `handleBranchingRoomEnter` and `handleLocationRoomEnter` are ~117 lines each of nearly identical code. |
| **Duplicated Activity Switches** | `src/App.tsx:650-780` + `src/App.tsx:1015-1144` | Same 130-line switch statement for activity handling duplicated. |

### Moderate

| Issue | Location | Description |
|-------|----------|-------------|
| **Code Duplication** | `RegionSystem.ts:82` + `LocationSystem.ts:1078` | `dangerToFloor()`, `calculateLocationXP()`, `calculateLocationRyo()` duplicated in both files. |
| **Weak Type Safety** | `App.tsx:125`, `App.tsx:186` | `logs: any[]` and `type: any = 'info'` - LogEntry interface exists but isn't used. |
| **God Component (UI)** | `src/scenes/Combat.tsx` (634 LOC) | Handles enemy view, player HUD, skill interface, tooltips, floating text - too many concerns. |
| **God Component (UI)** | `src/components/exploration/RegionMap.tsx` (547 LOC) | Contains 7 inline sub-component definitions that should be extracted. |
| **Tight Coupling** | `CombatWorkflowSystem.ts:531-553` | CombatWorkflowSystem imports 5+ functions from EquipmentPassiveSystem directly. |
| **Long Function** | `LocationSystem.ts:212-387` | `generateActivities()` is 175 lines handling 9 activity types. |
| **Magic Numbers** | `App.tsx:1285`, `App.tsx:1259` | Hardcoded `0.6` (sell value), `0.2` (skill growth) instead of named constants. |

### Minor

| Issue | Location | Description |
|-------|----------|-------------|
| **Duplicate Color Mapping** | `LocationPanel.tsx:17-29`, `LocationCard.tsx:21-42`, `RegionMap.tsx:26-34` | Danger level colors defined in 3 places. |
| **Missing Error Boundaries** | `Combat.tsx`, `Loot.tsx` | Scene files have no error boundaries or null checks. |
| **Hardcoded Arc Styling** | `RegionMap.tsx:386-419` | Arc-to-color mapping should be in constants. |
| **Inconsistent Handler Naming** | `Bag.tsx:182-229` | Mix of `handleX` and verb-only names (`startSynthesis`, `cancelSynthesis`). |
| **Legacy Aliases** | `types.ts:54-56` | `Stat`/`PrimaryStat` aliases for backward compatibility still exist. |

---

## Clean Code Issues

### Functions Too Large

| File | Function | Lines | Recommendation |
|------|----------|-------|----------------|
| CombatWorkflowSystem | `processEnemyTurn()` | 341 | Split into `processBuffTicks()`, `executeEnemyAction()`, `processTerrainHazards()`, `checkDeaths()` |
| CombatWorkflowSystem | `useSkill()` | 212 | Extract `createDamageLog()`, `applyPassiveEffects()`, `applySkillEffects()` |
| LocationSystem | `generateActivities()` | 175 | Split by activity type or create `ActivityGeneratorFactory` |
| App.tsx | `handleCombatVictory` | 140 | Extract exploration-specific logic to custom hooks |
| App.tsx | `handleEventChoice` | 120 | Extract event resolution to EventSystem |

### DRY Violations

1. **Danger scaling functions** duplicated:
   - `dangerToFloor()` in RegionSystem.ts AND LocationSystem.ts
   - `calculateLocationXP()` in both files
   - `calculateLocationRyo()` in both files
   - **Fix:** Create `ScalingSystem.ts` with single source of truth

2. **DoT processing logic** duplicated:
   - `CombatWorkflowSystem.ts:637-652` (enemy DoTs)
   - `CombatWorkflowSystem.ts:654-676` (player DoTs)
   - **Fix:** Extract `processBuffTick()` function

3. **Tooltip content patterns** duplicated:
   - `PlayerHUD.tsx:118-193` (buff tooltips)
   - `Combat.tsx:150-219` (enemy stat tooltips)
   - **Fix:** Extract `TooltipHeader`, `TooltipMechanics` components

### Testability Gaps

- **Non-deterministic functions** use `Math.random()` directly instead of injectable RNG
- **processEnemyTurn()** requires mocking 5+ dependencies to test one scenario
- **Missing DI:** Random number generation should be injectable for deterministic tests

---

## Positive Patterns

- **CombatCalculationSystem** - Exemplary pure function design with no side effects, fully testable
- **Type-safe enums** - Consistent use of TypeScript enums (`PrimaryStat`, `DamageType`, `Rarity`)
- **Immutable patterns** - State updates use spread operators consistently (`{ ...old, updated: value }`)
- **Clear layering** - Game logic in `/game/systems/` has no React dependencies
- **Custom hooks** - `useGameStore`, `useGameLoop`, `useCombatExplorationState` extract reusable logic
- **Component organization** - Proper categorization in `/components/` (combat, exploration, inventory, etc.)
- **Good interface design** in LootSystem - `CraftResult`, `EquipResult` with consistent success/reason patterns
- **LeftSidebarPanel** uses `useGame()` context directly - good pattern for avoiding prop drilling

---

## Recommendations (Prioritized)

### Priority 1: Critical Refactoring

1. **Split `processEnemyTurn()` into turn phases**
   ```typescript
   // Replace 341-line monolith with:
   processBuffTicks(enemy, player)    // DoT/Regen
   checkBuffDeaths(enemy, player)     // Death from DoT
   executeEnemyAction(enemy, player)  // Stun/attack logic
   applyTerrainHazards(terrain)       // Environment damage
   processPostTurnResources()         // Cooldowns, chakra regen
   ```

2. **Extract exploration state from App.tsx to custom hooks**
   ```typescript
   // Create useExploration() hook managing:
   // - branchingFloor + selectedBranchingRoom (legacy)
   // - region + locationFloor + locationDeck (new)
   // - Unified activity handling
   ```

3. **Eliminate `dangerToFloor()` duplication**
   - Create `src/game/systems/ScalingSystem.ts`
   - Move all scaling/reward calculations there
   - Single import point for both RegionSystem and LocationSystem

4. **Merge duplicated activity handling**
   - Replace two 130-line switch statements with single `ActivityDispatcher`
   - Use dispatch table pattern instead of switch

### Priority 2: High Value Cleanup

5. **Fix type safety in App.tsx**
   ```typescript
   // Change from:
   const [logs, setLogs] = useState<any[]>([]);
   // To:
   const [logs, setLogs] = useState<LogEntry[]>([]);
   ```

6. **Extract sub-components from RegionMap.tsx**
   - Move `DangerLevelBar`, `WealthLevelBar`, `ActivityIcons`, `LocationCardDisplay` to separate files
   - Reduces file from 547 to ~200 lines

7. **Split Combat.tsx into focused components**
   - Extract `EnemyStatsOverlay`
   - Extract `SkillInterfacePanel`
   - Extract `PassiveSkillsTooltip`

8. **Replace magic numbers with named constants**
   ```typescript
   // In src/game/constants/index.ts:
   export const GAME_BALANCE = {
     SELL_VALUE_MULTIPLIER: 0.6,
     SKILL_GROWTH_MULTIPLIER: 0.2,
     MERCHANT_DISCOUNT_CAP: 0.5,
   };
   ```

### Priority 3: Medium Term Improvements

9. **Create injectable RandomNumberGenerator**
   - Enables deterministic testing of probabilistic systems
   - Centralizes randomness control

10. **Split constants/index.ts (2,703 lines)**
    - Move clan data to `constants/clans.ts`
    - Move skills to `constants/skills.ts`
    - Move events to `constants/events/` (already partially done)

11. **Add error boundaries to scene components**
    - Wrap Combat, Loot, Merchant scenes
    - Handle edge cases gracefully

12. **Centralize color helpers**
    - Move all danger/rarity color mappings to `src/utils/colorHelpers.ts`
    - Single source of truth for UI theming

---

## Metrics Summary

| Metric | Current | Target |
|--------|---------|--------|
| App.tsx LOC | 2,314 | 300-400 |
| App.tsx state variables | 26 | <10 (via custom hooks) |
| App.tsx handlers | 40+ | <15 |
| processEnemyTurn() LOC | 341 | 50-100 |
| Duplicated exploration handlers | 2×117 lines | 1×60 lines |
| `any` type usages | 4+ in App.tsx | 0 |

---

## Detailed System Analysis

### Game Systems Layer (src/game/systems/)

| Category | Score | Notes |
|----------|-------|-------|
| Separation of Concerns | 8/10 | Good but some business logic bleeding |
| Dependency Management | 6/10 | Some circular risks, indirect coupling |
| Single Responsibility | 5/10 | CRITICAL: processEnemyTurn() too large |
| Interface Design | 7/10 | Generally good, some mixing of concerns |
| Code Smells | 5/10 | Long methods, some duplication |
| DRY Compliance | 6/10 | dangerToFloor duplicated, some calculations repeated |
| Testability | 6/10 | Pure functions good, workflows hard to test |

### React Layer (src/components/, src/scenes/)

| Category | Score | Notes |
|----------|-------|-------|
| Component Size | 5/10 | Combat.tsx (634), RegionMap.tsx (547) too large |
| Separation of Concerns | 6/10 | Business logic leaking into UI in places |
| Prop Drilling | 6/10 | Some excessive prop passing in RightSidebarPanel |
| Error Handling | 4/10 | Missing error boundaries, inconsistent null checks |
| DRY Compliance | 5/10 | Duplicate color mappings, tooltip patterns |
| Naming Consistency | 7/10 | Generally good, some inconsistencies |

### App.tsx Orchestrator

| Category | Score | Notes |
|----------|-------|-------|
| Size | 2/10 | 2,314 lines is 400-500% larger than ideal |
| State Management | 4/10 | 26 state variables, dual exploration systems |
| Handler Organization | 4/10 | 40+ handlers with inconsistent naming |
| Type Safety | 5/10 | `any` types used where interfaces exist |
| Coupling | 3/10 | Tightly coupled to 15+ systems with no abstraction |

---

## Conclusion

The codebase has a solid architectural foundation but needs focused refactoring to reduce complexity. The combat calculation layer is well-designed; the orchestration layer (App.tsx, CombatWorkflowSystem) needs decomposition. Prioritize:

1. Breaking up `processEnemyTurn()` (immediate impact on maintainability)
2. Extracting App.tsx exploration logic to hooks (reduces god component)
3. Eliminating code duplication (DRY compliance)
4. Adding proper type safety (developer experience)

These changes will significantly improve maintainability, testability, and developer velocity.
