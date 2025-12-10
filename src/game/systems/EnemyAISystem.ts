/**
 * =============================================================================
 * ENEMY AI SYSTEM - Strategic Skill Selection for Enemies
 * =============================================================================
 *
 * This system provides intelligent skill selection for enemies based on:
 * - Enemy's current HP (self-preservation)
 * - Player's current HP (finishing low HP players)
 * - Skill effects (debuffs, healing, damage)
 * - Cooldowns (only available skills)
 *
 * ## AI Priority Order:
 * 1. Self-heal when HP is below 30%
 * 2. Finish off low HP players (below 20%)
 * 3. Apply debuffs to healthy players (above 50%)
 * 4. Use high-damage skills strategically
 * 5. Add small randomness to prevent predictability
 *
 * =============================================================================
 */

import {
  Enemy,
  Player,
  Skill,
  CharacterStats,
  EffectType,
} from '../types';

/**
 * Context provided to the AI for decision making
 */
export interface AIContext {
  enemy: Enemy;
  enemyStats: CharacterStats;
  player: Player;
  playerStats: CharacterStats;
}

/**
 * A skill with its AI score and reasoning
 */
interface ScoredSkill {
  skill: Skill;
  score: number;
  reason: string;
}

/**
 * Check if a skill has a healing effect
 */
function hasHealEffect(skill: Skill): boolean {
  if (!skill.effects) return false;
  return skill.effects.some(e =>
    e.type === EffectType.HEAL ||
    e.type === EffectType.REGEN
  );
}

/**
 * Check if a skill has a debuff effect (stun, confusion, etc.)
 */
function hasDebuffEffect(skill: Skill): boolean {
  if (!skill.effects) return false;
  return skill.effects.some(e =>
    e.type === EffectType.STUN ||
    e.type === EffectType.CONFUSION ||
    e.type === EffectType.SILENCE ||
    e.type === EffectType.BLEED ||
    e.type === EffectType.BURN ||
    e.type === EffectType.POISON ||
    e.type === EffectType.CURSE
  );
}

/**
 * Check if a skill has a self-buff effect
 */
function hasSelfBuffEffect(skill: Skill): boolean {
  if (!skill.effects) return false;
  return skill.effects.some(e =>
    e.type === EffectType.BUFF ||
    e.type === EffectType.SHIELD ||
    e.type === EffectType.INVULNERABILITY ||
    e.type === EffectType.REFLECTION
  );
}

/**
 * Estimate the damage a skill would deal
 */
function estimateDamage(skill: Skill, enemyStats: CharacterStats): number {
  const scalingStatKey = skill.scalingStat.toLowerCase() as keyof typeof enemyStats.effectivePrimary;
  const scalingStat = enemyStats.effectivePrimary[scalingStatKey] || 10;
  return Math.floor(scalingStat * skill.damageMult);
}

/**
 * Selects the best skill for an enemy to use based on the current combat state.
 *
 * @param context - The AI decision context with enemy, player, and stats
 * @returns The selected skill to use
 */
export function selectEnemySkill(context: AIContext): Skill {
  const { enemy, enemyStats, player, playerStats } = context;

  // Get available skills (not on cooldown)
  const availableSkills = enemy.skills.filter(s => (s.currentCooldown || 0) <= 0);

  // Fallback: if no skills available, return first skill
  if (availableSkills.length === 0) {
    return enemy.skills[0];
  }

  // If only one skill available, use it
  if (availableSkills.length === 1) {
    return availableSkills[0];
  }

  // Score each available skill
  const scoredSkills: ScoredSkill[] = availableSkills.map(skill => {
    let score = 50; // Base score
    let reason = 'default';

    // Calculate HP percentages
    const enemyHpPercent = enemy.currentHp / enemyStats.derived.maxHp;
    const playerHpPercent = player.currentHp / playerStats.derived.maxHp;

    // PRIORITY 1: Self-preservation (heal when low HP)
    if (hasHealEffect(skill) && enemyHpPercent < 0.3) {
      score += 60;
      reason = 'self-heal at low HP';
    }

    // PRIORITY 2: Self-buff when moderately healthy
    if (hasSelfBuffEffect(skill) && enemyHpPercent > 0.4) {
      score += 25;
      reason = 'self-buff while healthy';
    }

    // PRIORITY 3: Finish off low HP player
    const estimatedDmg = estimateDamage(skill, enemyStats);
    if (playerHpPercent < 0.2 && estimatedDmg >= player.currentHp) {
      score += 50;
      reason = 'finish low HP player';
    }

    // PRIORITY 4: High damage skills when player is wounded but not critical
    if (playerHpPercent < 0.5 && playerHpPercent >= 0.2 && skill.damageMult > 1.5) {
      score += 20;
      reason = 'high damage on wounded player';
    }

    // PRIORITY 5: Apply debuffs to healthy players
    if (hasDebuffEffect(skill) && playerHpPercent > 0.5) {
      score += 30;
      reason = 'debuff healthy player';
    }

    // PRIORITY 6: Favor high-cooldown skills (use them when available)
    if (skill.cooldown >= 3) {
      score += 10;
      reason = reason === 'default' ? 'use powerful cooldown skill' : reason;
    }

    // PRIORITY 7: Element matching bonus (same element as enemy)
    if (skill.element === enemy.element) {
      score += 5;
    }

    // Add small randomness to prevent complete predictability (0-15)
    score += Math.random() * 15;

    return { skill, score, reason };
  });

  // Sort by score descending and return the best skill
  scoredSkills.sort((a, b) => b.score - a.score);

  return scoredSkills[0].skill;
}
