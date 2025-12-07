import {
  Item,
  Skill,
  EquipmentSlot,
  ComponentId,
  Rarity,
  ItemStatBonus,
  SkillTier,
  Player,
  DISASSEMBLE_RETURN_RATE,
  MAX_BAG_SLOTS,
  SLOT_MAPPING
} from '../types';
import { SKILLS } from '../constants';
import { COMPONENT_DEFINITIONS, COMPONENT_DROP_WEIGHTS, getTotalDropWeight } from '../constants/components';
import { findRecipe, SYNTHESIS_RECIPES } from '../constants/synthesis';
import { BALANCE } from '../config';

const generateId = () => Math.random().toString(36).substring(2, 9);

/**
 * Cap stats to maximum of 2, keeping the highest values
 * Used for artifacts to limit stat bonuses
 */
const capStatsToTwo = (stats: ItemStatBonus): ItemStatBonus => {
  const entries = Object.entries(stats).filter(([, v]) => v !== undefined && v !== 0);

  if (entries.length <= 2) return stats;

  // Sort by value descending, take top 2
  const topTwo = entries
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .slice(0, 2);

  return Object.fromEntries(topTwo) as ItemStatBonus;
};

export const generateSkillLoot = (enemyTier: string, currentFloor: number): Skill | null => {
  let possibleTiers: SkillTier[] = [SkillTier.COMMON];
  if (enemyTier === 'Chunin') possibleTiers = [SkillTier.COMMON, SkillTier.RARE];
  else if (enemyTier === 'Jonin') possibleTiers = [SkillTier.RARE, SkillTier.EPIC];
  else if (enemyTier === 'Akatsuki' || enemyTier === 'Kage Level' || enemyTier.includes('S-Rank')) possibleTiers = [SkillTier.EPIC, SkillTier.LEGENDARY];
  else if (enemyTier === 'Guardian') possibleTiers = [SkillTier.FORBIDDEN];

  const candidates = Object.values(SKILLS).filter(s => possibleTiers.includes(s.tier));
  if (candidates.length === 0) return SKILLS.SHURIKEN;
  return candidates[Math.floor(Math.random() * candidates.length)];
};

/**
 * Generate a skill for scroll discovery based on floor depth
 * Higher floors have better chances for higher tier skills
 */
export const generateSkillForFloor = (floor: number): Skill => {
  let possibleTiers: SkillTier[];

  if (floor <= 3) {
    possibleTiers = [SkillTier.COMMON];
  } else if (floor <= 7) {
    possibleTiers = [SkillTier.COMMON, SkillTier.RARE];
  } else if (floor <= 12) {
    possibleTiers = [SkillTier.RARE, SkillTier.EPIC];
  } else if (floor <= 18) {
    possibleTiers = [SkillTier.EPIC, SkillTier.LEGENDARY];
  } else {
    possibleTiers = [SkillTier.LEGENDARY, SkillTier.FORBIDDEN];
  }

  const candidates = Object.values(SKILLS).filter(s => possibleTiers.includes(s.tier));
  if (candidates.length === 0) return SKILLS.SHURIKEN;
  return candidates[Math.floor(Math.random() * candidates.length)];
};

/**
 * Equip an item to a specific slot or auto-assign based on legacy type
 * @param player - The player to equip the item on
 * @param item - The item to equip
 * @param targetSlot - Optional specific slot to equip to (overrides auto-assignment)
 */
export const equipItem = (player: Player, item: Item, targetSlot?: EquipmentSlot): Player => {
  let slotToUse: EquipmentSlot;

  if (targetSlot) {
    // Use the explicitly specified slot
    slotToUse = targetSlot;
  } else if (item.type) {
    // Map legacy ItemSlot to EquipmentSlot
    slotToUse = SLOT_MAPPING[item.type];
  } else {
    // For components/artifacts without a type, find first empty slot or use SLOT_1
    const emptySlot = Object.values(EquipmentSlot).find(
      slot => player.equipment[slot] === null
    );
    slotToUse = emptySlot || EquipmentSlot.SLOT_1;
  }

  const newEquip = { ...player.equipment, [slotToUse]: item };
  return { ...player, equipment: newEquip };
};

