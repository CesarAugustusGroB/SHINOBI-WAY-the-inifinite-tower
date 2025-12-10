/**
 * EnemyAISystem Unit Tests
 * Tests enemy AI skill selection logic
 */

import { describe, it, expect } from 'vitest';
import { selectEnemySkill } from '../EnemyAISystem';
import { calculateDerivedStats } from '../StatSystem';
import { EffectType, ActionType, DamageType, DamageProperty, AttackMethod, ElementType, SkillTier } from '../../types';
import { createMockPlayer, createMockEnemy, createMockSkill, BASE_STATS } from './testFixtures';

describe('selectEnemySkill', () => {
  const playerStats = {
    primary: BASE_STATS,
    effectivePrimary: BASE_STATS,
    derived: calculateDerivedStats(BASE_STATS, {}),
  };

  const enemyStats = {
    primary: BASE_STATS,
    effectivePrimary: BASE_STATS,
    derived: calculateDerivedStats(BASE_STATS, {}),
  };

  it('returns a skill when called', () => {
    const basicAttack = createMockSkill({ id: 'basic', name: 'Basic Attack' });
    const enemy = createMockEnemy({ skills: [basicAttack] });
    const player = createMockPlayer();

    const context = { enemy, enemyStats, player, playerStats };
    const selectedSkill = selectEnemySkill(context);

    expect(selectedSkill).toBeDefined();
    expect(selectedSkill.id).toBe('basic');
  });

  it('returns first skill if all on cooldown', () => {
    const skill1 = createMockSkill({ id: 'skill1', currentCooldown: 3 });
    const skill2 = createMockSkill({ id: 'skill2', currentCooldown: 2 });
    const enemy = createMockEnemy({ skills: [skill1, skill2] });
    const player = createMockPlayer();

    const context = { enemy, enemyStats, player, playerStats };
    const selectedSkill = selectEnemySkill(context);

    // Should fallback to first skill
    expect(selectedSkill.id).toBe('skill1');
  });

  it('prefers heal skills when enemy HP is low', () => {
    const attackSkill = createMockSkill({ id: 'attack', name: 'Attack', damageMult: 2.0 });
    const healSkill = createMockSkill({
      id: 'heal',
      name: 'Heal',
      damageMult: 0,
      effects: [{ type: EffectType.HEAL, value: 50, duration: 0, chance: 1 }],
    });

    // Enemy with 20% HP (low)
    const lowHpEnemy = createMockEnemy({
      skills: [attackSkill, healSkill],
      currentHp: Math.floor(enemyStats.derived.maxHp * 0.2),
    });
    const player = createMockPlayer();

    // Run multiple times to account for randomness
    let healSelected = 0;
    for (let i = 0; i < 20; i++) {
      const context = { enemy: lowHpEnemy, enemyStats, player, playerStats };
      const selectedSkill = selectEnemySkill(context);
      if (selectedSkill.id === 'heal') healSelected++;
    }

    // Heal should be selected most of the time when HP is low
    expect(healSelected).toBeGreaterThan(10);
  });

  it('prefers debuffs against healthy players', () => {
    const attackSkill = createMockSkill({ id: 'attack', name: 'Attack', damageMult: 1.5 });
    const debuffSkill = createMockSkill({
      id: 'debuff',
      name: 'Stun',
      damageMult: 0.5,
      effects: [{ type: EffectType.STUN, duration: 1, chance: 1 }],
    });

    const enemy = createMockEnemy({
      skills: [attackSkill, debuffSkill],
      currentHp: enemyStats.derived.maxHp, // Full HP enemy
    });

    // Player with full HP
    const healthyPlayer = createMockPlayer({
      currentHp: playerStats.derived.maxHp,
    });

    // Run multiple times
    let debuffSelected = 0;
    for (let i = 0; i < 20; i++) {
      const context = { enemy, enemyStats, player: healthyPlayer, playerStats };
      const selectedSkill = selectEnemySkill(context);
      if (selectedSkill.id === 'debuff') debuffSelected++;
    }

    // Debuff should be selected more often against healthy players
    expect(debuffSelected).toBeGreaterThan(5);
  });

  it('prefers high damage skills to finish low HP player', () => {
    const lowDamageSkill = createMockSkill({ id: 'low', name: 'Poke', damageMult: 0.5 });
    const highDamageSkill = createMockSkill({ id: 'high', name: 'Nuke', damageMult: 5.0 });

    const enemy = createMockEnemy({
      skills: [lowDamageSkill, highDamageSkill],
    });

    // Player with very low HP (15%)
    const lowHpPlayer = createMockPlayer({
      currentHp: Math.floor(playerStats.derived.maxHp * 0.15),
    });

    // Run multiple times
    let highDamageSelected = 0;
    for (let i = 0; i < 20; i++) {
      const context = { enemy, enemyStats, player: lowHpPlayer, playerStats };
      const selectedSkill = selectEnemySkill(context);
      if (selectedSkill.id === 'high') highDamageSelected++;
    }

    // High damage should be preferred to finish off low HP player
    expect(highDamageSelected).toBeGreaterThan(10);
  });

  it('skips skills on cooldown', () => {
    const availableSkill = createMockSkill({ id: 'available', currentCooldown: 0 });
    const cooldownSkill = createMockSkill({ id: 'cooldown', currentCooldown: 3 });

    const enemy = createMockEnemy({
      skills: [cooldownSkill, availableSkill],
    });
    const player = createMockPlayer();

    const context = { enemy, enemyStats, player, playerStats };
    const selectedSkill = selectEnemySkill(context);

    // Should select the available skill
    expect(selectedSkill.id).toBe('available');
  });

  it('includes randomness in selection', () => {
    const skill1 = createMockSkill({ id: 'skill1', damageMult: 1.0 });
    const skill2 = createMockSkill({ id: 'skill2', damageMult: 1.0 });

    const enemy = createMockEnemy({
      skills: [skill1, skill2],
    });
    const player = createMockPlayer();

    // Run many times and check both skills are selected sometimes
    const selections: Record<string, number> = { skill1: 0, skill2: 0 };
    for (let i = 0; i < 50; i++) {
      const context = { enemy, enemyStats, player, playerStats };
      const selectedSkill = selectEnemySkill(context);
      selections[selectedSkill.id]++;
    }

    // Both skills should be selected at least sometimes (randomness)
    expect(selections.skill1).toBeGreaterThan(0);
    expect(selections.skill2).toBeGreaterThan(0);
  });
});
