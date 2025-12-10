import {
  EffectDefinition,
  EffectType,
  PrimaryStat,
  ElementType,
  Buff,
  PrimaryAttributes,
  DamageType,
  AttackMethod,
  DamageProperty,
} from '../types';

// ============================================================================
// STAT ABBREVIATIONS
// ============================================================================

export const formatScalingStat = (stat: PrimaryStat): string => {
  const names: Record<PrimaryStat, string> = {
    [PrimaryStat.WILLPOWER]: 'Willpower',
    [PrimaryStat.CHAKRA]: 'Chakra',
    [PrimaryStat.STRENGTH]: 'Strength',
    [PrimaryStat.SPIRIT]: 'Spirit',
    [PrimaryStat.INTELLIGENCE]: 'Intelligence',
    [PrimaryStat.CALMNESS]: 'Calmness',
    [PrimaryStat.SPEED]: 'Speed',
    [PrimaryStat.ACCURACY]: 'Accuracy',
    [PrimaryStat.DEXTERITY]: 'Dexterity',
  };
  return names[stat] || stat;
};

export const getStatColor = (stat: PrimaryStat): string => {
  const colors: Record<PrimaryStat, string> = {
    [PrimaryStat.WILLPOWER]: 'text-red-500',
    [PrimaryStat.CHAKRA]: 'text-blue-500',
    [PrimaryStat.STRENGTH]: 'text-orange-500',
    [PrimaryStat.SPIRIT]: 'text-purple-500',
    [PrimaryStat.INTELLIGENCE]: 'text-cyan-500',
    [PrimaryStat.CALMNESS]: 'text-indigo-500',
    [PrimaryStat.SPEED]: 'text-green-500',
    [PrimaryStat.ACCURACY]: 'text-yellow-500',
    [PrimaryStat.DEXTERITY]: 'text-pink-500',
  };
  return colors[stat] || 'text-zinc-400';
};

// ============================================================================
// ELEMENT COLORS
// ============================================================================

export const getElementColor = (element: ElementType): string => {
  const colors: Record<ElementType, string> = {
    [ElementType.FIRE]: 'text-red-500',
    [ElementType.WIND]: 'text-emerald-400',
    [ElementType.LIGHTNING]: 'text-yellow-400',
    [ElementType.EARTH]: 'text-amber-600',
    [ElementType.WATER]: 'text-blue-400',
    [ElementType.PHYSICAL]: 'text-orange-400',
    [ElementType.MENTAL]: 'text-purple-400',
  };
  return colors[element] || 'text-zinc-400';
};

// ============================================================================
// EFFECT COLORS & ICONS
// ============================================================================

export const getEffectColor = (type: EffectType): string => {
  const colors: Record<EffectType, string> = {
    [EffectType.STUN]: 'text-yellow-500',
    [EffectType.DOT]: 'text-red-400',
    [EffectType.BUFF]: 'text-green-400',
    [EffectType.DEBUFF]: 'text-red-500',
    [EffectType.HEAL]: 'text-green-500',
    [EffectType.DRAIN]: 'text-purple-500',
    [EffectType.CONFUSION]: 'text-pink-400',
    [EffectType.SILENCE]: 'text-gray-400',
    [EffectType.BLEED]: 'text-red-600',
    [EffectType.BURN]: 'text-orange-500',
    [EffectType.POISON]: 'text-green-600',
    [EffectType.CHAKRA_DRAIN]: 'text-blue-600',
    [EffectType.SHIELD]: 'text-cyan-400',
    [EffectType.INVULNERABILITY]: 'text-yellow-300',
    [EffectType.CURSE]: 'text-purple-600',
    [EffectType.REFLECTION]: 'text-cyan-300',
    [EffectType.REGEN]: 'text-green-300',
    [EffectType.CHAKRA_REGEN]: 'text-blue-300',
  };
  return colors[type] || 'text-zinc-400';
};

