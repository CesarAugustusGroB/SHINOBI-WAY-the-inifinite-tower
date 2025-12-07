/**
 * Skill Selection AI - Automated skill selection for battle simulation
 * Scores skills based on damage potential, efficiency, and tactical value
 */

import {
  Skill,
  PrimaryAttributes,
  DerivedStats,
  ElementType,
  EffectType,
  DamageType,
  AttackMethod
} from '../game/types';
import { calculateDamage } from '../game/systems/StatSystem';
import { getElementEffectiveness } from '../game/constants';
import { SimCombatant } from './types';

// ============================================================================
// SCORING WEIGHTS
// ============================================================================

const SCORING_WEIGHTS = {
  // Base damage contribution
  DAMAGE_WEIGHT: 1.0,

  // Elemental bonuses
  SUPER_EFFECTIVE_BONUS: 50,
  RESISTED_PENALTY: -30,

  // Tactical bonuses
  FINISH_POTENTIAL_BONUS: 200,   // Can kill enemy this turn
  STUN_BONUS: 40,
  DOT_BONUS: 25,
  DEBUFF_BONUS: 20,
  SHIELD_BONUS: 30,

  // Crit bonuses
  CRIT_BONUS_WEIGHT: 2,

  // Efficiency (damage per chakra)
  EFFICIENCY_WEIGHT: 0.5,

  // Penalty for being unable to use
  UNAVAILABLE_PENALTY: -10000,

  // Preference for TRUE damage
  TRUE_DAMAGE_BONUS: 30,

  // Preference for PIERCING
  PIERCING_BONUS: 15,

  // Preference for AUTO hit
  AUTO_HIT_BONUS: 20
};

// ============================================================================
// SKILL SCORING
// ============================================================================

export interface SkillScore {
  skill: Skill;
  score: number;
  reasons: string[];
}

/**
 * Score a skill for the current combat situation
 */
export function scoreSkill(
  skill: Skill,
  attacker: SimCombatant,
  attackerDerived: DerivedStats,
  defender: SimCombatant,
  defenderDerived: DerivedStats,
  isFirstTurn: boolean = false,
  firstHitMultiplier: number = 1.0
): SkillScore {
  const reasons: string[] = [];
  let score = 0;

  // Check if skill is usable
  if (skill.currentCooldown > 0) {
    return { skill, score: SCORING_WEIGHTS.UNAVAILABLE_PENALTY, reasons: ['On cooldown'] };
  }

  if (attacker.currentChakra < skill.chakraCost) {
    return { skill, score: SCORING_WEIGHTS.UNAVAILABLE_PENALTY, reasons: ['Not enough chakra'] };
  }

  if (attacker.currentHp <= skill.hpCost) {
    return { skill, score: SCORING_WEIGHTS.UNAVAILABLE_PENALTY, reasons: ['Would kill self'] };
  }

  // Calculate expected damage
  const damageResult = calculateDamage(
    attacker.primaryStats,
    attackerDerived,
    defender.primaryStats,
    defenderDerived,
    skill,
    attacker.element,
    defender.element
  );

  // Base damage score
  let expectedDamage = damageResult.finalDamage;

  // Apply first hit multiplier if applicable
  if (isFirstTurn && firstHitMultiplier > 1.0) {
    expectedDamage = Math.floor(expectedDamage * firstHitMultiplier);
    reasons.push(`First hit bonus (${firstHitMultiplier}x)`);
  }

  score += expectedDamage * SCORING_WEIGHTS.DAMAGE_WEIGHT;
  reasons.push(`Expected damage: ${expectedDamage}`);

  // Elemental effectiveness
  const elementMult = getElementEffectiveness(skill.element, defender.element);
  if (elementMult > 1.0) {
    score += SCORING_WEIGHTS.SUPER_EFFECTIVE_BONUS;
    reasons.push('Super effective!');
  } else if (elementMult < 1.0) {
    score += SCORING_WEIGHTS.RESISTED_PENALTY;
    reasons.push('Resisted');
  }

  // Finish potential - can this skill kill the enemy?
  if (expectedDamage >= defender.currentHp) {
    score += SCORING_WEIGHTS.FINISH_POTENTIAL_BONUS;
    reasons.push('Can finish enemy!');
  }

  // Effect bonuses
  if (skill.effects) {
    for (const effect of skill.effects) {
      switch (effect.type) {
        case EffectType.STUN:
          score += SCORING_WEIGHTS.STUN_BONUS;
          reasons.push('Has stun');
          break;
        case EffectType.BLEED:
        case EffectType.BURN:
        case EffectType.POISON:
        case EffectType.DOT:
          score += SCORING_WEIGHTS.DOT_BONUS;
          reasons.push('Has DoT');
          break;
        case EffectType.DEBUFF:
          score += SCORING_WEIGHTS.DEBUFF_BONUS;
          reasons.push('Has debuff');
          break;
        case EffectType.SHIELD:
          // Prefer shields when low HP
          const hpPercent = attacker.currentHp / attacker.maxHp;
          if (hpPercent < 0.5) {
            score += SCORING_WEIGHTS.SHIELD_BONUS * 2;
            reasons.push('Shield (low HP)');
          } else {
            score += SCORING_WEIGHTS.SHIELD_BONUS;
            reasons.push('Has shield');
          }
          break;
      }
    }
  }

  // Crit bonus
  if (skill.critBonus) {
    score += skill.critBonus * SCORING_WEIGHTS.CRIT_BONUS_WEIGHT;
    reasons.push(`Crit bonus: +${skill.critBonus}%`);
  }

  // TRUE damage bonus
  if (skill.damageType === DamageType.TRUE) {
    score += SCORING_WEIGHTS.TRUE_DAMAGE_BONUS;
    reasons.push('TRUE damage');
  }

  // Piercing bonus
  if (skill.penetration) {
    score += SCORING_WEIGHTS.PIERCING_BONUS;
    reasons.push('Piercing');
  }

  // Auto-hit bonus
  if (skill.attackMethod === AttackMethod.AUTO) {
    score += SCORING_WEIGHTS.AUTO_HIT_BONUS;
    reasons.push('Cannot miss');
  }

  // Efficiency score (damage per chakra)
  if (skill.chakraCost > 0 && expectedDamage > 0) {
    const efficiency = expectedDamage / skill.chakraCost;
    score += efficiency * SCORING_WEIGHTS.EFFICIENCY_WEIGHT;
    reasons.push(`Efficiency: ${efficiency.toFixed(2)}/chakra`);
  }

  return { skill, score, reasons };
}

