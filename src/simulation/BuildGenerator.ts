/**
 * Build Generator - Intelligence-Based Skill Loadout Generation
 * Creates optimal player builds based on Intelligence stat requirements
 */

import {
  PrimaryAttributes,
  Skill,
  Clan,
  ElementType,
  SkillTier
} from '../game/types';
import { CLAN_STATS, CLAN_GROWTH, SKILLS, CLAN_START_SKILL } from '../game/constants';
import { PlayerBuildConfig } from './types';

// ============================================================================
// INTELLIGENCE TIERS
// ============================================================================

export enum IntelligenceTier {
  BASIC = 'BASIC',       // 0-10: Basic jutsu only
  RARE = 'RARE',         // 11-15: Rare jutsu unlock
  EPIC = 'EPIC',         // 16-20: Epic jutsu unlock
  LEGENDARY = 'LEGENDARY', // 21-25: Legendary jutsu unlock
  FORBIDDEN = 'FORBIDDEN'  // 26+: Forbidden jutsu unlock
}

export function getIntelligenceTier(intelligence: number): IntelligenceTier {
  if (intelligence >= 26) return IntelligenceTier.FORBIDDEN;
  if (intelligence >= 21) return IntelligenceTier.LEGENDARY;
  if (intelligence >= 16) return IntelligenceTier.EPIC;
  if (intelligence >= 11) return IntelligenceTier.RARE;
  return IntelligenceTier.BASIC;
}

// ============================================================================
// SKILL FILTERING
// ============================================================================

/**
 * Get all skills that a player can learn based on their intelligence
 */
export function getAvailableSkills(
  intelligence: number,
  clan?: Clan
): Skill[] {
  const available: Skill[] = [];

  for (const [key, skill] of Object.entries(SKILLS)) {
    // Check intelligence requirement
    const intReq = skill.requirements?.intelligence || 0;
    if (intReq > intelligence) continue;

    // Check clan requirement
    if (skill.requirements?.clan && skill.requirements.clan !== clan) continue;

    available.push(skill);
  }

  return available;
}

/**
 * Get skills sorted by damage potential
 */
export function getSkillsByDamagePotential(skills: Skill[]): Skill[] {
  return [...skills].sort((a, b) => {
    // Calculate approximate damage score
    const scoreA = a.damageMult * (a.critBonus ? 1.2 : 1) * (a.penetration ? 1.3 : 1);
    const scoreB = b.damageMult * (b.critBonus ? 1.2 : 1) * (b.penetration ? 1.3 : 1);
    return scoreB - scoreA;
  });
}

/**
 * Generate optimal skill loadout based on intelligence
 */
export function generateOptimalLoadout(
  intelligence: number,
  clan: Clan,
  maxSkills: number = 5
): Skill[] {
  const available = getAvailableSkills(intelligence, clan);
  const sorted = getSkillsByDamagePotential(available);

  // Always include basic attack
  const loadout: Skill[] = [{ ...SKILLS.BASIC_ATTACK, currentCooldown: 0 }];

  // Add clan starting skill if available
  const clanSkill = CLAN_START_SKILL[clan];
  if (clanSkill && !loadout.some(s => s.id === clanSkill.id)) {
    const intReq = clanSkill.requirements?.intelligence || 0;
    if (intReq <= intelligence) {
      loadout.push({ ...clanSkill, currentCooldown: 0 });
    }
  }

  // Fill remaining slots with best available skills
  for (const skill of sorted) {
    if (loadout.length >= maxSkills) break;
    if (loadout.some(s => s.id === skill.id)) continue;
    if (skill.damageMult === 0 && !skill.effects?.length) continue; // Skip pure utility
    loadout.push({ ...skill, currentCooldown: 0 });
  }

  return loadout;
}

// ============================================================================
// PLAYER STAT CALCULATION
// ============================================================================

/**
 * Calculate player stats at a given level
 */
export function calculatePlayerStats(
  clan: Clan,
  level: number,
  customOverrides?: Partial<PrimaryAttributes>
): PrimaryAttributes {
  const baseStats = CLAN_STATS[clan];
  const growth = CLAN_GROWTH[clan];

  const calculated: PrimaryAttributes = {
    willpower: baseStats.willpower + ((growth.willpower || 0) * (level - 1)),
    chakra: baseStats.chakra + ((growth.chakra || 0) * (level - 1)),
    strength: baseStats.strength + ((growth.strength || 0) * (level - 1)),
    spirit: baseStats.spirit + ((growth.spirit || 0) * (level - 1)),
    intelligence: baseStats.intelligence + ((growth.intelligence || 0) * (level - 1)),
    calmness: baseStats.calmness + ((growth.calmness || 0) * (level - 1)),
    speed: baseStats.speed + ((growth.speed || 0) * (level - 1)),
    accuracy: baseStats.accuracy + ((growth.accuracy || 0) * (level - 1)),
    dexterity: baseStats.dexterity + ((growth.dexterity || 0) * (level - 1))
  };

  // Apply custom overrides
  if (customOverrides) {
    Object.entries(customOverrides).forEach(([key, value]) => {
      if (value !== undefined) {
        calculated[key as keyof PrimaryAttributes] = value;
      }
    });
  }

  return calculated;
}

