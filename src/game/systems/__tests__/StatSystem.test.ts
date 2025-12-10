/**
 * StatSystem Unit Tests
 * Tests critical stat calculation functions
 */

import { describe, it, expect } from 'vitest';
import {
  calculateDerivedStats,
  calculateDotDamage,
  applyBuffsToPrimaryStats,
  checkGuts,
  calculateDamage,
  aggregateEquipmentBonuses,
  resistStatus,
  canLearnSkill,
} from '../StatSystem';
import { getElementEffectiveness } from '../../constants';
import { ElementType, EquipmentSlot, Clan, AttackMethod, SkillTier, ActionType } from '../../types';
import { STAT_FORMULAS, DamageType, DamageProperty } from '../../types';
import {
  BASE_STATS,
  HIGH_STATS,
  ZERO_STATS,
  createStatBuff,
  createStatDebuff,
  createMockSkill,
  createMockComponent,
} from './testFixtures';
import { PrimaryStat } from '../../types';

const F = STAT_FORMULAS;

describe('calculateDerivedStats', () => {
  describe('resource pools', () => {
    it('calculates maxHp correctly', () => {
      const derived = calculateDerivedStats(BASE_STATS, {});
      // Formula: HP_BASE + (willpower × HP_PER_WILLPOWER)
      // 50 + (10 × 12) = 170
      expect(derived.maxHp).toBe(F.HP_BASE + BASE_STATS.willpower * F.HP_PER_WILLPOWER);
    });

    it('calculates maxChakra correctly', () => {
      const derived = calculateDerivedStats(BASE_STATS, {});
      // Formula: CHAKRA_BASE + (chakra × CHAKRA_PER_CHAKRA)
      // 30 + (10 × 8) = 110
      expect(derived.maxChakra).toBe(F.CHAKRA_BASE + BASE_STATS.chakra * F.CHAKRA_PER_CHAKRA);
    });
  });

  describe('soft caps', () => {
    it('caps critChance at 75%', () => {
      // Need very high dex to hit cap: (75 - 8) / 0.5 = 134
      const maxCritStats = { ...HIGH_STATS, dexterity: 200 };
      const derived = calculateDerivedStats(maxCritStats, {});
      expect(derived.critChance).toBe(75);
    });

    it('caps percent defense at 75%', () => {
      const derived = calculateDerivedStats(HIGH_STATS, {});
      // All defense types should be capped
      expect(derived.physicalDefensePercent).toBeLessThanOrEqual(0.75);
      expect(derived.elementalDefensePercent).toBeLessThanOrEqual(0.75);
      expect(derived.mentalDefensePercent).toBeLessThanOrEqual(0.75);
    });
  });

  describe('edge cases', () => {
    it('handles zero stats without errors', () => {
      const derived = calculateDerivedStats(ZERO_STATS, {});
      expect(derived.maxHp).toBe(F.HP_BASE); // Base HP only
      expect(derived.maxChakra).toBe(F.CHAKRA_BASE); // Base chakra only
      expect(derived.critChance).toBe(F.BASE_CRIT_CHANCE); // Base crit only
    });
  });
});

describe('applyBuffsToPrimaryStats', () => {
  it('applies buff multipliers (+25%) to targeted stat', () => {
    // Buffs only affect their targetStat
    const buff = createStatBuff(0.25, 3, PrimaryStat.STRENGTH);
    const result = applyBuffsToPrimaryStats(BASE_STATS, [buff]);

    // Only strength should be increased by 25%
    expect(result.strength).toBe(Math.floor(BASE_STATS.strength * 1.25));
    // Other stats unchanged
    expect(result.willpower).toBe(BASE_STATS.willpower);
  });

  it('applies debuff multipliers (-25%) to targeted stat', () => {
    const debuff = createStatDebuff(0.25, 3, PrimaryStat.STRENGTH);
    const result = applyBuffsToPrimaryStats(BASE_STATS, [debuff]);

    // Only strength should be decreased by 25%
    expect(result.strength).toBe(Math.floor(BASE_STATS.strength * 0.75));
    // Other stats unchanged
    expect(result.willpower).toBe(BASE_STATS.willpower);
  });

  it('ignores buffs without targetStat', () => {
    // Generic buff without targetStat should not affect any stats
    const buff = createStatBuff(0.25);
    const result = applyBuffsToPrimaryStats(BASE_STATS, [buff]);

    // All stats should remain unchanged
    expect(result.strength).toBe(BASE_STATS.strength);
    expect(result.willpower).toBe(BASE_STATS.willpower);
  });
});

describe('calculateDotDamage', () => {
  it('calculates base DoT damage', () => {
    const derived = calculateDerivedStats(BASE_STATS, {});
    const dotDamage = calculateDotDamage(50, undefined, undefined, derived);

    // DoT should deal damage (exact formula may vary)
    expect(dotDamage).toBeGreaterThan(0);
  });

  it('applies reduced defense to DoT (50% effectiveness)', () => {
    const lowDefStats = calculateDerivedStats(BASE_STATS, {});
    const highDefStats = calculateDerivedStats(HIGH_STATS, {});

    const lowDefDot = calculateDotDamage(100, DamageType.PHYSICAL, DamageProperty.NORMAL, lowDefStats);
    const highDefDot = calculateDotDamage(100, DamageType.PHYSICAL, DamageProperty.NORMAL, highDefStats);

    // High defense should reduce DoT damage but less effectively than normal damage
    expect(highDefDot).toBeLessThan(lowDefDot);
    // But shouldn't be 0 (defense at 50% effectiveness for DoT)
    expect(highDefDot).toBeGreaterThan(0);
  });
});

