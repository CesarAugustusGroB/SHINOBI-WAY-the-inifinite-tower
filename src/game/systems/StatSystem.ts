/**
 * =============================================================================
 * STAT SYSTEM - Core Character Statistics Engine
 * =============================================================================
 *
 * This system handles all character stat calculations, from base attributes
 * through equipment and buffs to final derived combat values.
 *
 * ## STAT CALCULATION PIPELINE
 * The order of stat application is critical:
 * 1. Base Primary Stats (from clan + level ups)
 * 2. Equipment Bonuses (flat additions from gear)
 * 3. Passive Skill Bonuses (from PASSIVE action type skills)
 * 4. Buff Modifiers (multiplicative, applied last)
 * 5. Derived Stats (calculated from modified primary stats)
 *
 * ## PRIMARY STATS (9 Core Attributes)
 * Organized into 3 categories:
 *
 * ### BODY (Physical)
 * - WILLPOWER: HP pool, HP regen, Guts survival chance
 * - CHAKRA: Chakra pool size
 * - STRENGTH: Physical damage, Physical defense (flat + %)
 *
 * ### MIND (Mental)
 * - SPIRIT: Elemental defense (flat + %)
 * - INTELLIGENCE: Chakra regen, skill requirements
 * - CALMNESS: Mental defense, Status resistance
 *
 * ### TECHNIQUE (Combat Skills)
 * - SPEED: Melee hit rate, Evasion, Initiative
 * - ACCURACY: Ranged hit rate, Ranged crit damage
 * - DEXTERITY: Critical hit chance
 *
 * ## DEFENSE SYSTEM
 * Defense has two components that work together:
 * - FLAT Defense: Subtracts fixed damage (capped at 60% of incoming damage)
 * - PERCENT Defense: Reduces remaining damage by % (soft-capped at 75%)
 *
 * Percent defense uses diminishing returns formula:
 *   percentDef = stat / (stat + SOFT_CAP)
 * This prevents infinite stacking while rewarding investment.
 *
 * ## DAMAGE PROPERTIES
 * Skills can have different penetration behaviors:
 * - NORMAL: Both flat and % defense apply
 * - PIERCING: Ignores flat defense, only % applies
 * - ARMOR_BREAK: Ignores % defense, only flat applies
 * - TRUE damage (DamageType.TRUE): Bypasses ALL defense
 *
 * =============================================================================
 */

import {
  PrimaryAttributes,
  DerivedStats,
  CharacterStats,
  DamageType,
  DamageProperty,
  AttackMethod,
  Skill,
  Player,
  Enemy,
  DamageResult,
  ItemStatBonus,
  Item,
  ItemSlot,
  EquipmentSlot,
  Buff,
  EffectType,
  PrimaryStat,
  ElementType,
  STAT_FORMULAS,
  ActionType,
  PassiveSkillEffect
} from '../types';
import { ELEMENTAL_CYCLE } from '../constants';

// ============================================================================
// PASSIVE SKILL BONUS AGGREGATOR
// ============================================================================

/**
 * Aggregated bonuses from all equipped passive skills.
 * These bonuses are applied AFTER equipment but BEFORE buffs.
 */
export interface PassiveBonuses {
  /** Flat bonuses to primary stats (e.g., +5 Strength) */
  statBonus: Partial<PrimaryAttributes>;
  /** Percentage bonus to all outgoing damage (0.1 = +10%) */
  damageBonus: number;
  /** Percentage bonus to all defense types (0.1 = +10%) */
  defenseBonus: number;
  /** Flat HP regeneration per turn (added to derived hpRegen) */
  hpRegen: number;
  /** Flat chakra regeneration per turn (added to derived chakraRegen) */
  chakraRegen: number;
}

/**
 * Collects and sums all passive skill bonuses from a player's skill list.
 * Only processes skills with ActionType.PASSIVE and a valid passiveEffect.
 *
 * @param skills - Array of all player skills (active and passive)
 * @returns Aggregated PassiveBonuses object with summed values
 */
