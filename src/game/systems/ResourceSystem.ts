import {
  PlayerResources,
  ResourceModifiers,
  ResourceStatus,
  Player,
  DerivedStats,
} from '../types';
import { RESOURCE_CONSTANTS } from '../constants';

/**
 * Calculate stat modifiers based on current resource levels
 * Returns multipliers to be applied to various derived stats
 */
export const calculateResourceModifiers = (resources: PlayerResources): ResourceModifiers => {
  let hpMult = 1.0;
  let damageOut = 1.0;
  let speedMult = 1.0;
  let chakraCostMult = 1.0;
  let defenseMult = 1.0;
  let xpGainMult = 1.0;

  // HUNGER EFFECTS
  if (resources.hunger < RESOURCE_CONSTANTS.HUNGER_CRITICAL) {
    // Starving: reduced HP and damage
    hpMult *= RESOURCE_CONSTANTS.HUNGER_CRITICAL_HP_MULT;
    damageOut *= RESOURCE_CONSTANTS.HUNGER_CRITICAL_DAMAGE_MULT;
  } else if (resources.hunger > RESOURCE_CONSTANTS.HUNGER_GOOD_MIN) {
    // Well-fed: slight HP regen boost
    hpMult *= RESOURCE_CONSTANTS.HUNGER_GOOD_HP_REGEN_MULT;
  }

  // FATIGUE EFFECTS
  if (resources.fatigue > RESOURCE_CONSTANTS.FATIGUE_CRITICAL) {
    // Exhausted: reduced speed, increased chakra costs
    speedMult *= RESOURCE_CONSTANTS.FATIGUE_CRITICAL_SPEED_MULT;
    chakraCostMult *= RESOURCE_CONSTANTS.FATIGUE_CRITICAL_CHAKRA_COST_MULT;
  } else if (resources.fatigue < RESOURCE_CONSTANTS.FATIGUE_GOOD_MAX) {
    // Well-rested: increased speed, reduced chakra costs
    speedMult *= RESOURCE_CONSTANTS.FATIGUE_GOOD_SPEED_MULT;
    chakraCostMult *= RESOURCE_CONSTANTS.FATIGUE_GOOD_CHAKRA_COST_MULT;
  }

  // MORALE EFFECTS
  if (resources.morale < RESOURCE_CONSTANTS.MORALE_CRITICAL) {
    // Broken: reduced damage and defense
    damageOut *= RESOURCE_CONSTANTS.MORALE_CRITICAL_DAMAGE_MULT;
    defenseMult *= RESOURCE_CONSTANTS.MORALE_CRITICAL_DEFENSE_MULT;
  } else if (resources.morale > RESOURCE_CONSTANTS.MORALE_GOOD_MIN) {
    // Heroic: increased damage and XP
    damageOut *= RESOURCE_CONSTANTS.MORALE_GOOD_DAMAGE_MULT;
    xpGainMult *= RESOURCE_CONSTANTS.MORALE_GOOD_XP_MULT;
  }

  return {
    hpMult,
    damageOut,
    speedMult,
    chakraCostMult,
    defenseMult,
    xpGainMult,
  };
};

/**
 * Apply resource drain for progressing to next floor
 * Also handles combat fatigue gains
 */
export const applyResourceDrain = (
  resources: PlayerResources,
  roomType: string,
): PlayerResources => {
  const updated = { ...resources };

  // Floor progression effects
  updated.hunger = Math.max(0, updated.hunger - RESOURCE_CONSTANTS.HUNGER_DRAIN_PER_FLOOR);
  updated.fatigue = Math.min(100, updated.fatigue + RESOURCE_CONSTANTS.FATIGUE_GAIN_PER_FLOOR);

  // Combat-specific fatigue
  if (roomType === 'COMBAT') {
    updated.fatigue = Math.min(100, updated.fatigue + RESOURCE_CONSTANTS.FATIGUE_NORMAL_COMBAT);
  } else if (roomType === 'ELITE') {
    updated.fatigue = Math.min(100, updated.fatigue + RESOURCE_CONSTANTS.FATIGUE_ELITE_COMBAT);
  } else if (roomType === 'BOSS') {
    updated.fatigue = Math.min(100, updated.fatigue + RESOURCE_CONSTANTS.FATIGUE_BOSS_COMBAT);
  }

  // Clamp all resources to valid range
  updated.hunger = Math.max(0, Math.min(100, updated.hunger));
  updated.fatigue = Math.max(0, Math.min(100, updated.fatigue));
  updated.morale = Math.max(0, Math.min(100, updated.morale));
  updated.supplies = Math.max(0, Math.min(RESOURCE_CONSTANTS.MAX_SUPPLIES, updated.supplies));

  return updated;
};

/**
 * Apply morale change from combat outcome
 */
export const applyVictoryMorale = (
  resources: PlayerResources,
  roomType: string,
): PlayerResources => {
  const updated = { ...resources };

  if (roomType === 'COMBAT') {
    updated.morale = Math.min(100, updated.morale + RESOURCE_CONSTANTS.MORALE_NORMAL_VICTORY);
  } else if (roomType === 'ELITE') {
    updated.morale = Math.min(100, updated.morale + RESOURCE_CONSTANTS.MORALE_ELITE_VICTORY);
  } else if (roomType === 'BOSS') {
    updated.morale = Math.min(100, updated.morale + RESOURCE_CONSTANTS.MORALE_BOSS_VICTORY);
  }

  return updated;
};

