import {
  PrimaryAttributes, PrimaryStat, Clan, ElementType,
  ItemSlot, Rarity, Skill, EffectType, SkillTier, DamageType,
  DamageProperty, AttackMethod, GameEvent, ActionType
} from '../types';
import { ACADEMY_ARC_EVENTS } from './events/academyArcEvents';
import { WAVES_ARC_EVENTS } from './events/wavesArcEvents';
import { EXAMS_ARC_EVENTS } from './events/examsArcEvents';
import { ROGUE_ARC_EVENTS } from './events/rogueArcEvents';
import { WAR_ARC_EVENTS } from './events/warArcEvents';

// Exploration System Exports
export * from './terrain';
export * from './approaches';

export const MAX_LOGS = 50;

// ============================================================================
// ELEMENTAL ADVANTAGE CYCLE
// Fire > Wind > Lightning > Earth > Water > Fire
// ============================================================================
export const ELEMENTAL_CYCLE: Record<ElementType, ElementType> = {
  [ElementType.FIRE]: ElementType.WIND,
  [ElementType.WIND]: ElementType.LIGHTNING,
  [ElementType.LIGHTNING]: ElementType.EARTH,
  [ElementType.EARTH]: ElementType.WATER,
  [ElementType.WATER]: ElementType.FIRE,
  [ElementType.PHYSICAL]: ElementType.PHYSICAL,
  [ElementType.MENTAL]: ElementType.MENTAL,
};

// Helper to check effectiveness (1.2 = Strong, 0.8 = Weak, 1.0 = Neutral)
export const getElementEffectiveness = (attacker: ElementType, defender: ElementType): number => {
  if (attacker === ElementType.PHYSICAL || attacker === ElementType.MENTAL) return 1.0;

  // Standard Cycle (Attacker beats Defender)
  if (ELEMENTAL_CYCLE[attacker] === defender) return 1.2;

  // Reverse Cycle (Defender beats Attacker -> Resistance)
  if (ELEMENTAL_CYCLE[defender] === attacker) return 0.8;

  return 1.0;
};

// ============================================================================
// CLAN STARTING STATS (Primary Attributes)
// Philosophy:
// - Uzumaki: Massive Willpower/Chakra (Tank/Sustain)
// - Uchiha: High Spirit/Dexterity/Speed (Elemental Glass Cannon)
// - Hyuga: High Accuracy/Dexterity/Strength (Precision Taijutsu)
// - Lee: Extreme Strength/Speed, Zero Spirit/Intelligence (Pure Body)
// - Yamanaka: High Intelligence/Calmness/Spirit (Mind Controller)
// ============================================================================
export const CLAN_STATS: Record<Clan, PrimaryAttributes> = {
  [Clan.UZUMAKI]: {
    willpower: 25,   // Massive life force
    chakra: 22,      // Huge reserves
    strength: 12,
    spirit: 10,
    intelligence: 10,
    calmness: 14,    // Stubborn determination
    speed: 10,
    accuracy: 8,
    dexterity: 8
  },
  [Clan.UCHIHA]: {
    willpower: 12,
    chakra: 14,
    strength: 10,
    spirit: 22,      // Fire affinity mastery
    intelligence: 16,
    calmness: 12,
    speed: 18,       // Sharingan perception
    accuracy: 14,
    dexterity: 18    // Precise strikes
  },
  [Clan.HYUGA]: {
    willpower: 14,
    chakra: 12,
    strength: 16,    // Gentle Fist conditioning
    spirit: 8,       // Less elemental focus
    intelligence: 14,
    calmness: 16,    // Byakugan mental clarity
    speed: 16,
    accuracy: 22,    // Tenketsu precision
    dexterity: 18    // Surgical strikes
  },
  [Clan.LEE]: {
    willpower: 20,   // Never gives up
    chakra: 4,       // Almost no ninjutsu capacity
    strength: 28,    // Peak physical conditioning
    spirit: 2,       // Cannot mold elemental chakra
    intelligence: 6, // Limited jutsu learning
    calmness: 10,
    speed: 26,       // Extreme speed training
    accuracy: 12,
    dexterity: 12
  },
  [Clan.YAMANAKA]: {
    willpower: 12,
    chakra: 18,
    strength: 6,     // Frail body
    spirit: 14,
    intelligence: 22, // Master tacticians
    calmness: 24,    // Unshakeable mind
    speed: 10,
    accuracy: 10,
    dexterity: 12
  },
};

// ============================================================================
// CLAN GROWTH RATES (Stats per Level)
// ============================================================================
export const CLAN_GROWTH: Record<Clan, Partial<PrimaryAttributes>> = {
  [Clan.UZUMAKI]: { 
    willpower: 4, chakra: 3, strength: 1, spirit: 3, 
    intelligence: 1, calmness: 1, speed: 1, accuracy: 1, dexterity: 1 
  },
  [Clan.UCHIHA]: { 
    willpower: 1, chakra: 2, strength: 1, spirit: 3, 
    intelligence: 2, calmness: 1, speed: 2, accuracy: 2, dexterity: 3 
  },
  [Clan.HYUGA]: { 
    willpower: 2, chakra: 1, strength: 2, spirit: 1, 
    intelligence: 2, calmness: 2, speed: 2, accuracy: 3, dexterity: 2 
  },
  [Clan.LEE]: { 
    willpower: 3, chakra: 0, strength: 3, spirit: 0, 
    intelligence: 0, calmness: 1, speed: 4, accuracy: 1, dexterity: 2 
  },
  [Clan.YAMANAKA]: { 
    willpower: 1, chakra: 2, strength: 0, spirit: 2, 
    intelligence: 3, calmness: 4, speed: 1, accuracy: 1, dexterity: 2 
  },
};

// ============================================================================
// ENEMY PREFIXES FOR GENERATION
// ============================================================================
export const ENEMY_PREFIXES = {
  WEAK: ['Exhausted', 'Clumsy', 'Novice'],
  NORMAL: ['Mist', 'Rock', 'Cloud', 'Sound', 'Rogue'],
  STRONG: ['Veteran', 'Vicious', 'Elite', 'Merciless'],
  DEADLY: ['Demonic', 'Cursed', 'Blood-Thirsty']
};