export const getEffectIcon = (type: EffectType): string => {
  const icons: Record<EffectType, string> = {
    [EffectType.STUN]: '⚡',
    [EffectType.DOT]: '🩸',
    [EffectType.BUFF]: '↑',
    [EffectType.DEBUFF]: '↓',
    [EffectType.HEAL]: '💚',
    [EffectType.DRAIN]: '🔮',
    [EffectType.CONFUSION]: '💫',
    [EffectType.SILENCE]: '🔇',
    [EffectType.BLEED]: '🩸',
    [EffectType.BURN]: '🔥',
    [EffectType.POISON]: '☠️',
    [EffectType.CHAKRA_DRAIN]: '💧',
    [EffectType.SHIELD]: '🛡️',
    [EffectType.INVULNERABILITY]: '✨',
    [EffectType.CURSE]: '💀',
    [EffectType.REFLECTION]: '🪞',
    [EffectType.REGEN]: '💗',
    [EffectType.CHAKRA_REGEN]: '🔋',
  };
  return icons[type] || '•';
};

// ============================================================================
// EFFECT DESCRIPTION FORMATTERS
// ============================================================================

export const formatEffectDescription = (effect: EffectDefinition): string => {
  const { type, value, duration, targetStat, chance } = effect;
  const chanceText = chance < 1 ? `${Math.round(chance * 100)}% ` : '';
  const durationText = duration > 0 ? ` for ${duration} turn${duration > 1 ? 's' : ''}` : '';

  switch (type) {
    case EffectType.STUN:
      return `${chanceText}Stun${durationText}`;
    case EffectType.DOT:
      return `${chanceText}${value} dmg/turn${durationText}`;
    case EffectType.BLEED:
      return `${chanceText}Bleed: ${value} dmg/turn${durationText}`;
    case EffectType.BURN:
      return `${chanceText}Burn: ${value} dmg/turn${durationText}`;
    case EffectType.POISON:
      return `${chanceText}Poison: ${value} dmg/turn${durationText}`;
    case EffectType.BUFF:
      return `${chanceText}+${Math.round((value || 0) * 100)}% ${formatScalingStat(targetStat!)}${durationText}`;
    case EffectType.DEBUFF:
      return `${chanceText}-${Math.round((value || 0) * 100)}% ${formatScalingStat(targetStat!)}${durationText}`;
    case EffectType.HEAL:
      return `${chanceText}Heal ${value} HP`;
    case EffectType.DRAIN:
      return `${chanceText}Drain ${value} HP`;
    case EffectType.CONFUSION:
      return `${chanceText}Confusion${durationText}`;
    case EffectType.SILENCE:
      return `${chanceText}Silence${durationText}`;
    case EffectType.CHAKRA_DRAIN:
      return `${chanceText}Drain ${value} Chakra/turn${durationText}`;
    case EffectType.SHIELD:
      return `${chanceText}Shield: absorbs ${value} damage${durationText}`;
    case EffectType.INVULNERABILITY:
      return `${chanceText}Invulnerable${durationText}`;
    case EffectType.CURSE:
      return `${chanceText}Curse: +${Math.round((value || 0) * 100)}% damage taken${durationText}`;
    case EffectType.REFLECTION:
      return `${chanceText}Reflect ${Math.round((value || 0) * 100)}% damage${durationText}`;
    case EffectType.REGEN:
      return `${chanceText}Regen ${value} HP/turn${durationText}`;
    default:
      return type;
  }
};

// Full buff description (for active buffs display)
export const getBuffDescription = (buff: Buff): string => {
  if (!buff?.effect) return buff?.name || 'Unknown effect';
  const { type, value, targetStat } = buff.effect;
  switch (type) {
    case EffectType.STUN:
      return 'Cannot perform any actions.';
    case EffectType.DOT:
    case EffectType.BLEED:
    case EffectType.BURN:
    case EffectType.POISON:
      return `Takes ${value} damage at the start of each turn.`;
    case EffectType.BUFF:
      return `${targetStat} increased by ${Math.round((value || 0) * 100)}%.`;
    case EffectType.DEBUFF:
      return `${targetStat} decreased by ${Math.round((value || 0) * 100)}%.`;
    case EffectType.CONFUSION:
      return '50% chance to hurt self in confusion.';
    case EffectType.SILENCE:
      return 'Cannot use skills with chakra cost.';
    case EffectType.CHAKRA_DRAIN:
      return `Drains ${value} chakra per turn.`;
    case EffectType.SHIELD:
      return `Absorbs the next ${value} damage taken.`;
    case EffectType.INVULNERABILITY:
      return 'Takes 0 damage from all attacks.';
    case EffectType.REFLECTION:
      return `Reflects ${Math.round((value || 0) * 100)}% of damage taken back to attacker.`;
    case EffectType.CURSE:
      return `Damage taken increased by ${Math.round((value || 0) * 100)}%.`;
    case EffectType.REGEN:
      return `Restores ${value} HP at the start of each turn.`;
    default:
      return buff.name;
  }
};