export function aggregatePassiveSkillBonuses(skills: Skill[]): PassiveBonuses {
  const bonuses: PassiveBonuses = {
    statBonus: {},
    damageBonus: 0,
    defenseBonus: 0,
    hpRegen: 0,
    chakraRegen: 0
  };

  if (!skills || !Array.isArray(skills)) return bonuses;

  skills.forEach(skill => {
    // Only process PASSIVE action type skills
    if (skill.actionType !== ActionType.PASSIVE) return;
    if (!skill.passiveEffect) return;

    const effect = skill.passiveEffect;

    // Aggregate stat bonuses
    if (effect.statBonus) {
      Object.entries(effect.statBonus).forEach(([key, value]) => {
        if (value !== undefined) {
          const statKey = key as keyof PrimaryAttributes;
          bonuses.statBonus[statKey] = (bonuses.statBonus[statKey] || 0) + value;
        }
      });
    }

    // Aggregate damage bonus
    if (effect.damageBonus) {
      bonuses.damageBonus += effect.damageBonus;
    }

    // Aggregate defense bonus
    if (effect.defenseBonus) {
      bonuses.defenseBonus += effect.defenseBonus;
    }

    // Aggregate regen bonuses
    if (effect.regenBonus) {
      if (effect.regenBonus.hp) {
        bonuses.hpRegen += effect.regenBonus.hp;
      }
      if (effect.regenBonus.chakra) {
        bonuses.chakraRegen += effect.regenBonus.chakra;
      }
    }
  });

  return bonuses;
}

// ============================================================================
// PASSIVE STAT APPLICATOR
// ============================================================================

/**
 * Applies passive skill stat bonuses to primary attributes.
 * Creates a new object (immutable pattern) with bonuses added.
 *
 * @param baseStats - Current primary attributes before passive bonuses
 * @param passiveBonuses - Aggregated bonuses from passive skills
 * @returns New PrimaryAttributes object with bonuses applied
 */
export function applyPassiveBonusesToStats(
  baseStats: PrimaryAttributes,
  passiveBonuses: PassiveBonuses
): PrimaryAttributes {
  const modified = { ...baseStats };

  if (!passiveBonuses.statBonus) return modified;

  Object.entries(passiveBonuses.statBonus).forEach(([key, value]) => {
    if (value !== undefined) {
      const statKey = key as keyof PrimaryAttributes;
      if (statKey in modified) {
        modified[statKey] += value;
      }
    }
  });

  return modified;
}

// ============================================================================
// DERIVED STATS CALCULATOR
// ============================================================================

/**
 * Converts Primary Attributes into all Derived Combat Stats.
 * This is the core stat calculation function that generates all combat-relevant values.
 *
 * ## DERIVED STAT FORMULAS
 *
 * ### Resource Pools
 * - maxHp = 100 + (willpower × 12) + flatHp
 * - maxChakra = 50 + (chakra × 8) + flatChakra
 * - hpRegen = floor(maxHp × 1% × (willpower / 20))
 * - chakraRegen = floor(intelligence × 2)
 *
 * ### Defense (3 types, each has flat + %)
 * - Physical: strength → flat + % (protects vs DamageType.PHYSICAL)
 * - Elemental: spirit → flat + % (protects vs DamageType.ELEMENTAL)
 * - Mental: calmness → flat + % (protects vs DamageType.MENTAL)
 *
 * Flat Defense: stat × multiplier (linear scaling)
 * Percent Defense: stat / (stat + SOFT_CAP) (diminishing returns, max 75%)
 *
 * ### Hit Rates (base 85%, modified by target speed in combat)
 * - Melee: 85% + (speed × 0.3) - (defender_speed × 0.5)
 * - Ranged: 85% + (accuracy × 0.3) - (defender_speed × 0.5)
 * - Final hit chance clamped to 30-98% range
 *
 * ### Evasion (diminishing returns)
 * - evasion = speed / (speed + 100)
 *
 * ### Critical Hits
 * - critChance = 15% + (dexterity × 0.5) + equipment (max 75%)
 * - critDamageMelee = 1.5× base
 * - critDamageRanged = 1.5× + (accuracy × 0.05)
 * - Super effective hits: +20% crit chance bonus
 *
 * ### Combat Stats
 * - statusResistance = calmness / (calmness + 50)
 * - gutsChance = willpower / (willpower + 30) (survive lethal hit at 1 HP)
 * - initiative = 10 + (speed × 0.5)
 *
 * @param primary - Modified primary attributes (after equipment/passives/buffs)
 * @param equipmentBonuses - Direct bonuses from equipment (for flat HP/Chakra/etc)
 * @returns Complete DerivedStats object ready for combat
 */
