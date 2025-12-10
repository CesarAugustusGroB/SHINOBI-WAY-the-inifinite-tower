import {
  ApproachType,
  ApproachOption,
  PrimaryStat,
  EffectType,
  TerrainType,
} from '../types';

// ============================================================================
// APPROACH DEFINITIONS
// These determine how the player engages with combat encounters
// ============================================================================

export const APPROACH_DEFINITIONS: Record<ApproachType, ApproachOption> = {
  // ============================================================================
  // FRONTAL ASSAULT - Always available, no bonuses, no penalties
  // ============================================================================
  [ApproachType.FRONTAL_ASSAULT]: {
    type: ApproachType.FRONTAL_ASSAULT,
    name: 'Frontal Assault',
    description: 'Face the enemy directly. No tricks, no advantages, just pure combat prowess.',

    requirements: {},  // Always available

    successCalc: {
      baseChance: 100,
      scalingStat: PrimaryStat.STRENGTH,
      scalingFactor: 0,
      terrainBonus: false,
      maxChance: 100,
    },

    successEffects: {
      initiativeBonus: 0,
      guaranteedFirst: false,
      firstHitMultiplier: 1.0,
      playerBuffs: [],
      enemyDebuffs: [],
      skipCombat: false,
      enemyHpReduction: 0,
      chakraCost: 0,
      hpCost: 0,
      xpMultiplier: 1.0,
    },
  },

  // ============================================================================
  // STEALTH AMBUSH - Sneak attack for first-hit damage bonus
  // Requires Speed, scales with Dexterity
  // BALANCE: Nerfed from 2.5x to 2.0x, removed guaranteed first turn
  // ============================================================================
  [ApproachType.STEALTH_AMBUSH]: {
    type: ApproachType.STEALTH_AMBUSH,
    name: 'Silent Strike',
    description: 'Move through the shadows. If successful, your first attack deals 2x damage and you gain a large initiative bonus.',

    requirements: {
      minStat: { stat: PrimaryStat.SPEED, value: 12 },  // Base requirement
    },

    successCalc: {
      baseChance: 40,
      scalingStat: PrimaryStat.DEXTERITY,
      scalingFactor: 1.5,           // +1.5% per DEX point
      terrainBonus: true,           // Terrain stealth modifier applies
      maxChance: 95,
    },

    successEffects: {
      initiativeBonus: 50,          // High initiative, but not guaranteed
      guaranteedFirst: false,       // No longer guaranteed (nerfed)
      firstHitMultiplier: 2.0,      // First hit deals 2x damage (nerfed from 2.5x)
      playerBuffs: [
        {
          type: EffectType.BUFF,
          targetStat: PrimaryStat.DEXTERITY,
          value: 0.15,              // +15% DEX for first turn (nerfed from 30%)
          duration: 1,
          chance: 1.0,
        }
      ],
      enemyDebuffs: [
        {
          type: EffectType.STUN,
          duration: 1,
          chance: 0.15,             // 15% chance to stun from surprise (nerfed from 30%)
        }
      ],
      skipCombat: false,
      enemyHpReduction: 0,
      chakraCost: 0,
      hpCost: 0,
      xpMultiplier: 1.15,           // +15% XP for skillful approach
    },

    failureEffects: {
      initiativeBonus: 0,           // Just normal combat
      guaranteedFirst: false,
      firstHitMultiplier: 1.0,
      playerBuffs: [],
      enemyDebuffs: [],
      skipCombat: false,
      enemyHpReduction: 0,
      chakraCost: 0,
      hpCost: 0,
      xpMultiplier: 1.0,            // No penalty on failure
    },
  },

  // ============================================================================
  // GENJUTSU SETUP - Mental trap, debuffs enemy before combat
  // Requires Calmness, scales with Intelligence
  // ============================================================================
  [ApproachType.GENJUTSU_SETUP]: {
    type: ApproachType.GENJUTSU_SETUP,
    name: 'Mind Trap',
    description: 'Weave an illusion before engaging. If successful, the enemy starts confused and slowed.',

    requirements: {
      minStat: { stat: PrimaryStat.CALMNESS, value: 15 },
    },

    successCalc: {
      baseChance: 35,
      scalingStat: PrimaryStat.INTELLIGENCE,
      scalingFactor: 2.0,           // +2% per INT point
      terrainBonus: false,
      maxChance: 95,
    },

    successEffects: {
      initiativeBonus: 10,
      guaranteedFirst: false,
      firstHitMultiplier: 1.0,
      playerBuffs: [
        {
          type: EffectType.BUFF,
          targetStat: PrimaryStat.CALMNESS,
          value: 0.2,               // +20% Calmness
          duration: 3,
          chance: 1.0,
        }
      ],
      enemyDebuffs: [
        {
          type: EffectType.CONFUSION,
          duration: 2,
          chance: 1.0,              // Guaranteed confusion
        },
        {
          type: EffectType.DEBUFF,
          targetStat: PrimaryStat.SPEED,
          value: 0.30,              // -30% Speed
          duration: 3,
          chance: 1.0,
        }
      ],
      skipCombat: false,
      enemyHpReduction: 0,
      chakraCost: 20,               // Pre-fight chakra investment
      hpCost: 0,
      xpMultiplier: 1.20,           // +20% XP for mental mastery
    },

    failureEffects: {
      initiativeBonus: 0,
      guaranteedFirst: false,
      firstHitMultiplier: 1.0,
      playerBuffs: [],
      enemyDebuffs: [],
      skipCombat: false,
      enemyHpReduction: 0,
      chakraCost: 20,               // Still spend the chakra
      hpCost: 0,
      xpMultiplier: 1.0,
    },
  },

  // ============================================================================
  // ENVIRONMENTAL TRAP - Use terrain to damage enemy before combat
  // Requires Intelligence, specific terrains, scales with Accuracy
  // ============================================================================
  [ApproachType.ENVIRONMENTAL_TRAP]: {
    type: ApproachType.ENVIRONMENTAL_TRAP,
    name: 'Terrain Trap',
    description: 'Use the environment to weaken your enemy. Triggers a trap that deals 20% of enemy HP before combat.',

    requirements: {
      minStat: { stat: PrimaryStat.INTELLIGENCE, value: 14 },
      allowedTerrains: [
        TerrainType.TREE_CANOPY,
        TerrainType.CLIFF_EDGE,
        TerrainType.SWAMP,
        TerrainType.GIANT_ROOTS,
        TerrainType.ALLEYWAY,
        TerrainType.WATERFALL,
        TerrainType.CORRUPTED_ZONE,
      ],
    },

    successCalc: {
      baseChance: 45,
      scalingStat: PrimaryStat.ACCURACY,
      scalingFactor: 1.2,           // +1.2% per ACC point
      terrainBonus: false,
      maxChance: 90,
    },

    successEffects: {
      initiativeBonus: 5,
      guaranteedFirst: false,
      firstHitMultiplier: 1.0,
      playerBuffs: [],
      enemyDebuffs: [
        {
          type: EffectType.DEBUFF,
          targetStat: PrimaryStat.STRENGTH,
          value: 0.15,              // -15% Strength from injury
          duration: 3,
          chance: 1.0,
        }
      ],
      skipCombat: false,
      enemyHpReduction: 0.20,       // Enemy loses 20% HP before fight
      chakraCost: 0,
      hpCost: 0,
      xpMultiplier: 1.25,           // +25% XP for tactical approach
    },

    failureEffects: {
      initiativeBonus: 0,
      guaranteedFirst: false,
      firstHitMultiplier: 1.0,
      playerBuffs: [],
      enemyDebuffs: [],
      skipCombat: false,
      enemyHpReduction: 0,
      chakraCost: 0,
      hpCost: 0,
      xpMultiplier: 1.0,
    },
  },

  // ============================================================================
  // SHADOW BYPASS - Skip combat entirely (rare, high requirements)
  // Requires high Speed + Body Flicker skill
  // ============================================================================
  [ApproachType.SHADOW_BYPASS]: {
    type: ApproachType.SHADOW_BYPASS,
    name: 'Shadow Passage',
    description: 'Use supreme ninja skill to bypass this encounter entirely. Costs chakra, grants no XP or loot.',

    requirements: {
      minStat: { stat: PrimaryStat.SPEED, value: 35 },
      requiredSkill: 'shunshin',    // Body Flicker required
    },

    successCalc: {
      baseChance: 30,
      scalingStat: PrimaryStat.SPEED,
      scalingFactor: 1.0,           // +1% per SPD point
      terrainBonus: true,           // Terrain stealth modifier applies
      maxChance: 95,
    },

    successEffects: {
      initiativeBonus: 0,
      guaranteedFirst: false,
      firstHitMultiplier: 1.0,
      playerBuffs: [],
      enemyDebuffs: [],
      skipCombat: true,             // Skip combat entirely!
      enemyHpReduction: 0,
      chakraCost: 30,               // Significant chakra cost
      hpCost: 0,
      xpMultiplier: 0,              // No XP from bypassed fights
    },

    failureEffects: {
      initiativeBonus: 0,           // Just normal combat on failure
      guaranteedFirst: false,
      firstHitMultiplier: 1.0,
      playerBuffs: [],
      enemyDebuffs: [],
      skipCombat: false,
      enemyHpReduction: 0,
      chakraCost: 30,               // Still spend chakra
      hpCost: 0,
      xpMultiplier: 1.0,
    },
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get approach definition
 */
export function getApproach(type: ApproachType): ApproachOption {
  return APPROACH_DEFINITIONS[type];
}

/**
 * Calculate success chance for an approach
 * @param approach The approach type
 * @param stats Player's primary stats
 * @param terrainStealthBonus Bonus from current terrain (if applicable)
 * @returns Success percentage (0-100)
 */
export function calculateApproachSuccessChance(
  approach: ApproachType,
  stats: Record<string, number>,
  terrainStealthBonus: number = 0
): number {
  const def = APPROACH_DEFINITIONS[approach];
  const calc = def.successCalc;

  // Get the relevant stat value
  const statKey = calc.scalingStat.toLowerCase();
  const statValue = stats[statKey] || 0;

  // Calculate base + scaling
  let chance = calc.baseChance + (statValue * calc.scalingFactor);

  // Add terrain bonus if applicable
  if (calc.terrainBonus) {
    chance += terrainStealthBonus;
  }

  // Clamp to max
  return Math.min(calc.maxChance, Math.max(0, chance));
}

/**
 * Check if player meets requirements for an approach
 */
export function meetsApproachRequirements(
  approach: ApproachType,
  stats: Record<string, number>,
  skills: string[],
  currentTerrain: TerrainType
): { meets: boolean; reason?: string } {
  const def = APPROACH_DEFINITIONS[approach];
  const req = def.requirements;

  // Check minimum stat
  if (req.minStat) {
    const statKey = req.minStat.stat.toLowerCase();
    const playerStat = stats[statKey] || 0;
    if (playerStat < req.minStat.value) {
      return {
        meets: false,
        reason: `Requires ${req.minStat.stat} ${req.minStat.value} (you have ${playerStat})`,
      };
    }
  }

  // Check required skill
  if (req.requiredSkill) {
    if (!skills.includes(req.requiredSkill)) {
      return {
        meets: false,
        reason: `Requires ${req.requiredSkill} skill`,
      };
    }
  }

  // Check allowed terrains
  if (req.allowedTerrains && req.allowedTerrains.length > 0) {
    if (!req.allowedTerrains.includes(currentTerrain)) {
      return {
        meets: false,
        reason: `Not available on this terrain`,
      };
    }
  }

  return { meets: true };
}

/**
 * Get all available approaches for given context
 */
export function getAvailableApproaches(
  stats: Record<string, number>,
  skills: string[],
  currentTerrain: TerrainType,
  isEliteOrBoss: boolean = false
): Array<{ approach: ApproachType; available: boolean; reason?: string; successChance?: number }> {
  const terrainStealthMod = 0; // Would get from terrain definition

  return Object.values(ApproachType).map((approach) => {
    // Bypass is never available for Elite/Boss
    if (approach === ApproachType.SHADOW_BYPASS && isEliteOrBoss) {
      return {
        approach,
        available: false,
        reason: 'Cannot bypass Elite or Boss encounters',
      };
    }

    const { meets, reason } = meetsApproachRequirements(approach, stats, skills, currentTerrain);

    if (!meets) {
      return { approach, available: false, reason };
    }

    const successChance = calculateApproachSuccessChance(approach, stats, terrainStealthMod);

    return { approach, available: true, successChance };
  });
}

// ============================================================================
// APPROACH SCALING BY FLOOR
// Minimum stats increase as you progress through the tower
// ============================================================================
export const APPROACH_FLOOR_REQUIREMENTS: Record<string, Record<ApproachType, number>> = {
  // Floor ranges and their minimum stat requirements for each approach
  '1-10': {
    [ApproachType.FRONTAL_ASSAULT]: 0,
    [ApproachType.STEALTH_AMBUSH]: 12,
    [ApproachType.GENJUTSU_SETUP]: 15,
    [ApproachType.ENVIRONMENTAL_TRAP]: 14,
    [ApproachType.SHADOW_BYPASS]: 999,  // Not available early
  },
  '11-25': {
    [ApproachType.FRONTAL_ASSAULT]: 0,
    [ApproachType.STEALTH_AMBUSH]: 18,
    [ApproachType.GENJUTSU_SETUP]: 22,
    [ApproachType.ENVIRONMENTAL_TRAP]: 20,
    [ApproachType.SHADOW_BYPASS]: 35,
  },
  '26-50': {
    [ApproachType.FRONTAL_ASSAULT]: 0,
    [ApproachType.STEALTH_AMBUSH]: 25,
    [ApproachType.GENJUTSU_SETUP]: 28,
    [ApproachType.ENVIRONMENTAL_TRAP]: 26,
    [ApproachType.SHADOW_BYPASS]: 42,
  },
  '51-75': {
    [ApproachType.FRONTAL_ASSAULT]: 0,
    [ApproachType.STEALTH_AMBUSH]: 32,
    [ApproachType.GENJUTSU_SETUP]: 35,
    [ApproachType.ENVIRONMENTAL_TRAP]: 32,
    [ApproachType.SHADOW_BYPASS]: 50,
  },
  '76+': {
    [ApproachType.FRONTAL_ASSAULT]: 0,
    [ApproachType.STEALTH_AMBUSH]: 40,
    [ApproachType.GENJUTSU_SETUP]: 42,
    [ApproachType.ENVIRONMENTAL_TRAP]: 40,
    [ApproachType.SHADOW_BYPASS]: 58,
  },
};

/**
 * Get the floor range key for scaling
 */
export function getFloorRange(floor: number): string {
  if (floor <= 10) return '1-10';
  if (floor <= 25) return '11-25';
  if (floor <= 50) return '26-50';
  if (floor <= 75) return '51-75';
  return '76+';
}
