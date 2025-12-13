import { Player, Clan, EquipmentSlot, TreasureQuality, DEFAULT_MERCHANT_SLOTS, MAX_BAG_SLOTS } from '../types';
import { CLAN_STATS, CLAN_START_SKILL, CLAN_GROWTH, SKILLS, getClanStartingSkills } from '../constants';
import { calculateDerivedStats, getPlayerFullStats } from '../systems/StatSystem';

/**
 * Create a new player with starting stats for the given clan
 * Uses the full Jutsu Card System loadout with MAIN, SIDE, TOGGLE, and PASSIVE skills
 */
export const createPlayer = (clan: Clan): Player => {
  const baseStats = CLAN_STATS[clan];
  const startingSkills = getClanStartingSkills(clan);
  const derived = calculateDerivedStats(baseStats, {});

  // Initialize skills with level 1
  const skills = startingSkills.map(skill => ({ ...skill, level: 1 }));

  return {
    clan,
    level: 1,
    exp: 0,
    maxExp: 100,
    primaryStats: { ...baseStats },
    currentHp: derived.maxHp,
    currentChakra: derived.maxChakra,
    element: clan === Clan.UCHIHA ? 'Fire' : clan === Clan.UZUMAKI ? 'Wind' : 'Physical' as any,
    ryo: 100,
    equipment: {
      [EquipmentSlot.SLOT_1]: null,
      [EquipmentSlot.SLOT_2]: null,
      [EquipmentSlot.SLOT_3]: null,
      [EquipmentSlot.SLOT_4]: null,
    },
    skills,
    activeBuffs: [],
    bag: Array(MAX_BAG_SLOTS).fill(null), // 12 fixed slots for components and artifacts
    // Progression systems
    treasureQuality: TreasureQuality.BROKEN,  // Start with broken quality drops
    merchantSlots: DEFAULT_MERCHANT_SLOTS,     // Start with 1 merchant slot
  };
};

/**
 * Process level up for the player, increasing stats and fully healing
 * Returns true if the player leveled up
 */
export const checkLevelUp = (player: Player, addLogFn: (text: string, type: string) => void): { updatedPlayer: Player; leveledUp: boolean } => {
  let currentPlayer = { ...player };
  let leveledUp = false;

  while (currentPlayer.exp >= currentPlayer.maxExp) {
    leveledUp = true;
    currentPlayer.exp -= currentPlayer.maxExp;
    currentPlayer.level += 1;
    currentPlayer.maxExp = currentPlayer.level * 100;

    const growth = CLAN_GROWTH[currentPlayer.clan];
    const s = currentPlayer.primaryStats;

    currentPlayer.primaryStats = {
      willpower: s.willpower + (growth.willpower || 0),
      chakra: s.chakra + (growth.chakra || 0),
      strength: s.strength + (growth.strength || 0),
      spirit: s.spirit + (growth.spirit || 0),
      intelligence: s.intelligence + (growth.intelligence || 0),
      calmness: s.calmness + (growth.calmness || 0),
      speed: s.speed + (growth.speed || 0),
      accuracy: s.accuracy + (growth.accuracy || 0),
      dexterity: s.dexterity + (growth.dexterity || 0)
    };
  }

  if (leveledUp) {
    const newStats = getPlayerFullStats(currentPlayer);
    currentPlayer.currentHp = newStats.derived.maxHp;
    currentPlayer.currentChakra = newStats.derived.maxChakra;
    addLogFn(`LEVEL UP! You reached Level ${currentPlayer.level}. Stats increased & Fully Healed!`, 'gain');
  }

  return { updatedPlayer: currentPlayer, leveledUp };
};

/**
 * Add experience to the player and check for level ups
 */
export const addExperience = (
  player: Player,
  amount: number,
  addLogFn: (text: string, type: string) => void
): Player => {
  const updatedPlayer = { ...player, exp: player.exp + amount };
  const { updatedPlayer: finalPlayer } = checkLevelUp(updatedPlayer, addLogFn);
  return finalPlayer;
};
