/**
 * Equipment Passive Effect System
 *
 * Handles processing of artifact passive effects during combat.
 * Passives can trigger at various points: combat_start, on_hit, on_crit, on_kill, turn_start, below_half_hp
 */

import {
  Player,
  Enemy,
  Item,
  EquipmentSlot,
  PassiveEffect,
  PassiveEffectType,
  Buff,
  EffectType,
  DamageType,
  DamageProperty,
} from '../types';

const generateId = () => Math.random().toString(36).substring(2, 9);

/**
 * Get all equipped items with passives
 */
function getEquippedPassives(player: Player): { item: Item; passive: PassiveEffect }[] {
  const passives: { item: Item; passive: PassiveEffect }[] = [];

  for (const slot of Object.values(EquipmentSlot)) {
    const item = player.equipment[slot];
    if (item?.passive) {
      passives.push({ item, passive: item.passive });
    }
  }

  return passives;
}

/**
 * Result of processing passive effects
 */
export interface PassiveProcessResult {
  player: Player;
  enemy: Enemy;
  logs: string[];
  damageToEnemy: number;
  damageToPlayer: number;
  healToPlayer: number;
  chakraRestored: number;
  chakraDrained: number;
  skipFirstSkillCost: boolean;
  shouldCounter: boolean;
  defenseBypass: number; // Percentage of defense to ignore (0-100)
}

/**
 * Create a default result object
 */
function createDefaultResult(player: Player, enemy: Enemy): PassiveProcessResult {
  return {
    player: { ...player },
    enemy: { ...enemy },
    logs: [],
    damageToEnemy: 0,
    damageToPlayer: 0,
    healToPlayer: 0,
    chakraRestored: 0,
    chakraDrained: 0,
    skipFirstSkillCost: false,
    shouldCounter: false,
    defenseBypass: 0,
  };
}

/**
 * Process passive effects at combat start
 */
export function processPassivesOnCombatStart(
  player: Player,
  enemy: Enemy
): PassiveProcessResult {
  const result = createDefaultResult(player, enemy);
  const passives = getEquippedPassives(player);

  for (const { item, passive } of passives) {
    if (passive.triggerCondition && passive.triggerCondition !== 'combat_start') continue;

    switch (passive.type) {
      case PassiveEffectType.SHIELD_ON_START: {
        // Grant shield equal to % of max chakra
        const shieldValue = Math.floor(player.currentChakra * (passive.value || 50) / 100);
        const shieldBuff: Buff = {
          id: generateId(),
          name: EffectType.SHIELD,
          duration: 99, // Lasts until broken
          effect: { type: EffectType.SHIELD, value: shieldValue, duration: 99, chance: 1 },
          source: item.name,
        };
        result.player.activeBuffs = [...result.player.activeBuffs, shieldBuff];
        result.logs.push(`${item.name} grants ${shieldValue} Shield!`);
        break;
      }

      case PassiveEffectType.INVULNERABLE_FIRST_TURN: {
        const invulnBuff: Buff = {
          id: generateId(),
          name: EffectType.INVULNERABILITY,
          duration: 1,
          effect: { type: EffectType.INVULNERABILITY, duration: 1, chance: 1 },
          source: item.name,
        };
        result.player.activeBuffs = [...result.player.activeBuffs, invulnBuff];
        result.logs.push(`${item.name} grants Invulnerability for the first turn!`);
        break;
      }

      case PassiveEffectType.REFLECT: {
        // First attack reflection (100% reflect buff for first hit)
        const reflectBuff: Buff = {
          id: generateId(),
          name: EffectType.REFLECTION,
          duration: 1,
          effect: { type: EffectType.REFLECTION, value: (passive.value || 100) / 100, duration: 1, chance: 1 },
          source: item.name,
        };
        result.player.activeBuffs = [...result.player.activeBuffs, reflectBuff];
        result.logs.push(`${item.name} activates damage reflection!`);
        break;
      }

      case PassiveEffectType.FREE_FIRST_SKILL: {
        result.skipFirstSkillCost = true;
        result.logs.push(`${item.name}: First skill is free!`);
        break;
      }
    }
  }

  return result;
}

/**
 * Process passive effects when the player hits an enemy
 */