// ============================================================================
// SKILLS DATABASE
// ============================================================================
export const SKILLS: Record<string, Skill> = {
  // ==========================================
  // ACADEMY / BASIC UTILITY
  // ==========================================
  BASIC_ATTACK: {
    id: 'basic_atk',
    name: 'Taijutsu',
    tier: SkillTier.BASIC,
    description: 'A disciplined martial arts strike using raw physical power. Reliable and effective.',
    actionType: ActionType.MAIN,
    chakraCost: 0,
    hpCost: 0,
    cooldown: 0,
    currentCooldown: 0,
    damageMult: 2.0,  // BUFFED: Was 1.0 - doubled for better base damage
    scalingStat: PrimaryStat.STRENGTH,
    damageType: DamageType.PHYSICAL,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.MELEE,
    element: ElementType.PHYSICAL
  },
  
  SHURIKEN: {
    id: 'shuriken',
    name: 'Shuriken',
    tier: SkillTier.BASIC,
    description: 'A swift throw of sharpened steel stars. Targets weak points for high critical chance.',
    actionType: ActionType.MAIN,
    chakraCost: 0,
    hpCost: 0,
    cooldown: 1,
    currentCooldown: 0,
    damageMult: 1.8,  // BUFFED: Was 0.8 - more than doubled
    scalingStat: PrimaryStat.ACCURACY,
    damageType: DamageType.PHYSICAL,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.RANGED,
    element: ElementType.PHYSICAL,
    critBonus: 25
  },
  
  MUD_WALL: {
    id: 'mud_wall',
    name: 'Mud Wall',
    tier: SkillTier.BASIC,
    description: 'Spits mud that hardens into a barricade. Creates a Shield.',
    actionType: ActionType.SIDE,  // Defensive utility - use before MAIN
    chakraCost: 15,
    hpCost: 0,
    cooldown: 4,
    currentCooldown: 0,
    damageMult: 0,
    scalingStat: PrimaryStat.SPIRIT,
    damageType: DamageType.ELEMENTAL,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.AUTO,
    element: ElementType.EARTH,
    requirements: { intelligence: 8 },
    effects: [{ type: EffectType.SHIELD, value: 40, duration: 3, chance: 1.0 }]
  },
  
  PHOENIX_FLOWER: {
    id: 'phoenix_flower',
    name: 'Phoenix Flower',
    tier: SkillTier.BASIC,
    description: 'Volleys of small fireballs. Chance to burn. (SIDE action exception - deals damage)',
    actionType: ActionType.SIDE,  // Exception: SIDE action that deals damage
    chakraCost: 20,
    hpCost: 0,
    cooldown: 2,
    currentCooldown: 0,
    damageMult: 2.2,  // BUFFED: Was 1.5 - elemental attacks should hit harder
    scalingStat: PrimaryStat.SPIRIT,
    damageType: DamageType.ELEMENTAL,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.RANGED,
    element: ElementType.FIRE,
    requirements: { intelligence: 10 },
    effects: [{
      type: EffectType.BURN,
      value: 8,      // BUFFED: Was 5 - burn should be meaningful
      duration: 2,
      chance: 0.5,
      damageType: DamageType.ELEMENTAL,
      damageProperty: DamageProperty.NORMAL
    }]
  },

  KAWARIMI: {
    id: 'kawarimi',
    name: 'Body Replacement',
    tier: SkillTier.BASIC,
    description: 'Switch places with a log. The log absorbs damage while you reposition.',
    actionType: ActionType.SIDE,  // Defensive setup
    chakraCost: 10,
    hpCost: 0,
    cooldown: 4,
    currentCooldown: 0,
    damageMult: 0,
    scalingStat: PrimaryStat.DEXTERITY,
    damageType: DamageType.PHYSICAL,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.AUTO,
    element: ElementType.PHYSICAL,
    effects: [
      { type: EffectType.SHIELD, value: 30, duration: 1, chance: 1.0 },
      { type: EffectType.BUFF, targetStat: PrimaryStat.SPEED, value: 0.3, duration: 2, chance: 1.0 }
    ]
  },

  BUNSHIN: {
    id: 'bunshin',
    name: 'Clone Technique',
    tier: SkillTier.BASIC,
    description: 'Creates illusory copies to distract the enemy. Slight Evasion boost.',
    actionType: ActionType.SIDE,  // Buff setup
    chakraCost: 5,
    hpCost: 0,
    cooldown: 3,
    currentCooldown: 0,
    damageMult: 0,
    scalingStat: PrimaryStat.CHAKRA,
    damageType: DamageType.MENTAL,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.AUTO,
    element: ElementType.MENTAL,
    effects: [{ type: EffectType.BUFF, targetStat: PrimaryStat.SPEED, value: 0.2, duration: 2, chance: 1.0 }]
  },

  HENGE: {
    id: 'henge',
    name: 'Transformation',
    tier: SkillTier.BASIC,
    description: 'Transform into an object or person for a surprise attack.',
    actionType: ActionType.SIDE,  // Crit setup buff
    chakraCost: 5,
    hpCost: 0,
    cooldown: 4,
    currentCooldown: 0,
    damageMult: 0,
    scalingStat: PrimaryStat.INTELLIGENCE,
    damageType: DamageType.MENTAL,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.AUTO,
    element: ElementType.MENTAL,
    effects: [{ type: EffectType.BUFF, targetStat: PrimaryStat.DEXTERITY, value: 0.25, duration: 2, chance: 1.0 }]
  },

  SHUNSHIN: {
    id: 'shunshin',
    name: 'Body Flicker',
    tier: SkillTier.BASIC,
    description: 'High-speed movement to close gaps. Greatly boosts Initiative.',
    actionType: ActionType.SIDE,  // Speed buff setup
    chakraCost: 15,
    hpCost: 0,
    cooldown: 3,
    currentCooldown: 0,
    damageMult: 0,
    scalingStat: PrimaryStat.SPEED,
    damageType: DamageType.PHYSICAL,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.AUTO,
    element: ElementType.PHYSICAL,
    effects: [{ type: EffectType.BUFF, targetStat: PrimaryStat.SPEED, value: 0.4, duration: 2, chance: 1.0 }]
  },

  KAI: {
    id: 'kai',
    name: 'Release',
    tier: SkillTier.BASIC,
    description: 'Disrupts chakra flow to break illusions. Boosts Genjutsu Resistance.',
    actionType: ActionType.SIDE,  // Dispel + buff
    chakraCost: 10,
    hpCost: 0,
    cooldown: 2,
    currentCooldown: 0,
    damageMult: 0,
    scalingStat: PrimaryStat.CALMNESS,
    damageType: DamageType.MENTAL,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.AUTO,
    element: ElementType.MENTAL,
    effects: [{ type: EffectType.BUFF, targetStat: PrimaryStat.CALMNESS, value: 0.5, duration: 3, chance: 1.0 }]
  },

  // ==========================================
  // BASIC TIER - TAIJUTSU (NEW)
  // ==========================================
  LEAF_WHIRLWIND: {
    id: 'leaf_whirlwind',
    name: 'Leaf Whirlwind',
    tier: SkillTier.BASIC,
    description: 'A spinning kick that disrupts enemy accuracy.',
    actionType: ActionType.MAIN,
    chakraCost: 0,
    hpCost: 0,
    cooldown: 2,
    currentCooldown: 0,
    damageMult: 2.2,
    scalingStat: PrimaryStat.SPEED,
    damageType: DamageType.PHYSICAL,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.MELEE,
    element: ElementType.PHYSICAL,
    effects: [{ type: EffectType.DEBUFF, targetStat: PrimaryStat.ACCURACY, value: 0.15, duration: 2, chance: 0.3 }]
  },

  DYNAMIC_ENTRY: {
    id: 'dynamic_entry',
    name: 'Dynamic Entry',
    tier: SkillTier.BASIC,
    description: 'A powerful flying kick! Guaranteed first strike with high crit chance.',
    actionType: ActionType.MAIN,
    chakraCost: 0,
    hpCost: 0,
    cooldown: 3,
    currentCooldown: 0,
    damageMult: 2.5,
    scalingStat: PrimaryStat.STRENGTH,
    damageType: DamageType.PHYSICAL,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.MELEE,
    element: ElementType.PHYSICAL,
    critBonus: 20
  },

  RISING_WIND: {
    id: 'rising_wind',
    name: 'Leaf Rising Wind',
    tier: SkillTier.BASIC,
    description: 'An upward kick that sets up a follow-up attack.',
    actionType: ActionType.MAIN,
    chakraCost: 0,
    hpCost: 0,
    cooldown: 2,
    currentCooldown: 0,
    damageMult: 1.8,
    scalingStat: PrimaryStat.SPEED,
    damageType: DamageType.PHYSICAL,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.MELEE,
    element: ElementType.PHYSICAL,
    effects: [{ type: EffectType.BUFF, targetStat: PrimaryStat.STRENGTH, value: 0.25, duration: 1, chance: 1.0 }]
  },

  STRONG_FIST: {
    id: 'strong_fist',
    name: 'Strong Fist Combo',
    tier: SkillTier.BASIC,
    description: 'A rapid two-hit combo at 75% damage each.',
    actionType: ActionType.MAIN,
    chakraCost: 0,
    hpCost: 0,
    cooldown: 1,
    currentCooldown: 0,
    damageMult: 1.5,  // Note: Should hit twice at 75% each in combat system
    scalingStat: PrimaryStat.STRENGTH,
    damageType: DamageType.PHYSICAL,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.MELEE,
    element: ElementType.PHYSICAL
  },

  SWEEPING_KICK: {
    id: 'sweeping_kick',
    name: 'Sweeping Kick',
    tier: SkillTier.BASIC,
    description: 'A low sweep with a chance to stun.',
    actionType: ActionType.MAIN,
    chakraCost: 0,
    hpCost: 0,
    cooldown: 2,
    currentCooldown: 0,
    damageMult: 1.6,
    scalingStat: PrimaryStat.SPEED,
    damageType: DamageType.PHYSICAL,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.MELEE,
    element: ElementType.PHYSICAL,
    effects: [{ type: EffectType.STUN, duration: 1, chance: 0.4 }]
  },

  ELBOW_STRIKE: {
    id: 'elbow_strike',
    name: 'Elbow Strike',
    tier: SkillTier.BASIC,
    description: 'A close-range elbow strike that ignores flat defense.',
    actionType: ActionType.MAIN,
    chakraCost: 0,
    hpCost: 0,
    cooldown: 1,
    currentCooldown: 0,
    damageMult: 2.0,
    scalingStat: PrimaryStat.STRENGTH,
    damageType: DamageType.PHYSICAL,
    damageProperty: DamageProperty.PIERCING,
    attackMethod: AttackMethod.MELEE,
    element: ElementType.PHYSICAL
  },

  FEINT_STRIKE: {
    id: 'feint_strike',
    name: 'Feint Strike',
    tier: SkillTier.BASIC,
    description: 'A deceptive attack that cannot be evaded.',
    actionType: ActionType.MAIN,
    chakraCost: 0,
    hpCost: 0,
    cooldown: 2,
    currentCooldown: 0,
    damageMult: 1.5,
    scalingStat: PrimaryStat.DEXTERITY,
    damageType: DamageType.PHYSICAL,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.AUTO,  // Cannot be evaded
    element: ElementType.PHYSICAL
  },

  COUNTER_STANCE: {
    id: 'counter_stance',
    name: 'Counter Stance',
    tier: SkillTier.BASIC,
    description: 'Prepare to counter-attack if hit this turn.',
    actionType: ActionType.MAIN,
    chakraCost: 5,
    hpCost: 0,
    cooldown: 4,
    currentCooldown: 0,
    damageMult: 2.0,
    scalingStat: PrimaryStat.STRENGTH,
    damageType: DamageType.PHYSICAL,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.MELEE,
    element: ElementType.PHYSICAL,
    effects: [{ type: EffectType.REFLECTION, value: 0.5, duration: 1, chance: 1.0 }]
  },

  DANCING_LEAF: {
    id: 'dancing_leaf',
    name: 'Shadow of Dancing Leaf',
    tier: SkillTier.BASIC,
    description: 'Position behind target for devastating follow-up.',
    actionType: ActionType.SIDE,
    chakraCost: 5,
    hpCost: 0,
    cooldown: 3,
    currentCooldown: 0,
    damageMult: 0,
    scalingStat: PrimaryStat.SPEED,
    damageType: DamageType.PHYSICAL,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.AUTO,
    element: ElementType.PHYSICAL,
    effects: [
      { type: EffectType.BUFF, targetStat: PrimaryStat.STRENGTH, value: 0.5, duration: 1, chance: 1.0 },
      { type: EffectType.BUFF, targetStat: PrimaryStat.DEXTERITY, value: 0.3, duration: 1, chance: 1.0 }
    ]
  },

  FOCUSED_BREATHING: {
    id: 'focused_breathing',
    name: 'Focused Breathing',
    tier: SkillTier.BASIC,
    description: 'Regulate breathing to recover chakra.',
    actionType: ActionType.SIDE,
    chakraCost: 0,
    hpCost: 0,
    cooldown: 2,
    currentCooldown: 0,
    damageMult: 0,
    scalingStat: PrimaryStat.CALMNESS,
    damageType: DamageType.PHYSICAL,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.AUTO,
    element: ElementType.PHYSICAL,
    effects: [{ type: EffectType.CHAKRA_REGEN, value: 10, duration: 1, chance: 1.0 }]
  },

  // ==========================================
  // BASIC TIER - WEAPONS (NEW)
  // ==========================================
  KUNAI_SLASH: {
    id: 'kunai_slash',
    name: 'Kunai Slash',
    tier: SkillTier.BASIC,
    description: 'A quick slash with a kunai. Chance to cause bleeding.',
    actionType: ActionType.MAIN,
    chakraCost: 0,
    hpCost: 0,
    cooldown: 1,
    currentCooldown: 0,
    damageMult: 1.9,
    scalingStat: PrimaryStat.DEXTERITY,
    damageType: DamageType.PHYSICAL,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.MELEE,
    element: ElementType.PHYSICAL,
    effects: [{ type: EffectType.BLEED, value: 5, duration: 2, chance: 0.25, damageType: DamageType.PHYSICAL, damageProperty: DamageProperty.NORMAL }]
  },

  KUNAI_THROW: {
    id: 'kunai_throw',
    name: 'Kunai Throw',
    tier: SkillTier.BASIC,
    description: 'Throw a kunai at the enemy. Basic ranged attack.',
    actionType: ActionType.MAIN,
    chakraCost: 0,
    hpCost: 0,
    cooldown: 1,
    currentCooldown: 0,
    damageMult: 1.7,
    scalingStat: PrimaryStat.ACCURACY,
    damageType: DamageType.PHYSICAL,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.RANGED,
    element: ElementType.PHYSICAL
  },

  SHURIKEN_BARRAGE: {
    id: 'shuriken_barrage',
    name: 'Shuriken Barrage',
    tier: SkillTier.BASIC,
    description: 'Throw three shuriken at 40% damage each.',
    actionType: ActionType.MAIN,
    chakraCost: 5,
    hpCost: 0,
    cooldown: 2,
    currentCooldown: 0,
    damageMult: 1.2,  // 3 hits at 40% = 1.2 total
    scalingStat: PrimaryStat.ACCURACY,
    damageType: DamageType.PHYSICAL,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.RANGED,
    element: ElementType.PHYSICAL
  },

  WINDMILL_SHURIKEN: {
    id: 'windmill_shuriken',
    name: 'Windmill Shuriken',
    tier: SkillTier.BASIC,
    description: 'A large shuriken that ignores shields with armor penetration.',
    actionType: ActionType.MAIN,
    chakraCost: 0,
    hpCost: 0,
    cooldown: 3,
    currentCooldown: 0,
    damageMult: 2.8,
    scalingStat: PrimaryStat.ACCURACY,
    damageType: DamageType.PHYSICAL,
    damageProperty: DamageProperty.PIERCING,
    attackMethod: AttackMethod.RANGED,
    element: ElementType.PHYSICAL,
    penetration: 0.2
  },

  SENBON: {
    id: 'senbon',
    name: 'Senbon Needle',
    tier: SkillTier.BASIC,
    description: 'A precise needle throw. High chance to silence.',
    actionType: ActionType.MAIN,
    chakraCost: 0,
    hpCost: 0,
    cooldown: 1,
    currentCooldown: 0,
    damageMult: 1.2,
    scalingStat: PrimaryStat.ACCURACY,
    damageType: DamageType.PHYSICAL,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.RANGED,
    element: ElementType.PHYSICAL,
    effects: [{ type: EffectType.SILENCE, duration: 1, chance: 0.5 }]
  },

  SENBON_RAIN: {
    id: 'senbon_rain',
    name: 'Senbon Rain',
    tier: SkillTier.BASIC,
    description: 'A barrage of poisoned needles. Five hits with poison chance.',
    actionType: ActionType.MAIN,
    chakraCost: 10,
    hpCost: 0,
    cooldown: 3,
    currentCooldown: 0,
    damageMult: 0.8,  // 5 hits at low damage
    scalingStat: PrimaryStat.ACCURACY,
    damageType: DamageType.PHYSICAL,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.RANGED,
    element: ElementType.PHYSICAL,
    effects: [{ type: EffectType.POISON, value: 5, duration: 3, chance: 0.2, damageType: DamageType.TRUE, damageProperty: DamageProperty.NORMAL }]
  },

  EXPLOSIVE_TAG: {
    id: 'explosive_tag',
    name: 'Explosive Tag',
    tier: SkillTier.BASIC,
    description: 'Throw an explosive tag. Fire element damage.',
    actionType: ActionType.MAIN,
    chakraCost: 0,
    hpCost: 0,
    cooldown: 2,
    currentCooldown: 0,
    damageMult: 2.5,
    scalingStat: PrimaryStat.DEXTERITY,
    damageType: DamageType.ELEMENTAL,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.RANGED,
    element: ElementType.FIRE
  },

  EXPLOSIVE_BARRAGE: {
    id: 'explosive_barrage',
    name: 'Explosive Barrage',
    tier: SkillTier.BASIC,
    description: 'Multiple explosive tags that reduce enemy evasion.',
    actionType: ActionType.MAIN,
    chakraCost: 10,
    hpCost: 0,
    cooldown: 4,
    currentCooldown: 0,
    damageMult: 3.0,
    scalingStat: PrimaryStat.DEXTERITY,
    damageType: DamageType.ELEMENTAL,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.RANGED,
    element: ElementType.FIRE,
    effects: [{ type: EffectType.DEBUFF, targetStat: PrimaryStat.SPEED, value: 0.2, duration: 2, chance: 1.0 }]
  },

  SWORD_SLASH: {
    id: 'sword_slash',
    name: 'Sword Slash',
    tier: SkillTier.BASIC,
    description: 'A powerful sword strike with bleeding chance.',
    actionType: ActionType.MAIN,
    chakraCost: 0,
    hpCost: 0,
    cooldown: 1,
    currentCooldown: 0,
    damageMult: 2.2,
    scalingStat: PrimaryStat.STRENGTH,
    damageType: DamageType.PHYSICAL,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.MELEE,
    element: ElementType.PHYSICAL,
    effects: [{ type: EffectType.BLEED, value: 7, duration: 2, chance: 0.3, damageType: DamageType.PHYSICAL, damageProperty: DamageProperty.NORMAL }]
  },

  IAIDO: {
    id: 'iaido',
    name: 'Iaido',
    tier: SkillTier.BASIC,
    description: 'A lightning-fast quick draw attack. +40% crit if first action.',
    actionType: ActionType.MAIN,
    chakraCost: 5,
    hpCost: 0,
    cooldown: 3,
    currentCooldown: 0,
    damageMult: 2.8,
    scalingStat: PrimaryStat.SPEED,
    damageType: DamageType.PHYSICAL,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.MELEE,
    element: ElementType.PHYSICAL,
    critBonus: 40
  },

  WIRE_SETUP: {
    id: 'wire_setup',
    name: 'Wire Trap Setup',
    tier: SkillTier.BASIC,
    description: 'Set up wire traps. Next MAIN attack deals +20% damage and causes bleed.',
    actionType: ActionType.SIDE,
    chakraCost: 5,
    hpCost: 0,
    cooldown: 4,
    currentCooldown: 0,
    damageMult: 0,
    scalingStat: PrimaryStat.DEXTERITY,
    damageType: DamageType.PHYSICAL,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.AUTO,
    element: ElementType.PHYSICAL,
    effects: [
      { type: EffectType.BUFF, targetStat: PrimaryStat.STRENGTH, value: 0.2, duration: 1, chance: 1.0 },
      { type: EffectType.BLEED, value: 8, duration: 2, chance: 0.4, damageType: DamageType.PHYSICAL, damageProperty: DamageProperty.NORMAL }
    ]
  },

  POISON_COAT: {
    id: 'poison_coat',
    name: 'Poison Coat',
    tier: SkillTier.BASIC,
    description: 'Coat weapon with poison. Next attack applies poison.',
    actionType: ActionType.SIDE,
    chakraCost: 5,
    hpCost: 0,
    cooldown: 4,
    currentCooldown: 0,
    damageMult: 0,
    scalingStat: PrimaryStat.DEXTERITY,
    damageType: DamageType.PHYSICAL,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.AUTO,
    element: ElementType.PHYSICAL,
    effects: [{ type: EffectType.POISON, value: 8, duration: 3, chance: 1.0, damageType: DamageType.TRUE, damageProperty: DamageProperty.NORMAL }]
  },

  // ==========================================
  // BASIC TIER - ACADEMY UTILITY (NEW)
  // ==========================================
  SMOKE_BOMB: {
    id: 'smoke_bomb',
    name: 'Smoke Bomb',
    tier: SkillTier.BASIC,
    description: 'Create a smoke screen for evasion boost and enemy accuracy reduction.',
    actionType: ActionType.SIDE,
    chakraCost: 0,
    hpCost: 0,
    cooldown: 3,
    currentCooldown: 0,
    damageMult: 0,
    scalingStat: PrimaryStat.DEXTERITY,
    damageType: DamageType.PHYSICAL,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.AUTO,
    element: ElementType.PHYSICAL,
    effects: [
      { type: EffectType.BUFF, targetStat: PrimaryStat.SPEED, value: 0.35, duration: 2, chance: 1.0 },
      { type: EffectType.DEBUFF, targetStat: PrimaryStat.ACCURACY, value: 0.2, duration: 2, chance: 1.0 }
    ]
  },

  FLASH_BOMB: {
    id: 'flash_bomb',
    name: 'Flash Bomb',
    tier: SkillTier.BASIC,
    description: 'Blind the enemy with a flash. Chance to reduce their accuracy.',
    actionType: ActionType.SIDE,
    chakraCost: 0,
    hpCost: 0,
    cooldown: 4,
    currentCooldown: 0,
    damageMult: 0,
    scalingStat: PrimaryStat.DEXTERITY,
    damageType: DamageType.PHYSICAL,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.AUTO,
    element: ElementType.PHYSICAL,
    effects: [{ type: EffectType.DEBUFF, targetStat: PrimaryStat.ACCURACY, value: 0.4, duration: 2, chance: 0.5 }]
  },

  ANALYZE: {
    id: 'analyze',
    name: 'Analyze Enemy',
    tier: SkillTier.BASIC,
    description: 'Study the enemy for weaknesses. Increases damage dealt.',
    actionType: ActionType.SIDE,
    chakraCost: 0,
    hpCost: 0,
    cooldown: 5,
    currentCooldown: 0,
    damageMult: 0,
    scalingStat: PrimaryStat.INTELLIGENCE,
    damageType: DamageType.MENTAL,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.AUTO,
    element: ElementType.MENTAL,
    effects: [{ type: EffectType.BUFF, targetStat: PrimaryStat.STRENGTH, value: 0.15, duration: 3, chance: 1.0 }]
  },

  BRACE: {
    id: 'brace',
    name: 'Brace',
    tier: SkillTier.BASIC,
    description: 'Prepare for impact. Gain +30% defense until next turn.',
    actionType: ActionType.SIDE,
    chakraCost: 0,
    hpCost: 0,
    cooldown: 3,
    currentCooldown: 0,
    damageMult: 0,
    scalingStat: PrimaryStat.WILLPOWER,
    damageType: DamageType.PHYSICAL,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.AUTO,
    element: ElementType.PHYSICAL,
    effects: [{ type: EffectType.BUFF, targetStat: PrimaryStat.WILLPOWER, value: 0.3, duration: 1, chance: 1.0 }]
  },

  CLOAK_INVIS: {
    id: 'cloak_invis',
    name: 'Cloak of Invisibility',
    tier: SkillTier.BASIC,
    description: 'Become nearly invisible. +60% evasion and next hit auto-crits.',
    actionType: ActionType.SIDE,
    chakraCost: 10,
    hpCost: 0,
    cooldown: 4,
    currentCooldown: 0,
    damageMult: 0,
    scalingStat: PrimaryStat.DEXTERITY,
    damageType: DamageType.PHYSICAL,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.AUTO,
    element: ElementType.PHYSICAL,
    effects: [
      { type: EffectType.BUFF, targetStat: PrimaryStat.SPEED, value: 0.6, duration: 1, chance: 1.0 },
      { type: EffectType.BUFF, targetStat: PrimaryStat.DEXTERITY, value: 0.5, duration: 1, chance: 1.0 }
    ]
  },

  BASIC_MEDICAL: {
    id: 'basic_medical',
    name: 'Basic Medical Jutsu',
    tier: SkillTier.BASIC,
    description: 'Heal wounds with medical chakra. Removes poison and bleeding.',
    actionType: ActionType.MAIN,
    chakraCost: 20,
    hpCost: 0,
    cooldown: 5,
    currentCooldown: 0,
    damageMult: 0,
    scalingStat: PrimaryStat.INTELLIGENCE,
    damageType: DamageType.PHYSICAL,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.AUTO,
    element: ElementType.PHYSICAL,
    effects: [{ type: EffectType.HEAL, value: 25, duration: 1, chance: 1.0 }]
  },

  // ==========================================
  // BASIC TIER - TOGGLE STANCES (NEW)
  // ==========================================
  FOCUSED_STANCE: {
    id: 'focused_stance',
    name: 'Focused Stance',
    tier: SkillTier.BASIC,
    description: 'A stance focused on precision. +20% ACC, +15% Crit.',
    actionType: ActionType.TOGGLE,
    chakraCost: 10,
    hpCost: 0,
    cooldown: 5,
    currentCooldown: 0,
    damageMult: 0,
    scalingStat: PrimaryStat.ACCURACY,
    damageType: DamageType.PHYSICAL,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.AUTO,
    element: ElementType.PHYSICAL,
    isToggle: true,
    upkeepCost: 3,
    effects: [
      { type: EffectType.BUFF, targetStat: PrimaryStat.ACCURACY, value: 0.2, duration: -1, chance: 1.0 },
      { type: EffectType.BUFF, targetStat: PrimaryStat.DEXTERITY, value: 0.15, duration: -1, chance: 1.0 }
    ]
  },

  DEFENSIVE_POSTURE: {
    id: 'defensive_posture',
    name: 'Defensive Posture',
    tier: SkillTier.BASIC,
    description: 'A defensive stance. +25% Defense, -15% Speed.',
    actionType: ActionType.TOGGLE,
    chakraCost: 10,
    hpCost: 0,
    cooldown: 5,
    currentCooldown: 0,
    damageMult: 0,
    scalingStat: PrimaryStat.WILLPOWER,
    damageType: DamageType.PHYSICAL,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.AUTO,
    element: ElementType.PHYSICAL,
    isToggle: true,
    upkeepCost: 3,
    effects: [
      { type: EffectType.BUFF, targetStat: PrimaryStat.WILLPOWER, value: 0.25, duration: -1, chance: 1.0 },
      { type: EffectType.DEBUFF, targetStat: PrimaryStat.SPEED, value: 0.15, duration: -1, chance: 1.0 }
    ]
  },

  AGGRESSIVE_STANCE: {
    id: 'aggressive_stance',
    name: 'Aggressive Stance',
    tier: SkillTier.BASIC,
    description: 'An offensive stance. +30% STR, -20% Defense.',
    actionType: ActionType.TOGGLE,
    chakraCost: 10,
    hpCost: 0,
    cooldown: 5,
    currentCooldown: 0,
    damageMult: 0,
    scalingStat: PrimaryStat.STRENGTH,
    damageType: DamageType.PHYSICAL,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.AUTO,
    element: ElementType.PHYSICAL,
    isToggle: true,
    upkeepCost: 5,
    effects: [
      { type: EffectType.BUFF, targetStat: PrimaryStat.STRENGTH, value: 0.3, duration: -1, chance: 1.0 },
      { type: EffectType.DEBUFF, targetStat: PrimaryStat.WILLPOWER, value: 0.2, duration: -1, chance: 1.0 }
    ]
  },

  // ==========================================
  // BASIC TIER - PASSIVE ABILITIES (NEW)
  // ==========================================
  WEAPON_PROFICIENCY: {
    id: 'weapon_proficiency',
    name: 'Weapon Proficiency',
    tier: SkillTier.BASIC,
    description: '+10% weapon damage.',
    actionType: ActionType.PASSIVE,
    chakraCost: 0,
    hpCost: 0,
    cooldown: 0,
    currentCooldown: 0,
    damageMult: 0,
    scalingStat: PrimaryStat.DEXTERITY,
    damageType: DamageType.PHYSICAL,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.AUTO,
    element: ElementType.PHYSICAL,
    requirements: { intelligence: 10 },
    passiveEffect: {
      damageBonus: 0.1
    }
  },

  TAIJUTSU_TRAINING: {
    id: 'taijutsu_training',
    name: 'Taijutsu Training',
    tier: SkillTier.BASIC,
    description: '+10% taijutsu damage.',
    actionType: ActionType.PASSIVE,
    chakraCost: 0,
    hpCost: 0,
    cooldown: 0,
    currentCooldown: 0,
    damageMult: 0,
    scalingStat: PrimaryStat.STRENGTH,
    damageType: DamageType.PHYSICAL,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.AUTO,
    element: ElementType.PHYSICAL,
    requirements: { intelligence: 10 },
    passiveEffect: {
      damageBonus: 0.1
    }
  },

  QUICK_REFLEXES: {
    id: 'quick_reflexes',
    name: 'Quick Reflexes',
    tier: SkillTier.BASIC,
    description: '+5% Evasion.',
    actionType: ActionType.PASSIVE,
    chakraCost: 0,
    hpCost: 0,
    cooldown: 0,
    currentCooldown: 0,
    damageMult: 0,
    scalingStat: PrimaryStat.SPEED,
    damageType: DamageType.PHYSICAL,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.AUTO,
    element: ElementType.PHYSICAL,
    requirements: { intelligence: 15 },
    passiveEffect: {
      statBonus: { speed: 5 }
    }
  },

  IRON_BODY: {
    id: 'iron_body',
    name: 'Iron Body',
    tier: SkillTier.BASIC,
    description: '+5% Physical Defense.',
    actionType: ActionType.PASSIVE,
    chakraCost: 0,
    hpCost: 0,
    cooldown: 0,
    currentCooldown: 0,
    damageMult: 0,
    scalingStat: PrimaryStat.STRENGTH,
    damageType: DamageType.PHYSICAL,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.AUTO,
    element: ElementType.PHYSICAL,
    requirements: { intelligence: 15 },
    passiveEffect: {
      defenseBonus: 0.05
    }
  },

  CHAKRA_RESERVES: {
    id: 'chakra_reserves',
    name: 'Chakra Reserves',
    tier: SkillTier.BASIC,
    description: '+3 CP regen/turn.',
    actionType: ActionType.PASSIVE,
    chakraCost: 0,
    hpCost: 0,
    cooldown: 0,
    currentCooldown: 0,
    damageMult: 0,
    scalingStat: PrimaryStat.CHAKRA,
    damageType: DamageType.PHYSICAL,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.AUTO,
    element: ElementType.PHYSICAL,
    requirements: { intelligence: 15 },
    passiveEffect: {
      regenBonus: { chakra: 3 }
    }
  },

  MENTAL_FORTITUDE: {
    id: 'mental_fortitude',
    name: 'Mental Fortitude',
    tier: SkillTier.BASIC,
    description: '+10% Genjutsu Resistance.',
    actionType: ActionType.PASSIVE,
    chakraCost: 0,
    hpCost: 0,
    cooldown: 0,
    currentCooldown: 0,
    damageMult: 0,
    scalingStat: PrimaryStat.CALMNESS,
    damageType: DamageType.MENTAL,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.AUTO,
    element: ElementType.MENTAL,
    requirements: { intelligence: 15 },
    passiveEffect: {
      statBonus: { calmness: 10 }
    }
  },

  PRECISION: {
    id: 'precision',
    name: 'Precision',
    tier: SkillTier.BASIC,
    description: '+5% Critical Chance.',
    actionType: ActionType.PASSIVE,
    chakraCost: 0,
    hpCost: 0,
    cooldown: 0,
    currentCooldown: 0,
    damageMult: 0,
    scalingStat: PrimaryStat.ACCURACY,
    damageType: DamageType.PHYSICAL,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.AUTO,
    element: ElementType.PHYSICAL,
    requirements: { intelligence: 15 },
    passiveEffect: {
      statBonus: { accuracy: 5 }
    }
  },

  FIRE_AFFINITY: {
    id: 'fire_affinity',
    name: 'Fire Affinity',
    tier: SkillTier.BASIC,
    description: '+15% Fire damage.',
    actionType: ActionType.PASSIVE,
    chakraCost: 0,
    hpCost: 0,
    cooldown: 0,
    currentCooldown: 0,
    damageMult: 0,
    scalingStat: PrimaryStat.SPIRIT,
    damageType: DamageType.ELEMENTAL,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.AUTO,
    element: ElementType.FIRE,
    requirements: { clan: Clan.UCHIHA },
    passiveEffect: {
      damageBonus: 0.15
    }
  },

  AIR_PALM: {
    id: 'air_palm',
    name: 'Air Palm',
    tier: SkillTier.ADVANCED,
    description: 'Hyuga ranged technique. Fires a burst of chakra.',
    actionType: ActionType.MAIN,
    chakraCost: 15,
    hpCost: 0,
    cooldown: 2,
    currentCooldown: 0,
    damageMult: 2.5,
    scalingStat: PrimaryStat.ACCURACY,
    damageType: DamageType.PHYSICAL,
    damageProperty: DamageProperty.PIERCING,
    attackMethod: AttackMethod.RANGED,
    element: ElementType.WIND,
    requirements: { intelligence: 12, clan: Clan.HYUGA }
  },

  // ==== RARE / ADVANCED ====
  RASENGAN: {
    id: 'rasengan',
    name: 'Rasengan',
    tier: SkillTier.ADVANCED,
    description: 'A swirling sphere of pure wind chakra that grinds into the target. PIERCING damage ignores flat defense.',
    actionType: ActionType.MAIN,
    chakraCost: 35,
    hpCost: 0,
    cooldown: 3,
    currentCooldown: 0,
    damageMult: 4.0,  // BUFFED: Was 2.8 - signature move should hit hard
    scalingStat: PrimaryStat.SPIRIT,
    damageType: DamageType.ELEMENTAL,
    damageProperty: DamageProperty.PIERCING, // Ignores flat armor!
    attackMethod: AttackMethod.MELEE,
    element: ElementType.WIND,
    requirements: { intelligence: 14 },
    effects: [{
      type: EffectType.DEBUFF,
      targetStat: PrimaryStat.STRENGTH,
      value: 0.2,
      duration: 3,
      chance: 0.5
    }]
  },

  FIREBALL: {
    id: 'fireball',
    name: 'Fireball Jutsu',
    tier: SkillTier.ADVANCED,
    description: 'A massive, searing projectile of flame. Leaves the target burning.',
    actionType: ActionType.MAIN,
    chakraCost: 25,
    hpCost: 0,
    cooldown: 3,
    currentCooldown: 0,
    damageMult: 3.5,  // BUFFED: Was 2.4 - main elemental nuke
    scalingStat: PrimaryStat.SPIRIT,
    damageType: DamageType.ELEMENTAL,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.RANGED,
    element: ElementType.FIRE,
    requirements: { intelligence: 12 },
    effects: [{
      type: EffectType.BURN,
      value: 15,
      duration: 3,
      chance: 0.8,
      damageType: DamageType.ELEMENTAL,
      damageProperty: DamageProperty.NORMAL
    }]
  },

  ROTATION: {
    id: 'kaiten',
    name: '8 Trigrams Rotation',
    tier: SkillTier.HIDDEN,
    description: 'Expels chakra while spinning to repel attacks. Reflects damage.',
    actionType: ActionType.SIDE,  // Defensive SIDE action
    chakraCost: 25,
    hpCost: 0,
    cooldown: 4,
    currentCooldown: 0,
    damageMult: 0.5,
    scalingStat: PrimaryStat.CALMNESS,
    damageType: DamageType.ELEMENTAL,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.AUTO,
    element: ElementType.PHYSICAL,
    requirements: { clan: Clan.HYUGA },
    effects: [
      { type: EffectType.REFLECTION, value: 0.6, duration: 1, chance: 1.0 },
      { type: EffectType.SHIELD, value: 50, duration: 1, chance: 1.0 }
    ]
  },

  BYAKUGAN: {
    id: 'byakugan',
    name: 'Byakugan',
    tier: SkillTier.HIDDEN,
    description: 'The All-Seeing White Eye. Drastically improves Accuracy and Crit Chance.',
    actionType: ActionType.TOGGLE,  // Toggle ability
    chakraCost: 10,
    hpCost: 0,
    cooldown: 5,
    currentCooldown: 0,
    damageMult: 0,
    scalingStat: PrimaryStat.CALMNESS,
    damageType: DamageType.MENTAL,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.AUTO,
    element: ElementType.PHYSICAL,
    requirements: { clan: Clan.HYUGA },
    isToggle: true,
    upkeepCost: 5,
    effects: [
      { type: EffectType.BUFF, targetStat: PrimaryStat.ACCURACY, value: 0.4, duration: -1, chance: 1.0 },
      { type: EffectType.BUFF, targetStat: PrimaryStat.DEXTERITY, value: 0.3, duration: -1, chance: 1.0 }
    ]
  },

  GENTLE_FIST: {
    id: 'gentle_fist',
    name: 'Gentle Fist',
    tier: SkillTier.ADVANCED,
    description: 'Precise strikes to chakra points. True damage + Chakra Drain.',
    actionType: ActionType.MAIN,
    chakraCost: 15,
    hpCost: 0,
    cooldown: 2,
    currentCooldown: 0,
    damageMult: 2.5,  // BUFFED: Was 1.4 - TRUE damage should hit harder
    scalingStat: PrimaryStat.ACCURACY,
    damageType: DamageType.TRUE,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.MELEE,
    element: ElementType.PHYSICAL,
    requirements: { intelligence: 12 },
    effects: [{ type: EffectType.CHAKRA_DRAIN, value: 20, duration: 1, chance: 1.0 }]
  },

  SHARINGAN_2TOMOE: {
    id: 'sharingan_2',
    name: 'Sharingan (2-Tomoe)',
    tier: SkillTier.ADVANCED,
    description: 'Visual prowess that perceives attack trajectories. Toggle: Increases Speed and Dexterity.',
    actionType: ActionType.TOGGLE,  // Toggle ability
    chakraCost: 10,
    hpCost: 0,
    cooldown: 5,
    currentCooldown: 0,
    damageMult: 0,
    scalingStat: PrimaryStat.INTELLIGENCE,
    damageType: DamageType.PHYSICAL,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.AUTO,
    element: ElementType.FIRE,
    requirements: { intelligence: 14, clan: Clan.UCHIHA },
    isToggle: true,
    upkeepCost: 5,
    effects: [
      { type: EffectType.BUFF, targetStat: PrimaryStat.SPEED, value: 0.3, duration: -1, chance: 1.0 },
      { type: EffectType.BUFF, targetStat: PrimaryStat.DEXTERITY, value: 0.25, duration: -1, chance: 1.0 }
    ]
  },
  
  WATER_PRISON: {
    id: 'water_prison',
    name: 'Water Prison',
    tier: SkillTier.ADVANCED,
    description: 'Traps the enemy in a sphere of heavy water. High stun chance.',
    actionType: ActionType.MAIN,
    chakraCost: 30,
    hpCost: 0,
    cooldown: 5,
    currentCooldown: 0,
    damageMult: 2.0,  // BUFFED: Was 1.2 - CC-focused but should deal damage
    scalingStat: PrimaryStat.SPIRIT,
    damageType: DamageType.ELEMENTAL,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.RANGED,
    element: ElementType.WATER,
    requirements: { intelligence: 14 },
    effects: [{ type: EffectType.STUN, duration: 2, chance: 0.7 }]
  },

  WATER_WALL: {
    id: 'suijinheki',
    name: 'Water Wall',
    tier: SkillTier.ADVANCED,
    description: 'Expels water to form a defensive barrier. Creates a Shield.',
    actionType: ActionType.SIDE,
    chakraCost: 25,
    hpCost: 0,
    cooldown: 4,
    currentCooldown: 0,
    damageMult: 0,
    scalingStat: PrimaryStat.SPIRIT,
    damageType: DamageType.ELEMENTAL,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.AUTO,
    element: ElementType.WATER,
    effects: [
      { type: EffectType.SHIELD, value: 60, duration: 2, chance: 1.0 },
      { type: EffectType.BUFF, targetStat: PrimaryStat.SPIRIT, value: 0.3, duration: 2, chance: 1.0 }
    ]
  },

  HELL_VIEWING: {
    id: 'hell_viewing',
    name: 'Hell Viewing Technique',
    tier: SkillTier.ADVANCED,
    description: 'A Genjutsu that reveals the target\'s worst fears. MENTAL damage bypasses physical defense, resisted by Calmness.',
    actionType: ActionType.MAIN,
    chakraCost: 25,
    hpCost: 0,
    cooldown: 4,
    currentCooldown: 0,
    damageMult: 2.8,  // BUFFED: Was 1.5 - mental damage should be reliable
    scalingStat: PrimaryStat.CALMNESS,
    damageType: DamageType.MENTAL, // Uses Mental Defense!
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.AUTO, // Genjutsu auto-hits
    element: ElementType.MENTAL,
    requirements: { intelligence: 16 },
    effects: [{
      type: EffectType.DEBUFF,
      targetStat: PrimaryStat.STRENGTH,
      value: 0.3,
      duration: 3,
      chance: 1.0
    }]
  },
  
  MIND_DESTRUCTION: {
    id: 'mind_destruction',
    name: 'Mind Body Disturbance',
    tier: SkillTier.ADVANCED,
    description: 'Sends chakra into the opponent\'s nervous system to confuse their movement. MENTAL damage, causes confusion.',
    actionType: ActionType.MAIN,
    chakraCost: 30,
    hpCost: 0,
    cooldown: 4,
    currentCooldown: 0,
    damageMult: 3.0,  // BUFFED: Was 1.8 - piercing mental should hit hard
    scalingStat: PrimaryStat.CALMNESS,
    damageType: DamageType.MENTAL,
    damageProperty: DamageProperty.PIERCING, // Pierces mental flat def
    attackMethod: AttackMethod.AUTO,
    element: ElementType.MENTAL,
    requirements: { intelligence: 18 },
    effects: [{ type: EffectType.CONFUSION, duration: 3, chance: 1.0 }],
    image: '/assets/skill_mind_body_disturbing.png'
  },

  // ==========================================
  // ADVANCED TIER - ELEMENTAL NINJUTSU (NEW)
  // ==========================================
  DRAGON_FLAME: {
    id: 'dragon_flame',
    name: 'Dragon Flame Bomb',
    tier: SkillTier.ADVANCED,
    description: 'A dragon-shaped fireball that causes severe burns.',
    actionType: ActionType.MAIN,
    chakraCost: 30,
    hpCost: 0,
    cooldown: 3,
    currentCooldown: 0,
    damageMult: 3.2,
    scalingStat: PrimaryStat.SPIRIT,
    damageType: DamageType.ELEMENTAL,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.RANGED,
    element: ElementType.FIRE,
    requirements: { intelligence: 14 },
    effects: [{ type: EffectType.BURN, value: 10, duration: 3, chance: 0.7, damageType: DamageType.ELEMENTAL, damageProperty: DamageProperty.NORMAL }]
  },

  HIDDEN_MIST: {
    id: 'hidden_mist',
    name: 'Hidden Mist Jutsu',
    tier: SkillTier.ADVANCED,
    description: 'Creates a dense mist for evasion and enemy accuracy reduction.',
    actionType: ActionType.MAIN,
    chakraCost: 20,
    hpCost: 0,
    cooldown: 5,
    currentCooldown: 0,
    damageMult: 0,
    scalingStat: PrimaryStat.SPIRIT,
    damageType: DamageType.ELEMENTAL,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.AUTO,
    element: ElementType.WATER,
    requirements: { intelligence: 14 },
    effects: [
      { type: EffectType.BUFF, targetStat: PrimaryStat.SPEED, value: 0.5, duration: 3, chance: 1.0 },
      { type: EffectType.DEBUFF, targetStat: PrimaryStat.ACCURACY, value: 0.3, duration: 3, chance: 1.0 }
    ]
  },

  WATER_CLONE: {
    id: 'water_clone',
    name: 'Water Clone Jutsu',
    tier: SkillTier.ADVANCED,
    description: 'Creates a water clone for a strength buff.',
    actionType: ActionType.MAIN,
    chakraCost: 25,
    hpCost: 0,
    cooldown: 4,
    currentCooldown: 0,
    damageMult: 2.0,
    scalingStat: PrimaryStat.SPIRIT,
    damageType: DamageType.ELEMENTAL,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.MELEE,
    element: ElementType.WATER,
    requirements: { intelligence: 14 },
    effects: [{ type: EffectType.BUFF, targetStat: PrimaryStat.STRENGTH, value: 0.4, duration: 2, chance: 1.0 }]
  },

  LIGHTNING_BALL: {
    id: 'lightning_ball',
    name: 'Lightning Ball',
    tier: SkillTier.ADVANCED,
    description: 'A ball of lightning with stun chance.',
    actionType: ActionType.MAIN,
    chakraCost: 22,
    hpCost: 0,
    cooldown: 3,
    currentCooldown: 0,
    damageMult: 2.8,
    scalingStat: PrimaryStat.SPIRIT,
    damageType: DamageType.ELEMENTAL,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.RANGED,
    element: ElementType.LIGHTNING,
    requirements: { intelligence: 12 },
    effects: [{ type: EffectType.STUN, duration: 1, chance: 0.4 }]
  },

  EARTH_DECAPITATION: {
    id: 'earth_decapitation',
    name: 'Inner Decapitation',
    tier: SkillTier.ADVANCED,
    description: 'Pull enemy underground with high stun chance.',
    actionType: ActionType.MAIN,
    chakraCost: 20,
    hpCost: 0,
    cooldown: 3,
    currentCooldown: 0,
    damageMult: 2.5,
    scalingStat: PrimaryStat.DEXTERITY,
    damageType: DamageType.ELEMENTAL,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.MELEE,
    element: ElementType.EARTH,
    requirements: { intelligence: 12 },
    effects: [{ type: EffectType.STUN, duration: 1, chance: 0.6 }]
  },

  GREAT_BREAKTHROUGH: {
    id: 'great_breakthrough',
    name: 'Great Breakthrough',
    tier: SkillTier.ADVANCED,
    description: 'A powerful gust of wind that reduces enemy accuracy.',
    actionType: ActionType.MAIN,
    chakraCost: 22,
    hpCost: 0,
    cooldown: 3,
    currentCooldown: 0,
    damageMult: 3.0,
    scalingStat: PrimaryStat.SPIRIT,
    damageType: DamageType.ELEMENTAL,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.RANGED,
    element: ElementType.WIND,
    requirements: { intelligence: 12 },
    effects: [{ type: EffectType.DEBUFF, targetStat: PrimaryStat.ACCURACY, value: 0.25, duration: 2, chance: 1.0 }]
  },

  AIR_BULLET: {
    id: 'air_bullet',
    name: 'Air Bullet',
    tier: SkillTier.ADVANCED,
    description: 'Compressed air projectile that reduces enemy defense.',
    actionType: ActionType.MAIN,
    chakraCost: 18,
    hpCost: 0,
    cooldown: 2,
    currentCooldown: 0,
    damageMult: 2.4,
    scalingStat: PrimaryStat.SPIRIT,
    damageType: DamageType.ELEMENTAL,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.RANGED,
    element: ElementType.WIND,
    requirements: { intelligence: 10 },
    effects: [{ type: EffectType.DEBUFF, targetStat: PrimaryStat.WILLPOWER, value: 0.15, duration: 2, chance: 1.0 }]
  },

  // ==========================================
  // ADVANCED TIER - CLAN TECHNIQUES (NEW)
  // ==========================================
  FANG_OVER_FANG: {
    id: 'fang_over_fang',
    name: 'Fang Over Fang',
    tier: SkillTier.ADVANCED,
    description: 'Inuzuka dual rotation attack. Hits twice at 50% each.',
    actionType: ActionType.MAIN,
    chakraCost: 20,
    hpCost: 0,
    cooldown: 3,
    currentCooldown: 0,
    damageMult: 3.0,  // 2 hits at 50% = 1.5 each
    scalingStat: PrimaryStat.SPEED,
    damageType: DamageType.PHYSICAL,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.MELEE,
    element: ElementType.PHYSICAL,
    requirements: { intelligence: 10 }
  },

  MIND_TRANSFER: {
    id: 'mind_transfer',
    name: 'Mind Transfer Jutsu',
    tier: SkillTier.ADVANCED,
    description: 'Yamanaka mind control. 70% stun for 2 turns. Miss = self stun.',
    actionType: ActionType.MAIN,
    chakraCost: 40,
    hpCost: 0,
    cooldown: 6,
    currentCooldown: 0,
    damageMult: 0,
    scalingStat: PrimaryStat.CALMNESS,
    damageType: DamageType.MENTAL,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.AUTO,
    element: ElementType.MENTAL,
    requirements: { intelligence: 14, clan: Clan.YAMANAKA },
    effects: [{ type: EffectType.STUN, duration: 2, chance: 0.7 }]
  },

  SHADOW_POSSESSION: {
    id: 'shadow_possession',
    name: 'Shadow Possession',
    tier: SkillTier.ADVANCED,
    description: 'Nara shadow binding. High stun chance with reflect.',
    actionType: ActionType.MAIN,
    chakraCost: 30,
    hpCost: 0,
    cooldown: 5,
    currentCooldown: 0,
    damageMult: 0,
    scalingStat: PrimaryStat.INTELLIGENCE,
    damageType: DamageType.MENTAL,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.AUTO,
    element: ElementType.MENTAL,
    requirements: { intelligence: 14 },
    effects: [
      { type: EffectType.STUN, duration: 2, chance: 0.8 },
      { type: EffectType.REFLECTION, value: 0.3, duration: 2, chance: 1.0 }
    ]
  },

  BUG_SWARM: {
    id: 'bug_swarm',
    name: 'Parasitic Insects',
    tier: SkillTier.ADVANCED,
    description: 'Aburame insect attack. Drains chakra and poisons.',
    actionType: ActionType.MAIN,
    chakraCost: 25,
    hpCost: 0,
    cooldown: 4,
    currentCooldown: 0,
    damageMult: 1.5,
    scalingStat: PrimaryStat.INTELLIGENCE,
    damageType: DamageType.PHYSICAL,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.RANGED,
    element: ElementType.PHYSICAL,
    requirements: { intelligence: 12 },
    effects: [
      { type: EffectType.CHAKRA_DRAIN, value: 25, duration: 1, chance: 1.0 },
      { type: EffectType.POISON, value: 8, duration: 3, chance: 1.0, damageType: DamageType.TRUE, damageProperty: DamageProperty.NORMAL }
    ]
  },

  EXPANSION: {
    id: 'expansion',
    name: 'Expansion Jutsu',
    tier: SkillTier.ADVANCED,
    description: 'Akimichi body expansion. Big damage with strength buff.',
    actionType: ActionType.MAIN,
    chakraCost: 25,
    hpCost: 0,
    cooldown: 4,
    currentCooldown: 0,
    damageMult: 3.0,
    scalingStat: PrimaryStat.STRENGTH,
    damageType: DamageType.PHYSICAL,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.MELEE,
    element: ElementType.PHYSICAL,
    requirements: { intelligence: 10 },
    effects: [{ type: EffectType.BUFF, targetStat: PrimaryStat.STRENGTH, value: 0.5, duration: 2, chance: 1.0 }]
  },

  // ==========================================
  // HIDDEN TIER - SIGNATURE TECHNIQUES (NEW)
  // ==========================================
  SIXTY_FOUR_PALMS: {
    id: '64_palms',
    name: '8 Trigrams 64 Palms',
    tier: SkillTier.HIDDEN,
    description: 'Hyuga ultimate technique. TRUE damage that drains chakra and debuffs all stats.',
    actionType: ActionType.MAIN,
    chakraCost: 40,
    hpCost: 0,
    cooldown: 5,
    currentCooldown: 0,
    damageMult: 4.0,
    scalingStat: PrimaryStat.ACCURACY,
    damageType: DamageType.TRUE,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.MELEE,
    element: ElementType.PHYSICAL,
    requirements: { intelligence: 16, clan: Clan.HYUGA },
    effects: [
      { type: EffectType.CHAKRA_DRAIN, value: 40, duration: 1, chance: 1.0 },
      { type: EffectType.DEBUFF, targetStat: PrimaryStat.STRENGTH, value: 0.3, duration: 3, chance: 1.0 },
      { type: EffectType.DEBUFF, targetStat: PrimaryStat.SPEED, value: 0.3, duration: 3, chance: 1.0 }
    ]
  },

  SAND_BURIAL: {
    id: 'sand_burial',
    name: 'Sand Burial',
    tier: SkillTier.HIDDEN,
    description: 'Execute attack. +100% damage if target below 25% HP.',
    actionType: ActionType.MAIN,
    chakraCost: 30,
    hpCost: 0,
    cooldown: 3,
    currentCooldown: 0,
    damageMult: 3.5,  // Doubled when target <25% HP
    scalingStat: PrimaryStat.SPIRIT,
    damageType: DamageType.ELEMENTAL,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.RANGED,
    element: ElementType.EARTH,
    requirements: { intelligence: 16 }
  },

  CURSE_MARK_1: {
    id: 'curse_mark_1',
    name: 'Curse Mark Stage 1',
    tier: SkillTier.HIDDEN,
    description: 'Toggle: +40% STR, +30% SPD. Costs HP to activate and upkeep.',
    actionType: ActionType.TOGGLE,
    chakraCost: 0,
    hpCost: 15,
    cooldown: 5,
    currentCooldown: 0,
    damageMult: 0,
    scalingStat: PrimaryStat.WILLPOWER,
    damageType: DamageType.PHYSICAL,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.AUTO,
    element: ElementType.PHYSICAL,
    requirements: { intelligence: 14 },
    isToggle: true,
    upkeepCost: 5,  // HP cost per turn
    effects: [
      { type: EffectType.BUFF, targetStat: PrimaryStat.STRENGTH, value: 0.4, duration: -1, chance: 1.0 },
      { type: EffectType.BUFF, targetStat: PrimaryStat.SPEED, value: 0.3, duration: -1, chance: 1.0 }
    ]
  },

  // ==========================================
  // HIDDEN TIER - SIDE ACTIONS (NEW)
  // ==========================================
  SAND_SHIELD: {
    id: 'sand_shield',
    name: 'Sand Shield',
    tier: SkillTier.HIDDEN,
    description: 'Automatic sand defense. Creates 80 shield.',
    actionType: ActionType.SIDE,
    chakraCost: 20,
    hpCost: 0,
    cooldown: 3,
    currentCooldown: 0,
    damageMult: 0,
    scalingStat: PrimaryStat.SPIRIT,
    damageType: DamageType.ELEMENTAL,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.AUTO,
    element: ElementType.EARTH,
    requirements: { intelligence: 14 },
    effects: [{ type: EffectType.SHIELD, value: 80, duration: 2, chance: 1.0 }]
  },

  SHARINGAN_PREDICT: {
    id: 'sharingan_predict',
    name: 'Sharingan: Predict',
    tier: SkillTier.HIDDEN,
    description: 'See enemy\'s next move. +25% Evasion.',
    actionType: ActionType.SIDE,
    chakraCost: 10,
    hpCost: 0,
    cooldown: 3,
    currentCooldown: 0,
    damageMult: 0,
    scalingStat: PrimaryStat.INTELLIGENCE,
    damageType: DamageType.MENTAL,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.AUTO,
    element: ElementType.MENTAL,
    requirements: { intelligence: 14, clan: Clan.UCHIHA },
    effects: [{ type: EffectType.BUFF, targetStat: PrimaryStat.SPEED, value: 0.25, duration: 2, chance: 1.0 }]
  },

  BYAKUGAN_SCAN: {
    id: 'byakugan_scan',
    name: 'Tenketsu Scan',
    tier: SkillTier.HIDDEN,
    description: 'Scan chakra points. Next MAIN ignores 30% defense.',
    actionType: ActionType.SIDE,
    chakraCost: 10,
    hpCost: 0,
    cooldown: 3,
    currentCooldown: 0,
    damageMult: 0,
    scalingStat: PrimaryStat.ACCURACY,
    damageType: DamageType.MENTAL,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.AUTO,
    element: ElementType.MENTAL,
    requirements: { intelligence: 14, clan: Clan.HYUGA },
    effects: [{ type: EffectType.BUFF, targetStat: PrimaryStat.ACCURACY, value: 0.3, duration: 1, chance: 1.0 }]
  },

  // ==========================================
  // HIDDEN TIER - SUMMONING (NEW)
  // ==========================================
  SUMMON_GAMABUNTA: {
    id: 'summon_gamabunta',
    name: 'Summoning: Gamabunta',
    tier: SkillTier.HIDDEN,
    description: 'Summon the great toad. Big water damage + shield.',
    actionType: ActionType.MAIN,
    chakraCost: 60,
    hpCost: 0,
    cooldown: 8,
    currentCooldown: 0,
    damageMult: 4.5,
    scalingStat: PrimaryStat.CHAKRA,
    damageType: DamageType.ELEMENTAL,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.RANGED,
    element: ElementType.WATER,
    requirements: { intelligence: 18 },
    effects: [{ type: EffectType.SHIELD, value: 80, duration: 3, chance: 1.0 }]
  },

  SUMMON_MANDA: {
    id: 'summon_manda',
    name: 'Summoning: Manda',
    tier: SkillTier.HIDDEN,
    description: 'Summon the great snake. High damage + TRUE poison.',
    actionType: ActionType.MAIN,
    chakraCost: 50,
    hpCost: 20,
    cooldown: 7,
    currentCooldown: 0,
    damageMult: 5.0,
    scalingStat: PrimaryStat.SPIRIT,
    damageType: DamageType.PHYSICAL,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.MELEE,
    element: ElementType.PHYSICAL,
    requirements: { intelligence: 18 },
    effects: [{ type: EffectType.POISON, value: 15, duration: 4, chance: 1.0, damageType: DamageType.TRUE, damageProperty: DamageProperty.NORMAL }]
  },

  PUPPET_CROW: {
    id: 'puppet_crow',
    name: 'Puppet: Crow',
    tier: SkillTier.HIDDEN,
    description: 'Deploy puppet with poison and bleed.',
    actionType: ActionType.MAIN,
    chakraCost: 30,
    hpCost: 0,
    cooldown: 4,
    currentCooldown: 0,
    damageMult: 3.0,
    scalingStat: PrimaryStat.DEXTERITY,
    damageType: DamageType.PHYSICAL,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.RANGED,
    element: ElementType.PHYSICAL,
    requirements: { intelligence: 14 },
    effects: [
      { type: EffectType.POISON, value: 10, duration: 3, chance: 1.0, damageType: DamageType.TRUE, damageProperty: DamageProperty.NORMAL },
      { type: EffectType.BLEED, value: 10, duration: 3, chance: 1.0, damageType: DamageType.PHYSICAL, damageProperty: DamageProperty.NORMAL }
    ]
  },

  // ==== HIDDEN ====
  SHADOW_CLONE: {
    id: 'shadow_clone',
    name: 'Shadow Clone Jutsu',
    tier: SkillTier.HIDDEN,
    description: 'Creates solid clones to overwhelm the enemy. Massive stat buffs but deals NO direct damage.',
    actionType: ActionType.SIDE,
    chakraCost: 50,
    hpCost: 0,
    cooldown: 6,
    currentCooldown: 0,
    damageMult: 0,  // FIXED: Pure buff skill, no damage
    scalingStat: PrimaryStat.CHAKRA,
    damageType: DamageType.PHYSICAL,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.AUTO,
    element: ElementType.PHYSICAL,
    requirements: { intelligence: 18 },
    effects: [
      { type: EffectType.BUFF, targetStat: PrimaryStat.STRENGTH, value: 0.6, duration: 3, chance: 1.0 },  // BUFFED: Was 0.5
      { type: EffectType.BUFF, targetStat: PrimaryStat.SPEED, value: 0.4, duration: 3, chance: 1.0 }  // BUFFED: Was 0.3
    ]
  },
  
  PRIMARY_LOTUS: {
    id: 'primary_lotus',
    name: 'Primary Lotus',
    tier: SkillTier.HIDDEN,
    description: 'A forbidden technique unlocking the body\'s limits. Devastating PIERCING physical damage at the cost of HP.',
    actionType: ActionType.MAIN,
    chakraCost: 0,
    hpCost: 25,
    cooldown: 4,
    currentCooldown: 0,
    damageMult: 5.0,  // BUFFED: Was 3.8 - Lee's signature move
    scalingStat: PrimaryStat.STRENGTH,
    damageType: DamageType.PHYSICAL,
    damageProperty: DamageProperty.PIERCING, // Ignores flat phys def
    attackMethod: AttackMethod.MELEE,
    element: ElementType.PHYSICAL,
    requirements: { intelligence: 6 }, // Lee can use it!
    image: '/assets/skill_primary_lotus.png',
    effects: [{
      type: EffectType.BUFF,
      targetStat: PrimaryStat.STRENGTH,
      value: 0.3,
      duration: 2,
      chance: 1.0
    }]
  },
  
  CHIDORI: {
    id: 'chidori',
    name: 'Chidori',
    tier: SkillTier.HIDDEN,
    description: 'A crackling assassination technique. High speed thrust that deals PIERCING elemental damage.',
    actionType: ActionType.MAIN,
    chakraCost: 35,
    hpCost: 0,
    cooldown: 4,
    currentCooldown: 0,
    damageMult: 4.5,  // BUFFED: Was 3.2 - high speed thrust should hit hard
    scalingStat: PrimaryStat.SPEED,
    damageType: DamageType.ELEMENTAL,
    damageProperty: DamageProperty.PIERCING,
    attackMethod: AttackMethod.MELEE,
    element: ElementType.LIGHTNING,
    requirements: { intelligence: 16 },
    critBonus: 15,
    penetration: 0.2, // Also ignores 20% of % defense
    image: '/assets/skill_chidori.png'
  },
  
  CHIDORI_STREAM: {
    id: 'chidori_stream',
    name: 'Chidori Stream',
    tier: SkillTier.HIDDEN,
    description: 'Releases lightning chakra in all directions, paralyzing nearby foes.',
    actionType: ActionType.MAIN,
    chakraCost: 40, 
    hpCost: 0, 
    cooldown: 4, 
    currentCooldown: 0, 
    damageMult: 2.5, 
    scalingStat: PrimaryStat.SPIRIT, 
    damageType: DamageType.ELEMENTAL,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.AUTO, // AoE effect
    element: ElementType.LIGHTNING,
    requirements: { intelligence: 18 },
    effects: [{ type: EffectType.STUN, duration: 1, chance: 0.8 }]
  },
  
  SAND_COFFIN: {
    id: 'sand_coffin',
    name: 'Sand Coffin',
    tier: SkillTier.HIDDEN,
    description: 'Encases the enemy in crushing waves of sand. ARMOR_BREAK ignores % defense.',
    actionType: ActionType.MAIN,
    chakraCost: 40,
    hpCost: 0,
    cooldown: 5,
    currentCooldown: 0,
    damageMult: 4.0,  // BUFFED: Was 2.4 - armor break is strong
    scalingStat: PrimaryStat.SPIRIT,
    damageType: DamageType.ELEMENTAL,
    damageProperty: DamageProperty.ARMOR_BREAK, // Ignores % def!
    attackMethod: AttackMethod.RANGED,
    element: ElementType.EARTH,
    requirements: { intelligence: 16 },
    effects: [{ type: EffectType.STUN, duration: 1, chance: 0.7 }]
  },
  
  WATER_DRAGON: {
    id: 'water_dragon',
    name: 'Water Dragon Jutsu',
    tier: SkillTier.HIDDEN,
    description: 'Manifests a majestic dragon of water to crash down upon the foe.',
    actionType: ActionType.MAIN,
    chakraCost: 30,
    hpCost: 0,
    cooldown: 4,
    currentCooldown: 0,
    damageMult: 3.8,  // BUFFED: Was 2.6 - elemental nuke
    scalingStat: PrimaryStat.SPIRIT,
    damageType: DamageType.ELEMENTAL,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.RANGED,
    element: ElementType.WATER,
    requirements: { intelligence: 18 }
  },

  ICE_MIRRORS: {
    id: 'ice_mirrors',
    name: 'Demonic Ice Mirrors',
    tier: SkillTier.HIDDEN,
    description: 'Creates a dome of ice mirrors. Traps the target and deals multiple strikes.',
    actionType: ActionType.MAIN,
    chakraCost: 40,
    hpCost: 0,
    cooldown: 4,
    currentCooldown: 0,
    damageMult: 3.5,  // BUFFED: Was 2.2 - multi-hit + stun should be strong
    scalingStat: PrimaryStat.SPEED,
    damageType: DamageType.ELEMENTAL,
    damageProperty: DamageProperty.PIERCING,
    attackMethod: AttackMethod.AUTO,
    element: ElementType.WATER,
    requirements: { intelligence: 16 },
    effects: [{ type: EffectType.STUN, duration: 1, chance: 0.5 }]
  },

  FALSE_SURROUNDINGS: {
    id: 'false_surroundings',
    name: 'False Surroundings',
    tier: SkillTier.HIDDEN,
    description: 'Alters the perception of the environment. MENTAL damage with high confusion chance.',
    actionType: ActionType.MAIN,
    chakraCost: 45, 
    hpCost: 0, 
    cooldown: 5, 
    currentCooldown: 0, 
    damageMult: 0, 
    scalingStat: PrimaryStat.CALMNESS, 
    damageType: DamageType.MENTAL,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.AUTO,
    element: ElementType.MENTAL,
    requirements: { intelligence: 20 },
    effects: [{ type: EffectType.CONFUSION, duration: 3, chance: 0.8 }]
  },
  
  TEMPLE_NIRVANA: {
    id: 'temple_nirvana',
    name: 'Temple of Nirvana',
    tier: SkillTier.HIDDEN,
    description: 'Descending feathers induce a deep, magical slumber. Guaranteed MENTAL stun.',
    actionType: ActionType.MAIN,
    chakraCost: 50, 
    hpCost: 0, 
    cooldown: 6, 
    currentCooldown: 0, 
    damageMult: 0, 
    scalingStat: PrimaryStat.CALMNESS, 
    damageType: DamageType.MENTAL,
    damageProperty: DamageProperty.PIERCING,
    attackMethod: AttackMethod.AUTO,
    element: ElementType.MENTAL,
    requirements: { intelligence: 22 },
    effects: [{ type: EffectType.STUN, duration: 2, chance: 1.0 }]
  },

  // ==========================================
  // FORBIDDEN TIER - MAIN ACTIONS (NEW)
  // ==========================================
  HIDDEN_LOTUS: {
    id: 'hidden_lotus',
    name: 'Hidden Lotus',
    tier: SkillTier.FORBIDDEN,
    description: 'Ultimate taijutsu. TRUE damage at massive HP cost. Self-stuns after use.',
    actionType: ActionType.MAIN,
    chakraCost: 0,
    hpCost: 50,
    cooldown: 6,
    currentCooldown: 0,
    damageMult: 7.0,
    scalingStat: PrimaryStat.STRENGTH,
    damageType: DamageType.TRUE,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.MELEE,
    element: ElementType.PHYSICAL,
    requirements: { intelligence: 6 }
  },

  WATER_VORTEX: {
    id: 'water_vortex',
    name: 'Giant Water Vortex',
    tier: SkillTier.FORBIDDEN,
    description: 'Massive water attack that severely slows the enemy.',
    actionType: ActionType.MAIN,
    chakraCost: 45,
    hpCost: 0,
    cooldown: 5,
    currentCooldown: 0,
    damageMult: 4.2,
    scalingStat: PrimaryStat.SPIRIT,
    damageType: DamageType.ELEMENTAL,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.RANGED,
    element: ElementType.WATER,
    requirements: { intelligence: 18 },
    effects: [{ type: EffectType.DEBUFF, targetStat: PrimaryStat.SPEED, value: 0.4, duration: 3, chance: 1.0 }]
  },

  CLONE_EXPLOSION: {
    id: 'clone_explosion',
    name: 'Clone Great Explosion',
    tier: SkillTier.FORBIDDEN,
    description: 'Exploding clone. Cannot be evaded.',
    actionType: ActionType.MAIN,
    chakraCost: 40,
    hpCost: 10,
    cooldown: 5,
    currentCooldown: 0,
    damageMult: 4.5,
    scalingStat: PrimaryStat.CHAKRA,
    damageType: DamageType.ELEMENTAL,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.AUTO,  // Cannot be evaded
    element: ElementType.FIRE,
    requirements: { intelligence: 16 }
  },

  THOUSAND_YEARS: {
    id: '1000_years',
    name: '1000 Years of Death',
    tier: SkillTier.FORBIDDEN,
    description: 'The forbidden poke. 100% stun, 60% confusion.',
    actionType: ActionType.MAIN,
    chakraCost: 5,
    hpCost: 0,
    cooldown: 5,
    currentCooldown: 0,
    damageMult: 1.0,
    scalingStat: PrimaryStat.STRENGTH,
    damageType: DamageType.PHYSICAL,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.MELEE,
    element: ElementType.PHYSICAL,
    effects: [
      { type: EffectType.STUN, duration: 1, chance: 1.0 },
      { type: EffectType.CONFUSION, duration: 2, chance: 0.6 }
    ]
  },

  // ==========================================
  // FORBIDDEN TIER - TOGGLE ACTIONS (NEW)
  // ==========================================
  GATE_OF_LIFE: {
    id: 'gate_of_life',
    name: 'Gate of Life (3rd Gate)',
    tier: SkillTier.FORBIDDEN,
    description: 'Open the 3rd gate. +80% STR, +60% SPD. Heavy HP cost.',
    actionType: ActionType.TOGGLE,
    chakraCost: 0,
    hpCost: 25,
    cooldown: 6,
    currentCooldown: 0,
    damageMult: 0,
    scalingStat: PrimaryStat.WILLPOWER,
    damageType: DamageType.PHYSICAL,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.AUTO,
    element: ElementType.PHYSICAL,
    requirements: { intelligence: 4 },
    isToggle: true,
    upkeepCost: 10,  // HP cost per turn
    effects: [
      { type: EffectType.BUFF, targetStat: PrimaryStat.STRENGTH, value: 0.8, duration: -1, chance: 1.0 },
      { type: EffectType.BUFF, targetStat: PrimaryStat.SPEED, value: 0.6, duration: -1, chance: 1.0 }
    ]
  },

  CURSE_MARK_2: {
    id: 'curse_mark_2',
    name: 'Curse Mark Stage 2',
    tier: SkillTier.FORBIDDEN,
    description: 'Full transformation. +80% STR/SPD/SPI. Heavy HP cost.',
    actionType: ActionType.TOGGLE,
    chakraCost: 0,
    hpCost: 30,
    cooldown: 6,
    currentCooldown: 0,
    damageMult: 0,
    scalingStat: PrimaryStat.WILLPOWER,
    damageType: DamageType.PHYSICAL,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.AUTO,
    element: ElementType.PHYSICAL,
    requirements: { intelligence: 16 },
    isToggle: true,
    upkeepCost: 10,  // HP cost per turn
    effects: [
      { type: EffectType.BUFF, targetStat: PrimaryStat.STRENGTH, value: 0.8, duration: -1, chance: 1.0 },
      { type: EffectType.BUFF, targetStat: PrimaryStat.SPEED, value: 0.8, duration: -1, chance: 1.0 },
      { type: EffectType.BUFF, targetStat: PrimaryStat.SPIRIT, value: 0.8, duration: -1, chance: 1.0 }
    ]
  },

  // ==========================================
  // FORBIDDEN TIER - SIDE ACTIONS (NEW)
  // ==========================================
  CURSE_SURGE: {
    id: 'curse_surge',
    name: 'Curse Mark Surge',
    tier: SkillTier.FORBIDDEN,
    description: '+30% damage on next MAIN. HP cost.',
    actionType: ActionType.SIDE,
    chakraCost: 0,
    hpCost: 10,
    cooldown: 4,
    currentCooldown: 0,
    damageMult: 0,
    scalingStat: PrimaryStat.WILLPOWER,
    damageType: DamageType.PHYSICAL,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.AUTO,
    element: ElementType.PHYSICAL,
    requirements: { intelligence: 14 },
    effects: [{ type: EffectType.BUFF, targetStat: PrimaryStat.STRENGTH, value: 0.3, duration: 1, chance: 1.0 }]
  },

  GATE_PREP: {
    id: 'gate_prep',
    name: 'Gate Release Prep',
    tier: SkillTier.FORBIDDEN,
    description: 'Prepare for gate opening. Next gate activation: -50% HP cost.',
    actionType: ActionType.SIDE,
    chakraCost: 0,
    hpCost: 15,
    cooldown: 5,
    currentCooldown: 0,
    damageMult: 0,
    scalingStat: PrimaryStat.WILLPOWER,
    damageType: DamageType.PHYSICAL,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.AUTO,
    element: ElementType.PHYSICAL,
    requirements: { intelligence: 4 },
    effects: [{ type: EffectType.BUFF, targetStat: PrimaryStat.WILLPOWER, value: 0.5, duration: 2, chance: 1.0 }]
  },

  KILLING_INTENT: {
    id: 'killing_intent',
    name: 'Killing Intent',
    tier: SkillTier.FORBIDDEN,
    description: 'Release murderous aura. 30% chance enemy skips turn.',
    actionType: ActionType.SIDE,
    chakraCost: 0,
    hpCost: 0,
    cooldown: 6,
    currentCooldown: 0,
    damageMult: 0,
    scalingStat: PrimaryStat.CALMNESS,
    damageType: DamageType.MENTAL,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.AUTO,
    element: ElementType.MENTAL,
    requirements: { intelligence: 16 },
    effects: [{ type: EffectType.STUN, duration: 1, chance: 0.3 }]
  },

  // ==== LEGENDARY / AMBUSH ====
  DEMON_SLASH: {
    id: 'demon_slash',
    name: 'Demon Slash',
    tier: SkillTier.FORBIDDEN,
    description: 'A brutal, sweeping cleave with the Executioner Blade. Causes BLEED.',
    actionType: ActionType.MAIN,
    chakraCost: 0,
    hpCost: 0,
    cooldown: 2,
    currentCooldown: 0,
    damageMult: 3.5,  // BUFFED: Was 2.0 - piercing + bleed legendary
    scalingStat: PrimaryStat.STRENGTH,
    damageType: DamageType.PHYSICAL,
    damageProperty: DamageProperty.PIERCING,
    attackMethod: AttackMethod.MELEE,
    element: ElementType.PHYSICAL,
    requirements: { intelligence: 10 },
    effects: [{
      type: EffectType.BLEED,
      value: 15,
      duration: 3,
      chance: 1.0,
      damageType: DamageType.PHYSICAL,
      damageProperty: DamageProperty.PIERCING
    }]
  },
  
  BONE_DRILL: {
    id: 'bone_drill',
    name: 'Dance of Clematis',
    tier: SkillTier.FORBIDDEN,
    description: 'A macabre dance manipulating bone density into a piercing spear. TRUE damage.',
    actionType: ActionType.MAIN,
    chakraCost: 0,
    hpCost: 10,
    cooldown: 3,
    currentCooldown: 0,
    damageMult: 4.0,  // BUFFED: Was 2.0 - TRUE damage is ultimate
    scalingStat: PrimaryStat.STRENGTH,
    damageType: DamageType.TRUE, // Bypasses ALL defense
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.MELEE,
    element: ElementType.PHYSICAL,
    requirements: { intelligence: 8 },
    critBonus: 30
  },
  
  POISON_FOG: {
    id: 'poison_fog',
    name: 'Ibuse Poison Fog',
    tier: SkillTier.FORBIDDEN,
    description: 'Exhales a cloud of toxic gas. POISON ignores 50% of defense.',
    actionType: ActionType.MAIN,
    chakraCost: 20, 
    hpCost: 0, 
    cooldown: 3, 
    currentCooldown: 0, 
    damageMult: 1.5, 
    scalingStat: PrimaryStat.SPIRIT, 
    damageType: DamageType.ELEMENTAL,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.RANGED,
    element: ElementType.FIRE, // Poison is Fire-adjacent
    requirements: { intelligence: 14 },
    effects: [{ 
      type: EffectType.POISON, 
      value: 18, 
      duration: 4, 
      chance: 1.0,
      damageType: DamageType.TRUE, // Poison deals TRUE damage!
      damageProperty: DamageProperty.NORMAL
    }]
  },
  
  TSUKUYOMI: {
    id: 'tsukuyomi',
    name: 'Tsukuyomi',
    tier: SkillTier.FORBIDDEN,
    description: 'Traps the target in an illusion of torture. Massive TRUE MENTAL damage.',
    actionType: ActionType.MAIN,
    chakraCost: 80,
    hpCost: 15,
    cooldown: 6,
    currentCooldown: 0,
    damageMult: 5.0,  // BUFFED: Was 3.5 - TRUE mental ultimate
    scalingStat: PrimaryStat.CALMNESS,
    damageType: DamageType.TRUE, // Bypasses mental defense too!
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.AUTO,
    element: ElementType.MENTAL,
    requirements: { intelligence: 24, clan: Clan.UCHIHA },
    effects: [{ type: EffectType.STUN, duration: 1, chance: 1.0 }]
  },

  // ==========================================
  // KINJUTSU TIER - ULTIMATE TECHNIQUES (NEW)
  // ==========================================
  REAPER_DEATH_SEAL: {
    id: 'reaper_death_seal',
    name: 'Reaper Death Seal',
    tier: SkillTier.KINJUTSU,
    description: 'Sacrifice your life to instantly kill the target. Both die.',
    actionType: ActionType.MAIN,
    chakraCost: 0,
    hpCost: 9999,  // All HP
    cooldown: 99,
    currentCooldown: 0,
    damageMult: 999.0,  // Instant kill
    scalingStat: PrimaryStat.WILLPOWER,
    damageType: DamageType.TRUE,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.AUTO,
    element: ElementType.MENTAL,
    requirements: { intelligence: 20 }
  },

  EDO_TENSEI: {
    id: 'edo_tensei',
    name: 'Edo Tensei',
    tier: SkillTier.KINJUTSU,
    description: 'Summon an ally at 50% stats for 5 turns.',
    actionType: ActionType.MAIN,
    chakraCost: 100,
    hpCost: 30,
    cooldown: 10,
    currentCooldown: 0,
    damageMult: 0,
    scalingStat: PrimaryStat.INTELLIGENCE,
    damageType: DamageType.MENTAL,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.AUTO,
    element: ElementType.MENTAL,
    requirements: { intelligence: 22 },
    effects: [
      { type: EffectType.BUFF, targetStat: PrimaryStat.STRENGTH, value: 0.5, duration: 5, chance: 1.0 },
      { type: EffectType.BUFF, targetStat: PrimaryStat.SPEED, value: 0.5, duration: 5, chance: 1.0 }
    ]
  },

  GATE_OF_LIMIT: {
    id: 'gate_of_limit',
    name: 'Gate of Limit (5th Gate)',
    tier: SkillTier.KINJUTSU,
    description: 'Open the 5th gate. +150% STR/SPD but bleed 20/turn.',
    actionType: ActionType.MAIN,
    chakraCost: 0,
    hpCost: 40,
    cooldown: 99,
    currentCooldown: 0,
    damageMult: 0,
    scalingStat: PrimaryStat.WILLPOWER,
    damageType: DamageType.PHYSICAL,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.AUTO,
    element: ElementType.PHYSICAL,
    requirements: { intelligence: 4 },
    effects: [
      { type: EffectType.BUFF, targetStat: PrimaryStat.STRENGTH, value: 1.5, duration: 5, chance: 1.0 },
      { type: EffectType.BUFF, targetStat: PrimaryStat.SPEED, value: 1.5, duration: 5, chance: 1.0 },
      { type: EffectType.BLEED, value: 20, duration: 5, chance: 1.0, damageType: DamageType.TRUE, damageProperty: DamageProperty.NORMAL }
    ]
  },

  SHUKAKU_ARM: {
    id: 'shukaku_arm',
    name: 'Shukaku Arm',
    tier: SkillTier.KINJUTSU,
    description: 'Partial Bijuu transformation. ARMOR_BREAK + shield, double damage if <30% HP.',
    actionType: ActionType.MAIN,
    chakraCost: 50,
    hpCost: 0,
    cooldown: 6,
    currentCooldown: 0,
    damageMult: 6.0,
    scalingStat: PrimaryStat.SPIRIT,
    damageType: DamageType.ELEMENTAL,
    damageProperty: DamageProperty.ARMOR_BREAK,
    attackMethod: AttackMethod.MELEE,
    element: ElementType.EARTH,
    requirements: { intelligence: 18 },
    effects: [{ type: EffectType.SHIELD, value: 100, duration: 2, chance: 1.0 }]
  },

  COPY_JUTSU: {
    id: 'copy_jutsu',
    name: 'Sharingan: Copy',
    tier: SkillTier.KINJUTSU,
    description: 'Copy enemy\'s last skill at 80% power.',
    actionType: ActionType.MAIN,
    chakraCost: 30,
    hpCost: 0,
    cooldown: 8,
    currentCooldown: 0,
    damageMult: 4.0,  // Variable based on copied skill
    scalingStat: PrimaryStat.INTELLIGENCE,
    damageType: DamageType.PHYSICAL,  // Variable
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.AUTO,
    element: ElementType.PHYSICAL,
    requirements: { intelligence: 16, clan: Clan.UCHIHA }
  },

  // ==== FORBIDDEN ====
  C4_KARURA: {
    id: 'c4_karura',
    name: 'C4 Karura',
    tier: SkillTier.FORBIDDEN,
    description: 'Microscopic clay spiders that disintegrate the target on a cellular level. TRUE damage.',
    actionType: ActionType.MAIN,
    chakraCost: 100, 
    hpCost: 0, 
    cooldown: 6, 
    currentCooldown: 0, 
    damageMult: 3.0, 
    scalingStat: PrimaryStat.SPIRIT, 
    damageType: DamageType.TRUE,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.AUTO,
    element: ElementType.EARTH,
    requirements: { intelligence: 22 }
  },
  
  RASENSHURIKEN: {
    id: 'rasenshuriken',
    name: 'Rasenshuriken',
    tier: SkillTier.KINJUTSU,
    description: 'A microscopic wind blade vortex that severs chakra channels. PIERCING + TRUE damage hybrid.',
    actionType: ActionType.MAIN,
    chakraCost: 120,
    hpCost: 0,
    cooldown: 5,
    currentCooldown: 0,
    damageMult: 6.0,  // BUFFED: Was 4.0 - ultimate forbidden jutsu
    scalingStat: PrimaryStat.SPIRIT,
    damageType: DamageType.TRUE,
    damageProperty: DamageProperty.PIERCING,
    attackMethod: AttackMethod.RANGED,
    element: ElementType.WIND,
    requirements: { intelligence: 20 }
  },
  
  AMATERASU: {
    id: 'amaterasu',
    name: 'Amaterasu',
    tier: SkillTier.KINJUTSU,
    description: 'Inextinguishable black flames. Deals initial PIERCING damage + massive TRUE DoT.',
    actionType: ActionType.MAIN,
    chakraCost: 80,
    hpCost: 20,
    cooldown: 5,
    currentCooldown: 0,
    damageMult: 3.0,  // BUFFED: Was 1.5 - DoT-focused but should have good initial hit
    scalingStat: PrimaryStat.SPIRIT,
    damageType: DamageType.ELEMENTAL,
    damageProperty: DamageProperty.PIERCING,
    attackMethod: AttackMethod.AUTO,
    element: ElementType.FIRE,
    requirements: { intelligence: 22, clan: Clan.UCHIHA },
    effects: [{
      type: EffectType.BURN,
      value: 50,
      duration: 5,
      chance: 1.0,
      damageType: DamageType.TRUE, // Black flames deal TRUE damage
      damageProperty: DamageProperty.NORMAL
    }]
  },
  
  KIRIN: {
    id: 'kirin',
    name: 'Kirin',
    tier: SkillTier.KINJUTSU,
    description: 'Harnesses natural lightning from the heavens. Unavoidable ARMOR_BREAK strike.',
    actionType: ActionType.MAIN,
    chakraCost: 150,
    hpCost: 0,
    cooldown: 8,
    currentCooldown: 0,
    damageMult: 7.0,  // BUFFED: Was 4.5 - ultimate armor-break nuke
    scalingStat: PrimaryStat.SPIRIT,
    damageType: DamageType.ELEMENTAL,
    damageProperty: DamageProperty.ARMOR_BREAK, // Ignores % def
    attackMethod: AttackMethod.AUTO, // Cannot be dodged
    element: ElementType.LIGHTNING,
    requirements: { intelligence: 24 }
  },
  
  SHINRA_TENSEI: {
    id: 'shinra_tensei',
    name: 'Shinra Tensei',
    tier: SkillTier.KINJUTSU,
    description: 'Almighty Push. Repels everything with crushing gravitational force. TRUE damage.',
    actionType: ActionType.MAIN,
    chakraCost: 80, 
    hpCost: 0, 
    cooldown: 5, 
    currentCooldown: 0, 
    damageMult: 3.0, 
    scalingStat: PrimaryStat.SPIRIT, 
    damageType: DamageType.TRUE,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.AUTO,
    element: ElementType.WIND,
    requirements: { intelligence: 26 },
    effects: [{ type: EffectType.STUN, duration: 1, chance: 0.5 }]
  },
  
  KAMUI_IMPACT: {
    id: 'kamui_impact',
    name: 'Kamui',
    tier: SkillTier.KINJUTSU,
    description: 'Space-Time Ninjutsu that warps reality. TRUE damage that cannot miss.',
    actionType: ActionType.MAIN,
    chakraCost: 60, 
    hpCost: 0, 
    cooldown: 4, 
    currentCooldown: 0, 
    damageMult: 3.5, 
    scalingStat: PrimaryStat.INTELLIGENCE, 
    damageType: DamageType.TRUE,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.AUTO,
    element: ElementType.PHYSICAL,
    requirements: { intelligence: 24 },
    effects: [{ 
      type: EffectType.DEBUFF, 
      targetStat: PrimaryStat.SPEED, 
      value: 0.5, 
      duration: 2, 
      chance: 1.0 
    }]
  },
  
  TENGAI_SHINSEI: {
    id: 'tengai_shinsei',
    name: 'Tengai Shinsei',
    tier: SkillTier.KINJUTSU,
    description: 'Summons a massive meteorite from the atmosphere. Catastrophic TRUE damage.',
    actionType: ActionType.MAIN,
    chakraCost: 150, 
    hpCost: 0, 
    cooldown: 8, 
    currentCooldown: 0, 
    damageMult: 5.0, 
    scalingStat: PrimaryStat.SPIRIT, 
    damageType: DamageType.TRUE,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.AUTO,
    element: ElementType.EARTH,
    requirements: { intelligence: 28 }
  }
};