/**
 * Get the element affinity for a clan
 */
export function getClanElement(clan: Clan): ElementType {
  switch (clan) {
    case Clan.UZUMAKI: return ElementType.WIND;
    case Clan.UCHIHA: return ElementType.FIRE;
    case Clan.HYUGA: return ElementType.PHYSICAL;
    case Clan.LEE: return ElementType.PHYSICAL;
    case Clan.YAMANAKA: return ElementType.MENTAL;
    default: return ElementType.PHYSICAL;
  }
}

// ============================================================================
// PRESET BUILDS
// ============================================================================

/**
 * Generate all clan preset builds at a given level
 * FIXED: Use calculated base stats with targeted overrides for optimization
 */
export function generateClanPresets(level: number = 10): PlayerBuildConfig[] {
  const builds: PlayerBuildConfig[] = [];

  // UZUMAKI PRESET - Wind element focus with boosted Spirit
  // Problem: Base Uzumaki has low Spirit growth, can't scale Wind damage
  // Fix: Boost Spirit to 28, add Wind skills (Rasengan/Rasenshuriken)
  const uzumakiStats = calculatePlayerStats(Clan.UZUMAKI, level);
  builds.push({
    name: 'Uzumaki Preset',
    clan: Clan.UZUMAKI,
    level,
    customStats: {
      ...uzumakiStats,
      spirit: 28,         // BOOSTED: +9 base +9 growth = 19, override to 28 for Wind scaling
      intelligence: 20    // BOOSTED: Unlocks Rasenshuriken (req: 20)
    },
    skillIds: [
      'basic_atk',
      'rasengan',         // Wind, PIERCING, 4.0x mult, Spirit scaling
      'rasenshuriken',    // Wind, TRUE damage, 6.0x mult - signature move!
      'shadow_clone',     // Buff skill for +60% STR, +40% SPD
      'shuriken'          // Reliable ranged option
    ],
    element: ElementType.WIND
  });

  // UCHIHA PRESET - Fire element focus (already works well, keep natural stats)
  const uchihaStats = calculatePlayerStats(Clan.UCHIHA, level);
  builds.push({
    name: 'Uchiha Preset',
    clan: Clan.UCHIHA,
    level,
    customStats: {
      ...uchihaStats,
      intelligence: 22    // Ensure Kirin access (req: 22)
    },
    skillIds: [
      'basic_atk',
      'fireball',         // Fire, 2.5x mult, solid damage
      'chidori',          // Lightning, PIERCING, 3.5x mult
      'kirin',            // Lightning, TRUE, 5.0x mult + stun
      'rasenshuriken'     // TRUE damage backup
    ],
    element: ElementType.FIRE
  });

  // HYUGA PRESET - Physical/Gentle Fist focus
  const hyugaStats = calculatePlayerStats(Clan.HYUGA, level);
  builds.push({
    name: 'Hyuga Preset',
    clan: Clan.HYUGA,
    level,
    customStats: {
      ...hyugaStats,
      calmness: 24        // Boost mental defense
    },
    skillIds: [
      'basic_atk',
      'gentle_fist',      // Physical, TRUE damage, chakra drain
      'primary_lotus',    // PIERCING physical, 5.0x mult
      'chidori',          // Lightning backup
      'shuriken'          // Ranged option
    ],
    element: ElementType.PHYSICAL
  });

  // LEE DISCIPLE PRESET - Pure taijutsu focus
  const leeStats = calculatePlayerStats(Clan.LEE, level);
  builds.push({
    name: 'Lee Disciple Preset',
    clan: Clan.LEE,
    level,
    customStats: {
      ...leeStats
      // Lee's natural stats are already optimized for taijutsu
    },
    skillIds: [
      'basic_atk',
      'primary_lotus',    // PIERCING, 5.0x, HP cost (Lee's signature)
      'shuriken',         // Basic ranged
      'kawarimi',         // Evasion utility
      'bunshin'           // Clone distraction
    ],
    element: ElementType.PHYSICAL
  });

  // YAMANAKA PRESET - Mental/Genjutsu focus
  const yamanakaStats = calculatePlayerStats(Clan.YAMANAKA, level);
  builds.push({
    name: 'Yamanaka Preset',
    clan: Clan.YAMANAKA,
    level,
    customStats: {
      ...yamanakaStats,
      intelligence: 22,   // Ensure Kirin access
      calmness: 32        // Boost mental damage & defense
    },
    skillIds: [
      'basic_atk',
      'mind_destruction', // Mental, PIERCING, confusion
      'kirin',            // TRUE damage backup
      'rasenshuriken',    // TRUE damage
      'shuriken'          // Ranged option
    ],
    element: ElementType.MENTAL
  });

  return builds;
}

