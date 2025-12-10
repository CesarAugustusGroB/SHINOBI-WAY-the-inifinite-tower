/**
 * EquipmentPassiveSystem Unit Tests
 * Tests equipment passive trigger processing and effect application
 */

import { describe, it, expect } from 'vitest';
import {
  processPassivesOnCombatStart,
  processPassivesOnHit,
  checkExecuteThreshold,
  checkGutsPassive,
  getTotalDefenseBypass,
  hasAllElementsPassive,
} from '../EquipmentPassiveSystem';
import { EquipmentSlot, PassiveEffectType, EffectType } from '../../types';
import { createMockPlayer, createMockEnemy, createMockArtifact } from './testFixtures';

describe('processPassivesOnCombatStart', () => {
  it('returns default result when no passives equipped', () => {
    const player = createMockPlayer();
    const enemy = createMockEnemy();

    const result = processPassivesOnCombatStart(player, enemy);

    expect(result.player).toBeDefined();
    expect(result.enemy).toBeDefined();
    expect(result.logs.length).toBe(0);
    expect(result.skipFirstSkillCost).toBe(false);
  });

  it('grants shield from SHIELD_ON_START passive', () => {
    const artifact = createMockArtifact();
    artifact.passive = {
      type: PassiveEffectType.SHIELD_ON_START,
      value: 50, // 50% of chakra
      triggerCondition: 'combat_start',
    };

    const player = createMockPlayer({
      currentChakra: 100,
      equipment: {
        [EquipmentSlot.SLOT_1]: artifact,
        [EquipmentSlot.SLOT_2]: null,
        [EquipmentSlot.SLOT_3]: null,
        [EquipmentSlot.SLOT_4]: null,
      },
    });
    const enemy = createMockEnemy();

    const result = processPassivesOnCombatStart(player, enemy);

    expect(result.player.activeBuffs.length).toBeGreaterThan(0);
    const shieldBuff = result.player.activeBuffs.find(b => b.effect.type === EffectType.SHIELD);
    expect(shieldBuff).toBeDefined();
    expect(shieldBuff!.effect.value).toBe(50); // 50% of 100 chakra
  });

  it('grants invulnerability from INVULNERABLE_FIRST_TURN', () => {
    const artifact = createMockArtifact();
    artifact.passive = {
      type: PassiveEffectType.INVULNERABLE_FIRST_TURN,
      triggerCondition: 'combat_start',
    };

    const player = createMockPlayer({
      equipment: {
        [EquipmentSlot.SLOT_1]: artifact,
        [EquipmentSlot.SLOT_2]: null,
        [EquipmentSlot.SLOT_3]: null,
        [EquipmentSlot.SLOT_4]: null,
      },
    });
    const enemy = createMockEnemy();

    const result = processPassivesOnCombatStart(player, enemy);

    const invulnBuff = result.player.activeBuffs.find(b => b.effect.type === EffectType.INVULNERABILITY);
    expect(invulnBuff).toBeDefined();
    expect(invulnBuff!.duration).toBe(1);
  });

  it('sets skipFirstSkillCost from FREE_FIRST_SKILL', () => {
    const artifact = createMockArtifact();
    artifact.passive = {
      type: PassiveEffectType.FREE_FIRST_SKILL,
      triggerCondition: 'combat_start',
    };

    const player = createMockPlayer({
      equipment: {
        [EquipmentSlot.SLOT_1]: artifact,
        [EquipmentSlot.SLOT_2]: null,
        [EquipmentSlot.SLOT_3]: null,
        [EquipmentSlot.SLOT_4]: null,
      },
    });
    const enemy = createMockEnemy();

    const result = processPassivesOnCombatStart(player, enemy);

    expect(result.skipFirstSkillCost).toBe(true);
  });
});

describe('processPassivesOnHit', () => {
  it('applies BLEED debuff to enemy on hit', () => {
    const artifact = createMockArtifact();
    artifact.passive = {
      type: PassiveEffectType.BLEED,
      value: 5,
      duration: 3,
      triggerCondition: 'on_hit',
    };

    const player = createMockPlayer({
      equipment: {
        [EquipmentSlot.SLOT_1]: artifact,
        [EquipmentSlot.SLOT_2]: null,
        [EquipmentSlot.SLOT_3]: null,
        [EquipmentSlot.SLOT_4]: null,
      },
    });
    const enemy = createMockEnemy();

    const result = processPassivesOnHit(player, enemy, 50, false);

    const bleedBuff = result.enemy.activeBuffs.find(b => b.effect.type === EffectType.BLEED);
    expect(bleedBuff).toBeDefined();
  });

  it('calculates LIFESTEAL based on damage dealt', () => {
    const artifact = createMockArtifact();
    artifact.passive = {
      type: PassiveEffectType.LIFESTEAL,
      value: 20, // 20% lifesteal
      triggerCondition: 'on_hit',
    };

    const player = createMockPlayer({
      equipment: {
        [EquipmentSlot.SLOT_1]: artifact,
        [EquipmentSlot.SLOT_2]: null,
        [EquipmentSlot.SLOT_3]: null,
        [EquipmentSlot.SLOT_4]: null,
      },
    });
    const enemy = createMockEnemy();

    const result = processPassivesOnHit(player, enemy, 100, false);

    expect(result.healToPlayer).toBe(20); // 20% of 100 damage
  });

  it('activates PIERCE_DEFENSE on critical hit', () => {
    const artifact = createMockArtifact();
    artifact.passive = {
      type: PassiveEffectType.PIERCE_DEFENSE,
      value: 50, // 50% pierce
      triggerCondition: 'on_crit',
    };

    const player = createMockPlayer({
      equipment: {
        [EquipmentSlot.SLOT_1]: artifact,
        [EquipmentSlot.SLOT_2]: null,
        [EquipmentSlot.SLOT_3]: null,
        [EquipmentSlot.SLOT_4]: null,
      },
    });
    const enemy = createMockEnemy();

    // Without crit - no defense bypass
    const normalResult = processPassivesOnHit(player, enemy, 50, false);
    expect(normalResult.defenseBypass).toBe(0);

    // With crit - defense bypass activates
    const critResult = processPassivesOnHit(player, enemy, 50, true);
    expect(critResult.defenseBypass).toBe(50);
  });
});

