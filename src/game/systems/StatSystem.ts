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
  Buff,
  EffectType,
  PrimaryStat,
  ElementType,
  STAT_FORMULAS,
  PlayerResources
} from '../types';
import { ELEMENTAL_CYCLE } from '../constants';
import { calculateResourceModifiers } from './ResourceSystem';

// ============================================================================
// DERIVED STATS CALCULATOR
// Converts Primary Attributes into all Derived Stats
// Optionally applies resource modifiers for hunger, fatigue, morale
// ============================================================================
export function calculateDerivedStats(
  primary: PrimaryAttributes,
  equipmentBonuses: ItemStatBonus = {},
  resources?: PlayerResources
): DerivedStats {
  const F = STAT_FORMULAS;

  // Apply equipment bonuses to effective primary stats
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

  // Calculate resource modifiers if resources provided
  const resourceMods = resources ? calculateResourceModifiers(resources) : {
    hpMult: 1.0,
    damageOut: 1.0,
    speedMult: 1.0,
    chakraCostMult: 1.0,
    defenseMult: 1.0,
    xpGainMult: 1.0,
  };

  // Resource Pools (apply HP multiplier from hunger/morale)
  let maxHp = F.HP_BASE + (effective.willpower * F.HP_PER_WILLPOWER) + (equipmentBonuses.flatHp || 0);
  maxHp = Math.floor(maxHp * resourceMods.hpMult);

  const maxChakra = F.CHAKRA_BASE + (effective.chakra * F.CHAKRA_PER_CHAKRA) + (equipmentBonuses.flatChakra || 0);

  // Regeneration
  const hpRegen = Math.floor(maxHp * F.HP_REGEN_PERCENT * (effective.willpower / 20));
  const chakraRegen = Math.floor(effective.intelligence * F.CHAKRA_REGEN_PER_INT);

  // Flat Defense (linear scaling, apply defense multiplier from morale)
  let physicalDefenseFlat = Math.floor(effective.strength * F.FLAT_PHYS_DEF_PER_STR) + (equipmentBonuses.flatPhysicalDef || 0);
  let elementalDefenseFlat = Math.floor(effective.spirit * F.FLAT_ELEM_DEF_PER_SPIRIT) + (equipmentBonuses.flatElementalDef || 0);
  let mentalDefenseFlat = Math.floor(effective.calmness * F.FLAT_MENTAL_DEF_PER_CALM) + (equipmentBonuses.flatMentalDef || 0);

  physicalDefenseFlat = Math.floor(physicalDefenseFlat * resourceMods.defenseMult);
  elementalDefenseFlat = Math.floor(elementalDefenseFlat * resourceMods.defenseMult);
  mentalDefenseFlat = Math.floor(mentalDefenseFlat * resourceMods.defenseMult);

  // Percent Defense (diminishing returns: stat / (stat + SOFT_CAP))
  let physicalDefensePercent = Math.min(0.75,
    (effective.strength / (effective.strength + F.PHYSICAL_DEF_SOFT_CAP)) + (equipmentBonuses.percentPhysicalDef || 0)
  );
  let elementalDefensePercent = Math.min(0.75,
    (effective.spirit / (effective.spirit + F.ELEMENTAL_DEF_SOFT_CAP)) + (equipmentBonuses.percentElementalDef || 0)
  );
  let mentalDefensePercent = Math.min(0.75,
    (effective.calmness / (effective.calmness + F.MENTAL_DEF_SOFT_CAP)) + (equipmentBonuses.percentMentalDef || 0)
  );

  physicalDefensePercent *= resourceMods.defenseMult;
  elementalDefensePercent *= resourceMods.defenseMult;
  mentalDefensePercent *= resourceMods.defenseMult;

  // Status & Survival
  const statusResistance = effective.calmness / (effective.calmness + F.STATUS_RESIST_SOFT_CAP);
  const gutsChance = effective.willpower / (effective.willpower + F.GUTS_SOFT_CAP);

  // Hit Rates (base, modified in combat by target's speed, apply speed modifier)
  const meleeHitRate = F.BASE_HIT_CHANCE + (effective.speed * 0.3 * resourceMods.speedMult);
  const rangedHitRate = F.BASE_HIT_CHANCE + (effective.accuracy * 0.3);

  // Evasion (diminishing returns, apply speed modifier)
  const evasion = (effective.speed * resourceMods.speedMult) / ((effective.speed * resourceMods.speedMult) + F.EVASION_SOFT_CAP);

  // Critical
  const critChance = Math.min(75, F.BASE_CRIT_CHANCE + (effective.dexterity * F.CRIT_PER_DEX) + (equipmentBonuses.critChance || 0));
  const critDamageMelee = F.BASE_CRIT_MULT + (equipmentBonuses.critDamage || 0);
  const critDamageRanged = F.BASE_CRIT_MULT + (effective.accuracy * F.RANGED_CRIT_BONUS_PER_ACC) + (equipmentBonuses.critDamage || 0);

  // Initiative (apply speed modifier from fatigue)
  const initiative = F.INIT_BASE + (effective.speed * F.INIT_PER_SPEED * resourceMods.speedMult);

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
export function aggregateEquipmentBonuses(equipment: Record<ItemSlot, Item | null>): ItemStatBonus {
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

  buffs.forEach(buff => {
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
// Includes resource modifiers (hunger, fatigue, morale) in calculations
// ============================================================================
export function getPlayerFullStats(player: Player): {
  primary: PrimaryAttributes;
  effectivePrimary: PrimaryAttributes;
  derived: DerivedStats;
  equipmentBonuses: ItemStatBonus;
} {
  const equipmentBonuses = aggregateEquipmentBonuses(player.equipment);
  const withEquipment = applyEquipmentToPrimaryStats(player.primaryStats, equipmentBonuses);
  const effectivePrimary = applyBuffsToPrimaryStats(withEquipment, player.activeBuffs);
  const derived = calculateDerivedStats(effectivePrimary, equipmentBonuses, player.resources);

  return {
    primary: player.primaryStats,
    effectivePrimary,
    derived,
    equipmentBonuses
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
      result.elementMultiplier = 1.5; // Super effective
    } else if (ELEMENTAL_CYCLE[defenderElement] === skill.element) {
      result.elementMultiplier = 0.5; // Resisted
    }
  }
  result.rawDamage = Math.floor(result.rawDamage * result.elementMultiplier);

  // ========================================
  // STEP 4: CRITICAL HIT
  // ========================================
  let effectiveCritChance = attackerDerived.critChance + (skill.critBonus || 0);
  
  // BONUS: Super Effective hits get +20% Crit Chance
  if (result.elementMultiplier > 1.0) {
    effectiveCritChance += 20;
  }
  
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

  // BONUS: Super Effective hits ignore 50% of percent defense (Pseudo-penetration)
  if (result.elementMultiplier > 1.0) {
    percentDef = percentDef * 0.5;
  }

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
// For Bleed, Burn, Poison effects
// ============================================================================
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