export function processPassivesOnHit(
  player: Player,
  enemy: Enemy,
  damageDealt: number,
  wasCrit: boolean
): PassiveProcessResult {
  const result = createDefaultResult(player, enemy);
  const passives = getEquippedPassives(player);

  for (const { item, passive } of passives) {
    // Handle on_hit triggers
    if (passive.triggerCondition === 'on_hit' || !passive.triggerCondition) {
      switch (passive.type) {
        case PassiveEffectType.BLEED: {
          // Apply bleed DoT to enemy
          const bleedBuff: Buff = {
            id: generateId(),
            name: EffectType.BLEED,
            duration: passive.duration || 3,
            effect: {
              type: EffectType.BLEED,
              value: passive.value || 5,
              duration: passive.duration || 3,
              chance: 1,
              damageType: DamageType.PHYSICAL,
              damageProperty: DamageProperty.PIERCING,
            },
            source: item.name,
          };
          result.enemy.activeBuffs = [...result.enemy.activeBuffs, bleedBuff];
          result.logs.push(`${item.name} applies Bleed!`);
          break;
        }

        case PassiveEffectType.BURN: {
          // Apply burn on hit (not crit-triggered burns, those are handled separately)
          const burnBuff: Buff = {
            id: generateId(),
            name: EffectType.BURN,
            duration: passive.duration || 3,
            effect: {
              type: EffectType.BURN,
              value: passive.value || 8,
              duration: passive.duration || 3,
              chance: 1,
              damageType: DamageType.ELEMENTAL,
            },
            source: item.name,
          };
          result.enemy.activeBuffs = [...result.enemy.activeBuffs, burnBuff];
          result.logs.push(`${item.name} applies Burn!`);
          break;
        }

        case PassiveEffectType.CHAKRA_DRAIN: {
          const drainAmount = passive.value || 10;
          result.chakraDrained = drainAmount;
          result.chakraRestored = drainAmount;
          result.logs.push(`${item.name} drains ${drainAmount} Chakra!`);
          break;
        }

        case PassiveEffectType.LIFESTEAL: {
          const healAmount = Math.floor(damageDealt * (passive.value || 15) / 100);
          result.healToPlayer = healAmount;
          result.logs.push(`${item.name}: Lifesteal heals ${healAmount} HP!`);
          break;
        }

        case PassiveEffectType.SEAL_CHANCE: {
          if (Math.random() * 100 < (passive.value || 10)) {
            const sealBuff: Buff = {
              id: generateId(),
              name: EffectType.STUN,
              duration: passive.duration || 1,
              effect: { type: EffectType.STUN, duration: passive.duration || 1, chance: 1 },
              source: item.name,
            };
            result.enemy.activeBuffs = [...result.enemy.activeBuffs, sealBuff];
            result.logs.push(`${item.name} Seals the enemy!`);
          }
          break;
        }
      }
    }

    // Handle on_crit triggers
    if (passive.triggerCondition === 'on_crit' && wasCrit) {
      switch (passive.type) {
        case PassiveEffectType.PIERCE_DEFENSE: {
          result.defenseBypass = Math.max(result.defenseBypass, passive.value || 100);
          result.logs.push(`${item.name}: Critical hit ignores ${passive.value || 100}% defense!`);
          break;
        }

        case PassiveEffectType.BURN: {
          const burnBuff: Buff = {
            id: generateId(),
            name: EffectType.BURN,
            duration: passive.duration || 3,
            effect: {
              type: EffectType.BURN,
              value: passive.value || 15,
              duration: passive.duration || 3,
              chance: 1,
              damageType: DamageType.ELEMENTAL,
            },
            source: item.name,
          };
          result.enemy.activeBuffs = [...result.enemy.activeBuffs, burnBuff];
          result.logs.push(`${item.name} applies massive Burn!`);
          break;
        }
      }
    }
  }

  // Check for permanent defense pierce (non-conditional)
  for (const { item, passive } of passives) {
    if (passive.type === PassiveEffectType.PIERCE_DEFENSE && !passive.triggerCondition) {
      result.defenseBypass = Math.max(result.defenseBypass, passive.value || 25);
    }
  }

  return result;
}

/**
 * Process passive effects at the start of player's turn
 */
export function processPassivesOnTurnStart(
  player: Player,
  enemy: Enemy
): PassiveProcessResult {
  const result = createDefaultResult(player, enemy);
  const passives = getEquippedPassives(player);

  for (const { item, passive } of passives) {
    if (passive.triggerCondition !== 'turn_start') continue;

    switch (passive.type) {
      case PassiveEffectType.REGEN: {
        const maxHp = player.currentHp; // Should use derived maxHp but approximating
        const healAmount = Math.floor(maxHp * (passive.value || 5) / 100);
        result.healToPlayer += healAmount;
        result.logs.push(`${item.name} regenerates ${healAmount} HP!`);
        break;
      }

      case PassiveEffectType.CHAKRA_RESTORE: {
        result.chakraRestored += passive.value || 10;
        result.logs.push(`${item.name} restores ${passive.value || 10} Chakra!`);
        break;
      }
    }
  }

  return result;
}

