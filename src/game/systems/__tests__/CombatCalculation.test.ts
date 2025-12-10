/**
 * CombatCalculationSystem Unit Tests
 * Tests the damage mitigation pipeline and buff management
 */

import { describe, it, expect } from 'vitest';
import {
  applyMitigation,
  tickBuffDurations,
  getTerrainEvasionBonus,
  getTerrainInitiativeBonus,
  getTerrainElementAmplification,
  determineTurnOrder,
} from '../CombatCalculationSystem';
import { calculateDerivedStats } from '../StatSystem';
import { ElementType } from '../../types';
import {
  createShieldBuff,
  createCurseBuff,
  createReflectionBuff,
  createInvulnBuff,
  createPermanentBuff,
  createExpiringBuff,
  createMockTerrain,
  BASE_STATS,
} from './testFixtures';

describe('applyMitigation', () => {
  describe('invulnerability', () => {
    it('blocks all damage when invulnerable', () => {
      const buffs = [createInvulnBuff()];
      const result = applyMitigation(buffs, 100, 'Target');

      expect(result.finalDamage).toBe(0);
      expect(result.reflectedDamage).toBe(0);
    });
  });

  describe('shield mechanics', () => {
    it('absorbs damage fully when shield > damage', () => {
      const buffs = [createShieldBuff(200)];
      const result = applyMitigation(buffs, 100, 'Target');

      expect(result.finalDamage).toBe(0);
      // Shield should be reduced by damage amount
      const shieldBuff = result.updatedBuffs.find(b => b.id === 'test-shield');
      expect(shieldBuff?.effect.value).toBe(100); // 200 - 100
    });

    it('breaks shield and passes remaining damage when shield < damage', () => {
      const buffs = [createShieldBuff(50)];
      const result = applyMitigation(buffs, 100, 'Target');

      expect(result.finalDamage).toBe(50); // 100 - 50 shield
      // Shield should be removed
      const shieldBuff = result.updatedBuffs.find(b => b.id === 'test-shield');
      expect(shieldBuff).toBeUndefined();
    });
  });

  describe('curse mechanics', () => {
    it('amplifies damage by curse value', () => {
      const buffs = [createCurseBuff(0.5)]; // +50% damage
      const result = applyMitigation(buffs, 100, 'Target');

      expect(result.finalDamage).toBe(150); // 100 + 50%
    });
  });

  describe('reflection mechanics', () => {
    it('reflects damage back to attacker', () => {
      const buffs = [createReflectionBuff(0.3)]; // 30% reflected
      const result = applyMitigation(buffs, 100, 'Target');

      expect(result.reflectedDamage).toBe(30);
      // Note: reflection doesn't reduce incoming damage
      expect(result.finalDamage).toBe(100);
    });

    it('calculates reflection BEFORE curse amplification', () => {
      // This is important: reflection should be on original damage, not cursed damage
      const buffs = [createReflectionBuff(0.5), createCurseBuff(1.0)]; // 50% reflect, +100% damage
      const result = applyMitigation(buffs, 100, 'Target');

      // Reflection calculated on original 100 damage
      expect(result.reflectedDamage).toBe(50);
      // Final damage includes curse: 100 + 100% = 200
      expect(result.finalDamage).toBe(200);
    });
  });

  describe('mitigation order', () => {
    it('processes invuln -> reflect -> curse -> shield in order', () => {
      // Shield of 50, Curse +50%, Reflection 30%
      const buffs = [
        createShieldBuff(75),
        createCurseBuff(0.5),
        createReflectionBuff(0.3),
      ];
      const result = applyMitigation(buffs, 100, 'Target');

      // 1. Reflection: 30% of 100 = 30 reflected
      expect(result.reflectedDamage).toBe(30);

      // 2. Curse: 100 + 50% = 150
      // 3. Shield: 150 - 75 = 75 final damage
      expect(result.finalDamage).toBe(75);
    });
  });
});

describe('tickBuffDurations', () => {
  it('decrements buff durations by 1', () => {
    const buff = createShieldBuff(100, 3);
    const result = tickBuffDurations([buff]);

    expect(result[0].duration).toBe(2);
  });

  it('removes expired buffs (duration <= 1)', () => {
    const expiring = createExpiringBuff(); // duration 1
    const result = tickBuffDurations([expiring]);

    expect(result.length).toBe(0);
  });

  it('preserves permanent buffs (duration -1)', () => {
    const permanent = createPermanentBuff();
    const result = tickBuffDurations([permanent]);

    expect(result.length).toBe(1);
    expect(result[0].duration).toBe(-1);
  });

  it('handles mixed buff durations correctly', () => {
    const buffs = [
      createShieldBuff(100, 5), // stays
      createExpiringBuff(), // removed
      createPermanentBuff(), // stays
    ];
    const result = tickBuffDurations(buffs);

    expect(result.length).toBe(2);
    expect(result.find(b => b.id === 'test-shield')?.duration).toBe(4);
    expect(result.find(b => b.id === 'test-permanent')?.duration).toBe(-1);
  });
});