export const sellItem = (player: Player, item: Item): Player => {
  const val = Math.floor(item.value * 0.6);
  return { ...player, ryo: player.ryo + val };
};

// ============================================================================
// SYNTHESIS SYSTEM - Component Generation & Crafting
// ============================================================================

/**
 * Weighted random selection of a component type
 * Excludes Hashirama Cell (weight 0) from normal drops
 */
function weightedRandomComponent(): ComponentId {
  const totalWeight = getTotalDropWeight();
  let roll = Math.random() * totalWeight;

  for (const [id, weight] of Object.entries(COMPONENT_DROP_WEIGHTS) as [ComponentId, number][]) {
    roll -= weight;
    if (roll <= 0) return id;
  }

  return ComponentId.NINJA_STEEL; // Fallback
}

/**
 * Generate a component item that drops from enemies
 * Components scale with floor level like regular items
 */
export const generateComponent = (currentFloor: number, difficulty: number): Item => {
  const componentId = weightedRandomComponent();
  const def = COMPONENT_DEFINITIONS[componentId];

  // Scale value based on floor (similar to regular item scaling)
  const floorScaling = 1 + (currentFloor * BALANCE.FLOOR_SCALING);
  const qualityRoll = 0.9 + (Math.random() * 0.3); // 0.9 to 1.2
  const statValue = Math.floor(def.baseValue * floorScaling * qualityRoll);

  return {
    id: generateId(),
    name: def.name,
    rarity: Rarity.COMMON, // Components are always common rarity
    stats: { [def.primaryStat]: statValue },
    value: statValue * 15,
    description: def.description,
    isComponent: true,
    componentId,
    icon: def.icon,
  };
};

/**
 * Generate loot from combat - 100% components
 * This is the main drop function for post-combat rewards
 */
export const generateLoot = (currentFloor: number, difficulty: number): Item => {
  return generateComponent(currentFloor, difficulty);
};

/**
 * Generate a random artifact (for rare drops or special events)
 * Picks a random recipe and creates the artifact with floor-scaled stats
 */
export const generateRandomArtifact = (currentFloor: number, difficulty: number): Item => {
  const recipe = SYNTHESIS_RECIPES[Math.floor(Math.random() * SYNTHESIS_RECIPES.length)];
  const [compIdA, compIdB] = recipe.recipe;
  const defA = COMPONENT_DEFINITIONS[compIdA];
  const defB = COMPONENT_DEFINITIONS[compIdB];

  // Generate base stats from both components
  const floorScaling = 1 + (currentFloor * BALANCE.FLOOR_SCALING);
  const statValueA = Math.floor(defA.baseValue * floorScaling);
  const statValueB = Math.floor(defB.baseValue * floorScaling);

  // Combine stats
  const combinedStats: ItemStatBonus = {
    [defA.primaryStat]: statValueA,
    [defB.primaryStat]: (defA.primaryStat === defB.primaryStat)
      ? statValueA + statValueB
      : statValueB,
  };

  // Add recipe bonus stats
  if (recipe.bonusStats) {
    for (const [key, val] of Object.entries(recipe.bonusStats)) {
      if (val !== undefined) {
        combinedStats[key as keyof ItemStatBonus] =
          (combinedStats[key as keyof ItemStatBonus] || 0) + val;
      }
    }
  }

  // Cap to maximum 2 stat bonuses
  const cappedStats = capStatsToTwo(combinedStats);

  const baseValue = (statValueA + statValueB) * 15;

  return {
    id: generateId(),
    name: recipe.name,
    rarity: Rarity.EPIC, // All synthesized artifacts are Epic
    stats: cappedStats,
    value: baseValue * 2, // Artifacts are worth more
    description: recipe.description,
    isComponent: false,
    recipe: recipe.recipe,
    passive: recipe.passive,
    icon: recipe.icon,
  };
};

/**
 * Synthesize two components into an artifact
 * Returns null if the combination is invalid
 */