export function calculateDerivedStats(
  primary: PrimaryAttributes,
  equipmentBonuses: ItemStatBonus = {}
): DerivedStats {
  const F = STAT_FORMULAS;

  // Build effective stats by adding equipment bonuses to primary stats
  const effective = {
    willpower: primary.willpower + (equipmentBonuses.willpower || 0),
    chakra: primary.chakra + (equipmentBonuses.chakra || 0),
    strength: primary.strength + (equipmentBonuses.strength || 0),
    spirit: primary.spirit + (equipmentBonuses.spirit || 0),
    intelligence: primary.intelligence + (equipmentBonuses.intelligence || 0),
    calmness: primary.calmness + (equipmentBonuses.calmness || 0),
    speed: primary.speed + (equipmentBonuses.speed || 0),
    accuracy: primary.accuracy + (equipmentBonuses.accuracy || 0),
    dexterity: primary.dexterity + (equipmentBonuses.dexterity || 0),
  };

  // ─────────────────────────────────────────────────────────────────────────
  // RESOURCE POOLS - HP and Chakra capacity
  // ─────────────────────────────────────────────────────────────────────────
  const maxHp = F.HP_BASE + (effective.willpower * F.HP_PER_WILLPOWER) + (equipmentBonuses.flatHp || 0);
  const maxChakra = F.CHAKRA_BASE + (effective.chakra * F.CHAKRA_PER_CHAKRA) + (equipmentBonuses.flatChakra || 0);

  // ─────────────────────────────────────────────────────────────────────────
  // REGENERATION - Per-turn resource recovery
  // HP regen scales with both max HP AND willpower (double scaling)
  // Chakra regen is purely intelligence-based
  // ─────────────────────────────────────────────────────────────────────────
  const hpRegen = Math.floor(maxHp * F.HP_REGEN_PERCENT * (effective.willpower / 20));
  const chakraRegen = Math.floor(effective.intelligence * F.CHAKRA_REGEN_PER_INT);

  // ─────────────────────────────────────────────────────────────────────────
  // FLAT DEFENSE - Linear scaling, subtracts fixed damage amount
  // Applied FIRST in damage calculation, capped at 60% of incoming damage
  // ─────────────────────────────────────────────────────────────────────────
  const physicalDefenseFlat = Math.floor(effective.strength * F.FLAT_PHYS_DEF_PER_STR) + (equipmentBonuses.flatPhysicalDef || 0);
  const elementalDefenseFlat = Math.floor(effective.spirit * F.FLAT_ELEM_DEF_PER_SPIRIT) + (equipmentBonuses.flatElementalDef || 0);
  const mentalDefenseFlat = Math.floor(effective.calmness * F.FLAT_MENTAL_DEF_PER_CALM) + (equipmentBonuses.flatMentalDef || 0);

  // ─────────────────────────────────────────────────────────────────────────
  // PERCENT DEFENSE - Diminishing returns formula: stat / (stat + SOFT_CAP)
  // Applied SECOND after flat reduction, hard-capped at 75%
  // Example: 50 strength with SOFT_CAP=100 → 50/(50+100) = 33% reduction
  // ─────────────────────────────────────────────────────────────────────────
  const physicalDefensePercent = Math.min(0.75,
    (effective.strength / (effective.strength + F.PHYSICAL_DEF_SOFT_CAP)) + (equipmentBonuses.percentPhysicalDef || 0)
  );
  const elementalDefensePercent = Math.min(0.75,
    (effective.spirit / (effective.spirit + F.ELEMENTAL_DEF_SOFT_CAP)) + (equipmentBonuses.percentElementalDef || 0)
  );
  const mentalDefensePercent = Math.min(0.75,
    (effective.calmness / (effective.calmness + F.MENTAL_DEF_SOFT_CAP)) + (equipmentBonuses.percentMentalDef || 0)
  );

  // ─────────────────────────────────────────────────────────────────────────
  // STATUS & SURVIVAL - Crowd control resistance and death prevention
  // Both use diminishing returns formulas
  // ─────────────────────────────────────────────────────────────────────────
  const statusResistance = effective.calmness / (effective.calmness + F.STATUS_RESIST_SOFT_CAP);
  const gutsChance = effective.willpower / (effective.willpower + F.GUTS_SOFT_CAP);

  // ─────────────────────────────────────────────────────────────────────────
  // HIT RATES - Base accuracy before defender's evasion is applied
  // In combat, defender's speed reduces these values
  // ─────────────────────────────────────────────────────────────────────────
  const meleeHitRate = F.BASE_HIT_CHANCE + (effective.speed * 0.3);
  const rangedHitRate = F.BASE_HIT_CHANCE + (effective.accuracy * 0.3);

  // ─────────────────────────────────────────────────────────────────────────
  // EVASION - Chance to completely avoid attacks (separate from miss)
  // Uses diminishing returns, checked AFTER hit roll succeeds
  // ─────────────────────────────────────────────────────────────────────────
  const evasion = effective.speed / (effective.speed + F.EVASION_SOFT_CAP);

  // ─────────────────────────────────────────────────────────────────────────
  // CRITICAL HITS - Chance and multiplier for bonus damage
  // Ranged attacks get bonus crit damage from accuracy
  // ─────────────────────────────────────────────────────────────────────────
  const critChance = Math.min(75, F.BASE_CRIT_CHANCE + (effective.dexterity * F.CRIT_PER_DEX) + (equipmentBonuses.critChance || 0));
  const critDamageMelee = F.BASE_CRIT_MULT + (equipmentBonuses.critDamage || 0);
  const critDamageRanged = F.BASE_CRIT_MULT + (effective.accuracy * F.RANGED_CRIT_BONUS_PER_ACC) + (equipmentBonuses.critDamage || 0);

  // ─────────────────────────────────────────────────────────────────────────
  // INITIATIVE - Determines turn order in combat (higher = acts first)
  // ─────────────────────────────────────────────────────────────────────────
  const initiative = F.INIT_BASE + (effective.speed * F.INIT_PER_SPEED);

  return {
    maxHp,
    currentHp: maxHp,
    maxChakra,
    currentChakra: maxChakra,
    hpRegen,
    chakraRegen,
    physicalDefenseFlat,
    elementalDefenseFlat,
    mentalDefenseFlat,
    physicalDefensePercent,
    elementalDefensePercent,
    mentalDefensePercent,
    statusResistance,
    gutsChance,
    meleeHitRate,
    rangedHitRate,
    evasion,
    critChance,
    critDamageMelee,
    critDamageRanged,
    initiative
  };
}