/**
 * Apply morale penalty when player is near death
 */
export const applyNearDeathPenalty = (
  resources: PlayerResources,
  currentHp: number,
  maxHp: number,
): PlayerResources => {
  const updated = { ...resources };

  // If HP is below 20% of max, apply morale penalty
  if (currentHp > 0 && currentHp < maxHp * 0.2) {
    updated.morale = Math.max(0, updated.morale - RESOURCE_CONSTANTS.MORALE_NEAR_DEATH_PENALTY);
  }

  return updated;
};

/**
 * Get the status of resources (critical/warning/good)
 * Used for UI display and decision-making
 */
export const getResourceStatus = (resources: PlayerResources): ResourceStatus => {
  const hunger = resources.hunger;
  const fatigue = resources.fatigue;
  const morale = resources.morale;

  // Critical if ANY resource is critical
  if (
    hunger < RESOURCE_CONSTANTS.HUNGER_CRITICAL ||
    fatigue > RESOURCE_CONSTANTS.FATIGUE_CRITICAL ||
    morale < RESOURCE_CONSTANTS.MORALE_CRITICAL
  ) {
    return ResourceStatus.CRITICAL;
  }

  // Warning if ANY resource is warning (between critical and neutral)
  const hungerWarning = hunger < 40;
  const fatigueWarning = fatigue > 60;
  const moraleWarning = morale < 40;

  if (hungerWarning || fatigueWarning || moraleWarning) {
    return ResourceStatus.WARNING;
  }

  return ResourceStatus.GOOD;
};

/**
 * Check if player can afford a resource cost
 */
export const canAffordResourceCost = (
  resources: PlayerResources,
  cost: { hunger?: number; fatigue?: number; morale?: number; supplies?: number },
): boolean => {
  if (cost.hunger && resources.hunger < cost.hunger) return false;
  if (cost.fatigue && resources.fatigue < cost.fatigue) return false;
  if (cost.morale && resources.morale < cost.morale) return false;
  if (cost.supplies && resources.supplies < cost.supplies) return false;

  return true;
};

/**
 * Apply a resource cost (for event choices, etc.)
 */
export const applyResourceCost = (
  resources: PlayerResources,
  cost: { hunger?: number; fatigue?: number; morale?: number; supplies?: number },
): PlayerResources => {
  const updated = { ...resources };

  if (cost.hunger) updated.hunger = Math.max(0, updated.hunger - cost.hunger);
  if (cost.fatigue) updated.fatigue = Math.max(0, updated.fatigue - cost.fatigue);
  if (cost.morale) updated.morale = Math.max(0, updated.morale - cost.morale);
  if (cost.supplies) updated.supplies = Math.max(0, updated.supplies - cost.supplies);

  return updated;
};

/**
 * Apply resource changes (gains or losses)
 */
export const applyResourceChanges = (
  resources: PlayerResources,
  changes: Partial<PlayerResources>,
): PlayerResources => {
  const updated = { ...resources };

  if (changes.hunger !== undefined) {
    updated.hunger = Math.max(0, Math.min(100, updated.hunger + changes.hunger));
  }
  if (changes.fatigue !== undefined) {
    updated.fatigue = Math.max(0, Math.min(100, updated.fatigue + changes.fatigue));
  }
  if (changes.morale !== undefined) {
    updated.morale = Math.max(0, Math.min(100, updated.morale + changes.morale));
  }
  if (changes.supplies !== undefined) {
    updated.supplies = Math.max(
      0,
      Math.min(RESOURCE_CONSTANTS.MAX_SUPPLIES, updated.supplies + changes.supplies),
    );
  }

  return updated;
};

/**
 * Get a description of active resource effects
 * Used for tooltips and UI display
 */
export const getResourceEffectsDescription = (resources: PlayerResources): string[] => {
  const effects: string[] = [];

  if (resources.hunger < RESOURCE_CONSTANTS.HUNGER_CRITICAL) {
    effects.push('Starving: -15% Max HP, -10% Damage');
  } else if (resources.hunger > RESOURCE_CONSTANTS.HUNGER_GOOD_MIN) {
    effects.push('Well-fed: +5% HP Regen');
  }

  if (resources.fatigue > RESOURCE_CONSTANTS.FATIGUE_CRITICAL) {
    effects.push('Exhausted: -20% Speed, +15% Chakra Costs');
  } else if (resources.fatigue < RESOURCE_CONSTANTS.FATIGUE_GOOD_MAX) {
    effects.push('Well-rested: +10% Speed, -10% Chakra Costs');
  }

  if (resources.morale < RESOURCE_CONSTANTS.MORALE_CRITICAL) {
    effects.push('Broken: -20% Damage, -20% Defense');
  } else if (resources.morale > RESOURCE_CONSTANTS.MORALE_GOOD_MIN) {
    effects.push('Heroic: +15% Damage, +10% XP Gain');
  }

  return effects;
};

/**
 * Create default starting resources for a new game
 */
export const getStartingResources = (): PlayerResources => {
  return {
    hunger: RESOURCE_CONSTANTS.STARTING_HUNGER,
    fatigue: RESOURCE_CONSTANTS.STARTING_FATIGUE,
    morale: RESOURCE_CONSTANTS.STARTING_MORALE,
    supplies: RESOURCE_CONSTANTS.STARTING_SUPPLIES,
  };
};