// ============================================================================
// CLAN STARTING SKILLS (Legacy - single skill)
// ============================================================================
export const CLAN_START_SKILL: Record<Clan, Skill> = {
  [Clan.UZUMAKI]: SKILLS.SHADOW_CLONE,
  [Clan.UCHIHA]: SKILLS.FIREBALL,
  [Clan.HYUGA]: SKILLS.GENTLE_FIST,
  [Clan.LEE]: SKILLS.PRIMARY_LOTUS,
  [Clan.YAMANAKA]: SKILLS.MIND_DESTRUCTION,
};

// ============================================================================
// CLAN STARTING LOADOUTS (Full Jutsu Card System)
// Each clan starts with a balanced loadout of skills by action type
// ============================================================================
export interface ClanLoadout {
  main: Skill[];      // Primary attack skills
  side: Skill[];      // Setup/utility skills
  toggle: Skill[];    // Stance/transformation skills
  passive: Skill[];   // Permanent bonus skills
}

export const CLAN_START_LOADOUT: Record<Clan, ClanLoadout> = {
  // Uzumaki: Tank/Sustain - High chakra, shadow clones, healing
  [Clan.UZUMAKI]: {
    main: [SKILLS.BASIC_ATTACK, SKILLS.RASENGAN, SKILLS.BASIC_MEDICAL],
    side: [SKILLS.BUNSHIN, SKILLS.SHUNSHIN, SKILLS.BRACE, SKILLS.SHADOW_CLONE],
    toggle: [],
    passive: [SKILLS.CHAKRA_RESERVES]
  },

  // Uchiha: Glass Cannon - High damage, fire ninjutsu, sharingan
  [Clan.UCHIHA]: {
    main: [SKILLS.BASIC_ATTACK, SKILLS.SHURIKEN, SKILLS.FIREBALL],
    side: [SKILLS.WIRE_SETUP, SKILLS.SMOKE_BOMB, SKILLS.SHARINGAN_PREDICT, SKILLS.PHOENIX_FLOWER],
    toggle: [SKILLS.SHARINGAN_2TOMOE],
    passive: [SKILLS.FIRE_AFFINITY, SKILLS.PRECISION]
  },

  // Hyuga: Precision Fighter - TRUE damage, chakra disruption, defensive
  [Clan.HYUGA]: {
    main: [SKILLS.BASIC_ATTACK, SKILLS.GENTLE_FIST, SKILLS.SIXTY_FOUR_PALMS, SKILLS.AIR_PALM],
    side: [SKILLS.ROTATION, SKILLS.BYAKUGAN_SCAN, SKILLS.ANALYZE],
    toggle: [SKILLS.BYAKUGAN],
    passive: [SKILLS.PRECISION, SKILLS.TAIJUTSU_TRAINING]
  },

  // Lee: Pure Taijutsu - No ninjutsu, extreme physical stats, gates
  [Clan.LEE]: {
    main: [SKILLS.BASIC_ATTACK, SKILLS.LEAF_WHIRLWIND, SKILLS.DYNAMIC_ENTRY, SKILLS.PRIMARY_LOTUS],
    side: [SKILLS.DANCING_LEAF, SKILLS.FOCUSED_BREATHING, SKILLS.BRACE],
    toggle: [],
    passive: [SKILLS.TAIJUTSU_TRAINING, SKILLS.IRON_BODY]
  },

  // Yamanaka: Mind Controller - CC focus, genjutsu, debuffs
  [Clan.YAMANAKA]: {
    main: [SKILLS.BASIC_ATTACK, SKILLS.SHURIKEN, SKILLS.MIND_TRANSFER, SKILLS.HELL_VIEWING],
    side: [SKILLS.BUNSHIN, SKILLS.ANALYZE, SKILLS.KAI],
    toggle: [],
    passive: [SKILLS.MENTAL_FORTITUDE]
  }
};