export const synthesize = (componentA: Item, componentB: Item): Item | null => {
  // Both items must be components
  if (!componentA.isComponent || !componentB.isComponent) return null;
  if (!componentA.componentId || !componentB.componentId) return null;

  // Find matching recipe
  const recipe = findRecipe(componentA.componentId, componentB.componentId);
  if (!recipe) return null;

  // Combine stats from both components
  const combinedStats: ItemStatBonus = {};

  // Add stats from component A
  for (const key of Object.keys(componentA.stats) as (keyof ItemStatBonus)[]) {
    combinedStats[key] = (combinedStats[key] || 0) + (componentA.stats[key] || 0);
  }

  // Add stats from component B
  for (const key of Object.keys(componentB.stats) as (keyof ItemStatBonus)[]) {
    combinedStats[key] = (combinedStats[key] || 0) + (componentB.stats[key] || 0);
  }

  // Add recipe bonus stats
  if (recipe.bonusStats) {
    for (const key of Object.keys(recipe.bonusStats) as (keyof ItemStatBonus)[]) {
      const val = recipe.bonusStats[key];
      if (val !== undefined) {
        combinedStats[key] = (combinedStats[key] || 0) + val;
      }
    }
  }

  // Cap to maximum 2 stat bonuses
  const cappedStats = capStatsToTwo(combinedStats);

  return {
    id: generateId(),
    name: recipe.name,
    rarity: Rarity.EPIC, // All synthesized artifacts are Epic
    stats: cappedStats,
    value: (componentA.value + componentB.value) * 2,
    description: recipe.description,
    isComponent: false,
    recipe: recipe.recipe,
    passive: recipe.passive,
    icon: recipe.icon,
  };
};

/**
 * Disassemble an artifact back into its component materials
 * Returns 50% of the artifact's value split between two components
 * Returns null if the item cannot be disassembled
 */
export const disassemble = (artifact: Item): Item[] | null => {
  // Can only disassemble artifacts (not components or legacy items)
  if (artifact.isComponent || !artifact.recipe) return null;

  const [compIdA, compIdB] = artifact.recipe;
  const defA = COMPONENT_DEFINITIONS[compIdA];
  const defB = COMPONENT_DEFINITIONS[compIdB];

  // Return value is 50% of artifact value, split between components
  const returnValue = Math.floor(artifact.value * DISASSEMBLE_RETURN_RATE);
  const valuePerComponent = Math.floor(returnValue / 2);

  // Estimate stat values from returned value
  const statValue = Math.floor(valuePerComponent / 15);

  return [
    {
      id: generateId(),
      name: defA.name,
      rarity: Rarity.COMMON,
      stats: { [defA.primaryStat]: statValue },
      value: valuePerComponent,
      description: defA.description,
      isComponent: true,
      componentId: compIdA,
      icon: defA.icon,
    },
    {
      id: generateId(),
      name: defB.name,
      rarity: Rarity.COMMON,
      stats: { [defB.primaryStat]: statValue },
      value: valuePerComponent,
      description: defB.description,
      isComponent: true,
      componentId: compIdB,
      icon: defB.icon,
    },
  ];
};

/**
 * Grant a Hashirama Cell (special event only)
 * This component never drops naturally
 */
export const grantHashiramaCell = (currentFloor: number): Item => {
  const def = COMPONENT_DEFINITIONS[ComponentId.HASHIRAMA_CELL];
  const floorScaling = 1 + (currentFloor * BALANCE.FLOOR_SCALING);

  return {
    id: generateId(),
    name: def.name,
    rarity: Rarity.LEGENDARY, // Special rarity for this rare component
    stats: { [def.primaryStat]: Math.floor(def.baseValue * floorScaling * 1.5) },
    value: 500, // High base value
    description: def.description,
    isComponent: true,
    componentId: ComponentId.HASHIRAMA_CELL,
    icon: def.icon,
  };
};

/**
 * Add a component to the player's bag
 * Returns updated player or null if bag is full
 */
export const addToBag = (player: Player, item: Item): Player | null => {
  if (player.componentBag.length >= MAX_BAG_SLOTS) {
    return null; // Bag is full
  }

  return {
    ...player,
    componentBag: [...player.componentBag, item],
  };
};

/**
 * Remove a component from the player's bag by ID
 */
export const removeFromBag = (player: Player, itemId: string): Player => {
  return {
    ...player,
    componentBag: player.componentBag.filter(item => item.id !== itemId),
  };
};

/**
 * Check if the player's bag has space
 */
export const hasBagSpace = (player: Player): boolean => {
  return player.componentBag.length < MAX_BAG_SLOTS;
};
