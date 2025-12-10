# Combat System Refactor Brainstorm

## Separating CombatCalculationSystem from CombatWorkflowSystem

---

## The Problem

The current `CombatSystem.ts` mixes two distinct responsibilities:

1. **Calculation Logic** - Computing damage, hit/miss, crits, defense mitigation, etc.
2. **Workflow Logic** - Managing state changes, turn order, applying results, tracking combat flow

This coupling makes the code:
- Harder to test (can't test calculations without mocking state)
- Harder to maintain (changes to workflow affect calculations)
- Harder to extend (adding new mechanics touches too many places)
- Less predictable (side effects mixed with pure computations)

---

## The Solution: Two Separate Systems

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           COMBAT FLOW                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   Player Action          CombatCalculationSystem         CombatWorkflowSystem│
│       │                         │                              │            │
│       ▼                         │                              │            │
│   ┌───────┐                     │                              │            │
│   │ Input │ ──────────────────► │                              │            │
│   └───────┘                     ▼                              │            │
│                         ┌───────────────┐                      │            │
│                         │   Calculate   │                      │            │
│                         │   All Results │                      │            │
│                         │   (Pure)      │                      │            │
│                         └───────┬───────┘                      │            │
│                                 │                              │            │
│                                 │ CombatActionResult           │            │
│                                 │                              │            │
│                                 └────────────────────────────► │            │
│                                                                ▼            │
│                                                        ┌───────────────┐    │
│                                                        │    Apply      │    │
│                                                        │    Results    │    │
│                                                        │    To State   │    │
│                                                        └───────┬───────┘    │
│                                                                │            │
│                                                                ▼            │
│                                                        ┌───────────────┐    │
│                                                        │  Updated      │    │
│                                                        │  Game State   │    │
│                                                        └───────────────┘    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## System 1: CombatCalculationSystem

### Purpose
Pure functions that compute combat outcomes. No state mutations. No side effects. Given inputs, returns deterministic results (with controlled randomness).

### Principles
- **Pure Functions Only** - Same inputs always produce same outputs (except for random rolls)
- **No State Mutation** - Never modifies input parameters
- **Complete Results** - Returns everything needed to apply the action
- **Testable** - Can be unit tested without any mocking

### Core Interface

```typescript
/**
 * The complete result of a combat action calculation.
 * Contains ALL information needed to apply the action to game state.
 */
interface CombatActionResult {
  // === ATTACK OUTCOME ===
  hit: boolean;
  evaded: boolean;
  criticalHit: boolean;

  // === DAMAGE VALUES ===
  rawDamage: number;
  elementMultiplier: number;
  critMultiplier: number;
  flatDefenseApplied: number;
  percentDefenseApplied: number;
  finalDamage: number;

  // === MITIGATION RESULTS ===
  damageAbsorbedByShield: number;
  damageReflected: number;
  damageAmplifiedByCurse: number;
  invulnerabilityBlocked: boolean;

  // === SURVIVAL ===
  wouldBeLethal: boolean;
  gutsTriggered: boolean;
  gutsSucceeded: boolean;

  // === EFFECTS TO APPLY ===
  effectsOnTarget: EffectApplication[];
  effectsOnSelf: EffectApplication[];

  // === RESOURCE CHANGES ===
  attackerChakraChange: number;
  attackerHpChange: number;

  // === METADATA ===
  skillUsed: Skill;
  logs: CombatLogEntry[];
}

interface EffectApplication {
  type: EffectType;
  value: number;
  duration: number;
  wasResisted: boolean;
  resistChance: number;
}

interface CombatLogEntry {
  message: string;
  type: 'info' | 'damage' | 'heal' | 'effect' | 'critical' | 'miss';
}
```

### Functions

```typescript
// ============================================================================
// COMBAT CALCULATION SYSTEM - Pure Functions
// ============================================================================

/**
 * Main entry point: Calculate the complete result of using a skill
 */
function calculateSkillUse(
  attacker: CombatEntity,
  defender: CombatEntity,
  skill: Skill,
  context: CombatContext
): CombatActionResult;

/**
 * Calculate hit/miss and evasion
 */
function calculateHitCheck(
  attackerStats: DerivedStats,
  defenderStats: DerivedStats,
  skill: Skill,
  randomSeed?: number
): HitCheckResult;

/**
 * Calculate base damage before mitigation
 */
function calculateBaseDamage(
  attackerPrimary: PrimaryAttributes,
  skill: Skill
): number;

/**
 * Calculate elemental effectiveness multiplier
 */
function calculateElementEffectiveness(
  attackElement: ElementType,
  defenderElement: ElementType
): ElementResult;

/**
 * Calculate critical hit
 */
function calculateCritical(
  attackerStats: DerivedStats,
  skill: Skill,
  elementResult: ElementResult,
  randomSeed?: number
): CriticalResult;

/**
 * Calculate defense reduction
 */
function calculateDefenseReduction(
  damage: number,
  defenderStats: DerivedStats,
  damageType: DamageType,
  damageProperty: DamageProperty,
  penetration: number
): DefenseResult;

/**
 * Calculate mitigation pipeline (invuln → curse → reflect → shield)
 */
function calculateMitigation(
  damage: number,
  targetBuffs: Buff[]
): MitigationResult;

/**
 * Calculate guts survival chance
 */
function calculateGutsSurvival(
  currentHp: number,
  damage: number,
  gutsChance: number,
  gutsAlreadyUsedThisTurn: boolean,
  randomSeed?: number
): GutsResult;

/**
 * Calculate effect applications with resistance
 */
function calculateEffectApplications(
  effects: SkillEffect[],
  targetResistance: number,
  damageDealt: number
): EffectApplication[];

/**
 * Calculate DoT tick damage
 */
function calculateDotTick(
  dotEffect: DotEffect,
  defenderStats: DerivedStats
): number;

/**
 * Calculate terrain effects
 */
function calculateTerrainEffects(
  terrain: TerrainDefinition,
  attackElement: ElementType,
  targets: CombatEntity[]
): TerrainResult;
```

### Supporting Interfaces

```typescript
interface CombatEntity {
  primaryStats: PrimaryAttributes;
  derivedStats: DerivedStats;
  activeBuffs: Buff[];
  element: ElementType;
  currentHp: number;
  currentChakra: number;
}

interface CombatContext {
  isFirstTurn: boolean;
  firstHitMultiplier: number;
  terrain: TerrainDefinition | null;
  gutsUsedThisTurn: boolean;
}

interface HitCheckResult {
  hit: boolean;
  hitChance: number;
  evaded: boolean;
  evasionChance: number;
}

interface ElementResult {
  multiplier: number;
  isSuperEffective: boolean;
  isResisted: boolean;
  critBonus: number;
}

interface CriticalResult {
  isCrit: boolean;
  critChance: number;
  critMultiplier: number;
}

interface DefenseResult {
  flatReduction: number;
  percentReduction: number;
  totalReduction: number;
  damageAfterDefense: number;
}

interface MitigationResult {
  finalDamage: number;
  reflectedDamage: number;
  shieldDamageAbsorbed: number;
  curseAmplification: number;
  wasInvulnerable: boolean;
  shieldBroken: boolean;
  newShieldValue: number;
}

interface GutsResult {
  wouldDie: boolean;
  gutsTriggered: boolean;
  survived: boolean;
  finalHp: number;
}

interface TerrainResult {
  elementAmplification: number;
  hazardDamage: number;
  hazardTriggered: boolean;
}
```

---

## System 2: CombatWorkflowSystem

### Purpose
Manages combat state and applies calculated results. Handles turn flow, state transitions, and coordinates between UI and calculations.

### Principles
- **State Management** - Owns and updates combat state
- **Uses Calculations** - Calls CombatCalculationSystem for all math
- **Orchestrates Flow** - Controls turn order, phases, win/loss conditions
- **Generates Events** - Produces events for UI updates and logging

### Core Interface

```typescript
/**
 * Complete combat state managed by the workflow system
 */
interface CombatWorkflowState {
  // === COMBATANTS ===
  player: CombatantState;
  enemy: CombatantState;

  // === TURN TRACKING ===
  currentTurn: 'player' | 'enemy';
  turnNumber: number;
  phase: CombatPhase;

  // === COMBAT CONTEXT ===
  isFirstTurn: boolean;
  firstHitMultiplier: number;
  terrain: TerrainDefinition | null;

  // === TURN-SCOPED FLAGS ===
  gutsUsedThisTurn: boolean;
  playerActedThisTurn: boolean;

  // === COMBAT LOG ===
  logs: CombatLogEntry[];

  // === RESOLUTION ===
  isComplete: boolean;
  winner: 'player' | 'enemy' | null;
}

interface CombatantState {
  entity: Player | Enemy;
  currentHp: number;
  currentChakra: number;
  activeBuffs: Buff[];
  skillCooldowns: Map<string, number>;
}

enum CombatPhase {
  COMBAT_START,
  TURN_START,
  UPKEEP,
  DOT_PROCESSING,
  MAIN_ACTION,
  EFFECT_APPLICATION,
  TURN_END,
  RESOURCE_RECOVERY,
  TERRAIN_HAZARDS,
  DEATH_CHECK,
  COMBAT_END
}
```

### Functions

```typescript
// ============================================================================
// COMBAT WORKFLOW SYSTEM - State Management
// ============================================================================

/**
 * Initialize a new combat
 */
function initializeCombat(
  player: Player,
  enemy: Enemy,
  terrain: TerrainDefinition | null,
  approachModifiers: CombatModifiers
): CombatWorkflowState;

/**
 * Execute a player action (main entry point for player turn)
 */
function executePlayerAction(
  state: CombatWorkflowState,
  skill: Skill
): CombatWorkflowState;

/**
 * Execute the enemy's turn (called after player action)
 */
function executeEnemyTurn(
  state: CombatWorkflowState
): CombatWorkflowState;

// === PHASE HANDLERS ===

/**
 * Process turn start phase
 */
function processTurnStart(
  state: CombatWorkflowState,
  combatant: 'player' | 'enemy'
): CombatWorkflowState;

/**
 * Process upkeep phase (toggle costs, passive regen)
 */
function processUpkeep(
  state: CombatWorkflowState,
  combatant: 'player' | 'enemy'
): CombatWorkflowState;

/**
 * Process DoT effects on a combatant
 */
function processDoTPhase(
  state: CombatWorkflowState,
  combatant: 'player' | 'enemy'
): CombatWorkflowState;

/**
 * Apply a calculated action result to state
 */
function applyActionResult(
  state: CombatWorkflowState,
  result: CombatActionResult,
  attacker: 'player' | 'enemy'
): CombatWorkflowState;

/**
 * Process turn end (cooldown reduction, chakra regen)
 */
function processTurnEnd(
  state: CombatWorkflowState,
  combatant: 'player' | 'enemy'
): CombatWorkflowState;

/**
 * Process terrain hazards
 */
function processTerrainHazards(
  state: CombatWorkflowState
): CombatWorkflowState;

/**
 * Check for combat end conditions
 */
function checkCombatEnd(
  state: CombatWorkflowState
): CombatWorkflowState;

// === STATE MUTATORS (Internal) ===

function applyDamageToTarget(
  state: CombatWorkflowState,
  target: 'player' | 'enemy',
  damage: number,
  source: string
): CombatWorkflowState;

function applyHealToTarget(
  state: CombatWorkflowState,
  target: 'player' | 'enemy',
  amount: number,
  source: string
): CombatWorkflowState;

function applyEffectToTarget(
  state: CombatWorkflowState,
  target: 'player' | 'enemy',
  effect: EffectApplication
): CombatWorkflowState;

function tickBuffDurations(
  state: CombatWorkflowState,
  target: 'player' | 'enemy'
): CombatWorkflowState;

function updateCooldowns(
  state: CombatWorkflowState,
  target: 'player' | 'enemy'
): CombatWorkflowState;

function restoreChakra(
  state: CombatWorkflowState,
  target: 'player' | 'enemy',
  amount: number
): CombatWorkflowState;

function addCombatLog(
  state: CombatWorkflowState,
  entry: CombatLogEntry
): CombatWorkflowState;
```

---

## Data Flow Example: Player Uses Skill

### Current (Mixed) Approach

```typescript
// Current: Everything happens in one function
const result = useSkill(player, playerStats, enemy, enemyStats, skill, combatState);
// result contains: newEnemyHp, newPlayerHp, newEnemyBuffs, newPlayerBuffs, etc.
// The function both CALCULATES and APPLIES changes
```

### Proposed (Separated) Approach

```typescript
// Step 1: Get current combat entities
const attacker = getCombatEntity(state.player);
const defender = getCombatEntity(state.enemy);

// Step 2: Calculate the complete result (PURE - no mutations)
const actionResult = CombatCalculation.calculateSkillUse(
  attacker,
  defender,
  skill,
  {
    isFirstTurn: state.isFirstTurn,
    firstHitMultiplier: state.firstHitMultiplier,
    terrain: state.terrain,
    gutsUsedThisTurn: state.gutsUsedThisTurn
  }
);

// Step 3: Apply the result to state (MUTATION - controlled)
const newState = CombatWorkflow.applyActionResult(state, actionResult, 'player');
```

---

## Detailed Turn Flow (Workflow System)

### Player Turn Sequence

```
┌────────────────────────────────────────────────────────────────────────────┐
│                         PLAYER TURN FLOW                                    │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. TURN START                                                              │
│     └─► Reset turn-scoped flags (gutsUsedThisTurn = false)                  │
│                                                                             │
│  2. UPKEEP PHASE                                                            │
│     ├─► Process toggle skill upkeep costs                                   │
│     │   └─► Calculate: Can afford? → Deactivate if not                     │
│     └─► Apply passive regen bonuses                                         │
│         └─► Calculate: Regen amounts from passive skills                    │
│                                                                             │
│  3. MAIN ACTION (Player Choice)                                             │
│     ├─► Validate skill can be used (cooldown, resources)                    │
│     ├─► Calculate: CombatCalculation.calculateSkillUse()                    │
│     │   └─► Returns complete CombatActionResult                             │
│     └─► Apply: CombatWorkflow.applyActionResult()                           │
│         ├─► Update enemy HP                                                 │
│         ├─► Update player HP (if reflection/self-damage)                    │
│         ├─► Update player resources (chakra, HP costs)                      │
│         ├─► Apply effects to both parties                                   │
│         ├─► Set skill cooldown                                              │
│         └─► Add combat logs                                                 │
│                                                                             │
│  4. DEATH CHECK                                                             │
│     ├─► If enemy HP <= 0 → Combat ends (player wins)                        │
│     └─► If player HP <= 0 (reflection) → Combat ends (enemy wins)           │
│                                                                             │
│  5. TURN END                                                                │
│     └─► Mark isFirstTurn = false                                            │
│                                                                             │
│  → Transition to ENEMY TURN                                                 │
│                                                                             │
└────────────────────────────────────────────────────────────────────────────┘
```

### Enemy Turn Sequence

```
┌────────────────────────────────────────────────────────────────────────────┐
│                          ENEMY TURN FLOW                                    │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. DOT PROCESSING - ENEMY                                                  │
│     ├─► For each DoT buff on enemy:                                         │
│     │   └─► Calculate: CombatCalculation.calculateDotTick()                 │
│     │   └─► Apply: Damage to enemy HP                                       │
│     ├─► For each Regen buff on enemy:                                       │
│     │   └─► Apply: Heal enemy HP                                            │
│     └─► Tick buff durations, remove expired                                 │
│                                                                             │
│  2. DOT PROCESSING - PLAYER                                                 │
│     ├─► For each DoT buff on player:                                        │
│     │   └─► Calculate: DotTick + Shield mitigation                          │
│     │   └─► Apply: Damage (shield first, then HP)                           │
│     ├─► For each Regen buff on player:                                      │
│     │   └─► Apply: Heal player HP                                           │
│     └─► Tick buff durations, remove expired                                 │
│                                                                             │
│  3. DEATH CHECK (DoT)                                                       │
│     ├─► If enemy HP <= 0 → Combat ends (player wins)                        │
│     └─► If player HP <= 0:                                                  │
│         └─► Calculate: Guts check                                           │
│         └─► Apply: Survive at 1 HP or die                                   │
│                                                                             │
│  4. ENEMY ACTION                                                            │
│     ├─► Check stun → Skip if stunned                                        │
│     ├─► Check confusion → 50% self-hit if confused                          │
│     ├─► Select skill via EnemyAI                                            │
│     ├─► Calculate: CombatCalculation.calculateSkillUse()                    │
│     └─► Apply: CombatWorkflow.applyActionResult()                           │
│         ├─► Update player HP                                                │
│         ├─► Update enemy HP (if reflection)                                 │
│         ├─► Apply effects to both parties                                   │
│         └─► Handle Guts if lethal                                           │
│                                                                             │
│  5. DEATH CHECK (Attack)                                                    │
│     ├─► If player HP <= 0 → Combat ends (enemy wins)                        │
│     └─► If enemy HP <= 0 (reflection/confusion) → Combat ends (player wins) │
│                                                                             │
│  6. RESOURCE RECOVERY - PLAYER                                              │
│     ├─► Reduce all skill cooldowns by 1                                     │
│     └─► Restore chakra based on chakraRegen                                 │
│                                                                             │
│  7. TERRAIN HAZARDS                                                         │
│     ├─► Calculate: Hazard trigger chance                                    │
│     ├─► Calculate: Hazard damage to both parties                            │
│     └─► Apply: Damage with Guts check for player                            │
│                                                                             │
│  8. FINAL DEATH CHECK                                                       │
│     ├─► If enemy HP <= 0 → Combat ends (player wins)                        │
│     └─► If player HP <= 0 → Combat ends (enemy wins)                        │
│                                                                             │
│  → Transition to PLAYER TURN                                                │
│                                                                             │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## Benefits of Separation

### 1. Testability

```typescript
// BEFORE: Hard to test, need to mock state
describe('useSkill', () => {
  it('calculates damage correctly', () => {
    // Need full Player, Enemy, combat state...
    const result = useSkill(player, playerStats, enemy, enemyStats, skill, combatState);
    // Result includes state mutations mixed with calculations
  });
});

// AFTER: Pure functions are easy to test
describe('CombatCalculation', () => {
  it('calculates base damage correctly', () => {
    const damage = calculateBaseDamage(
      { strength: 20, spirit: 10, /* ... */ },
      { damageMult: 1.5, scalingStat: 'strength', /* ... */ }
    );
    expect(damage).toBe(30); // 20 * 1.5
  });

  it('applies element effectiveness', () => {
    const result = calculateElementEffectiveness(ElementType.FIRE, ElementType.WIND);
    expect(result.multiplier).toBe(1.5);
    expect(result.isSuperEffective).toBe(true);
  });
});
```

### 2. Reusability

```typescript
// Can use calculations without full combat context
const previewDamage = CombatCalculation.calculateBaseDamage(playerStats, skill);
// Show in skill tooltip without needing enemy

// Can simulate combat outcomes
const simulation = CombatCalculation.calculateSkillUse(player, enemy, skill, context);
// Preview result without applying it

// Can use for AI decision making
const potentialOutcomes = skills.map(skill =>
  CombatCalculation.calculateSkillUse(enemy, player, skill, context)
);
const bestSkill = selectBestOutcome(potentialOutcomes);
```

### 3. Maintainability

```typescript
// BEFORE: Changing damage formula means touching state management code
function useSkill(/*...*/) {
  // ... resource checks ...
  // ... state setup ...
  const damage = scalingValue * skill.damageMult; // Formula buried here
  // ... more state changes ...
  // ... effect application ...
  // ... cooldown updates ...
}

// AFTER: Clear separation of concerns
// Change calculation: Only touch CombatCalculationSystem
// Change workflow: Only touch CombatWorkflowSystem
function calculateBaseDamage(stats, skill) {
  return stats[skill.scalingStat] * skill.damageMult;
}
```

### 4. Debugging

```typescript
// AFTER: Can log the complete result before application
const result = CombatCalculation.calculateSkillUse(attacker, defender, skill, context);

console.log('Combat Calculation Result:', {
  hit: result.hit,
  rawDamage: result.rawDamage,
  elementMultiplier: result.elementMultiplier,
  criticalHit: result.criticalHit,
  defenseApplied: result.flatDefenseApplied + result.percentDefenseApplied,
  finalDamage: result.finalDamage,
  effectsToApply: result.effectsOnTarget
});

// Then apply if looks correct
const newState = CombatWorkflow.applyActionResult(state, result, 'player');
```

---

## Migration Strategy

### Phase 1: Extract Calculation Functions
1. Create `CombatCalculationSystem.ts`
2. Move pure calculation logic from `StatSystem.ts` and `CombatSystem.ts`
3. Keep existing functions as wrappers that call new system
4. Add comprehensive unit tests

### Phase 2: Define Result Interfaces
1. Create detailed `CombatActionResult` interface
2. Create supporting interfaces (`HitCheckResult`, `DefenseResult`, etc.)
3. Ensure all information needed for workflow is captured

### Phase 3: Create Workflow System
1. Create `CombatWorkflowSystem.ts`
2. Implement state management functions
3. Implement phase handlers
4. Add integration tests

### Phase 4: Integrate Systems
1. Update `useSkill` to use new systems
2. Update `processEnemyTurn` to use new systems
3. Verify all existing functionality works
4. Remove deprecated code

### Phase 5: UI Integration
1. Update `Combat.tsx` to use new workflow system
2. Ensure combat logs work correctly
3. Test all edge cases (guts, reflection, shields, etc.)

---

## File Structure (Proposed)

```
src/game/systems/
├── combat/
│   ├── index.ts                      # Public exports
│   ├── CombatCalculationSystem.ts    # Pure calculation functions
│   ├── CombatWorkflowSystem.ts       # State management
│   ├── types.ts                      # Combat-specific interfaces
│   └── __tests__/
│       ├── CombatCalculation.test.ts
│       └── CombatWorkflow.test.ts
├── StatSystem.ts                     # Keep for stat calculations
├── EnemyAISystem.ts                  # Keep for AI logic
└── ApproachSystem.ts                 # Keep for approach mechanics
```

---

## Open Questions

1. **Random Seed Control** - Should calculation functions accept random seeds for deterministic testing?

2. **Event System** - Should workflow emit events for UI updates, or return logs in state?

3. **Validation** - Where should skill validation live (can use skill, has resources)?

4. **State Immutability** - Use Immer or manual spread operators for state updates?

5. **Async Operations** - Should enemy turn be async for animation timing?

6. **Combat History** - Track full action history for replay/undo?

---

## Summary

| Aspect | CombatCalculationSystem | CombatWorkflowSystem |
|--------|-------------------------|----------------------|
| **Purpose** | Compute combat math | Manage combat state |
| **Functions** | Pure, stateless | Stateful, orchestration |
| **Inputs** | Stats, skills, context | State + calculation results |
| **Outputs** | Result objects | Updated state |
| **Side Effects** | None | State mutations, logs |
| **Testability** | Unit tests | Integration tests |
| **Reusability** | High (tooltips, AI, preview) | Lower (tied to combat flow) |

This separation follows the **Command Pattern** where:
- **CombatCalculationSystem** computes what SHOULD happen
- **CombatWorkflowSystem** applies what DID happen to state

The result is cleaner, more maintainable, and easier to test code.
