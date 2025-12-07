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
  const abbreviations: Record<PrimaryStat, string> = {
    [PrimaryStat.WILLPOWER]: 'WIL',
    [PrimaryStat.CHAKRA]: 'CHA',
    [PrimaryStat.STRENGTH]: 'STR',
    [PrimaryStat.SPIRIT]: 'SPI',
    [PrimaryStat.INTELLIGENCE]: 'INT',
    [PrimaryStat.CALMNESS]: 'CAL',
    [PrimaryStat.SPEED]: 'SPD',
    [PrimaryStat.ACCURACY]: 'ACC',
    [PrimaryStat.DEXTERITY]: 'DEX',
  };
  return abbreviations[stat] || stat;
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
    willpower: 'WIL',
    chakra: 'CHA',
    strength: 'STR',
    spirit: 'SPI',
    intelligence: 'INT',
    calmness: 'CAL',
    speed: 'SPD',
    accuracy: 'ACC',
    dexterity: 'DEX',
    flatHp: 'HP',
    flatChakra: 'CP',
    flatPhysicalDef: 'P.DEF',
    flatElementalDef: 'E.DEF',
    flatMentalDef: 'M.DEF',
    percentPhysicalDef: 'P.DEF%',
    percentElementalDef: 'E.DEF%',
    percentMentalDef: 'M.DEF%',
    critChance: 'CRIT%',
    critDamage: 'CRIT DMG',
  };
  return names[key] || key.toUpperCase();
};