describe('checkGuts', () => {
  it('survives lethal damage with 100% guts chance', () => {
    const result = checkGuts(50, 100, 1.0); // 100% guts chance

    expect(result.survived).toBe(true);
    expect(result.newHp).toBe(1);
  });

  it('dies to lethal damage with 0% guts chance', () => {
    const result = checkGuts(50, 100, 0); // 0% guts chance

    expect(result.survived).toBe(false);
    expect(result.newHp).toBeLessThanOrEqual(0);
  });

  it('takes normal damage when not lethal', () => {
    const result = checkGuts(100, 50, 0); // Non-lethal damage

    expect(result.survived).toBe(true);
    expect(result.newHp).toBe(50); // 100 - 50 = 50
  });
});

describe('getElementEffectiveness', () => {
  it('follows element cycle: Fire > Wind > Lightning > Earth > Water > Fire', () => {
    // Advantages (1.2x)
    expect(getElementEffectiveness(ElementType.FIRE, ElementType.WIND)).toBe(1.2);
    expect(getElementEffectiveness(ElementType.WIND, ElementType.LIGHTNING)).toBe(1.2);
    expect(getElementEffectiveness(ElementType.LIGHTNING, ElementType.EARTH)).toBe(1.2);
    expect(getElementEffectiveness(ElementType.EARTH, ElementType.WATER)).toBe(1.2);
    expect(getElementEffectiveness(ElementType.WATER, ElementType.FIRE)).toBe(1.2);

    // Resistances (0.8x) - reverse matchups
    expect(getElementEffectiveness(ElementType.WIND, ElementType.FIRE)).toBe(0.8);
    expect(getElementEffectiveness(ElementType.LIGHTNING, ElementType.WIND)).toBe(0.8);
    expect(getElementEffectiveness(ElementType.EARTH, ElementType.LIGHTNING)).toBe(0.8);
    expect(getElementEffectiveness(ElementType.WATER, ElementType.EARTH)).toBe(0.8);
    expect(getElementEffectiveness(ElementType.FIRE, ElementType.WATER)).toBe(0.8);

    // Neutral (1.0x)
    expect(getElementEffectiveness(ElementType.FIRE, ElementType.FIRE)).toBe(1.0);
    expect(getElementEffectiveness(ElementType.PHYSICAL, ElementType.FIRE)).toBe(1.0);
    expect(getElementEffectiveness(ElementType.MENTAL, ElementType.WATER)).toBe(1.0);
  });
});

// ============================================================================
// NEW TESTS: calculateDamage
// ============================================================================

describe('calculateDamage', () => {
  const attackerDerived = calculateDerivedStats(BASE_STATS, {});
  const defenderDerived = calculateDerivedStats(BASE_STATS, {});

  it('calculates base damage from scaling stat and damage mult', () => {
    const skill = createMockSkill({
      damageMult: 2.0,
      scalingStat: PrimaryStat.STRENGTH,
      attackMethod: AttackMethod.AUTO, // Auto-hit for predictable testing
    });

    const result = calculateDamage(
      BASE_STATS,
      attackerDerived,
      BASE_STATS,
      defenderDerived,
      skill,
      ElementType.PHYSICAL,
      ElementType.WATER
    );

    // Base damage: strength(10) * damageMult(2.0) = 20
    // Should have some damage after defense
    expect(result.rawDamage).toBeGreaterThan(0);
    expect(result.isMiss).toBe(false);
    expect(result.isEvaded).toBe(false);
  });

  it('applies element effectiveness multiplier', () => {
    const fireSkill = createMockSkill({
      damageMult: 2.0,
      scalingStat: PrimaryStat.SPIRIT,
      damageType: DamageType.ELEMENTAL,
      attackMethod: AttackMethod.AUTO,
      element: ElementType.FIRE,
    });

    // Fire vs Wind (super effective)
    const superEffective = calculateDamage(
      BASE_STATS, attackerDerived, BASE_STATS, defenderDerived,
      fireSkill, ElementType.FIRE, ElementType.WIND
    );

    // Fire vs Water (resisted)
    const resisted = calculateDamage(
      BASE_STATS, attackerDerived, BASE_STATS, defenderDerived,
      fireSkill, ElementType.FIRE, ElementType.WATER
    );

    expect(superEffective.elementMultiplier).toBe(1.2);
    expect(resisted.elementMultiplier).toBe(0.8);
  });

  it('TRUE damage bypasses all defense', () => {
    const trueSkill = createMockSkill({
      damageMult: 3.0,
      scalingStat: PrimaryStat.STRENGTH,
      damageType: DamageType.TRUE,
      attackMethod: AttackMethod.AUTO,
    });

    const result = calculateDamage(
      BASE_STATS, attackerDerived, HIGH_STATS, calculateDerivedStats(HIGH_STATS, {}),
      trueSkill, ElementType.PHYSICAL, ElementType.WATER
    );

    // TRUE damage should have 0 flat and percent reduction
    expect(result.flatReduction).toBe(0);
    expect(result.percentReduction).toBe(0);
    expect(result.finalDamage).toBe(result.rawDamage);
  });

  it('PIERCING ignores flat defense', () => {
    const piercingSkill = createMockSkill({
      damageMult: 2.0,
      damageProperty: DamageProperty.PIERCING,
      attackMethod: AttackMethod.AUTO,
    });

    const result = calculateDamage(
      BASE_STATS, attackerDerived, BASE_STATS, defenderDerived,
      piercingSkill, ElementType.PHYSICAL, ElementType.WATER
    );

    expect(result.flatReduction).toBe(0);
    // Should still have percent reduction
    expect(result.percentReduction).toBeGreaterThanOrEqual(0);
  });
});