/**
 * Get all skills from a clan loadout as a flat array
 * Useful for initializing a player's skill list
 */
export const getClanStartingSkills = (clan: Clan): Skill[] => {
  const loadout = CLAN_START_LOADOUT[clan];
  return [
    ...loadout.main,
    ...loadout.side,
    ...loadout.toggle,
    ...loadout.passive
  ];
};

// ============================================================================
// BOSS DEFINITIONS
// ============================================================================
export const BOSS_NAMES = {
  8: { name: 'Demon Brothers', element: ElementType.PHYSICAL, skill: SKILLS.DEMON_SLASH },
  17: { name: 'Haku', element: ElementType.WATER, skill: SKILLS.ICE_MIRRORS },
  25: { name: 'Zabuza Momochi', element: ElementType.WATER, skill: SKILLS.WATER_DRAGON },
  35: { name: 'Orochimaru', element: ElementType.WIND, skill: SKILLS.POISON_FOG },
  45: { name: 'Gaara', element: ElementType.EARTH, skill: SKILLS.SAND_COFFIN },
  55: { name: 'Kimimaro', element: ElementType.PHYSICAL, skill: SKILLS.BONE_DRILL },
  65: { name: 'Sasuke Uchiha', element: ElementType.LIGHTNING, skill: SKILLS.CHIDORI },
  75: { name: 'Pain', element: ElementType.WIND, skill: SKILLS.SHINRA_TENSEI },
  85: { name: 'Obito Uchiha', element: ElementType.FIRE, skill: SKILLS.KAMUI_IMPACT },
  100: { name: 'Madara Uchiha', element: ElementType.FIRE, skill: SKILLS.TENGAI_SHINSEI },
};

export const AMBUSH_ENEMIES = [
  { name: 'Zabuza Momochi', element: ElementType.WATER, skill: SKILLS.DEMON_SLASH },
  { name: 'Kimimaro', element: ElementType.PHYSICAL, skill: SKILLS.BONE_DRILL },
  { name: 'Hanzo the Salamander', element: ElementType.FIRE, skill: SKILLS.POISON_FOG }
];

// ============================================================================
// EVENT DEFINITIONS
// ============================================================================
export const EVENTS: GameEvent[] = [
  ...ACADEMY_ARC_EVENTS,
  ...WAVES_ARC_EVENTS,
  ...EXAMS_ARC_EVENTS,
  ...ROGUE_ARC_EVENTS,
  ...WAR_ARC_EVENTS,
];