// ============================================================================
// ATTACK METHOD & DAMAGE PROPERTY FORMATTERS
// ============================================================================

export const formatAttackMethod = (method: AttackMethod): string => {
  return method;
};

export const getAttackMethodDescription = (method: AttackMethod): string => {
  switch (method) {
    case AttackMethod.MELEE:
      return 'Uses Speed vs Speed for hit chance';
    case AttackMethod.RANGED:
      return 'Uses Accuracy vs Speed for hit chance';
    case AttackMethod.AUTO:
      return 'Always hits';
    default:
      return '';
  }
};

export const formatDamageProperty = (property: DamageProperty): string => {
  return property;
};

export const getDamagePropertyDescription = (property: DamageProperty): string => {
  switch (property) {
    case DamageProperty.NORMAL:
      return 'Reduced by both flat and % defense';
    case DamageProperty.PIERCING:
      return 'Ignores flat defense';
    case DamageProperty.ARMOR_BREAK:
      return 'Ignores % defense';
    default:
      return '';
  }
};

export const getDamageTypeDescription = (type: DamageType): string => {
  switch (type) {
    case DamageType.PHYSICAL:
      return 'Mitigated by Strength-based defense';
    case DamageType.ELEMENTAL:
      return 'Mitigated by Spirit-based defense';
    case DamageType.MENTAL:
      return 'Mitigated by Calmness-based defense';
    case DamageType.TRUE:
      return 'Bypasses ALL defenses';
    default:
      return '';
  }
};

// ============================================================================
// STAT RANK CALCULATIONS (from CharacterSelect)
// ============================================================================

export const getStatRank = (stats: PrimaryAttributes, keys: (keyof PrimaryAttributes)[]): string => {
  const average = keys.reduce((sum, key) => sum + stats[key], 0) / keys.length;
  if (average >= 22) return 'S';
  if (average >= 19) return 'A';
  if (average >= 16) return 'B';
  if (average >= 13) return 'C';
  return 'D';
};

export const getRankColor = (rank: string): string => {
  switch (rank) {
    case 'S': return 'text-red-500';
    case 'A': return 'text-orange-500';
    case 'B': return 'text-yellow-500';
    case 'C': return 'text-cyan-500';
    case 'D': return 'text-blue-500';
    default: return 'text-zinc-500';
  }
};

// Get all three category ranks for a character
export const getCategoryRanks = (stats: PrimaryAttributes) => {
  return {
    body: getStatRank(stats, ['strength', 'willpower', 'chakra']),
    mind: getStatRank(stats, ['spirit', 'intelligence', 'calmness']),
    technique: getStatRank(stats, ['speed', 'accuracy', 'dexterity']),
  };
};

// ============================================================================
// ITEM STAT FORMATTING
// ============================================================================

export const formatStatName = (key: string): string => {
  const names: Record<string, string> = {
    willpower: 'Willpower',
    chakra: 'Chakra',
    strength: 'Strength',
    spirit: 'Spirit',
    intelligence: 'Intelligence',
    calmness: 'Calmness',
    speed: 'Speed',
    accuracy: 'Accuracy',
    dexterity: 'Dexterity',
    flatHp: 'HP',
    flatChakra: 'Chakra',
    flatPhysicalDef: 'Physical Def',
    flatElementalDef: 'Elemental Def',
    flatMentalDef: 'Mental Def',
    percentPhysicalDef: 'Physical Def %',
    percentElementalDef: 'Elemental Def %',
    percentMentalDef: 'Mental Def %',
    critChance: 'Crit Chance',
    critDamage: 'Crit Damage',
  };
  return names[key] || key.toUpperCase();
};

// ============================================================================
// DETAILED EFFECT MECHANICS - For enhanced tooltips
// ============================================================================

export type EffectCategory = 'dot' | 'control' | 'defensive' | 'stat' | 'resource' | 'utility';

/**
 * Categorizes effects for UI grouping and styling
 */
