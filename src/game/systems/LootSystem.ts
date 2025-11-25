import {
  Item,
  Skill,
  ItemSlot,
  Rarity,
  ItemStatBonus,
  SkillTier,
  Player
} from '../types';
import { BASE_ITEM_NAMES, SKILLS } from '../constants';

const generateId = () => Math.random().toString(36).substring(2, 9);

export const generateItem = (currentFloor: number, diff: number, guaranteedRarity?: Rarity): Item => {
  const slots = [ItemSlot.WEAPON, ItemSlot.HEAD, ItemSlot.BODY, ItemSlot.ACCESSORY];
  const slot = slots[Math.floor(Math.random() * slots.length)];
  const luckFactor = (currentFloor * 0.002) + (diff * 0.0025);

  let rarity = Rarity.COMMON;
  if (guaranteedRarity) {
    rarity = guaranteedRarity;
  } else {
    const roll = Math.random();
    if (roll < 0.005 + luckFactor) rarity = Rarity.LEGENDARY;
    else if (roll < 0.05 + luckFactor) rarity = Rarity.EPIC;
    else if (roll < 0.20 + luckFactor) rarity = Rarity.RARE;
  }

  const rarityMult = { [Rarity.COMMON]: 1, [Rarity.RARE]: 1.8, [Rarity.EPIC]: 3.5, [Rarity.LEGENDARY]: 6, [Rarity.CURSED]: 1 };
  const qualityRoll = 0.8 + (Math.random() * 0.4) + (diff * 0.005);
  const floorScaling = 1 + (currentFloor * 0.1);
  const finalMult = floorScaling * rarityMult[rarity] * qualityRoll;

  let prefix = "";
  if (qualityRoll > 1.4) prefix = "Pristine ";
  else if (qualityRoll < 0.9) prefix = "Rusty ";
  else if (rarity === Rarity.LEGENDARY) prefix = "Sage's ";

  const baseName = BASE_ITEM_NAMES[slot][Math.floor(Math.random() * BASE_ITEM_NAMES[slot].length)];
  const mainStatVal = Math.floor((3 + Math.random() * 4) * finalMult);
  const subStatVal = Math.floor((1 + Math.random() * 2) * finalMult);

  const stats: ItemStatBonus = {};
  switch (slot) {
    case ItemSlot.WEAPON:
      stats.strength = mainStatVal;
      stats.accuracy = subStatVal;
      if (Math.random() > 0.7) stats.dexterity = Math.floor(subStatVal * 0.8);
      break;
    case ItemSlot.HEAD:
      stats.calmness = mainStatVal;
      stats.intelligence = subStatVal;
      if (Math.random() > 0.5) stats.spirit = Math.floor(subStatVal * 0.6);
      break;
    case ItemSlot.BODY:
      stats.willpower = mainStatVal;
      stats.strength = Math.floor(subStatVal * 0.8);
      if (Math.random() > 0.6) stats.flatHp = Math.floor(mainStatVal * 8);
      break;
    case ItemSlot.ACCESSORY:
      if (Math.random() > 0.5) {
        stats.speed = mainStatVal;
        stats.chakra = subStatVal;
      } else {
        stats.spirit = mainStatVal;
        stats.dexterity = subStatVal;
      }
      break;
  }

  return {
    id: generateId(),
    name: `${prefix}${rarity !== Rarity.COMMON ? rarity + ' ' : ''}${baseName}`,
    type: slot,
    rarity,
    value: Math.floor(mainStatVal * 30),
    stats
  };
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

export const equipItem = (player: Player, item: Item): Player => {
  const newEquip = { ...player.equipment, [item.type]: item };
  return { ...player, equipment: newEquip };
};

export const sellItem = (player: Player, item: Item): Player => {
  const val = Math.floor(item.value * 0.6);
  return { ...player, ryo: player.ryo + val };
};
