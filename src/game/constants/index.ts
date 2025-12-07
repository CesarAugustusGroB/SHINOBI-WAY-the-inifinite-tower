import {
  PrimaryAttributes, PrimaryStat, Clan, ElementType, GameEventDefinition,
  ItemSlot, Rarity, Skill, EffectType, SkillTier, DamageType,
  DamageProperty, AttackMethod, EnhancedGameEventDefinition
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

// Helper to check effectiveness (1.5 = Strong, 0.5 = Weak, 1.0 = Neutral)
export const getElementEffectiveness = (attacker: ElementType, defender: ElementType): number => {
  if (attacker === ElementType.PHYSICAL || attacker === ElementType.MENTAL) return 1.0;

  // Standard Cycle (Attacker beats Defender)
  if (ELEMENTAL_CYCLE[attacker] === defender) return 1.5;

  // Reverse Cycle (Defender beats Attacker -> Resistance)
  if (ELEMENTAL_CYCLE[defender] === attacker) return 0.5;

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
    willpower: 4, chakra: 3, strength: 1, spirit: 1, 
    intelligence: 1, calmness: 2, speed: 1, accuracy: 1, dexterity: 1 
  },
  [Clan.UCHIHA]: { 
    willpower: 1, chakra: 2, strength: 1, spirit: 3, 
    intelligence: 2, calmness: 1, speed: 2, accuracy: 2, dexterity: 3 
  },
  [Clan.HYUGA]: { 
    willpower: 2, chakra: 1, strength: 2, spirit: 1, 
    intelligence: 1, calmness: 2, speed: 2, accuracy: 3, dexterity: 2 
  },
  [Clan.LEE]: { 
    willpower: 3, chakra: 0, strength: 4, spirit: 0, 
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
    tier: SkillTier.COMMON, 
    description: 'A disciplined martial arts strike using raw physical power. Reliable and effective.',
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
    tier: SkillTier.COMMON, 
    description: 'A swift throw of sharpened steel stars. Targets weak points for high critical chance.',
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
    tier: SkillTier.COMMON,
    description: 'Spits mud that hardens into a barricade. Creates a Shield.',
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
    tier: SkillTier.COMMON,
    description: 'Volleys of small fireballs. Chance to burn.',
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
    tier: SkillTier.COMMON,
    description: 'Switch places with a log. The log absorbs damage while you reposition.',
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
    tier: SkillTier.COMMON,
    description: 'Creates illusory copies to distract the enemy. Slight Evasion boost.',
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
    tier: SkillTier.COMMON,
    description: 'Transform into an object or person for a surprise attack.',
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
    tier: SkillTier.COMMON,
    description: 'High-speed movement to close gaps. Greatly boosts Initiative.',
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
    tier: SkillTier.COMMON,
    description: 'Disrupts chakra flow to break illusions. Boosts Genjutsu Resistance.',
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

  // ==== RARE ====
  RASENGAN: {
    id: 'rasengan', 
    name: 'Rasengan', 
    tier: SkillTier.RARE, 
    description: 'A swirling sphere of pure wind chakra that grinds into the target. PIERCING damage ignores flat defense.',
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
    tier: SkillTier.RARE, 
    description: 'A massive, searing projectile of flame. Leaves the target burning.',
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
    tier: SkillTier.EPIC,
    description: 'Expels chakra while spinning to repel attacks. Reflects damage.',
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
    tier: SkillTier.EPIC,
    description: 'The All-Seeing White Eye. Drastically improves Accuracy and Crit Chance.',
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
    tier: SkillTier.RARE,
    description: 'Precise strikes to chakra points. True damage + Chakra Drain.',
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
    tier: SkillTier.RARE, 
    description: 'Visual prowess that perceives attack trajectories. Toggle: Increases Speed and Dexterity.',
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
    tier: SkillTier.RARE,
    description: 'Traps the enemy in a sphere of heavy water. High stun chance.',
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
    tier: SkillTier.RARE,
    description: 'Expels water to form a defensive barrier. Creates a Shield.',
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
    tier: SkillTier.RARE,
    description: 'A Genjutsu that reveals the target\'s worst fears. MENTAL damage bypasses physical defense, resisted by Calmness.',
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
    tier: SkillTier.RARE,
    description: 'Sends chakra into the opponent\'s nervous system to confuse their movement. MENTAL damage, causes confusion.',
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
    effects: [{ type: EffectType.CONFUSION, duration: 3, chance: 1.0 }]
  },

  // ==== EPIC ====
  SHADOW_CLONE: {
    id: 'shadow_clone',
    name: 'Shadow Clone Jutsu',
    tier: SkillTier.EPIC,
    description: 'Creates solid clones to overwhelm the enemy. Massive stat buffs but deals NO direct damage.',
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
    tier: SkillTier.EPIC,
    description: 'A forbidden technique unlocking the body\'s limits. Devastating PIERCING physical damage at the cost of HP.',
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
    tier: SkillTier.EPIC,
    description: 'A crackling assassination technique. High speed thrust that deals PIERCING elemental damage.',
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
    penetration: 0.2 // Also ignores 20% of % defense
  },
  
  CHIDORI_STREAM: {
    id: 'chidori_stream', 
    name: 'Chidori Stream', 
    tier: SkillTier.EPIC, 
    description: 'Releases lightning chakra in all directions, paralyzing nearby foes.',
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
    tier: SkillTier.EPIC,
    description: 'Encases the enemy in crushing waves of sand. ARMOR_BREAK ignores % defense.',
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
    tier: SkillTier.EPIC,
    description: 'Manifests a majestic dragon of water to crash down upon the foe.',
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
    tier: SkillTier.EPIC,
    description: 'Creates a dome of ice mirrors. Traps the target and deals multiple strikes.',
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
    tier: SkillTier.EPIC, 
    description: 'Alters the perception of the environment. MENTAL damage with high confusion chance.',
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
    tier: SkillTier.EPIC, 
    description: 'Descending feathers induce a deep, magical slumber. Guaranteed MENTAL stun.',
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

  // ==== LEGENDARY / AMBUSH ====
  DEMON_SLASH: {
    id: 'demon_slash',
    name: 'Demon Slash',
    tier: SkillTier.LEGENDARY,
    description: 'A brutal, sweeping cleave with the Executioner Blade. Causes BLEED.',
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
    tier: SkillTier.LEGENDARY,
    description: 'A macabre dance manipulating bone density into a piercing spear. TRUE damage.',
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
    tier: SkillTier.LEGENDARY, 
    description: 'Exhales a cloud of toxic gas. POISON ignores 50% of defense.',
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
    tier: SkillTier.LEGENDARY,
    description: 'Traps the target in an illusion of torture. Massive TRUE MENTAL damage.',
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

  // ==== FORBIDDEN ====
  C4_KARURA: {
    id: 'c4_karura', 
    name: 'C4 Karura', 
    tier: SkillTier.FORBIDDEN, 
    description: 'Microscopic clay spiders that disintegrate the target on a cellular level. TRUE damage.',
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
    tier: SkillTier.FORBIDDEN,
    description: 'A microscopic wind blade vortex that severs chakra channels. PIERCING + TRUE damage hybrid.',
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
    tier: SkillTier.FORBIDDEN,
    description: 'Inextinguishable black flames. Deals initial PIERCING damage + massive TRUE DoT.',
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
    tier: SkillTier.FORBIDDEN,
    description: 'Harnesses natural lightning from the heavens. Unavoidable ARMOR_BREAK strike.',
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
    tier: SkillTier.FORBIDDEN, 
    description: 'Almighty Push. Repels everything with crushing gravitational force. TRUE damage.',
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
    tier: SkillTier.FORBIDDEN, 
    description: 'Space-Time Ninjutsu that warps reality. TRUE damage that cannot miss.',
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
    tier: SkillTier.FORBIDDEN, 
    description: 'Summons a massive meteorite from the atmosphere. Catastrophic TRUE damage.',
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
// CLAN STARTING SKILLS
// ============================================================================
export const CLAN_START_SKILL: Record<Clan, Skill> = {
  [Clan.UZUMAKI]: SKILLS.SHADOW_CLONE,
  [Clan.UCHIHA]: SKILLS.FIREBALL,
  [Clan.HYUGA]: SKILLS.GENTLE_FIST,
  [Clan.LEE]: SKILLS.PRIMARY_LOTUS,
  [Clan.YAMANAKA]: SKILLS.MIND_DESTRUCTION,
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
export const EVENTS: GameEventDefinition[] = [
  {
    id: 'orochimaru_lab',
    title: "Orochimaru's Lab",
    description: "The air is thick with antiseptic and decay. Vats of green liquid bubble ominously. A forbidden scroll lies open, detailing a procedure to merge flesh with snake essence.",
    choices: [
      { label: "Undergo Experiment", type: 'GAMBLE_HP', value: 50, chance: 0.5, description: "50% Chance: +50 Max HP. Fail: -50% Current HP." },
      { label: "Leave", type: 'LEAVE', description: "Do not tamper with nature." }
    ]
  },
  {
    id: 'fresh_grave',
    title: "Fresh Grave",
    description: "A freshly dug grave in a field of red spider lilies. A high-quality weapon protrudes from the loose earth. The spirit of the fallen warrior seems restless.",
    choices: [
      { label: "Desecrate", type: 'FIGHT_GHOST', description: "Steal the weapon. Fight a vengeful spirit." },
      { label: "Pray", type: 'HEAL_CHAKRA', description: "Pay respects. Fully restore Chakra." }
    ]
  },
  {
    id: 'merchant',
    title: "Wandering Merchant",
    description: "A mysterious figure in a tattered hood sits by a small fire. He gestures to a sealed box.",
    choices: [
      { label: "Buy Mystery Box", type: 'TRADE', value: 150, description: "Cost: 150 Ryō." },
      { label: "Leave", type: 'LEAVE', description: "Save your money." }
    ]
  },
  {
    id: 'training_dummy',
    title: "Abandoned Training Grounds",
    description: "An old training stump used by legendary ninja. It still bears the scars of a thousand strikes.",
    choices: [
      { label: "Train Form", type: 'GAIN_XP', value: 50, description: "Practice Kata. Gain 50 Experience." }, 
      { label: 'Meditate', type: 'HEAL_ALL', description: 'Deep meditation. Fully recover HP and Chakra.' }
    ]
  },
  {
    id: 'forbidden_temple',
    title: "Forbidden Temple",
    description: "You discovered a sealed temple emitting a terrifying chakra pressure. Inside lies a forbidden scroll, but it is guarded by a monstrous entity.",
    choices: [
      { label: "Challenge Guardian", type: 'CHALLENGE_GUARDIAN', description: "Fight a powerful foe for a Forbidden Technique." },
      { label: "Leave", type: 'LEAVE', description: "The risk is too great." }
    ]
  }
];

// ============================================================================
// ENHANCED EVENT DEFINITIONS (New Resource Management System)
// ============================================================================
export const ENHANCED_EVENTS: EnhancedGameEventDefinition[] = [
  ...ACADEMY_ARC_EVENTS,
  ...WAVES_ARC_EVENTS,
  ...EXAMS_ARC_EVENTS,
  ...ROGUE_ARC_EVENTS,
  ...WAR_ARC_EVENTS,
];