export const getEffectCategory = (type: EffectType): EffectCategory => {
  switch (type) {
    case EffectType.DOT:
    case EffectType.BLEED:
    case EffectType.BURN:
    case EffectType.POISON:
      return 'dot';
    case EffectType.STUN:
    case EffectType.CONFUSION:
    case EffectType.SILENCE:
      return 'control';
    case EffectType.SHIELD:
    case EffectType.INVULNERABILITY:
    case EffectType.REFLECTION:
    case EffectType.REGEN:
      return 'defensive';
    case EffectType.BUFF:
    case EffectType.DEBUFF:
    case EffectType.CURSE:
      return 'stat';
    case EffectType.HEAL:
    case EffectType.DRAIN:
    case EffectType.CHAKRA_DRAIN:
    case EffectType.CHAKRA_REGEN:
      return 'resource';
    default:
      return 'utility';
  }
};

/**
 * Returns which defense stat mitigates a damage type
 */
export const getDamageTypeDefense = (damageType?: DamageType): string => {
  switch (damageType) {
    case DamageType.PHYSICAL:
      return 'Strength (Physical Defense)';
    case DamageType.ELEMENTAL:
      return 'Spirit (Elemental Defense)';
    case DamageType.MENTAL:
      return 'Calmness (Mental Defense)';
    case DamageType.TRUE:
      return 'None (True damage)';
    default:
      return 'Physical Defense';
  }
};

/**
 * Calculates total DoT damage over duration
 */
export const calculateDoTTotal = (value: number, duration: number): number => {
  return Math.floor(value * duration);
};

/**
 * Returns detailed mechanical breakdown for a buff/effect
 */
export const getDetailedEffectMechanics = (buff: Buff): string[] => {
  if (!buff?.effect) return ['Unknown effect'];

  const { type, value, duration, targetStat, damageType, damageProperty } = buff.effect;
  const mechanics: string[] = [];

  switch (type) {
    case EffectType.DOT:
    case EffectType.BLEED:
    case EffectType.BURN:
    case EffectType.POISON:
      mechanics.push(`${value} damage per turn`);
      if (damageType) {
        mechanics.push(`${damageType} damage type`);
        mechanics.push(`Mitigated by: ${getDamageTypeDefense(damageType)}`);
      }
      if (duration > 0) {
        mechanics.push(`Total damage: ${calculateDoTTotal(value || 0, duration)} over ${duration} turns`);
      }
      if (damageProperty === DamageProperty.PIERCING) {
        mechanics.push('Piercing: Ignores flat defense');
      }
      break;

    case EffectType.STUN:
      mechanics.push('Skips entire turn');
      mechanics.push('Cannot use any skills');
      mechanics.push('Cannot pass turn early');
      break;

    case EffectType.CONFUSION:
      mechanics.push('50% chance to hurt self');
      mechanics.push('Self-damage: 50% of Strength');
      mechanics.push('Can still act normally 50% of time');
      break;

    case EffectType.SILENCE:
      mechanics.push('Cannot use skills with CP cost');
      mechanics.push('Free skills still usable');
      mechanics.push('Basic attack remains available');
      break;

    case EffectType.BUFF:
      mechanics.push(`+${Math.round((value || 0) * 100)}% ${formatScalingStat(targetStat!)}`);
      mechanics.push('Applied after equipment bonuses');
      mechanics.push('Stacks with other buffs');
      break;

    case EffectType.DEBUFF:
      mechanics.push(`-${Math.round((value || 0) * 100)}% ${formatScalingStat(targetStat!)}`);
      mechanics.push('Reduces effective stat value');
      mechanics.push('Can reduce to minimum of 1');
      break;

    case EffectType.SHIELD:
      mechanics.push(`Absorbs next ${value} damage`);
      mechanics.push('Consumed before HP');
      mechanics.push('Breaks when depleted');
      mechanics.push('Does not stack (replaces)');
      break;

    case EffectType.INVULNERABILITY:
      mechanics.push('Blocks ALL incoming damage');
      mechanics.push('Includes True damage');
      mechanics.push('DoT still ticks but deals 0');
      break;

    case EffectType.CURSE:
      mechanics.push(`+${Math.round((value || 0) * 100)}% damage taken`);
      mechanics.push('Applied before defense');
      mechanics.push('Amplifies ALL damage types');
      break;

    case EffectType.REFLECTION:
      mechanics.push(`Returns ${Math.round((value || 0) * 100)}% damage to attacker`);
      mechanics.push('Calculated before shield absorbs');
      mechanics.push('Cannot reflect reflected damage');
      break;

    case EffectType.REGEN:
      mechanics.push(`+${value} HP per turn`);
      mechanics.push('Heals at turn start');
      mechanics.push(`Total heal: ${calculateDoTTotal(value || 0, duration)} over ${duration} turns`);
      break;

    case EffectType.CHAKRA_DRAIN:
      mechanics.push(`-${value} CP per turn`);
      mechanics.push('Drains at turn start');
      mechanics.push('Cannot reduce below 0');
      break;

    case EffectType.CHAKRA_REGEN:
      mechanics.push(`+${value} CP per turn`);
      mechanics.push('Restores at turn start');
      mechanics.push('Capped at max chakra');
      break;

    case EffectType.HEAL:
      mechanics.push(`Restores ${value} HP instantly`);
      mechanics.push('Capped at max HP');
      break;

    case EffectType.DRAIN:
      mechanics.push(`Steals ${value} HP from target`);
      mechanics.push('Heals attacker for same amount');
      break;

    default:
      mechanics.push('Effect details unknown');
  }

  return mechanics;
};

