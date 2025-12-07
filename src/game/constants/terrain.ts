import { TerrainType, TerrainDefinition, ElementType } from '../types';

// ============================================================================
// TERRAIN DEFINITIONS
// Each terrain affects both exploration (stealth, visibility) and combat
// ============================================================================

export const TERRAIN_DEFINITIONS: Record<TerrainType, TerrainDefinition> = {
  // ============================================================================
  // ACADEMY BIOME (Floors 1-10)
  // Village Hidden in the Leaves - Safe, familiar territory
  // ============================================================================
  [TerrainType.OPEN_GROUND]: {
    id: TerrainType.OPEN_GROUND,
    name: 'Open Ground',
    description: 'Flat, exposed terrain with no cover. Standard combat conditions.',
    biome: 'ACADEMY',
    effects: {
      stealthModifier: -10,       // Hard to hide in the open
      visibilityRange: 3,         // Can see far
      hiddenRoomBonus: 0,
      movementCost: 1.0,
      initiativeModifier: 0,
      evasionModifier: 0,
    }
  },

  [TerrainType.ROOFTOPS]: {
    id: TerrainType.ROOFTOPS,
    name: 'Village Rooftops',
    description: 'High ground with good sightlines. Favors agile fighters.',
    biome: 'ACADEMY',
    effects: {
      stealthModifier: 10,        // Can duck behind chimneys
      visibilityRange: 3,
      hiddenRoomBonus: 10,
      movementCost: 0.9,          // Ninja traverse rooftops easily
      initiativeModifier: 5,      // High ground advantage
      evasionModifier: 0.05,      // Some cover available
    }
  },

  [TerrainType.TRAINING_FIELD]: {
    id: TerrainType.TRAINING_FIELD,
    name: 'Training Field',
    description: 'Practice grounds with training posts and equipment. Good for honing skills.',
    biome: 'ACADEMY',
    effects: {
      stealthModifier: 0,
      visibilityRange: 2,
      hiddenRoomBonus: 5,
      movementCost: 1.0,
      initiativeModifier: 0,
      evasionModifier: 0,
    }
  },

  [TerrainType.ALLEYWAY]: {
    id: TerrainType.ALLEYWAY,
    name: 'Narrow Alleyway',
    description: 'Tight corridors between buildings. Perfect for ambushes.',
    biome: 'ACADEMY',
    effects: {
      stealthModifier: 25,        // Many shadows to hide in
      visibilityRange: 1,         // Limited sightlines
      hiddenRoomBonus: 15,
      movementCost: 1.1,          // Cramped movement
      initiativeModifier: 8,      // Ambush advantage
      evasionModifier: -0.05,     // Hard to dodge in tight spaces
    }
  },

  // ============================================================================
  // WAVES BIOME (Floors 11-25)
  // Mist Covered Bridge - Limited visibility, water element
  // ============================================================================
  [TerrainType.FOG_BANK]: {
    id: TerrainType.FOG_BANK,
    name: 'Thick Fog',
    description: 'Dense mist obscures everything. Sound travels strangely here.',
    biome: 'WAVES',
    effects: {
      stealthModifier: 30,        // Very easy to hide
      visibilityRange: 1,         // Can barely see
      hiddenRoomBonus: 20,
      movementCost: 1.3,          // Slow, careful movement
      initiativeModifier: -5,     // Hard to react quickly
      evasionModifier: 0.12,      // Hard to target
      elementAmplify: ElementType.WATER,
      elementAmplifyPercent: 25,
    }
  },

  [TerrainType.BRIDGE]: {
    id: TerrainType.BRIDGE,
    name: 'Narrow Bridge',
    description: 'A precarious crossing over churning water. No room to maneuver.',
    biome: 'WAVES',
    effects: {
      stealthModifier: -15,       // Nowhere to hide
      visibilityRange: 2,
      hiddenRoomBonus: 0,
      movementCost: 1.0,
      initiativeModifier: 0,
      evasionModifier: -0.08,     // Nowhere to dodge
      hazard: {
        type: 'FALL',
        value: 20,                // Fall damage
        chance: 0.10,             // 10% chance when missed attack
        affectsPlayer: true,
        affectsEnemy: true,
      }
    }
  },

  [TerrainType.WATER_SURFACE]: {
    id: TerrainType.WATER_SURFACE,
    name: 'Water Surface',
    description: 'Standing on water using chakra. Requires constant concentration.',
    biome: 'WAVES',
    effects: {
      stealthModifier: -5,
      visibilityRange: 2,
      hiddenRoomBonus: 5,
      movementCost: 1.2,          // Chakra-intensive movement
      initiativeModifier: -3,
      evasionModifier: 0.08,      // Can sink to dodge
      elementAmplify: ElementType.WATER,
      elementAmplifyPercent: 30,
      hazard: {
        type: 'CHAKRA_DRAIN',
        value: 3,                 // Drain per turn to maintain footing
        chance: 1.0,
        affectsPlayer: true,
        affectsEnemy: true,
      }
    }
  },

  [TerrainType.SHORELINE]: {
    id: TerrainType.SHORELINE,
    name: 'Rocky Shoreline',
    description: 'Wet rocks and crashing waves. Treacherous but scenic.',
    biome: 'WAVES',
    effects: {
      stealthModifier: 5,
      visibilityRange: 2,
      hiddenRoomBonus: 10,
      movementCost: 1.15,         // Slippery rocks
      initiativeModifier: 0,
      evasionModifier: 0,
      elementAmplify: ElementType.WATER,
      elementAmplifyPercent: 15,
    }
  },

  // ============================================================================
  // FOREST OF DEATH BIOME (Floors 26-50)
  // Chunin Exams survival - Dense, dangerous, full of secrets
  // ============================================================================
  [TerrainType.DENSE_FOLIAGE]: {
    id: TerrainType.DENSE_FOLIAGE,
    name: 'Dense Foliage',
    description: 'Thick vegetation obscures movement. Perfect for guerilla tactics.',
    biome: 'EXAMS',
    effects: {
      stealthModifier: 20,
      visibilityRange: 1,
      hiddenRoomBonus: 25,        // Many hiding spots
      movementCost: 1.2,
      initiativeModifier: 5,
      evasionModifier: 0.08,
    }
  },

  [TerrainType.TREE_CANOPY]: {
    id: TerrainType.TREE_CANOPY,
    name: 'Forest Canopy',
    description: 'High among the branches. A ninja\'s natural domain.',
    biome: 'EXAMS',
    effects: {
      stealthModifier: 25,
      visibilityRange: 2,
      hiddenRoomBonus: 30,        // Excellent for finding secrets
      movementCost: 0.8,          // Ninja excel here
      initiativeModifier: 10,     // High ground + mobility
      evasionModifier: 0.10,      // Branches provide cover
    }
  },

  [TerrainType.SWAMP]: {
    id: TerrainType.SWAMP,
    name: 'Murky Swamp',
    description: 'Fetid water and sucking mud. Everything here wants to kill you.',
    biome: 'EXAMS',
    effects: {
      stealthModifier: 15,
      visibilityRange: 1,
      hiddenRoomBonus: 20,
      movementCost: 1.5,          // Very slow
      initiativeModifier: -8,     // Stuck in mud
      evasionModifier: -0.05,     // Hard to move quickly
      elementAmplify: ElementType.WATER,
      elementAmplifyPercent: 15,
      hazard: {
        type: 'POISON',
        value: 5,                 // Toxic swamp gas
        chance: 0.25,             // 25% each turn
        affectsPlayer: true,
        affectsEnemy: true,
      }
    }
  },

  [TerrainType.GIANT_ROOTS]: {
    id: TerrainType.GIANT_ROOTS,
    name: 'Giant Roots',
    description: 'Massive tree roots create a labyrinth. Ancient chakra lingers here.',
    biome: 'EXAMS',
    effects: {
      stealthModifier: 15,
      visibilityRange: 1,
      hiddenRoomBonus: 35,        // Many secret passages
      movementCost: 1.1,
      initiativeModifier: 3,
      evasionModifier: 0.05,
      elementAmplify: ElementType.EARTH,
      elementAmplifyPercent: 20,
    }
  },

  // ============================================================================
  // VALLEY OF THE END BIOME (Floors 51-75)
  // Rogue Arc - Vertical terrain, dramatic battlefields
  // ============================================================================
  [TerrainType.WATERFALL]: {
    id: TerrainType.WATERFALL,
    name: 'Thundering Waterfall',
    description: 'Roaring water drowns out all sound. The spray is blinding.',
    biome: 'ROGUE',
    effects: {
      stealthModifier: 20,        // Sound is masked
      visibilityRange: 1,
      hiddenRoomBonus: 15,
      movementCost: 1.3,
      initiativeModifier: -3,
      evasionModifier: 0.15,      // Spray provides cover
      elementAmplify: ElementType.WATER,
      elementAmplifyPercent: 35,
      hazard: {
        type: 'DAMAGE',
        value: 8,                 // Crushing water
        chance: 0.15,
        affectsPlayer: true,
        affectsEnemy: true,
      }
    }
  },

  [TerrainType.CLIFF_EDGE]: {
    id: TerrainType.CLIFF_EDGE,
    name: 'Cliff Edge',
    description: 'Precarious ledge with a fatal drop. One wrong move...',
    biome: 'ROGUE',
    effects: {
      stealthModifier: -10,
      visibilityRange: 3,         // Great view
      hiddenRoomBonus: 5,
      movementCost: 1.2,
      initiativeModifier: 5,      // High ground
      evasionModifier: 0.08,
      hazard: {
        type: 'FALL',
        value: 25,                // Significant fall damage
        chance: 0.15,
        affectsPlayer: true,
        affectsEnemy: true,
      }
    }
  },

  [TerrainType.STONE_PILLARS]: {
    id: TerrainType.STONE_PILLARS,
    name: 'Stone Pillars',
    description: 'Ancient statues of legendary shinobi. Their chakra still resonates.',
    biome: 'ROGUE',
    effects: {
      stealthModifier: 10,
      visibilityRange: 2,
      hiddenRoomBonus: 20,
      movementCost: 1.0,
      initiativeModifier: 0,
      evasionModifier: 0.05,
      elementAmplify: ElementType.EARTH,
      elementAmplifyPercent: 25,
    }
  },

  [TerrainType.RAPIDS]: {
    id: TerrainType.RAPIDS,
    name: 'Churning Rapids',
    description: 'Fast-moving water threatens to sweep you away.',
    biome: 'ROGUE',
    effects: {
      stealthModifier: 5,
      visibilityRange: 2,
      hiddenRoomBonus: 10,
      movementCost: 1.4,
      initiativeModifier: -5,
      evasionModifier: 0,
      elementAmplify: ElementType.WATER,
      elementAmplifyPercent: 25,
      hazard: {
        type: 'DAMAGE',
        value: 10,
        chance: 0.20,             // 20% chance to be swept
        affectsPlayer: true,
        affectsEnemy: true,
      }
    }
  },

  // ============================================================================
  // WAR ARC BIOME (Floors 76+)
  // Divine Tree - Corrupted, chakra-draining, apocalyptic
  // ============================================================================
  [TerrainType.ROOT_NETWORK]: {
    id: TerrainType.ROOT_NETWORK,
    name: 'Root Network',
    description: 'Living roots of the Divine Tree pulse with stolen chakra.',
    biome: 'WAR',
    effects: {
      stealthModifier: 10,
      visibilityRange: 2,
      hiddenRoomBonus: 25,
      movementCost: 1.1,
      initiativeModifier: 0,
      evasionModifier: 0,
      elementAmplify: ElementType.EARTH,
      elementAmplifyPercent: 20,
      hazard: {
        type: 'CHAKRA_DRAIN',
        value: 5,
        chance: 0.30,
        affectsPlayer: true,
        affectsEnemy: false,      // Enemies are attuned
      }
    }
  },

  [TerrainType.CORRUPTED_ZONE]: {
    id: TerrainType.CORRUPTED_ZONE,
    name: 'Corrupted Zone',
    description: 'Reality warps here. The corruption reveals all but weakens the body.',
    biome: 'WAR',
    effects: {
      stealthModifier: -20,       // Corruption reveals presence
      visibilityRange: 3,         // Strangely clear
      hiddenRoomBonus: -10,
      movementCost: 1.2,
      initiativeModifier: 0,
      evasionModifier: -0.10,     // Corruption slows reflexes
      hazard: {
        type: 'CHAKRA_DRAIN',
        value: 8,
        chance: 1.0,              // Constant drain
        affectsPlayer: true,
        affectsEnemy: true,
      }
    }
  },

  [TerrainType.CHAKRA_NEXUS]: {
    id: TerrainType.CHAKRA_NEXUS,
    name: 'Chakra Nexus',
    description: 'A convergence point of natural energy. All jutsu are amplified.',
    biome: 'WAR',
    effects: {
      stealthModifier: -15,       // Chakra signatures are bright
      visibilityRange: 3,
      hiddenRoomBonus: 15,
      movementCost: 1.0,
      initiativeModifier: 5,
      evasionModifier: 0,
      elementAmplify: ElementType.FIRE,  // All elements, but we pick one
      elementAmplifyPercent: 20,         // Actually applies to all
      hazard: {
        type: 'CHAKRA_DRAIN',
        value: 10,
        chance: 0.5,
        affectsPlayer: true,
        affectsEnemy: true,
      }
    }
  },

  [TerrainType.VOID_SPACE]: {
    id: TerrainType.VOID_SPACE,
    name: 'Void Space',
    description: 'A tear in reality. Nothing makes sense here.',
    biome: 'WAR',
    effects: {
      stealthModifier: 0,         // Nothing matters
      visibilityRange: 1,         // Reality is broken
      hiddenRoomBonus: 40,        // Many secrets in the void
      movementCost: 1.5,          // Hard to navigate
      initiativeModifier: -10,
      evasionModifier: 0.15,      // Hard to hit what you can't see
      hazard: {
        type: 'DAMAGE',
        value: 15,                // Void damage
        chance: 0.20,
        affectsPlayer: true,
        affectsEnemy: true,
      }
    }
  },
};

