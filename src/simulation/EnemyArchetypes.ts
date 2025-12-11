/**
 * Enemy Archetypes for Battle Simulation
 * Fixed enemy configurations for consistent testing
 */

import {
  PrimaryAttributes,
  ElementType,
  Enemy,
  Buff,
  EffectType
} from '../game/types';
import { SKILLS } from '../game/constants';
import { calculateDerivedStats } from '../game/systems/StatSystem';
import { ArchetypeConfig, EnemyArchetype } from './types';

// Re-export EnemyArchetype from types
export { EnemyArchetype } from './types';

// ============================================================================
// ARCHETYPE BASE STATS
// ============================================================================

export const ARCHETYPE_CONFIGS: Record<EnemyArchetype, ArchetypeConfig> = {
  [EnemyArchetype.TANK]: {
    name: 'Stone Wall Tank',
    description: 'High HP and physical defense with retaliation damage',
    baseStats: {
      willpower: 35,      // BUFFED: +5 (more HP)
      chakra: 18,         // BUFFED: +6 (can use skills)
      strength: 32,       // BUFFED: +7 (more damage)
      spirit: 16,         // BUFFED: +6 (some elemental damage)
      intelligence: 10,   // BUFFED: +2
      calmness: 16,       // BUFFED: +2 (mental resist)
      speed: 10,          // BUFFED: +2
      accuracy: 14,       // BUFFED: +4 (can hit)
      dexterity: 10       // BUFFED: +2
    },
    element: ElementType.EARTH,
    skillIds: ['basic_atk', 'mud_wall', 'sand_coffin'],  // ADDED: sand_coffin for big damage
    // Note: TANK now has a threatening damage skill and better stats overall
    // Making battles more of a war of attrition instead of free wins
    startingBuffs: [
      {
        id: 'thorns_aura',
        name: 'Stone Skin Thorns',
        duration: 99,          // Lasts entire fight
        effect: {
          type: EffectType.REFLECTION,
          value: 0.15,         // 15% damage reflection
          duration: 99,
          chance: 1.0
        },
        source: 'archetype'
      }
    ]
  },

  [EnemyArchetype.ASSASSIN]: {
    name: 'Shadow Assassin',
    description: 'High speed and crit, glass cannon physical attacker',
    baseStats: {
      willpower: 12,
      chakra: 14,
      strength: 18,
      spirit: 8,
      intelligence: 12,
      calmness: 10,
      speed: 28,
      accuracy: 16,
      dexterity: 24
    },
    element: ElementType.LIGHTNING,
    skillIds: ['basic_atk', 'shuriken']
  },

  [EnemyArchetype.CASTER]: {
    name: 'Elemental Caster',
    description: 'High spirit for elemental damage, ranged attacks',
    baseStats: {
      willpower: 12,       // NERFED: -2 (more fragile)
      chakra: 18,          // NERFED: -7 (fewer skill uses, runs out faster)
      strength: 6,         // NERFED: -2 (even weaker physical)
      spirit: 22,          // NERFED: -6 (main nerf - less elemental damage)
      intelligence: 14,    // NERFED: -4 (less skill scaling)
      calmness: 10,        // NERFED: -2 (weaker mental resist)
      speed: 12,           // NERFED: -2 (slower)
      accuracy: 10,        // NERFED: -2 (more misses)
      dexterity: 10        // NERFED: -2 (less crit)
    },
    element: ElementType.FIRE,
    skillIds: ['basic_atk', 'phoenix_flower']  // NERFED: Removed fireball (no big nuke)
    // Note: CASTER now relies on Phoenix Flower (2.2x + burn) instead of Fireball (3.5x + burn)
    // This significantly reduces burst damage while keeping DoT pressure
  },

  [EnemyArchetype.GENJUTSU]: {
    name: 'Mind Weaver',
    description: 'Mental attacks specialist, weaker defenses',
    baseStats: {
      willpower: 12,      // NERFED: -2 (less HP, more fragile)
      chakra: 18,         // NERFED: -2 (fewer skill uses)
      strength: 6,        // NERFED: -2 (very weak physical)
      spirit: 10,         // NERFED: -4 (weak elemental defense)
      intelligence: 22,   // NERFED: -3 (still smart but less so)
      calmness: 22,       // NERFED: -6 (main nerf - less damage & mental resist)
      speed: 10,          // NERFED: -2 (slower)
      accuracy: 8,        // NERFED: -2 (relies on AUTO hit)
      dexterity: 10       // NERFED: -4 (easier to crit)
    },
    element: ElementType.MENTAL,
    skillIds: ['basic_atk', 'hell_viewing'],  // NERFED: Removed mind_destruction (no piercing + confusion combo)
    // Note: GENJUTSU now relies on hell_viewing only, making it more manageable
    // Players with decent Calmness can now resist and fight back
  },

  [EnemyArchetype.BALANCED]: {
    name: 'Veteran Shinobi',
    description: 'Well-rounded stats, adaptable fighter',
    baseStats: {
      willpower: 16,
      chakra: 16,
      strength: 16,
      spirit: 16,
      intelligence: 16,
      calmness: 16,
      speed: 16,
      accuracy: 16,
      dexterity: 16
    },
    element: ElementType.WATER,
    skillIds: ['basic_atk', 'water_dragon', 'shuriken']
  }
};