// ============================================================================
// NEW TESTS: Terrain Effects
// ============================================================================

describe('getTerrainEvasionBonus', () => {
  it('returns 0 for null terrain', () => {
    expect(getTerrainEvasionBonus(null)).toBe(0);
  });

  it('returns evasion modifier from terrain', () => {
    const terrain = createMockTerrain({
      effects: {
        stealthModifier: 0,
        visibilityRange: 2,
        hiddenRoomBonus: 0,
        movementCost: 1,
        initiativeModifier: 5,
        evasionModifier: 0.15, // +15% evasion
      },
    });
    expect(getTerrainEvasionBonus(terrain)).toBe(0.15);
  });
});

describe('getTerrainInitiativeBonus', () => {
  it('returns 0 for null terrain', () => {
    expect(getTerrainInitiativeBonus(null)).toBe(0);
  });

  it('returns initiative modifier from terrain', () => {
    const terrain = createMockTerrain({
      effects: {
        stealthModifier: 0,
        visibilityRange: 2,
        hiddenRoomBonus: 0,
        movementCost: 1,
        initiativeModifier: 10,
        evasionModifier: 0,
      },
    });
    expect(getTerrainInitiativeBonus(terrain)).toBe(10);
  });
});

describe('getTerrainElementAmplification', () => {
  it('returns 1.0 for null terrain', () => {
    expect(getTerrainElementAmplification(null, ElementType.FIRE)).toBe(1.0);
  });

  it('returns 1.0 when terrain has no element amplification', () => {
    const terrain = createMockTerrain();
    expect(getTerrainElementAmplification(terrain, ElementType.FIRE)).toBe(1.0);
  });

  it('returns amplified multiplier when element matches', () => {
    const terrain = createMockTerrain({
      effects: {
        stealthModifier: 0,
        visibilityRange: 2,
        hiddenRoomBonus: 0,
        movementCost: 1,
        initiativeModifier: 0,
        evasionModifier: 0,
        elementAmplify: ElementType.FIRE,
        elementAmplifyPercent: 25, // +25%
      },
    });
    expect(getTerrainElementAmplification(terrain, ElementType.FIRE)).toBe(1.25);
  });

  it('returns 1.0 when element does not match', () => {
    const terrain = createMockTerrain({
      effects: {
        stealthModifier: 0,
        visibilityRange: 2,
        hiddenRoomBonus: 0,
        movementCost: 1,
        initiativeModifier: 0,
        evasionModifier: 0,
        elementAmplify: ElementType.FIRE,
        elementAmplifyPercent: 25,
      },
    });
    expect(getTerrainElementAmplification(terrain, ElementType.WATER)).toBe(1.0);
  });
});

// ============================================================================
// NEW TESTS: Turn Order
// ============================================================================

describe('determineTurnOrder', () => {
  it('player goes first when approach guarantees first turn', () => {
    const playerStats = {
      primary: BASE_STATS,
      effectivePrimary: BASE_STATS,
      derived: calculateDerivedStats(BASE_STATS, {}),
    };
    const enemyStats = {
      primary: { ...BASE_STATS, speed: 50 }, // High enemy speed
      effectivePrimary: { ...BASE_STATS, speed: 50 },
      derived: calculateDerivedStats({ ...BASE_STATS, speed: 50 }, {}),
    };

    const combatState = {
      isFirstTurn: true,
      playerGoesFirst: true, // Approach success
      playerInitiativeBonus: 0,
      terrain: null,
    };

    // Player should always go first when approach succeeded
    expect(determineTurnOrder(playerStats, enemyStats, combatState)).toBe('player');
  });

  it('uses initiative calculation after first turn', () => {
    const fastStats = { ...BASE_STATS, speed: 50 };
    const slowStats = { ...BASE_STATS, speed: 5 };

    const fastPlayer = {
      primary: fastStats,
      effectivePrimary: fastStats,
      derived: calculateDerivedStats(fastStats, {}),
    };
    const slowEnemy = {
      primary: slowStats,
      effectivePrimary: slowStats,
      derived: calculateDerivedStats(slowStats, {}),
    };

    const combatState = {
      isFirstTurn: false,
      playerGoesFirst: false,
      playerInitiativeBonus: 0,
      terrain: null,
    };

    // Run multiple times due to small random factor
    let playerFirst = 0;
    for (let i = 0; i < 100; i++) {
      if (determineTurnOrder(fastPlayer, slowEnemy, combatState) === 'player') {
        playerFirst++;
      }
    }
    // Fast player should win most of the time (>80%)
    expect(playerFirst).toBeGreaterThan(80);
  });
});