// ============================================================================
// EQUIPMENT BONUS AGGREGATOR
// Combines all equipped items into a single bonus object
// ============================================================================
export function aggregateEquipmentBonuses(equipment: Record<EquipmentSlot, Item | null>): ItemStatBonus {
  const bonuses: ItemStatBonus = {};

  Object.values(equipment).forEach(item => {
    if (!item || !item.stats) return;

    const stats = item.stats;
    (Object.keys(stats) as Array<keyof ItemStatBonus>).forEach(key => {
      const value = stats[key];
      if (value !== undefined) {
        bonuses[key] = (bonuses[key] || 0) + value;
      }
    });
  });

  return bonuses;
}

// ============================================================================
// EQUIPMENT BONUS APPLICATOR
// Applies equipment bonuses to primary attributes
// ============================================================================
export function applyEquipmentToPrimaryStats(
  baseStats: PrimaryAttributes,
  equipmentBonuses: ItemStatBonus
): PrimaryAttributes {
  return {
    willpower: baseStats.willpower + (equipmentBonuses.willpower || 0),
    chakra: baseStats.chakra + (equipmentBonuses.chakra || 0),
    strength: baseStats.strength + (equipmentBonuses.strength || 0),
    spirit: baseStats.spirit + (equipmentBonuses.spirit || 0),
    intelligence: baseStats.intelligence + (equipmentBonuses.intelligence || 0),
    calmness: baseStats.calmness + (equipmentBonuses.calmness || 0),
    speed: baseStats.speed + (equipmentBonuses.speed || 0),
    accuracy: baseStats.accuracy + (equipmentBonuses.accuracy || 0),
    dexterity: baseStats.dexterity + (equipmentBonuses.dexterity || 0),
  };
}

// ============================================================================
// BUFF MODIFIER CALCULATOR
// Applies active buff/debuff modifiers to primary stats
// ============================================================================
export function applyBuffsToPrimaryStats(
  baseStats: PrimaryAttributes,
  buffs: Buff[]
): PrimaryAttributes {
  const modified = { ...baseStats };

  // Safely handle undefined or malformed buffs
  if (!buffs || !Array.isArray(buffs)) return modified;

  buffs.forEach(buff => {
    // Skip undefined or malformed buffs
    if (!buff || !buff.effect) return;

    if (buff.effect.type === EffectType.BUFF || buff.effect.type === EffectType.DEBUFF) {
      const targetStat = buff.effect.targetStat;
      const value = buff.effect.value || 0;

      if (targetStat) {
        const statKey = targetStat.toLowerCase() as keyof PrimaryAttributes;
        if (statKey in modified) {
          const multiplier = buff.effect.type === EffectType.BUFF ? (1 + value) : (1 - value);
          modified[statKey] = Math.floor(modified[statKey] * multiplier);
        }
      }
    }
  });

  return modified;
}

