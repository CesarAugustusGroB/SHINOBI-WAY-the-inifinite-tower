import {
  PrimaryAttributes, PrimaryStat, Clan, ElementType,
  ItemSlot, Rarity, GameEvent, Skill
} from '../types';
import { ACADEMY_ARC_EVENTS } from './events/academyArcEvents';
import { WAVES_ARC_EVENTS } from './events/wavesArcEvents';
import { EXAMS_ARC_EVENTS } from './events/examsArcEvents';
import { ROGUE_ARC_EVENTS } from './events/rogueArcEvents';
import { WAR_ARC_EVENTS } from './events/warArcEvents';
import { GENERIC_EVENTS } from './events/genericEvents';
import { SKILLS } from './skills';

// Exploration System Exports
export * from './terrain';
export * from './approaches';
export * from './skills';

// MAX_LOGS removed - use LIMITS.MAX_LOG_ENTRIES from config.ts instead

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
  ...GENERIC_EVENTS, // Generic events that can appear in any arc (treasure upgrades, etc.)
  ...ACADEMY_ARC_EVENTS,
  ...WAVES_ARC_EVENTS,
  ...EXAMS_ARC_EVENTS,
  ...ROGUE_ARC_EVENTS,
  ...WAR_ARC_EVENTS,
];