/**
 * Select the best skill for the current situation
 */
export function selectBestSkill(
  skills: Skill[],
  attacker: SimCombatant,
  attackerDerived: DerivedStats,
  defender: SimCombatant,
  defenderDerived: DerivedStats,
  isFirstTurn: boolean = false,
  firstHitMultiplier: number = 1.0
): Skill {
  const scores = skills.map(skill =>
    scoreSkill(skill, attacker, attackerDerived, defender, defenderDerived, isFirstTurn, firstHitMultiplier)
  );

  // Sort by score descending
  scores.sort((a, b) => b.score - a.score);

  // Return the best usable skill
  for (const scored of scores) {
    if (scored.score > SCORING_WEIGHTS.UNAVAILABLE_PENALTY) {
      return scored.skill;
    }
  }

  // Fallback to first skill (should be basic attack)
  return skills[0];
}

/**
 * Get all skill scores for debugging
 */
export function getAllSkillScores(
  skills: Skill[],
  attacker: SimCombatant,
  attackerDerived: DerivedStats,
  defender: SimCombatant,
  defenderDerived: DerivedStats,
  isFirstTurn: boolean = false,
  firstHitMultiplier: number = 1.0
): SkillScore[] {
  return skills
    .map(skill =>
      scoreSkill(skill, attacker, attackerDerived, defender, defenderDerived, isFirstTurn, firstHitMultiplier)
    )
    .sort((a, b) => b.score - a.score);
}

// ============================================================================
// AI STRATEGIES
// ============================================================================

export enum AIStrategy {
  AGGRESSIVE = 'AGGRESSIVE',   // Maximize damage
  DEFENSIVE = 'DEFENSIVE',     // Prioritize survival
  BURST = 'BURST',             // Use strongest skills first
  CONTROL = 'CONTROL'          // Prioritize CC
}

/**
 * Select skill based on strategy
 */
export function selectSkillByStrategy(
  skills: Skill[],
  attacker: SimCombatant,
  attackerDerived: DerivedStats,
  defender: SimCombatant,
  defenderDerived: DerivedStats,
  strategy: AIStrategy,
  isFirstTurn: boolean = false,
  firstHitMultiplier: number = 1.0
): Skill {
  const hpPercent = attacker.currentHp / attacker.maxHp;

  // Auto-switch to defensive when low HP
  if (hpPercent < 0.25 && strategy !== AIStrategy.DEFENSIVE) {
    strategy = AIStrategy.DEFENSIVE;
  }

  // Get base scores
  const scores = getAllSkillScores(
    skills, attacker, attackerDerived, defender, defenderDerived, isFirstTurn, firstHitMultiplier
  );

  switch (strategy) {
    case AIStrategy.AGGRESSIVE:
      // Already sorted by damage potential
      return scores[0]?.skill || skills[0];

    case AIStrategy.DEFENSIVE:
      // Boost shield/heal skills
      for (const scored of scores) {
        if (scored.skill.effects?.some(e =>
          e.type === EffectType.SHIELD ||
          e.type === EffectType.HEAL ||
          e.type === EffectType.REGEN
        )) {
          if (scored.score > SCORING_WEIGHTS.UNAVAILABLE_PENALTY) {
            return scored.skill;
          }
        }
      }
      return scores[0]?.skill || skills[0];

    case AIStrategy.BURST:
      // Prefer high damage, high cooldown skills
      const burst = scores
        .filter(s => s.score > SCORING_WEIGHTS.UNAVAILABLE_PENALTY)
        .sort((a, b) => b.skill.damageMult - a.skill.damageMult);
      return burst[0]?.skill || skills[0];

    case AIStrategy.CONTROL:
      // Prefer CC skills
      for (const scored of scores) {
        if (scored.skill.effects?.some(e =>
          e.type === EffectType.STUN ||
          e.type === EffectType.CONFUSION ||
          e.type === EffectType.SILENCE
        )) {
          if (scored.score > SCORING_WEIGHTS.UNAVAILABLE_PENALTY) {
            return scored.skill;
          }
        }
      }
      return scores[0]?.skill || skills[0];

    default:
      return scores[0]?.skill || skills[0];
  }
}
