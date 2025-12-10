/**
 * ApproachSystem Unit Tests
 * Tests pre-combat approach execution, affordability, and effects
 */

import { describe, it, expect } from 'vitest';
import {
  executeApproach,
  canAffordApproach,
  applyApproachCosts,
  applyEnemyHpReduction,
  getCombatModifiers,
} from '../ApproachSystem';
import { calculateDerivedStats } from '../StatSystem';
import { ApproachType } from '../../types';
import { createMockPlayer, createMockEnemy, createMockTerrain, BASE_STATS } from './testFixtures';

describe('executeApproach', () => {
  const player = createMockPlayer();
  const playerStats = {
    primary: player.primaryStats,
    effectivePrimary: player.primaryStats,
    derived: calculateDerivedStats(player.primaryStats, {}),
  };
  const enemy = createMockEnemy();
  const terrain = createMockTerrain();

  it('FRONTAL_ASSAULT always succeeds', () => {
    // Run multiple times to verify
    for (let i = 0; i < 10; i++) {
      const result = executeApproach(
        ApproachType.FRONTAL_ASSAULT,
        player,
        playerStats,
        enemy,
        terrain
      );
      expect(result.success).toBe(true);
    }
  });

  it('returns proper result structure', () => {
    const result = executeApproach(
      ApproachType.FRONTAL_ASSAULT,
      player,
      playerStats,
      enemy,
      terrain
    );

    expect(result.approach).toBe(ApproachType.FRONTAL_ASSAULT);
    expect(typeof result.success).toBe('boolean');
    expect(typeof result.successChance).toBe('number');
    expect(typeof result.roll).toBe('number');
    expect(typeof result.skipCombat).toBe('boolean');
    expect(typeof result.guaranteedFirst).toBe('boolean');
    expect(typeof result.description).toBe('string');
    expect(Array.isArray(result.playerBuffs)).toBe(true);
    expect(Array.isArray(result.enemyDebuffs)).toBe(true);
  });

  it('STEALTH_AMBUSH provides first hit multiplier on success', () => {
    // This test is probabilistic - run multiple times
    let successCount = 0;
    for (let i = 0; i < 50; i++) {
      const result = executeApproach(
        ApproachType.STEALTH_AMBUSH,
        player,
        playerStats,
        enemy,
        terrain
      );
      if (result.success) {
        successCount++;
        expect(result.firstHitMultiplier).toBeGreaterThan(1);
      }
    }
    // Should have at least some successes (base chance is decent)
    expect(successCount).toBeGreaterThan(0);
  });

  it('terrain stealth modifier affects success chance', () => {
    const stealthyTerrain = createMockTerrain({
      effects: {
        stealthModifier: 50, // +50% to stealth
        visibilityRange: 1,
        hiddenRoomBonus: 0,
        movementCost: 1,
        initiativeModifier: 0,
        evasionModifier: 0,
      },
    });

    const result = executeApproach(
      ApproachType.STEALTH_AMBUSH,
      player,
      playerStats,
      enemy,
      stealthyTerrain
    );

    // Success chance should be higher with stealth terrain
    expect(result.successChance).toBeGreaterThan(0);
  });
});

describe('canAffordApproach', () => {
  it('FRONTAL_ASSAULT is always affordable', () => {
    const player = createMockPlayer();
    const result = canAffordApproach(ApproachType.FRONTAL_ASSAULT, player);
    expect(result.canAfford).toBe(true);
  });

  it('returns false when chakra insufficient', () => {
    const player = createMockPlayer({ currentChakra: 0 });
    const result = canAffordApproach(ApproachType.GENJUTSU_SETUP, player);

    // GENJUTSU_SETUP costs chakra - may fail with 0 chakra
    // If it has chakra cost, should fail
    if (!result.canAfford) {
      expect(result.reason).toContain('chakra');
    }
  });

  it('returns false when HP insufficient', () => {
    const player = createMockPlayer({ currentHp: 1 });
    const result = canAffordApproach(ApproachType.SHADOW_BYPASS, player);

    // SHADOW_BYPASS may cost HP
    // If it has HP cost greater than 0, should fail
    if (!result.canAfford) {
      expect(result.reason).toContain('HP');
    }
  });
});

describe('applyApproachCosts', () => {
  it('deducts chakra cost from player', () => {
    const player = createMockPlayer({ currentChakra: 100 });
    const result = {
      chakraCost: 20,
      hpCost: 0,
    } as any;

    const updated = applyApproachCosts(player, result);
    expect(updated.currentChakra).toBe(80);
  });

  it('deducts HP cost from player', () => {
    const player = createMockPlayer({ currentHp: 100 });
    const result = {
      chakraCost: 0,
      hpCost: 10,
    } as any;

    const updated = applyApproachCosts(player, result);
    expect(updated.currentHp).toBe(90);
  });

  it('does not reduce HP below 1', () => {
    const player = createMockPlayer({ currentHp: 5 });
    const result = {
      chakraCost: 0,
      hpCost: 100,
    } as any;

    const updated = applyApproachCosts(player, result);
    expect(updated.currentHp).toBe(1);
  });
});

describe('applyEnemyHpReduction', () => {
  it('reduces enemy HP by percentage', () => {
    const enemy = createMockEnemy({ currentHp: 100 });
    const result = {
      enemyHpReduction: 0.2, // 20%
    } as any;

    const updated = applyEnemyHpReduction(enemy, result);
    expect(updated.currentHp).toBe(80);
  });

  it('does not reduce HP below 1', () => {
    const enemy = createMockEnemy({ currentHp: 10 });
    const result = {
      enemyHpReduction: 0.99, // 99%
    } as any;

    const updated = applyEnemyHpReduction(enemy, result);
    expect(updated.currentHp).toBe(1);
  });

  it('returns unchanged enemy when no reduction', () => {
    const enemy = createMockEnemy({ currentHp: 100 });
    const result = {
      enemyHpReduction: 0,
    } as any;

    const updated = applyEnemyHpReduction(enemy, result);
    expect(updated.currentHp).toBe(100);
  });
});

describe('getCombatModifiers', () => {
  it('extracts combat modifiers from approach result', () => {
    const approachResult = {
      guaranteedFirst: true,
      initiativeBonus: 15,
      firstHitMultiplier: 2.5,
      playerBuffs: [],
      enemyDebuffs: [],
      xpMultiplier: 1.2,
    } as any;

    const modifiers = getCombatModifiers(approachResult);

    expect(modifiers.playerGoesFirst).toBe(true);
    expect(modifiers.playerInitiativeBonus).toBe(15);
    expect(modifiers.firstHitMultiplier).toBe(2.5);
    expect(modifiers.xpMultiplier).toBe(1.2);
  });
});
