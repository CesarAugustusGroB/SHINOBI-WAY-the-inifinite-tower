import { Player, SupplyType } from '../types';
import { RESOURCE_CONSTANTS } from '../constants';

/**
 * Use a supply item and apply its effects to the player
 */
export const useSupply = (
  player: Player,
  supplyType: SupplyType,
  playerStats: any, // DerivedStats
): Player | null => {
  if (!player || player.resources.supplies <= 0) {
    return null;
  }

  const updated = { ...player };
  updated.resources = { ...player.resources };
  updated.resources.supplies -= 1;

  switch (supplyType) {
    case SupplyType.RATIONS:
      // Restore hunger
      updated.resources.hunger = Math.min(
        100,
        updated.resources.hunger + RESOURCE_CONSTANTS.RATIONS_HUNGER_RESTORE,
      );
      break;

    case SupplyType.BANDAGES:
      // Restore % of max HP
      const hpRestore = Math.floor(
        playerStats.derived.maxHp * RESOURCE_CONSTANTS.BANDAGES_HP_RESTORE_PERCENT,
      );
      updated.currentHp = Math.min(playerStats.derived.maxHp, updated.currentHp + hpRestore);
      break;

    case SupplyType.CHAKRA_PILLS:
      // Restore % of max Chakra
      const chakraRestore = Math.floor(
        playerStats.derived.maxChakra * RESOURCE_CONSTANTS.CHAKRA_PILLS_CHAKRA_RESTORE_PERCENT,
      );
      updated.currentChakra = Math.min(
        playerStats.derived.maxChakra,
        updated.currentChakra + chakraRestore,
      );
      break;

    case SupplyType.STAMINA_TONIC:
      // Reduce fatigue
      updated.resources.fatigue = Math.max(
        0,
        updated.resources.fatigue - RESOURCE_CONSTANTS.STAMINA_TONIC_FATIGUE_REDUCTION,
      );
      break;
  }

  return updated;
};

/**
 * Add supplies to player inventory
 */
export const addSupply = (
  player: Player,
  supplyType: SupplyType,
  amount: number = 1,
): Player => {
  const updated = { ...player };
  updated.resources = { ...player.resources };

  const newTotal = Math.min(
    RESOURCE_CONSTANTS.MAX_SUPPLIES,
    updated.resources.supplies + amount,
  );
  updated.resources.supplies = newTotal;

  return updated;
};

/**
 * Get the name and description of a supply item
 */
export const getSupplyInfo = (supplyType: SupplyType): { name: string; description: string } => {
  const info: Record<SupplyType, { name: string; description: string }> = {
    [SupplyType.RATIONS]: {
      name: 'Rations',
      description: `Restores ${RESOURCE_CONSTANTS.RATIONS_HUNGER_RESTORE} Hunger`,
    },
    [SupplyType.BANDAGES]: {
      name: 'Bandages',
      description: `Restores ${RESOURCE_CONSTANTS.BANDAGES_HP_RESTORE_PERCENT * 100}% Max HP`,
    },
    [SupplyType.CHAKRA_PILLS]: {
      name: 'Chakra Pills',
      description: `Restores ${RESOURCE_CONSTANTS.CHAKRA_PILLS_CHAKRA_RESTORE_PERCENT * 100}% Max Chakra`,
    },
    [SupplyType.STAMINA_TONIC]: {
      name: 'Stamina Tonic',
      description: `Reduces Fatigue by ${RESOURCE_CONSTANTS.STAMINA_TONIC_FATIGUE_REDUCTION}`,
    },
  };

  return info[supplyType] || { name: 'Unknown', description: 'Unknown supply' };
};

/**
 * Get all supply types
 */
export const getAllSupplyTypes = (): SupplyType[] => {
  return [SupplyType.RATIONS, SupplyType.BANDAGES, SupplyType.CHAKRA_PILLS, SupplyType.STAMINA_TONIC];
};

/**
 * Generate a random supply drop (used for events)
 */
export const generateSupplyDrop = (): SupplyType => {
  const supplies = getAllSupplyTypes();
  return supplies[Math.floor(Math.random() * supplies.length)];
};

/**
 * Check if a player can use a supply (has supplies available)
 */
export const canUseSupply = (player: Player): boolean => {
  return player.resources.supplies > 0;
};

/**
 * Get cost of buying a supply from a merchant
 */
export const getSupplyCost = (): number => {
  return RESOURCE_CONSTANTS.SUPPLY_SHOP_COST;
};