// ============================================================================
// NEW TESTS: aggregateEquipmentBonuses
// ============================================================================

describe('aggregateEquipmentBonuses', () => {
  it('combines stats from multiple equipment slots', () => {
    const equipment: Record<EquipmentSlot, any> = {
      [EquipmentSlot.SLOT_1]: createMockComponent(undefined, { strength: 10 }),
      [EquipmentSlot.SLOT_2]: createMockComponent(undefined, { strength: 5, speed: 8 }),
      [EquipmentSlot.SLOT_3]: null,
      [EquipmentSlot.SLOT_4]: null,
    };

    const bonuses = aggregateEquipmentBonuses(equipment);

    expect(bonuses.strength).toBe(15); // 10 + 5
    expect(bonuses.speed).toBe(8);
  });

  it('handles empty equipment', () => {
    const equipment: Record<EquipmentSlot, any> = {
      [EquipmentSlot.SLOT_1]: null,
      [EquipmentSlot.SLOT_2]: null,
      [EquipmentSlot.SLOT_3]: null,
      [EquipmentSlot.SLOT_4]: null,
    };

    const bonuses = aggregateEquipmentBonuses(equipment);

    expect(Object.keys(bonuses).length).toBe(0);
  });
});

// ============================================================================
// NEW TESTS: resistStatus
// ============================================================================

describe('resistStatus', () => {
  it('applies status with 100% chance and 0% resistance', () => {
    // Run multiple times to verify (since there's randomness)
    let applied = 0;
    for (let i = 0; i < 100; i++) {
      if (resistStatus(1.0, 0)) applied++;
    }
    expect(applied).toBe(100); // Should always apply
  });

  it('never applies status with 0% chance', () => {
    let applied = 0;
    for (let i = 0; i < 100; i++) {
      if (resistStatus(0, 0.5)) applied++;
    }
    expect(applied).toBe(0); // Should never apply
  });

  it('reduces effective chance based on resistance', () => {
    // 80% chance with 50% resistance = 40% effective chance
    // Statistical test: should apply roughly 40% of the time
    let applied = 0;
    const trials = 1000;
    for (let i = 0; i < trials; i++) {
      if (resistStatus(0.8, 0.5)) applied++;
    }
    // Allow for statistical variance (30-50% range)
    expect(applied).toBeGreaterThan(trials * 0.25);
    expect(applied).toBeLessThan(trials * 0.55);
  });
});

// ============================================================================
// NEW TESTS: canLearnSkill
// ============================================================================

describe('canLearnSkill', () => {
  it('allows learning skill with no requirements', () => {
    const skill = createMockSkill({ requirements: undefined });
    const result = canLearnSkill(skill, 10, 1, Clan.UZUMAKI);
    expect(result.canLearn).toBe(true);
  });

  it('blocks learning if intelligence too low', () => {
    const skill = createMockSkill({
      requirements: { intelligence: 20 },
    });
    const result = canLearnSkill(skill, 10, 1, Clan.UZUMAKI);
    expect(result.canLearn).toBe(false);
    expect(result.reason).toContain('Intelligence');
  });

  it('blocks learning if level too low', () => {
    const skill = createMockSkill({
      requirements: { level: 10 },
    });
    const result = canLearnSkill(skill, 20, 5, Clan.UZUMAKI);
    expect(result.canLearn).toBe(false);
    expect(result.reason).toContain('Level');
  });

  it('blocks learning if wrong clan', () => {
    const skill = createMockSkill({
      requirements: { clan: Clan.UCHIHA },
    });
    const result = canLearnSkill(skill, 20, 10, Clan.UZUMAKI);
    expect(result.canLearn).toBe(false);
    expect(result.reason).toContain('bloodline');
  });

  it('allows learning if all requirements met', () => {
    const skill = createMockSkill({
      requirements: { intelligence: 15, level: 5, clan: Clan.UCHIHA },
    });
    const result = canLearnSkill(skill, 20, 10, Clan.UCHIHA);
    expect(result.canLearn).toBe(true);
  });
});