// ============================================================================
// FULL CHARACTER STATS CALCULATOR
// Gets the complete stat picture for a player
// Calculation order: Base -> Equipment -> Passive Skills -> Buffs
// ============================================================================
export function getPlayerFullStats(player: Player): {
  primary: PrimaryAttributes;
  effectivePrimary: PrimaryAttributes;
  derived: DerivedStats;
  equipmentBonuses: ItemStatBonus;
  passiveBonuses: PassiveBonuses;
} {
  // 1. Equipment bonuses
  const equipmentBonuses = aggregateEquipmentBonuses(player.equipment);

  // 2. Passive skill bonuses
  const passiveBonuses = aggregatePassiveSkillBonuses(player.skills);

  // 3. Apply bonuses in order: Base -> Equipment -> Passive -> Buffs
  const withEquipment = applyEquipmentToPrimaryStats(player.primaryStats, equipmentBonuses);
  const withPassives = applyPassiveBonusesToStats(withEquipment, passiveBonuses);
  const effectivePrimary = applyBuffsToPrimaryStats(withPassives, player.activeBuffs);

  // 4. Calculate derived stats
  const derived = calculateDerivedStats(effectivePrimary, equipmentBonuses);

  // 5. Apply passive regen bonuses to derived stats
  derived.chakraRegen += passiveBonuses.chakraRegen;
  derived.hpRegen += passiveBonuses.hpRegen;

  return {
    primary: player.primaryStats,
    effectivePrimary,
    derived,
    equipmentBonuses,
    passiveBonuses
  };
}

// ============================================================================
// ENEMY STATS CALCULATOR
// ============================================================================
export function getEnemyFullStats(enemy: Enemy): {
  primary: PrimaryAttributes;
  effectivePrimary: PrimaryAttributes;
  derived: DerivedStats;
} {
  const buffedPrimary = applyBuffsToPrimaryStats(enemy.primaryStats, enemy.activeBuffs);
  const derived = calculateDerivedStats(buffedPrimary, {});

  return {
    primary: enemy.primaryStats,
    effectivePrimary: buffedPrimary,
    derived
  };
}

// ============================================================================
// DAMAGE CALCULATOR - THE CORE COMBAT MATH
// ============================================================================

/**
 * The core damage calculation function used for all combat attacks.
 * Handles the complete damage pipeline from raw damage to final result.
 *
 * ## DAMAGE CALCULATION PIPELINE (5 Steps)
 *
 * ### Step 1: Hit/Miss Check
 * - AUTO attacks always hit (toggle skills, certain abilities)
 * - MELEE: hitChance = baseHit + (attacker_speed × 0.3) - (defender_speed × 0.5)
 * - RANGED: hitChance = baseHit + (attacker_accuracy × 0.3) - (defender_speed × 0.5)
 * - Hit chance clamped to 30-98% range
 * - If hit succeeds, separate EVASION check occurs
 *
 * ### Step 2: Base Damage
 * - rawDamage = scalingStat × skill.damageMult
 * - Scaling stat determined by skill.scalingStat (e.g., STRENGTH, SPIRIT)
 *
 * ### Step 3: Elemental Effectiveness
 * - Element cycle: Fire > Wind > Lightning > Earth > Water > Fire
 * - Super effective: 1.5× damage multiplier
 * - Resisted: 0.5× damage multiplier
 * - Neutral: 1.0× (no change)
 * - PHYSICAL and MENTAL elements are neutral to all
 *
 * ### Step 4: Critical Hit
 * - Roll against critChance + skill.critBonus
 * - Super effective attacks get +20% bonus crit chance
 * - Crit multiplier: 1.5× base (ranged gets bonus from accuracy)
 *
 * ### Step 5: Defense Application
 * - Select defense type based on skill.damageType (Physical/Elemental/Mental)
 * - TRUE damage bypasses ALL defense
 * - Super effective hits ignore 50% of % defense (pseudo-penetration)
 * - Skill penetration further reduces % defense
 * - Apply damage property modifiers:
 *   - NORMAL: Flat (max 60% reduction) then % defense
 *   - PIERCING: Only % defense (ignores flat)
 *   - ARMOR_BREAK: Only flat defense (ignores %)
 * - Minimum 1 damage after all reductions
 *
 * @param attackerPrimary - Attacker's primary attributes
 * @param attackerDerived - Attacker's calculated derived stats
 * @param defenderPrimary - Defender's primary attributes
 * @param defenderDerived - Defender's calculated derived stats
 * @param skill - The skill being used for the attack
 * @param attackerElement - Attacker's elemental affinity
 * @param defenderElement - Defender's elemental affinity
 * @returns DamageResult with all calculation details (for combat log)
 */
