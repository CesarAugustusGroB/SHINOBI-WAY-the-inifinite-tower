export enum GameState {
  MENU,
  CHAR_SELECT,
  EXPLORE,
  COMBAT,
  LOOT,
  EVENT,
  GAME_OVER,
  VICTORY
}

export enum ElementType {
  FIRE = 'Fire',
  WIND = 'Wind',
  LIGHTNING = 'Lightning',
  EARTH = 'Earth',
  WATER = 'Water',
  PHYSICAL = 'Physical'
}

export enum Stat {
  HP = 'HP',
  CHAKRA = 'Chakra',
  STR = 'STR',
  INT = 'INT',
  SPD = 'SPD',
  DEF = 'DEF',
  GEN = 'GEN',
  ACC = 'ACC'
}

export enum Clan {
  UZUMAKI = 'Uzumaki',
  UCHIHA = 'Uchiha',
  HYUGA = 'Hyuga',
  LEE = 'Lee Disciple',
  YAMANAKA = 'Yamanaka'
}

export enum Rarity {
  COMMON = 'Common',
  RARE = 'Rare',
  EPIC = 'Epic',
  LEGENDARY = 'Legendary',
  CURSED = 'Cursed'
}

export enum SkillTier {
  COMMON = 'Common',
  RARE = 'Rare',
  EPIC = 'Epic',
  LEGENDARY = 'Legendary',
  FORBIDDEN = 'Forbidden'
}

export enum ItemSlot {
  WEAPON = 'Weapon',
  HEAD = 'Head',
  BODY = 'Body',
  ACCESSORY = 'Accessory'
}

export interface Attributes {
  hp: number;
  maxHp: number;
  chakra: number;
  maxChakra: number;
  str: number;
  int: number;
  spd: number;
  def: number;
  gen: number;
  acc: number;
}

export enum EffectType {
    STUN = 'Stun',
    DOT = 'DoT', // Damage over time
    BUFF = 'Buff', // Stat increase
    DEBUFF = 'Debuff', // Stat decrease
    HEAL = 'Heal',
    DRAIN = 'Drain',
    CONFUSION = 'Confusion', // Chance to hit self
    SILENCE = 'Silence' // Cannot use skills
}

export interface EffectDefinition {
    type: EffectType;
    value?: number; // Damage amount or Stat multiplier (e.g. 0.2 for 20%)
    duration: number; // Turns
    targetStat?: Stat; // For Buff/Debuff
    chance: number; // 0-1 (1 = 100%)
}

export interface Skill {
  id: string;
  name: string;
  tier: SkillTier;
  description: string;
  chakraCost: number;
  hpCost: number;
  cooldown: number;
  currentCooldown: number;
  damageMult: number;
  scalingStat: Stat;
  element: ElementType;
  isToggle?: boolean;
  isActive?: boolean;
  upkeepCost?: number; // Chakra per turn if toggle
  effects?: EffectDefinition[];
  critBonus?: number; // Extra % chance to crit
  level?: number;
}

export interface Item {
  id: string;
  name: string;
  type: ItemSlot;
  rarity: Rarity;
  stats: Partial<Attributes>;
  value: number;
  description?: string;
}

export interface Buff {
  id: string;
  name: string;
  duration: number;
  effect: EffectDefinition;
  source: string;
}

export interface Player {
  clan: Clan;
  level: number;
  exp: number;
  maxExp: number;
  stats: Attributes;
  element: ElementType;
  ryo: number;
  equipment: Record<ItemSlot, Item | null>;
  skills: Skill[];
  activeBuffs: Buff[];
}

export interface Enemy {
  name: string;
  tier: string;
  stats: Attributes;
  element: ElementType;
  skills: Skill[];
  isBoss?: boolean;
  image?: string;
  dropRateBonus?: number;
  activeBuffs: Buff[];
}

export interface LogEntry {
  id: number;
  text: string;
  type: 'info' | 'combat' | 'loot' | 'danger' | 'gain' | 'event';
  details?: string;
}

export interface EventChoice {
    label: string;
    type: 'HEAL_HP' | 'HEAL_CHAKRA' | 'HEAL_ALL' | 'GAMBLE_HP' | 'FIGHT_GHOST' | 'TRADE' | 'LEAVE' | 'TRAP_DMG' | 'GAIN_XP' | 'CHALLENGE_GUARDIAN';
    value?: number; // Cost, Dmg, or percent
    chance?: number; // 0-1
    description?: string;
}

export interface GameEventDefinition {
    id: string;
    title: string;
    description: string;
    choices: EventChoice[];
}

export interface Room {
  type: 'COMBAT' | 'ELITE' | 'BOSS' | 'EVENT' | 'REST' | 'AMBUSH';
  description: string;
  enemy?: Enemy;
  eventDefinition?: GameEventDefinition;
}