// ============================================================================
// ENEMY GENERATION
// ============================================================================

/**
 * Generate an enemy from an archetype with floor scaling
 */
export function generateSimEnemy(
  archetype: EnemyArchetype,
  floorNumber: number,
  difficulty: number
): Enemy {
  const config = ARCHETYPE_CONFIGS[archetype];

  // Calculate scaling multiplier
  const floorMult = 1 + (floorNumber * 0.08);  // 8% per floor
  const diffMult = 0.50 + (difficulty / 200);   // 50% at diff 0, 100% at diff 100
  const totalScaling = floorMult * diffMult;

  // Scale base stats
  const scaledStats: PrimaryAttributes = {
    willpower: Math.floor(config.baseStats.willpower * totalScaling),
    chakra: Math.floor(config.baseStats.chakra * totalScaling),
    strength: Math.floor(config.baseStats.strength * totalScaling),
    spirit: Math.floor(config.baseStats.spirit * totalScaling),
    intelligence: Math.floor(config.baseStats.intelligence * totalScaling),
    calmness: Math.floor(config.baseStats.calmness * totalScaling),
    speed: Math.floor(config.baseStats.speed * totalScaling),
    accuracy: Math.floor(config.baseStats.accuracy * totalScaling),
    dexterity: Math.floor(config.baseStats.dexterity * totalScaling)
  };

  // Calculate derived stats for HP/Chakra
  const derived = calculateDerivedStats(scaledStats, {});

  // Get skills from config
  const skills = config.skillIds
    .map(id => SKILLS[id.toUpperCase()] || SKILLS[id])
    .filter(Boolean)
    .map(skill => ({ ...skill, currentCooldown: 0 }));

  // Fallback to basic attack if no skills found
  if (skills.length === 0) {
    skills.push({ ...SKILLS.BASIC_ATTACK, currentCooldown: 0 });
  }

  // Copy starting buffs if archetype has them
  const startingBuffs: Buff[] = config.startingBuffs
    ? config.startingBuffs.map(buff => ({ ...buff }))
    : [];

  return {
    name: config.name,
    tier: getTierFromFloor(floorNumber),
    primaryStats: scaledStats,
    currentHp: derived.maxHp,
    currentChakra: derived.maxChakra,
    element: config.element,
    skills,
    activeBuffs: startingBuffs,
    isBoss: false
  };
}

/**
 * Get tier name based on floor
 */
function getTierFromFloor(floor: number): string {
  if (floor <= 10) return 'Genin';
  if (floor <= 25) return 'Chunin';
  if (floor <= 50) return 'Jonin';
  if (floor <= 75) return 'S-Rank';
  return 'Kage Level';
}

/**
 * Get all archetypes as an array
 */
export function getAllArchetypes(): EnemyArchetype[] {
  return Object.values(EnemyArchetype);
}

/**
 * Get archetype config by type
 */
export function getArchetypeConfig(archetype: EnemyArchetype): ArchetypeConfig {
  return ARCHETYPE_CONFIGS[archetype];
}