// ============================================================================
// BIOME-TERRAIN MAPPING
// Which terrains are available in each story arc
// ============================================================================
export const BIOME_TERRAINS: Record<string, TerrainType[]> = {
  ACADEMY_ARC: [
    TerrainType.OPEN_GROUND,
    TerrainType.ROOFTOPS,
    TerrainType.TRAINING_FIELD,
    TerrainType.ALLEYWAY,
  ],
  WAVES_ARC: [
    TerrainType.FOG_BANK,
    TerrainType.BRIDGE,
    TerrainType.WATER_SURFACE,
    TerrainType.SHORELINE,
  ],
  EXAMS_ARC: [
    TerrainType.DENSE_FOLIAGE,
    TerrainType.TREE_CANOPY,
    TerrainType.SWAMP,
    TerrainType.GIANT_ROOTS,
  ],
  ROGUE_ARC: [
    TerrainType.WATERFALL,
    TerrainType.CLIFF_EDGE,
    TerrainType.STONE_PILLARS,
    TerrainType.RAPIDS,
  ],
  WAR_ARC: [
    TerrainType.ROOT_NETWORK,
    TerrainType.CORRUPTED_ZONE,
    TerrainType.CHAKRA_NEXUS,
    TerrainType.VOID_SPACE,
  ],
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get terrain definition by type
 */
export function getTerrain(type: TerrainType): TerrainDefinition {
  return TERRAIN_DEFINITIONS[type];
}

/**
 * Get random terrain for a given arc
 */
export function getRandomTerrainForArc(arcName: string): TerrainType {
  const terrains = BIOME_TERRAINS[arcName] || BIOME_TERRAINS.ACADEMY_ARC;
  return terrains[Math.floor(Math.random() * terrains.length)];
}

/**
 * Check if a terrain amplifies a specific element
 */
export function getElementAmplification(terrain: TerrainType, element: ElementType): number {
  const def = TERRAIN_DEFINITIONS[terrain];
  if (def.effects.elementAmplify === element || terrain === TerrainType.CHAKRA_NEXUS) {
    return (def.effects.elementAmplifyPercent || 25) / 100;
  }
  return 0;
}