/**
 * Returns strategic tips for countering or utilizing effects
 */
export const getEffectTip = (type: EffectType): string => {
  switch (type) {
    case EffectType.DOT:
    case EffectType.BLEED:
      return 'Physical defense reduces bleed damage';
    case EffectType.BURN:
      return 'Spirit stat reduces fire damage';
    case EffectType.POISON:
      return 'Often ignores some defense - high HP helps';
    case EffectType.STUN:
      return 'Calmness increases status resistance';
    case EffectType.CONFUSION:
      return 'Low Strength reduces self-damage';
    case EffectType.SILENCE:
      return 'Keep a 0-cost skill as backup';
    case EffectType.SHIELD:
      return 'Shield absorbs DoT damage too';
    case EffectType.INVULNERABILITY:
      return 'Use to survive burst damage';
    case EffectType.CURSE:
      return 'Very dangerous - prioritize removing';
    case EffectType.REFLECTION:
      return 'Makes enemies hesitate to attack';
    case EffectType.REGEN:
      return 'Stacks well with high Willpower';
    case EffectType.BUFF:
    case EffectType.DEBUFF:
      return 'Duration can be extended by some skills';
    default:
      return '';
  }
};

/**
 * Returns the effect's severity level for UI styling
 */
export const getEffectSeverity = (buff: Buff): 'low' | 'medium' | 'high' | 'critical' => {
  if (!buff?.effect) return 'low';

  const { type, value, duration } = buff.effect;
  const category = getEffectCategory(type);

  // Control effects are always high severity
  if (category === 'control') {
    return type === EffectType.STUN ? 'critical' : 'high';
  }

  // DoTs scale by total damage
  if (category === 'dot') {
    const totalDmg = calculateDoTTotal(value || 0, duration);
    if (totalDmg >= 100) return 'critical';
    if (totalDmg >= 50) return 'high';
    if (totalDmg >= 25) return 'medium';
    return 'low';
  }

  // Curse is always high
  if (type === EffectType.CURSE) return 'high';

  // Defensive buffs
  if (category === 'defensive') {
    if (type === EffectType.INVULNERABILITY) return 'critical';
    return 'medium';
  }

  return 'low';
};

/**
 * Returns color class based on effect severity
 */
export const getSeverityColor = (severity: 'low' | 'medium' | 'high' | 'critical'): string => {
  switch (severity) {
    case 'critical': return 'text-red-400';
    case 'high': return 'text-orange-400';
    case 'medium': return 'text-yellow-400';
    case 'low': return 'text-zinc-400';
  }
};

/**
 * Returns whether this effect is beneficial or harmful
 */
export const isPositiveEffect = (type: EffectType): boolean => {
  const positiveEffects = [
    EffectType.BUFF,
    EffectType.HEAL,
    EffectType.SHIELD,
    EffectType.INVULNERABILITY,
    EffectType.REFLECTION,
    EffectType.REGEN,
    EffectType.CHAKRA_REGEN,
  ];
  return positiveEffects.includes(type);
};
