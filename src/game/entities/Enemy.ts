import { Enemy, ElementType } from '../types';
import { calculateDerivedStats } from '../systems/StatSystem';

/**
 * Story arc definitions for different tower floors
 */
export interface StoryArc {
  name: string;
  label: string;
  biome: string;
}

export enum EnemyArchetype {
  TANK = 'TANK',
  ASSASSIN = 'ASSASSIN',
  BALANCED = 'BALANCED',
  CASTER = 'CASTER',
  GENJUTSU = 'GENJUTSU'
}

/**
 * Archetype-specific stat distributions
 * These define the personality of different enemy types
 */
export const ARCHETYPE_STAT_TEMPLATES = {
  [EnemyArchetype.TANK]: {
    willpower: 22,
    chakra: 10,
    strength: 18,
    spirit: 8,
    intelligence: 8,
    calmness: 12,
    speed: 8,
    accuracy: 8,
    dexterity: 8
  },
  [EnemyArchetype.ASSASSIN]: {
    willpower: 10,
    chakra: 12,
    strength: 16,
    spirit: 8,
    intelligence: 10,
    calmness: 8,
    speed: 22,
    accuracy: 14,
    dexterity: 18
  },
  [EnemyArchetype.CASTER]: {
    willpower: 10,
    chakra: 18,
    strength: 6,
    spirit: 22,
    intelligence: 16,
    calmness: 10,
    speed: 12,
    accuracy: 10,
    dexterity: 10
  },
  [EnemyArchetype.GENJUTSU]: {
    willpower: 10,
    chakra: 16,
    strength: 6,
    spirit: 12,
    intelligence: 18,
    calmness: 22,
    speed: 10,
    accuracy: 8,
    dexterity: 12
  },
  [EnemyArchetype.BALANCED]: {
    willpower: 14,
    chakra: 12,
    strength: 12,
    spirit: 12,
    intelligence: 12,
    calmness: 12,
    speed: 12,
    accuracy: 12,
    dexterity: 12
  }
};

/**
 * Get story arc info for the current floor
 */
export const getStoryArcForFloor = (floor: number): StoryArc => {
  if (floor <= 10) return { name: 'ACADEMY_ARC', label: 'Academy Graduation', biome: 'Village Hidden in the Leaves' };
  if (floor <= 25) return { name: 'WAVES_ARC', label: 'Land of Waves', biome: 'Mist Covered Bridge' };
  if (floor <= 50) return { name: 'EXAMS_ARC', label: 'Chunin Exams', biome: 'Forest of Death' };
  if (floor <= 75) return { name: 'ROGUE_ARC', label: 'Sasuke Retrieval', biome: 'Valley of the End' };
  return { name: 'WAR_ARC', label: 'Great Ninja War', biome: 'Divine Tree Roots' };
};

/**
 * Determine enemy archetype based on configuration
 */
export const selectArchetype = (
  type: 'NORMAL' | 'ELITE' | 'BOSS' | 'AMBUSH'
): EnemyArchetype => {
  if (type === 'AMBUSH') return EnemyArchetype.ASSASSIN;
  if (type === 'ELITE') return Math.random() > 0.5 ? EnemyArchetype.TANK : EnemyArchetype.CASTER;
  if (type === 'NORMAL') {
    const archetypes = Object.values(EnemyArchetype).filter(a => a !== EnemyArchetype.BALANCED);
    return archetypes[Math.floor(Math.random() * archetypes.length)];
  }
  return EnemyArchetype.BALANCED;
};

/**
 * Apply elite stat multipliers to an enemy
 */
export const applyEliteScaling = (stats: any, isElite: boolean) => {
  if (!isElite) return stats;
  return {
    ...stats,
    willpower: Math.floor(stats.willpower * 1.4),
    strength: Math.floor(stats.strength * 1.3),
    spirit: Math.floor(stats.spirit * 1.3)
  };
};