export function calculateDamage(
  attackerPrimary: PrimaryAttributes,
  attackerDerived: DerivedStats,
  defenderPrimary: PrimaryAttributes,
  defenderDerived: DerivedStats,
  skill: Skill,
  attackerElement: ElementType,
  defenderElement: ElementType
): DamageResult {
  const result: DamageResult = {
    rawDamage: 0,
    flatReduction: 0,
    percentReduction: 0,
    finalDamage: 0,
    isCrit: false,
    isMiss: false,
    isEvaded: false,
    elementMultiplier: 1.0,
    gutsTriggered: false
  };

  // ========================================
  // STEP 1: HIT/MISS CHECK
  // ========================================
  if (skill.attackMethod !== AttackMethod.AUTO) {
    let hitChance: number;
    
    if (skill.attackMethod === AttackMethod.MELEE) {
      // Melee: Attacker SPEED vs Defender SPEED
      hitChance = attackerDerived.meleeHitRate - (defenderPrimary.speed * 0.5);
    } else {
      // Ranged: Attacker ACCURACY vs Defender SPEED
      hitChance = attackerDerived.rangedHitRate - (defenderPrimary.speed * 0.5);
    }

    hitChance = Math.max(30, Math.min(98, hitChance)); // Clamp 30-98%

    if (Math.random() * 100 > hitChance) {
      result.isMiss = true;
      return result;
    }

    // Evasion check (separate from miss)
    const evasionRoll = Math.random();
    if (evasionRoll < defenderDerived.evasion) {
      result.isEvaded = true;
      return result;
    }
  }

  // ========================================
  // STEP 2: BASE DAMAGE CALCULATION
  // ========================================
  const scalingStatKey = skill.scalingStat.toLowerCase() as keyof PrimaryAttributes;
  const scalingValue = attackerPrimary[scalingStatKey] || 10;
  result.rawDamage = Math.floor(scalingValue * skill.damageMult);

  // ========================================
  // STEP 3: ELEMENTAL EFFECTIVENESS
  // ========================================
  if (skill.element !== ElementType.PHYSICAL && skill.element !== ElementType.MENTAL) {
    if (ELEMENTAL_CYCLE[skill.element] === defenderElement) {
      result.elementMultiplier = 1.2; // Super effective
    } else if (ELEMENTAL_CYCLE[defenderElement] === skill.element) {
      result.elementMultiplier = 0.8; // Resisted
    }
  }
  result.rawDamage = Math.floor(result.rawDamage * result.elementMultiplier);

  // ========================================
  // STEP 4: CRITICAL HIT
  // ========================================
  let effectiveCritChance = attackerDerived.critChance + (skill.critBonus || 0);

  // BONUS: Super Effective hits get +10% Crit Chance (reduced from 20%)
  if (result.elementMultiplier > 1.0) {
    effectiveCritChance += 10;
  }

  // Cap effective crit chance at 95% (always some uncertainty)
  effectiveCritChance = Math.min(95, effectiveCritChance);

  if (Math.random() * 100 < effectiveCritChance) {
    result.isCrit = true;
    const critMult = skill.attackMethod === AttackMethod.RANGED 
      ? attackerDerived.critDamageRanged 
      : attackerDerived.critDamageMelee;
    result.rawDamage = Math.floor(result.rawDamage * critMult);
  }

  // ========================================
  // STEP 5: DEFENSE APPLICATION
  // ========================================
  let flatDef = 0;
  let percentDef = 0;

  // Select defense type based on damage type
  if (skill.damageType === DamageType.TRUE) {
    // TRUE damage bypasses ALL defense
    flatDef = 0;
    percentDef = 0;
  } else if (skill.damageType === DamageType.PHYSICAL) {
    flatDef = defenderDerived.physicalDefenseFlat;
    percentDef = defenderDerived.physicalDefensePercent;
  } else if (skill.damageType === DamageType.ELEMENTAL) {
    flatDef = defenderDerived.elementalDefenseFlat;
    percentDef = defenderDerived.elementalDefensePercent;
  } else if (skill.damageType === DamageType.MENTAL) {
    flatDef = defenderDerived.mentalDefenseFlat;
    percentDef = defenderDerived.mentalDefensePercent;
  }

  // NOTE: Super effective defense ignore removed for balance
  // Super effective now only grants +10% crit chance bonus

  // Apply penetration if skill has it
  if (skill.penetration) {
    percentDef = percentDef * (1 - skill.penetration);
  }

  // Apply damage property modifiers
  let damageAfterDefense = result.rawDamage;

  if (skill.damageProperty === DamageProperty.NORMAL) {
    // Normal: Both flat and % apply
    // Order: Flat first, then %
    result.flatReduction = Math.min(flatDef, damageAfterDefense * 0.6); // Flat can't reduce more than 60%
    damageAfterDefense -= result.flatReduction;
    result.percentReduction = Math.floor(damageAfterDefense * percentDef);
    damageAfterDefense -= result.percentReduction;
  } else if (skill.damageProperty === DamageProperty.PIERCING) {
    // Piercing: Ignores FLAT, only % applies
    result.flatReduction = 0;
    result.percentReduction = Math.floor(damageAfterDefense * percentDef);
    damageAfterDefense -= result.percentReduction;
  } else if (skill.damageProperty === DamageProperty.ARMOR_BREAK) {
    // Armor Break: Ignores %, only FLAT applies
    result.flatReduction = Math.min(flatDef, damageAfterDefense * 0.6);
    damageAfterDefense -= result.flatReduction;
    result.percentReduction = 0;
  }

  result.finalDamage = Math.max(1, Math.floor(damageAfterDefense));

  return result;
}