/**
 * Process passive effects on kill
 */
export function processPassivesOnKill(
  player: Player,
  enemy: Enemy
): PassiveProcessResult {
  const result = createDefaultResult(player, enemy);
  const passives = getEquippedPassives(player);

  for (const { item, passive } of passives) {
    if (passive.triggerCondition !== 'on_kill' && passive.type !== PassiveEffectType.COOLDOWN_RESET_ON_KILL) continue;

    switch (passive.type) {
      case PassiveEffectType.COOLDOWN_RESET_ON_KILL: {
        // Reset all skill cooldowns
        result.player.skills = result.player.skills.map(skill => ({
          ...skill,
          currentCooldown: 0,
        }));
        result.logs.push(`${item.name}: All cooldowns reset!`);
        break;
      }
    }
  }

  return result;
}

/**
 * Process passive effects when player is below half HP
 */
export function processPassivesBelowHalfHp(
  player: Player,
  enemy: Enemy,
  maxHp: number
): PassiveProcessResult {
  const result = createDefaultResult(player, enemy);

  // Only trigger if below 50% HP
  if (player.currentHp > maxHp / 2) return result;

  const passives = getEquippedPassives(player);

  for (const { item, passive } of passives) {
    if (passive.triggerCondition !== 'below_half_hp') continue;

    switch (passive.type) {
      case PassiveEffectType.DAMAGE_REDUCTION: {
        // This would need to be tracked as a combat modifier
        result.logs.push(`${item.name}: Taking ${passive.value || 15}% less damage while wounded!`);
        break;
      }
    }
  }

  return result;
}

/**
 * Check if player should counter-attack when hit
 */
export function shouldCounterAttack(player: Player): { shouldCounter: boolean; chance: number; source: string } {
  const passives = getEquippedPassives(player);

  for (const { item, passive } of passives) {
    if (passive.type === PassiveEffectType.COUNTER_ATTACK) {
      const chance = passive.value || 25;
      if (Math.random() * 100 < chance) {
        return { shouldCounter: true, chance, source: item.name };
      }
    }
  }

  return { shouldCounter: false, chance: 0, source: '' };
}

/**
 * Check if enemy is below execute threshold
 */
export function checkExecuteThreshold(player: Player, enemy: Enemy, maxEnemyHp: number): boolean {
  const passives = getEquippedPassives(player);

  for (const { passive } of passives) {
    if (passive.type === PassiveEffectType.EXECUTE_THRESHOLD) {
      const threshold = (passive.value || 20) / 100;
      if (enemy.currentHp / maxEnemyHp <= threshold) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Check for GUTS passive (survive lethal blow)
 */
export function checkGutsPassive(player: Player): { hasGuts: boolean; healPercent: number; source: string } {
  const passives = getEquippedPassives(player);

  for (const { item, passive } of passives) {
    if (passive.type === PassiveEffectType.GUTS) {
      return {
        hasGuts: true,
        healPercent: passive.value || 25,
        source: item.name,
      };
    }
  }

  return { hasGuts: false, healPercent: 0, source: '' };
}

/**
 * Get total defense bypass from all equipment
 */
export function getTotalDefenseBypass(player: Player): number {
  let totalBypass = 0;
  const passives = getEquippedPassives(player);

  for (const { passive } of passives) {
    if (passive.type === PassiveEffectType.PIERCE_DEFENSE && !passive.triggerCondition) {
      totalBypass += passive.value || 0;
    }
  }

  return Math.min(totalBypass, 100); // Cap at 100%
}

/**
 * Check if player has ALL_ELEMENTS passive (always super effective)
 */
export function hasAllElementsPassive(player: Player): boolean {
  const passives = getEquippedPassives(player);
  return passives.some(({ passive }) => passive.type === PassiveEffectType.ALL_ELEMENTS);
}

/**
 * Get any clan trait passives
 */
export function getClanTraitPassives(player: Player): PassiveEffectType[] {
  const passives = getEquippedPassives(player);
  const traits: PassiveEffectType[] = [];

  for (const { passive } of passives) {
    if ([
      PassiveEffectType.CLAN_TRAIT_UCHIHA,
      PassiveEffectType.CLAN_TRAIT_UZUMAKI,
      PassiveEffectType.CLAN_TRAIT_HYUGA,
      PassiveEffectType.CLAN_TRAIT_NARA,
    ].includes(passive.type)) {
      traits.push(passive.type);
    }
  }

  return traits;
}