/**
 * Generate extreme/specialized builds for testing edge cases
 */
export function generateExtremeBuilds(level: number = 10): PlayerBuildConfig[] {
  const builds: PlayerBuildConfig[] = [];

  // Glass Cannon - Max Spirit/Dex, Min Willpower
  builds.push({
    name: 'Glass Cannon',
    clan: Clan.UCHIHA,
    level,
    customStats: {
      willpower: 8,
      chakra: 20,
      strength: 10,
      spirit: 40,
      intelligence: 18,
      calmness: 10,
      speed: 20,
      accuracy: 16,
      dexterity: 30
    },
    skillIds: ['basic_atk', 'fireball', 'chidori', 'amaterasu'],
    element: ElementType.FIRE
  });

  // Immortal Tank - Max Willpower/Strength, Min Speed
  // FIXED: Added strength-scaling damage skills instead of utility-only
  builds.push({
    name: 'Immortal Tank',
    clan: Clan.UZUMAKI,
    level,
    customStats: {
      willpower: 50,
      chakra: 30,
      strength: 35,
      spirit: 12,
      intelligence: 12,
      calmness: 20,
      speed: 8,
      accuracy: 14,       // BUFFED: +4 to actually hit enemies
      dexterity: 10
    },
    skillIds: [
      'basic_atk',
      'bone_drill',       // TRUE damage, scales with STR, 4.0x mult
      'demon_slash',      // PIERCING + BLEED, scales with STR, 3.5x mult
      'primary_lotus',    // PIERCING physical, 5.0x mult, HP cost but tank has HP to spare
      'mud_wall'          // Keep the shield for survivability
    ],
    element: ElementType.PHYSICAL  // Changed to PHYSICAL to match strength-based attacks
  });

  // Speed Demon - Max Speed/Dex
  builds.push({
    name: 'Speed Demon',
    clan: Clan.LEE,
    level,
    customStats: {
      willpower: 20,
      chakra: 10,
      strength: 25,
      spirit: 8,
      intelligence: 8,
      calmness: 12,
      speed: 45,
      accuracy: 18,
      dexterity: 35
    },
    skillIds: ['basic_atk', 'shuriken', 'primary_lotus'],
    element: ElementType.PHYSICAL
  });

  // Mind Controller - Max Intelligence/Calmness
  builds.push({
    name: 'Mind Controller',
    clan: Clan.YAMANAKA,
    level,
    customStats: {
      willpower: 15,
      chakra: 25,
      strength: 8,
      spirit: 18,
      intelligence: 40,
      calmness: 45,
      speed: 12,
      accuracy: 12,
      dexterity: 15
    },
    skillIds: ['basic_atk', 'hell_viewing', 'mind_destruction', 'temple_nirvana', 'tsukuyomi'],
    element: ElementType.MENTAL
  });

  // Balanced - All stats equal
  builds.push({
    name: 'Balanced Build',
    clan: Clan.HYUGA,
    level,
    customStats: {
      willpower: 20,
      chakra: 20,
      strength: 20,
      spirit: 20,
      intelligence: 20,
      calmness: 20,
      speed: 20,
      accuracy: 20,
      dexterity: 20
    },
    skillIds: ['basic_atk', 'gentle_fist', 'shuriken', 'water_dragon'],
    element: ElementType.WATER
  });

  return builds;
}

/**
 * Generate all test builds (clan presets + extreme builds)
 */
export function generateAllBuilds(level: number = 10): PlayerBuildConfig[] {
  return [
    ...generateClanPresets(level),
    ...generateExtremeBuilds(level)
  ];
}

/**
 * Create a player build from config
 */
export function createBuildFromConfig(config: PlayerBuildConfig): {
  stats: PrimaryAttributes;
  skills: Skill[];
  element: ElementType;
} {
  const stats = config.customStats
    ? { ...calculatePlayerStats(config.clan, config.level), ...config.customStats }
    : calculatePlayerStats(config.clan, config.level);

  const skills = config.skillIds
    .map(id => {
      const upper = id.toUpperCase();
      return SKILLS[upper] || SKILLS[id];
    })
    .filter(Boolean)
    .map(skill => ({ ...skill, currentCooldown: 0 }));

  // Ensure at least basic attack
  if (skills.length === 0) {
    skills.push({ ...SKILLS.BASIC_ATTACK, currentCooldown: 0 });
  }

  return {
    stats,
    skills,
    element: config.element
  };
}