// ============================================================================
// GUTS CHECK - Survival mechanic
// ============================================================================

/**
 * Checks if a character survives a lethal hit through the "Guts" mechanic.
 * Guts is a last-stand ability that gives a chance to survive at 1 HP.
 *
 * This mechanic is inspired by fighting games where characters can survive
 * a killing blow with a small amount of health remaining.
 *
 * ## Guts Chance Formula
 * gutsChance = willpower / (willpower + GUTS_SOFT_CAP)
 * - Uses diminishing returns (same formula as other survival stats)
 * - Higher willpower = higher survival chance
 * - Typical range: 0-30% for normal characters
 *
 * ## When Guts Triggers
 * - Only checked when damage would reduce HP to 0 or below
 * - On success: HP set to 1, character survives
 * - On failure: HP set to 0, character dies
 *
 * @param currentHp - Character's current HP before damage
 * @param incomingDamage - Amount of damage being dealt
 * @param gutsChance - Probability of triggering Guts (0.0 to 1.0)
 * @returns Object with survival status and new HP value
 */
export function checkGuts(
  currentHp: number,
  incomingDamage: number,
  gutsChance: number
): { survived: boolean; newHp: number } {
  const potentialHp = currentHp - incomingDamage;

  if (potentialHp <= 0) {
    // Death territory - check for Guts
    const roll = Math.random();
    if (roll < gutsChance) {
      return { survived: true, newHp: 1 };
    }
    return { survived: false, newHp: 0 };
  }

  return { survived: true, newHp: potentialHp };
}

// ============================================================================
// STATUS RESISTANCE CHECK
// ============================================================================

/**
 * Determines if a status effect successfully applies to a target.
 * Uses the target's status resistance to reduce the application chance.
 *
 * ## Status Resistance Formula
 * effectiveChance = baseChance × (1 - statusResistance)
 *
 * Example: 80% stun chance vs 50% resistance = 80% × 0.5 = 40% effective chance
 *
 * @param statusChance - Base chance of the status effect (0.0 to 1.0)
 * @param statusResistance - Target's resistance stat (0.0 to 1.0)
 * @returns true if status effect applies, false if resisted
 */
export function resistStatus(
  statusChance: number,
  statusResistance: number
): boolean {
  const effectiveChance = statusChance * (1 - statusResistance);
  return Math.random() < effectiveChance;
}