describe('checkExecuteThreshold', () => {
  it('returns false when enemy above threshold', () => {
    const artifact = createMockArtifact();
    artifact.passive = {
      type: PassiveEffectType.EXECUTE_THRESHOLD,
      value: 20, // 20% threshold
    };

    const player = createMockPlayer({
      equipment: {
        [EquipmentSlot.SLOT_1]: artifact,
        [EquipmentSlot.SLOT_2]: null,
        [EquipmentSlot.SLOT_3]: null,
        [EquipmentSlot.SLOT_4]: null,
      },
    });
    const enemy = createMockEnemy({ currentHp: 80 });

    expect(checkExecuteThreshold(player, enemy, 100)).toBe(false);
  });

  it('returns true when enemy below threshold', () => {
    const artifact = createMockArtifact();
    artifact.passive = {
      type: PassiveEffectType.EXECUTE_THRESHOLD,
      value: 20, // 20% threshold
    };

    const player = createMockPlayer({
      equipment: {
        [EquipmentSlot.SLOT_1]: artifact,
        [EquipmentSlot.SLOT_2]: null,
        [EquipmentSlot.SLOT_3]: null,
        [EquipmentSlot.SLOT_4]: null,
      },
    });
    const enemy = createMockEnemy({ currentHp: 15 });

    expect(checkExecuteThreshold(player, enemy, 100)).toBe(true);
  });

  it('returns false when no EXECUTE_THRESHOLD passive', () => {
    const player = createMockPlayer();
    const enemy = createMockEnemy({ currentHp: 10 });

    expect(checkExecuteThreshold(player, enemy, 100)).toBe(false);
  });
});

describe('checkGutsPassive', () => {
  it('returns hasGuts: false when no GUTS passive', () => {
    const player = createMockPlayer();

    const result = checkGutsPassive(player);

    expect(result.hasGuts).toBe(false);
    expect(result.healPercent).toBe(0);
  });

  it('returns guts info when GUTS passive equipped', () => {
    const artifact = createMockArtifact();
    artifact.passive = {
      type: PassiveEffectType.GUTS,
      value: 25, // Heal 25% on trigger
    };

    const player = createMockPlayer({
      equipment: {
        [EquipmentSlot.SLOT_1]: artifact,
        [EquipmentSlot.SLOT_2]: null,
        [EquipmentSlot.SLOT_3]: null,
        [EquipmentSlot.SLOT_4]: null,
      },
    });

    const result = checkGutsPassive(player);

    expect(result.hasGuts).toBe(true);
    expect(result.healPercent).toBe(25);
  });
});

describe('getTotalDefenseBypass', () => {
  it('returns 0 when no bypass passives', () => {
    const player = createMockPlayer();
    expect(getTotalDefenseBypass(player)).toBe(0);
  });

  it('sums bypass from multiple items', () => {
    const artifact1 = createMockArtifact();
    artifact1.passive = {
      type: PassiveEffectType.PIERCE_DEFENSE,
      value: 20, // Non-conditional pierce
    };

    const artifact2 = createMockArtifact();
    artifact2.passive = {
      type: PassiveEffectType.PIERCE_DEFENSE,
      value: 30,
    };

    const player = createMockPlayer({
      equipment: {
        [EquipmentSlot.SLOT_1]: artifact1,
        [EquipmentSlot.SLOT_2]: artifact2,
        [EquipmentSlot.SLOT_3]: null,
        [EquipmentSlot.SLOT_4]: null,
      },
    });

    expect(getTotalDefenseBypass(player)).toBe(50);
  });

  it('caps at 100%', () => {
    const artifact1 = createMockArtifact();
    artifact1.passive = { type: PassiveEffectType.PIERCE_DEFENSE, value: 60 };

    const artifact2 = createMockArtifact();
    artifact2.passive = { type: PassiveEffectType.PIERCE_DEFENSE, value: 60 };

    const player = createMockPlayer({
      equipment: {
        [EquipmentSlot.SLOT_1]: artifact1,
        [EquipmentSlot.SLOT_2]: artifact2,
        [EquipmentSlot.SLOT_3]: null,
        [EquipmentSlot.SLOT_4]: null,
      },
    });

    expect(getTotalDefenseBypass(player)).toBe(100);
  });
});

describe('hasAllElementsPassive', () => {
  it('returns false when no ALL_ELEMENTS passive', () => {
    const player = createMockPlayer();
    expect(hasAllElementsPassive(player)).toBe(false);
  });

  it('returns true when ALL_ELEMENTS passive equipped', () => {
    const artifact = createMockArtifact();
    artifact.passive = {
      type: PassiveEffectType.ALL_ELEMENTS,
    };

    const player = createMockPlayer({
      equipment: {
        [EquipmentSlot.SLOT_1]: artifact,
        [EquipmentSlot.SLOT_2]: null,
        [EquipmentSlot.SLOT_3]: null,
        [EquipmentSlot.SLOT_4]: null,
      },
    });

    expect(hasAllElementsPassive(player)).toBe(true);
  });
});
