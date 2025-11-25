import { Player, Clan } from '../types';
import { CLAN_STATS, CLAN_START_SKILL, CLAN_GROWTH, SKILLS } from '../constants';
import { calculateDerivedStats, getPlayerFullStats } from '../systems/StatSystem';

/**
 * Create a new player with starting stats for the given clan
 */
export const createPlayer = (clan: Clan): Player => {
  const baseStats = CLAN_STATS[clan];
  const startSkill = CLAN_START_SKILL[clan];
  const derived = calculateDerivedStats(baseStats, {});

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
    equipment: { WEAPON: null, HEAD: null, BODY: null, ACCESSORY: null } as any,
    skills: [SKILLS.BASIC_ATTACK, SKILLS.SHURIKEN, { ...startSkill, level: 1 }],
    activeBuffs: []
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