// ============================================================================
// SKILL REQUIREMENT CHECK
// ============================================================================
export function canLearnSkill(
  skill: Skill,
  playerIntelligence: number,
  playerLevel: number,
  playerClan: string
): { canLearn: boolean; reason?: string } {
  if (!skill.requirements) {
    return { canLearn: true };
  }

  const req = skill.requirements;

  if (req.intelligence && playerIntelligence < req.intelligence) {
    return { 
      canLearn: false, 
      reason: `Requires ${req.intelligence} Intelligence (you have ${playerIntelligence})` 
    };
  }

  if (req.level && playerLevel < req.level) {
    return { 
      canLearn: false, 
      reason: `Requires Level ${req.level}` 
    };
  }

  if (req.clan && req.clan !== playerClan) {
    return { 
      canLearn: false, 
      reason: `Requires ${req.clan} bloodline` 
    };
  }

  return { canLearn: true };
}

// ============================================================================
// DOT DAMAGE CALCULATOR
// ============================================================================

/**
 * Calculates damage from Damage-over-Time effects (Bleed, Burn, Poison).
 * DoT damage has special interactions with defense - it's only partially mitigated.
 *
 * ## DoT Defense Interaction
 * DoT effects receive REDUCED defense mitigation compared to direct attacks:
 * - Flat defense: Applied at 50% efficiency (half reduction)
 * - Percent defense: Applied at 50% efficiency
 * - Minimum damage: 1 (DoTs always deal at least 1 damage)
 *
 * ## DoT Types by Damage Type
 * - PHYSICAL DoTs (Bleed): Mitigated by physical defense
 * - ELEMENTAL DoTs (Burn): Mitigated by elemental defense
 * - TRUE DoTs (Poison, Amaterasu): Bypass ALL defense
 *
 * ## DoT Damage Properties
 * - NORMAL: Both flat and % defense apply (at 50% each)
 * - PIERCING: Only % defense applies (at 50%)
 * - TRUE: No defense applies
 *
 * @param dotValue - Base damage per tick of the DoT effect
 * @param dotDamageType - Type of damage (defaults to PHYSICAL)
 * @param dotDamageProperty - Damage property (defaults to NORMAL)
 * @param defenderDerived - Defender's calculated stats for defense values
 * @returns Final DoT damage after defense reduction
 */
export function calculateDotDamage(
  dotValue: number,
  dotDamageType: DamageType | undefined,
  dotDamageProperty: DamageProperty | undefined,
  defenderDerived: DerivedStats
): number {
  const type = dotDamageType || DamageType.PHYSICAL;
  const property = dotDamageProperty || DamageProperty.NORMAL;

  // TRUE damage DoTs (like Poison or Amaterasu) bypass defense
  if (type === DamageType.TRUE) {
    return dotValue;
  }

  // Get appropriate defense
  let flatDef = 0;
  let percentDef = 0;

  if (type === DamageType.PHYSICAL) {
    flatDef = defenderDerived.physicalDefenseFlat;
    percentDef = defenderDerived.physicalDefensePercent;
  } else if (type === DamageType.ELEMENTAL) {
    flatDef = defenderDerived.elementalDefenseFlat;
    percentDef = defenderDerived.elementalDefensePercent;
  }

  // Apply damage property
  let damage = dotValue;

  if (property === DamageProperty.NORMAL) {
    const flatRed = Math.min(flatDef * 0.5, damage * 0.4); // DoTs get reduced flat reduction
    damage -= flatRed;
    damage -= Math.floor(damage * percentDef * 0.5); // And reduced % reduction
  } else if (property === DamageProperty.PIERCING) {
    damage -= Math.floor(damage * percentDef * 0.5);
  }

  return Math.max(1, Math.floor(damage));
}

// ============================================================================
// DISPLAY HELPERS
// ============================================================================
export function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

export function formatStat(value: number): string {
  return Math.floor(value).toString();
}

export function getDefenseBreakdown(derived: DerivedStats): {
  physical: { flat: number; percent: string };
  elemental: { flat: number; percent: string };
  mental: { flat: number; percent: string };
} {
  return {
    physical: {
      flat: derived.physicalDefenseFlat,
      percent: formatPercent(derived.physicalDefensePercent)
    },
    elemental: {
      flat: derived.elementalDefenseFlat,
      percent: formatPercent(derived.elementalDefensePercent)
    },
    mental: {
      flat: derived.mentalDefenseFlat,
      percent: formatPercent(derived.mentalDefensePercent)
    }
  };
}