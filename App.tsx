import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  GameState, Player, Clan, Skill, Enemy, LogEntry, 
  Room, Item, ItemSlot, Rarity, ElementType, GameEventDefinition, 
  EffectType, Buff, EffectDefinition, SkillTier, PrimaryAttributes,
  DerivedStats, DamageType, DamageProperty, AttackMethod, PrimaryStat,
  ItemStatBonus
} from './types';
import { 
  CLAN_STATS, CLAN_START_SKILL, SKILLS, MAX_LOGS, ELEMENTAL_CYCLE, 
  BASE_ITEM_NAMES, BOSS_NAMES, AMBUSH_ENEMIES, EVENTS, CLAN_GROWTH, ENEMY_PREFIXES,
  getElementEffectiveness
} from './constants';
import {
  calculateDerivedStats,
  aggregateEquipmentBonuses,
  applyBuffsToPrimaryStats,
  getPlayerFullStats,
  getEnemyFullStats,
  calculateDamage,
  checkGuts,
  resistStatus,
  canLearnSkill,
  calculateDotDamage,
  formatPercent
} from './statCalculator';
import StatBar from './components/StatBar';
import GameLog from './components/GameLog';
import CharacterSheet from './components/CharacterSheet';
import Tooltip from './components/Tooltip';
import { 
  Sword, Shield, Skull, Heart, Ghost, HelpCircle, Flame, 
  Map as MapIcon, ArrowUpCircle, Scroll, Hourglass,
  Target, Zap, AlertTriangle
} from 'lucide-react';

type EnemyArchetype = 'TANK' | 'ASSASSIN' | 'BALANCED' | 'CASTER' | 'GENJUTSU';

const getStoryArc = (floor: number) => {
  if (floor <= 10) return { name: 'ACADEMY_ARC', label: 'Academy Graduation', biome: 'Village Hidden in the Leaves' };
  if (floor <= 25) return { name: 'WAVES_ARC', label: 'Land of Waves', biome: 'Mist Covered Bridge' };
  if (floor <= 50) return { name: 'EXAMS_ARC', label: 'Chunin Exams', biome: 'Forest of Death' };
  if (floor <= 75) return { name: 'ROGUE_ARC', label: 'Sasuke Retrieval', biome: 'Valley of the End' };
  return { name: 'WAR_ARC', label: 'Great Ninja War', biome: 'Divine Tree Roots' };
};

const generateId = () => Math.random().toString(36).substring(2, 9);

const App: React.FC = () => {
  // --- Core State ---
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [floor, setFloor] = useState(1);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [player, setPlayer] = useState<Player | null>(null);
  const [enemy, setEnemy] = useState<Enemy | null>(null);
  const [roomChoices, setRoomChoices] = useState<Room[]>([]);
  const [droppedItems, setDroppedItems] = useState<Item[]>([]);
  const [droppedSkill, setDroppedSkill] = useState<Skill | null>(null);
  const [activeEvent, setActiveEvent] = useState<GameEventDefinition | null>(null);
  const [difficulty, setDifficulty] = useState<number>(20);
  const [turnState, setTurnState] = useState<'PLAYER' | 'ENEMY_TURN'>('PLAYER');


  // --- Helpers ---
  const addLog = useCallback((text: string, type: LogEntry['type'] = 'info', details?: string) => {
    setLogs(prev => {
      const newEntry: LogEntry = { id: Date.now() + Math.random(), text, type, details };
      const newLogs = [...prev, newEntry];
      if (newLogs.length > MAX_LOGS) newLogs.shift();
      return newLogs;
    });
  }, []);

  // --- Player Stats Computation ---
  const playerStats = useMemo(() => {
    if (!player) return null;
    return getPlayerFullStats(player);
  }, [player]);

  // --- Enemy Stats Computation ---
  const enemyStats = useMemo(() => {
    if (!enemy) return null;
    return getEnemyFullStats(enemy);
  }, [enemy]);

  // --- Buff Description Helper ---
  const getBuffDescription = (buff: Buff) => {
    const { type, value, targetStat } = buff.effect;
    switch (type) {
      case EffectType.STUN: return "Cannot perform any actions.";
      case EffectType.DOT: case EffectType.BLEED: case EffectType.BURN: case EffectType.POISON:
        return `Takes ${value} damage at the start of each turn.`;
      case EffectType.BUFF: return `${targetStat} increased by ${Math.round((value || 0) * 100)}%.`;
      case EffectType.DEBUFF: return `${targetStat} decreased by ${Math.round((value || 0) * 100)}%.`;
      case EffectType.CONFUSION: return "50% chance to hurt self in confusion.";
      case EffectType.SILENCE: return "Cannot use skills with chakra cost.";
      case EffectType.CHAKRA_DRAIN: return `Drains ${value} chakra per turn.`;
      default: return buff.name;
    }
  };

  // --- Level Up Check ---
  const checkLevelUp = (p: Player): Player => {
    let currentPlayer = { ...p };
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
      addLog(`LEVEL UP! You reached Level ${currentPlayer.level}. Stats increased & Fully Healed!`, 'gain');
    }
    return currentPlayer;
  };

  // --- Enemy Generator ---
  const generateEnemy = (currentFloor: number, type: 'NORMAL' | 'ELITE' | 'BOSS' | 'AMBUSH', diff: number): Enemy => {
    const arc = getStoryArc(currentFloor);
    const floorMult = 1 + (currentFloor * 0.08);
    const diffMult = 0.75 + (diff / 100);
    const totalScaling = floorMult * diffMult;

    if (type === 'BOSS') {
      const bossData = BOSS_NAMES[currentFloor as keyof typeof BOSS_NAMES] || { name: 'Edo Tensei Legend', element: ElementType.FIRE, skill: SKILLS.RASENGAN };
      const bossStats: PrimaryAttributes = {
        willpower: Math.floor(40 * totalScaling),
        chakra: Math.floor(30 * totalScaling),
        strength: Math.floor(25 * totalScaling),
        spirit: Math.floor(25 * totalScaling),
        intelligence: Math.floor(20 * totalScaling),
        calmness: Math.floor(18 * totalScaling),
        speed: Math.floor(18 * totalScaling),
        accuracy: Math.floor(15 * totalScaling),
        dexterity: Math.floor(15 * totalScaling)
      };
      const derived = calculateDerivedStats(bossStats, {});
      return {
        name: bossData.name,
        tier: 'Kage Level',
        element: bossData.element,
        isBoss: true,
        skills: [SKILLS.BASIC_ATTACK, SKILLS.FIREBALL, bossData.skill],
        primaryStats: bossStats,
        currentHp: derived.maxHp,
        currentChakra: derived.maxChakra,
        dropRateBonus: 50 + diff,
        activeBuffs: []
      };
    }

    let archetype: EnemyArchetype = 'BALANCED';
    if (type === 'AMBUSH') archetype = 'ASSASSIN';
    else if (type === 'ELITE') archetype = Math.random() > 0.5 ? 'TANK' : 'CASTER';
    else archetype = ['TANK', 'ASSASSIN', 'BALANCED', 'CASTER', 'GENJUTSU'][Math.floor(Math.random() * 5)] as EnemyArchetype;

    let baseStats: PrimaryAttributes;
    switch (archetype) {
      case 'TANK':
        baseStats = { willpower: 22, chakra: 10, strength: 18, spirit: 8, intelligence: 8, calmness: 12, speed: 8, accuracy: 8, dexterity: 8 };
        break;
      case 'ASSASSIN':
        baseStats = { willpower: 10, chakra: 12, strength: 16, spirit: 8, intelligence: 10, calmness: 8, speed: 22, accuracy: 14, dexterity: 18 };
        break;
      case 'CASTER':
        baseStats = { willpower: 10, chakra: 18, strength: 6, spirit: 22, intelligence: 16, calmness: 10, speed: 12, accuracy: 10, dexterity: 10 };
        break;
      case 'GENJUTSU':
        baseStats = { willpower: 10, chakra: 16, strength: 6, spirit: 12, intelligence: 18, calmness: 22, speed: 10, accuracy: 8, dexterity: 12 };
        break;
      default:
        baseStats = { willpower: 14, chakra: 12, strength: 12, spirit: 12, intelligence: 12, calmness: 12, speed: 12, accuracy: 12, dexterity: 12 };
    }

    const scaledStats: PrimaryAttributes = {
      willpower: Math.floor(baseStats.willpower * totalScaling),
      chakra: Math.floor(baseStats.chakra * totalScaling),
      strength: Math.floor(baseStats.strength * totalScaling),
      spirit: Math.floor(baseStats.spirit * totalScaling),
      intelligence: Math.floor(baseStats.intelligence * totalScaling),
      calmness: Math.floor(baseStats.calmness * totalScaling),
      speed: Math.floor(baseStats.speed * totalScaling),
      accuracy: Math.floor(baseStats.accuracy * totalScaling),
      dexterity: Math.floor(baseStats.dexterity * totalScaling)
    };

     let name = "";
    let skills = [SKILLS.BASIC_ATTACK];
    const elements = Object.values(ElementType).filter(e => e !== ElementType.MENTAL && e !== ElementType.PHYSICAL);
    let enemyElement: ElementType = elements[Math.floor(Math.random() * elements.length)];
    if (type === 'AMBUSH') {
      const template = AMBUSH_ENEMIES[Math.floor(Math.random() * AMBUSH_ENEMIES.length)];
      name = template.name;
      enemyElement = template.element;
      skills.push(template.skill);
    } else {
      let namePool = ENEMY_PREFIXES.NORMAL;
      if (arc.name === 'WAVES_ARC') namePool = ['Mist', 'Demon Brother', 'Mercenary'];
      else if (arc.name === 'EXAMS_ARC') namePool = ['Sand', 'Sound', 'Rain', 'Grass'];
      else if (arc.name === 'ROGUE_ARC') namePool = ['Sound Four', 'Curse Mark', 'Rogue'];
      else if (arc.name === 'WAR_ARC') namePool = ['Reanimated', 'White Zetsu', 'Masked'];
      else if (diff > 75) namePool = ENEMY_PREFIXES.DEADLY;
      else if (diff > 40) namePool = ENEMY_PREFIXES.STRONG;
      else if (diff < 10) namePool = ENEMY_PREFIXES.WEAK;
      
      const prefix = namePool[Math.floor(Math.random() * namePool.length)];
      const job = ['Ninja', 'Samurai', 'Puppeteer', 'Monk'][Math.floor(Math.random() * 4)];
      name = `${prefix} ${job}`;

      if (archetype === 'CASTER') skills.push(SKILLS.FIREBALL);
      else if (archetype === 'ASSASSIN') skills.push(SKILLS.SHURIKEN);
      else if (archetype === 'GENJUTSU') skills.push(SKILLS.HELL_VIEWING);
      if (diff > 50 && Math.random() < 0.3) skills.push(SKILLS.RASENGAN);
    }

    const isElite = type === 'ELITE' || type === 'AMBUSH';
    if (isElite) {
      scaledStats.willpower = Math.floor(scaledStats.willpower * 1.4);
      scaledStats.strength = Math.floor(scaledStats.strength * 1.3);
      scaledStats.spirit = Math.floor(scaledStats.spirit * 1.3);
    }

    const derived = calculateDerivedStats(scaledStats, {});

    return {
      name,
      tier: isElite ? (type === 'AMBUSH' ? 'S-Rank Rogue' : 'Jonin') : 'Chunin',
      element: enemyElement,
      skills,
      primaryStats: scaledStats,
      currentHp: derived.maxHp,
      currentChakra: derived.maxChakra,
      activeBuffs: []
    };
  };

  // --- Item Generator ---
  const generateItem = (currentFloor: number, diff: number, guaranteedRarity?: Rarity): Item => {
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

  // --- Skill Loot Generator ---
  const generateSkillLoot = (enemyTier: string, currentFloor: number): Skill | null => {
    let possibleTiers: SkillTier[] = [SkillTier.COMMON];
    if (enemyTier === 'Chunin') possibleTiers = [SkillTier.COMMON, SkillTier.RARE];
    else if (enemyTier === 'Jonin') possibleTiers = [SkillTier.RARE, SkillTier.EPIC];
    else if (enemyTier === 'Akatsuki' || enemyTier === 'Kage Level' || enemyTier.includes('S-Rank')) possibleTiers = [SkillTier.EPIC, SkillTier.LEGENDARY];
    else if (enemyTier === 'Guardian') possibleTiers = [SkillTier.FORBIDDEN];
    const candidates = Object.values(SKILLS).filter(s => possibleTiers.includes(s.tier));
    if (candidates.length === 0) return SKILLS.SHURIKEN;
    return candidates[Math.floor(Math.random() * candidates.length)];
  };

  // --- Room Generator ---
  const generateRooms = (currentFloor: number, diff: number) => {
    const rooms: Room[] = [];
    const arc = getStoryArc(currentFloor);

    if (currentFloor % 10 === 0) {
      let bossDesc = "A terrifying chakra pressure crushes the air.";
      if (arc.name === 'ACADEMY_ARC') bossDesc = "A rogue sensei blocks your graduation.";
      else if (arc.name === 'WAVES_ARC') bossDesc = "The Mist Demon waits on the bridge.";
      else if (arc.name === 'EXAMS_ARC') bossDesc = "The Proctor blocks your path.";
      rooms.push({ type: 'BOSS', description: bossDesc, enemy: generateEnemy(currentFloor, 'BOSS', diff) });
      setRoomChoices(rooms);
      return;
    }

    for (let i = 0; i < 3; i++) {
      const roll = Math.random();
      const rivalChance = arc.name === 'ROGUE_ARC' ? 0.15 : 0.05;
      
      if (roll < rivalChance && currentFloor > 5) {
        rooms.push({
          type: 'ELITE',
          description: 'Your rival has found you...',
          enemy: { ...generateEnemy(currentFloor, 'ELITE', diff + 20), name: 'Rival Ninja', tier: 'Fated Rival', dropRateBonus: 100 }
        });
        continue;
      }

      if (i === 0) {
        const restThreshold = arc.name === 'EXAMS_ARC' ? 0.2 : 0.4;
        if (Math.random() < restThreshold) {
          if (Math.random() < 0.1) {
            rooms.push({
              type: 'EVENT',
              description: 'A hidden Ramen stand!',
              eventDefinition: { id: 'ramen_shop', title: 'Ichiraku Ramen', description: 'Teuchi offers you a special bowl.', choices: [{ label: 'Eat Ramen', type: 'HEAL_ALL', description: 'Full Heal' }] }
            });
          } else {
            rooms.push({ type: 'REST', description: 'A brief respite in the shadows.' });
          }
        } else {
          rooms.push({
            type: 'EVENT',
            description: 'A quiet spot for training.',
            eventDefinition: { id: 'training_tree', title: 'Tree Climbing Practice', description: 'Focus your chakra.', choices: [{ label: 'Train Hard', type: 'GAIN_XP', value: 50 + (currentFloor * 5), description: 'Gain XP' }, { label: 'Meditate', type: 'HEAL_CHAKRA', description: 'Restore Chakra' }] }
          });
        }
        continue;
      }

      let ambushRate = 0.1 + (diff * 0.002);
      if (arc.name === 'WAR_ARC') ambushRate += 0.2;

      if (roll < ambushRate) {
        rooms.push({ type: 'AMBUSH', description: 'Killer Intent spikes nearby!', enemy: generateEnemy(currentFloor, 'AMBUSH', diff) });
      } else if (roll < ambushRate + 0.3) {
        const eventDef = EVENTS[Math.floor(Math.random() * EVENTS.length)];
        rooms.push({ type: 'EVENT', description: 'An odd occurrence.', eventDefinition: eventDef });
      } else {
        const enemy = generateEnemy(currentFloor, 'NORMAL', diff);
        let combatDesc = "A rogue ninja blocks the path.";
        if (arc.name === 'EXAMS_ARC') combatDesc = "Another team wants your scroll.";
        rooms.push({ type: 'COMBAT', description: combatDesc, enemy });
      }
    }
    setRoomChoices(rooms);
  };

  // --- Game Flow ---
  const startGame = (clan: Clan) => {
    const baseStats = CLAN_STATS[clan];
    const startSkill = CLAN_START_SKILL[clan];
    const derived = calculateDerivedStats(baseStats, {});
    
    const newPlayer: Player = {
      clan,
      level: 1,
      exp: 0,
      maxExp: 100,
      primaryStats: { ...baseStats },
      currentHp: derived.maxHp,
      currentChakra: derived.maxChakra,
      element: clan === Clan.UCHIHA ? ElementType.FIRE : clan === Clan.UZUMAKI ? ElementType.WIND : ElementType.PHYSICAL,
      ryo: 100,
      equipment: { [ItemSlot.WEAPON]: null, [ItemSlot.HEAD]: null, [ItemSlot.BODY]: null, [ItemSlot.ACCESSORY]: null },
      skills: [SKILLS.BASIC_ATTACK, SKILLS.SHURIKEN, { ...startSkill, level: 1 }],
      activeBuffs: []
    };

    setPlayer(newPlayer);
    setFloor(1);
    setLogs([]);
    setEnemy(null);
    setDroppedItems([]);
    setDroppedSkill(null);
    setActiveEvent(null);
    setTurnState('PLAYER');
    addLog(`Lineage chosen: ${clan}. The Tower awaits.`, 'info');
    generateRooms(1, difficulty);
    setGameState(GameState.EXPLORE);
  };

  const selectRoom = (room: Room) => {
    if (room.type === 'REST') {
      if (!player || !playerStats) return;
      setPlayer({ ...player, currentHp: playerStats.derived.maxHp, currentChakra: playerStats.derived.maxChakra });
      addLog('You rested. HP & Chakra fully restored.', 'gain');
      nextFloor();
    } else if (room.type === 'EVENT' && room.eventDefinition) {
      setActiveEvent(room.eventDefinition);
      setGameState(GameState.EVENT);
    } else if (['COMBAT', 'ELITE', 'BOSS', 'AMBUSH'].includes(room.type) && room.enemy) {
      setEnemy(room.enemy);
      setTurnState('PLAYER');
      setGameState(GameState.COMBAT);
      addLog(`Engaged: ${room.enemy.name}`, 'danger');
      if (room.type === 'AMBUSH') addLog("DANGER! An S-Rank Rogue blocks your path!", 'danger');
    }
  };

  const handleEventChoice = (choice: GameEventDefinition['choices'][0]) => {
    if (!player || !playerStats) return;
    let text = "";
    let type: LogEntry['type'] = 'info';
    let next = true;

    switch (choice.type) {
      case 'LEAVE': text = "You chose to leave."; break;
      case 'HEAL_CHAKRA':
        setPlayer(p => p ? ({ ...p, currentChakra: playerStats.derived.maxChakra }) : null);
        text = "You prayed and restored your Chakra."; type = 'gain'; break;
      case 'HEAL_HP':
        const healAmt = Math.floor(playerStats.derived.maxHp * 0.3);
        setPlayer(p => p ? ({ ...p, currentHp: Math.min(playerStats.derived.maxHp, p.currentHp + healAmt) }) : null);
        text = `You tended to your wounds. +${healAmt} HP.`; type = 'gain'; break;
      case 'HEAL_ALL':
        setPlayer(p => p ? ({ ...p, currentHp: playerStats.derived.maxHp, currentChakra: playerStats.derived.maxChakra }) : null);
        text = "HP & Chakra fully restored."; type = 'gain'; break;
      case 'GAIN_XP':
        const xpGain = choice.value || 20;
        setPlayer(prev => prev ? checkLevelUp({ ...prev, exp: prev.exp + xpGain }) : null);
        text = `Gained ${xpGain} Experience.`; type = 'gain'; break;
      case 'GAMBLE_HP':
        if (Math.random() < (choice.chance || 0.5)) {
          setPlayer(p => p ? ({ ...p, primaryStats: { ...p.primaryStats, willpower: p.primaryStats.willpower + 5 } }) : null);
          text = "Success! Willpower increased by 5."; type = 'gain';
        } else {
          const loss = Math.floor(player.currentHp * 0.5);
          setPlayer(p => p ? ({ ...p, currentHp: Math.max(1, p.currentHp - loss) }) : null);
          text = `Failure. You lost ${loss} HP.`; type = 'danger';
        }
        break;
      case 'TRADE':
        if (player.ryo >= (choice.value || 150)) {
          const item = generateItem(floor, difficulty, Rarity.RARE);
          setPlayer(p => p ? ({ ...p, ryo: p.ryo - (choice.value || 150) }) : null);
          setDroppedItems([item]);
          setDroppedSkill(null);
          setGameState(GameState.LOOT);
          text = `You bought: ${item.name}`; type = 'loot'; next = false;
        } else {
          text = "Not enough Ryō."; type = 'danger';
        }
        break;
      case 'FIGHT_GHOST': case 'CHALLENGE_GUARDIAN':
        const ghostStats: PrimaryAttributes = {
          willpower: Math.floor(player.primaryStats.willpower * 0.9),
          chakra: player.primaryStats.chakra,
          strength: player.primaryStats.strength,
          spirit: Math.floor(player.primaryStats.spirit * 1.1),
          intelligence: player.primaryStats.intelligence,
          calmness: Math.floor(player.primaryStats.calmness * 1.2),
          speed: player.primaryStats.speed,
          accuracy: player.primaryStats.accuracy,
          dexterity: player.primaryStats.dexterity
        };
        const ghostDerived = calculateDerivedStats(ghostStats, {});
        const ghost: Enemy = {
          name: choice.type === 'CHALLENGE_GUARDIAN' ? 'Temple Guardian' : 'Vengeful Spirit',
          tier: choice.type === 'CHALLENGE_GUARDIAN' ? 'Guardian' : 'Spirit',
          element: ElementType.FIRE,
          primaryStats: ghostStats,
          currentHp: ghostDerived.maxHp,
          currentChakra: ghostDerived.maxChakra,
          skills: choice.type === 'CHALLENGE_GUARDIAN' ? [SKILLS.BASIC_ATTACK, SKILLS.FIREBALL, SKILLS.AMATERASU] : [SKILLS.BASIC_ATTACK, SKILLS.RASENGAN],
          dropRateBonus: choice.type === 'CHALLENGE_GUARDIAN' ? 100 : 20,
          activeBuffs: []
        };
        setEnemy(ghost);
        setTurnState('PLAYER');
        setGameState(GameState.COMBAT);
        addLog(`${ghost.name} attacks!`, 'danger');
        next = false;
        break;
    }
    if (next) { addLog(text, type); nextFloor(); }
  };

  const nextFloor = () => {
    setFloor(f => f + 1);
    setPlayer(p => {
      if (!p) return null;
      const stats = getPlayerFullStats(p);
      return {
        ...p,
        currentChakra: Math.min(stats.derived.maxChakra, p.currentChakra + stats.derived.chakraRegen),
        currentHp: Math.min(stats.derived.maxHp, p.currentHp + stats.derived.hpRegen)
      };
    });
    generateRooms(floor + 1, difficulty);
    setGameState(GameState.EXPLORE);
  };

  // --- Combat: Use Skill ---
  const useSkill = (skill: Skill) => {
    if (!player || !enemy || !playerStats || !enemyStats) return;

    // Handle toggle
    if (skill.isToggle) {
      const isActive = skill.isActive || false;
      setPlayer(prev => {
        if (!prev) return null;
        let newBuffs = [...prev.activeBuffs];
        let newSkills = prev.skills.map(s => s.id === skill.id ? { ...s, isActive: !isActive } : s);
        if (isActive) {
          newBuffs = newBuffs.filter(b => b.source !== skill.id);
          addLog(`${skill.name} Deactivated.`, 'info');
        } else {
          addLog(`${skill.name} Activated.`, 'info');
          if (skill.effects) {
            skill.effects.forEach(eff => {
              if (eff.type === EffectType.BUFF && Math.random() <= eff.chance) {
                newBuffs.push({ id: generateId(), name: `${eff.targetStat} Up`, duration: eff.duration, effect: eff, source: skill.id });
              }
            });
          }
        }
        return { ...prev, skills: newSkills, activeBuffs: newBuffs };
      });
      setTurnState('ENEMY_TURN');
      return;
    }

    // Resource check
    if (player.currentChakra < skill.chakraCost || player.currentHp <= skill.hpCost) {
      addLog("Insufficient Chakra or HP!", 'danger');
      return;
    }
    if (skill.currentCooldown > 0) return;

    const isStunned = player.activeBuffs.some(b => b.effect.type === EffectType.STUN);
    if (isStunned) {
      addLog("You are stunned!", 'danger');
      setTurnState('ENEMY_TURN');
      return;
    }

    // Execute attack
    let newPlayerHp = player.currentHp - skill.hpCost;
    let newPlayerChakra = player.currentChakra - skill.chakraCost;
    
    const damageResult = calculateDamage(
      playerStats.effectivePrimary,
      playerStats.derived,
      enemyStats.effectivePrimary,
      enemyStats.derived,
      skill,
      player.element,
      enemy.element
    );

    let logMsg = '';
    let newEnemyHp = enemy.currentHp;

    if (damageResult.isMiss) {
      logMsg = `You used ${skill.name} but MISSED!`;
      addLog(logMsg, 'info');
    } else if (damageResult.isEvaded) {
      logMsg = `You used ${skill.name} but ${enemy.name} EVADED!`;
      addLog(logMsg, 'info');
    } else {
      newEnemyHp -= damageResult.finalDamage;
      logMsg = `Used ${skill.name} for ${damageResult.finalDamage} dmg`;
      if (damageResult.flatReduction > 0) logMsg += ` (${damageResult.flatReduction} blocked)`;
      if (damageResult.elementMultiplier > 1) logMsg += " SUPER EFFECTIVE!";
      else if (damageResult.elementMultiplier < 1) logMsg += " Resisted.";
      if (damageResult.isCrit) logMsg += " CRITICAL!";
      addLog(logMsg, 'combat');

      // Apply effects
      if (skill.effects) {
        skill.effects.forEach(eff => {
          const resisted = eff.type !== EffectType.BUFF && eff.type !== EffectType.HEAL && !resistStatus(eff.chance, enemyStats.derived.statusResistance);
          if (!resisted) {
            if (eff.type === EffectType.BUFF || eff.type === EffectType.HEAL) {
              // Self buff
            } else {
              const buff: Buff = { id: generateId(), name: eff.type, duration: eff.duration, effect: eff, source: skill.name };
              setEnemy(prev => prev ? { ...prev, activeBuffs: [...prev.activeBuffs, buff] } : null);
              addLog(`Enemy afflicted with ${eff.type}!`, 'gain');
            }
          }
        });
      }
    }

    // Update cooldowns
    const newSkills = player.skills.map(s => s.id === skill.id ? { ...s, currentCooldown: s.cooldown + 1 } : s);

    if (newEnemyHp <= 0) {
      setEnemy(prev => prev ? { ...prev, currentHp: 0 } : null);
      setPlayer(prev => prev ? { ...prev, currentHp: newPlayerHp, currentChakra: newPlayerChakra, skills: newSkills } : null);
      handleVictory();
    } else {
      setEnemy(prev => prev ? { ...prev, currentHp: newEnemyHp } : null);
      setPlayer(prev => prev ? { ...prev, currentHp: newPlayerHp, currentChakra: newPlayerChakra, skills: newSkills } : null);
      setTurnState('ENEMY_TURN');
    }
  };

  // --- Enemy Turn Effect ---
  useEffect(() => {
    if (turnState === 'ENEMY_TURN' && player && enemy && playerStats && enemyStats) {
      const timer = setTimeout(() => {
        let updatedPlayer = { ...player };
        let updatedEnemy = { ...enemy };

        // Process DoTs on enemy
        updatedEnemy.activeBuffs.forEach(buff => {
          if ([EffectType.DOT, EffectType.BLEED, EffectType.BURN, EffectType.POISON].includes(buff.effect.type) && buff.effect.value) {
            const dotDmg = calculateDotDamage(buff.effect.value, buff.effect.damageType, buff.effect.damageProperty, enemyStats.derived);
            updatedEnemy.currentHp -= dotDmg;
            addLog(`${enemy.name} took ${dotDmg} ${buff.name} damage!`, 'combat');
          }
        });
        updatedEnemy.activeBuffs = updatedEnemy.activeBuffs.filter(b => b.duration > 1 || b.duration === -1).map(b => b.duration === -1 ? b : { ...b, duration: b.duration - 1 });

        // Process DoTs on player
        updatedPlayer.activeBuffs.forEach(buff => {
          if ([EffectType.DOT, EffectType.BLEED, EffectType.BURN, EffectType.POISON].includes(buff.effect.type) && buff.effect.value) {
            const dotDmg = calculateDotDamage(buff.effect.value, buff.effect.damageType, buff.effect.damageProperty, playerStats.derived);
            updatedPlayer.currentHp -= dotDmg;
            addLog(`You took ${dotDmg} ${buff.name} damage!`, 'danger');
          }
        });
        updatedPlayer.activeBuffs = updatedPlayer.activeBuffs.filter(b => b.duration > 1 || b.duration === -1).map(b => b.duration === -1 ? b : { ...b, duration: b.duration - 1 });

        // Check deaths from DoT
        if (updatedEnemy.currentHp <= 0) {
          setPlayer(updatedPlayer);
          setEnemy(updatedEnemy);
          handleVictory();
          setTurnState('PLAYER');
          return;
        }
        if (updatedPlayer.currentHp <= 0) {
          const gutsResult = checkGuts(updatedPlayer.currentHp, 0, playerStats.derived.gutsChance);
          if (!gutsResult.survived) {
            setGameState(GameState.GAME_OVER);
            return;
          }
          updatedPlayer.currentHp = 1;
          addLog("GUTS! You survived a fatal blow!", 'gain');
        }

        // Enemy action
        const isStunned = updatedEnemy.activeBuffs.some(b => b.effect.type === EffectType.STUN);
        const isConfused = updatedEnemy.activeBuffs.some(b => b.effect.type === EffectType.CONFUSION);

        if (isStunned) {
          addLog(`${enemy.name} is stunned!`, 'gain');
        } else if (isConfused && Math.random() < 0.5) {
          const confusionDmg = Math.floor(enemyStats.effectivePrimary.strength * 0.5);
          updatedEnemy.currentHp -= confusionDmg;
          addLog(`${enemy.name} hurt itself in confusion for ${confusionDmg} damage!`, 'gain');
        } else {
          const skill = updatedEnemy.skills[Math.floor(Math.random() * updatedEnemy.skills.length)];
          const damageResult = calculateDamage(
            enemyStats.effectivePrimary,
            enemyStats.derived,
            playerStats.effectivePrimary,
            playerStats.derived,
            skill,
            enemy.element,
            player.element
          );

          if (damageResult.isMiss) {
            addLog(`${enemy.name} used ${skill.name} but MISSED!`, 'gain');
          } else if (damageResult.isEvaded) {
            addLog(`You EVADED ${enemy.name}'s ${skill.name}!`, 'gain');
          } else {
            const gutsResult = checkGuts(updatedPlayer.currentHp, damageResult.finalDamage, playerStats.derived.gutsChance);
            if (!gutsResult.survived) {
              setGameState(GameState.GAME_OVER);
              return;
            }
            updatedPlayer.currentHp = gutsResult.newHp;
            if (gutsResult.newHp === 1 && updatedPlayer.currentHp - damageResult.finalDamage <= 0) {
              addLog("GUTS! You survived a fatal blow!", 'gain');
            }
            let msg = `${enemy.name} used ${skill.name} for ${damageResult.finalDamage} dmg!`;
            if (damageResult.isCrit) msg += " Crit!";
            addLog(msg, 'danger');

            // Apply enemy skill effects to player
            if (skill.effects) {
              skill.effects.forEach(eff => {
                if (eff.type !== EffectType.BUFF && eff.type !== EffectType.HEAL) {
                  const resisted = !resistStatus(eff.chance, playerStats.derived.statusResistance);
                  if (!resisted) {
                    updatedPlayer.activeBuffs.push({ id: generateId(), name: eff.type, duration: eff.duration, effect: eff, source: 'Enemy' });
                    addLog(`You are afflicted with ${eff.type}!`, 'danger');
                  } else if (eff.chance > 0) {
                    addLog(`You resisted ${eff.type}!`, 'gain');
                  }
                }
              });
            }
          }
        }

        // Check enemy death from self-damage
        if (updatedEnemy.currentHp <= 0) {
          setPlayer(updatedPlayer);
          setEnemy(updatedEnemy);
          handleVictory();
          setTurnState('PLAYER');
          return;
        }

        // Cooldowns & regen
        updatedPlayer.skills = updatedPlayer.skills.map(s => ({ ...s, currentCooldown: Math.max(0, s.currentCooldown - 1) }));
        updatedPlayer.currentChakra = Math.min(playerStats.derived.maxChakra, updatedPlayer.currentChakra + playerStats.derived.chakraRegen);

        setPlayer(updatedPlayer);
        setEnemy(updatedEnemy);
        setTurnState('PLAYER');
      }, 800);

      return () => clearTimeout(timer);
    }
  }, [turnState, player, enemy, playerStats, enemyStats]);

  const passTurn = () => {
    addLog("You focus on defense and wait.", 'info');
    setTurnState('ENEMY_TURN');
  };

  const handleVictory = () => {
    addLog("Enemy Defeated!", 'gain');
    setEnemy(null);
    setPlayer(prev => {
      if (!prev) return null;
      const isBoss = enemy?.isBoss;
      const isAmbush = enemy?.tier.includes('S-Rank');
      const isGuardian = enemy?.tier === 'Guardian';
      const enemyTier = enemy?.tier || 'Chunin';

      const baseExp = 25 + (floor * 5);
      const tierBonus = isGuardian ? 300 : enemyTier === 'Jonin' ? 20 : enemyTier === 'Kage Level' ? 200 : isAmbush ? 100 : 0;
      const expGain = baseExp + tierBonus;
      
      let updatedPlayer = { ...prev, exp: prev.exp + expGain };
      addLog(`Gained ${expGain} Experience.`, 'info');
      updatedPlayer = checkLevelUp(updatedPlayer);

      const ryoGain = (floor * 15) + Math.floor(Math.random() * 25);
      updatedPlayer.ryo += ryoGain;

      let rarityBonus = undefined;
      if (isBoss) rarityBonus = Rarity.EPIC;
      if (isAmbush || isGuardian) rarityBonus = Rarity.LEGENDARY;

      const item1 = generateItem(floor, difficulty, rarityBonus);
      const item2 = generateItem(floor, difficulty);
      const skill = generateSkillLoot(enemyTier, floor);

      setDroppedItems([item1, item2]);
      setDroppedSkill(skill);
      setGameState(GameState.LOOT);

      return updatedPlayer;
    });
  };

  const equipItem = (item: Item) => {
    if (!player) return;
    setPlayer(prev => {
      if (!prev) return null;
      const newEquip = { ...prev.equipment, [item.type]: item };
      return { ...prev, equipment: newEquip };
    });
    addLog(`Equipped ${item.name}.`, 'loot');
    nextFloor();
  };

  const learnSkill = (skill: Skill, slotIndex?: number) => {
    if (!player || !playerStats) return;
    
    const checkResult = canLearnSkill(skill, playerStats.effectivePrimary.intelligence, player.level, player.clan);
    if (!checkResult.canLearn) {
      addLog(`Cannot learn ${skill.name}: ${checkResult.reason}`, 'danger');
      return;
    }

    let newSkills = [...player.skills];
    const existingIndex = newSkills.findIndex(s => s.id === skill.id);

    if (existingIndex !== -1) {
      const existing = newSkills[existingIndex];
      const currentLevel = existing.level || 1;
      const growth = skill.damageMult * 0.2;
      newSkills[existingIndex] = { ...existing, level: currentLevel + 1, damageMult: existing.damageMult + growth };
      addLog(`Upgraded ${existing.name} to Level ${currentLevel + 1}!`, 'gain');
    } else {
      if (slotIndex !== undefined) {
        addLog(`Forgot ${newSkills[slotIndex].name} to learn ${skill.name}.`, 'loot');
        newSkills[slotIndex] = { ...skill, level: 1 };
      } else if (newSkills.length < 4) {
        newSkills.push({ ...skill, level: 1 });
        addLog(`Learned ${skill.name}.`, 'loot');
      } else {
        return;
      }
    }
    setPlayer({ ...player, skills: newSkills });
    nextFloor();
  };

  const sellItem = (item: Item) => {
    if (!player) return;
    const val = Math.floor(item.value * 0.6);
    setPlayer({ ...player, ryo: player.ryo + val });
    addLog(`Sold ${item.name} for ${val} Ryō.`, 'loot');
    nextFloor();
  };

  // --- Render Helpers ---
  const getRarityColor = (r: Rarity) => {
    switch (r) {
      case Rarity.LEGENDARY: return 'text-orange-400';
      case Rarity.EPIC: return 'text-purple-400';
      case Rarity.RARE: return 'text-blue-400';
      case Rarity.CURSED: return 'text-red-600 animate-pulse';
      default: return 'text-zinc-400';
    }
  };

  const getDamageTypeColor = (dt: DamageType) => {
    switch (dt) {
      case DamageType.PHYSICAL: return 'text-orange-500';
      case DamageType.ELEMENTAL: return 'text-purple-500';
      case DamageType.MENTAL: return 'text-indigo-500';
      case DamageType.TRUE: return 'text-red-500';
    }
  };

  const renderRoomCard = (room: Room, index: number) => {
    let borderColor = 'border-zinc-800';
    let bgColor = 'bg-black/60';
    let icon = <HelpCircle size={32} className="text-gray-600" />;
    let titleColor = 'text-gray-400';

    switch (room.type) {
      case 'BOSS':
        borderColor = 'border-red-900'; bgColor = 'bg-red-950/20';
        icon = <Skull size={48} className="text-red-600 animate-pulse" />; titleColor = 'text-red-500';
        break;
      case 'AMBUSH':
        borderColor = 'border-purple-900'; bgColor = 'bg-purple-950/20';
        icon = <Flame size={48} className="text-purple-600" />; titleColor = 'text-purple-500';
        break;
      case 'ELITE':
        borderColor = 'border-yellow-800';
        icon = <Sword size={40} className="text-yellow-600" />; titleColor = 'text-yellow-600';
        break;
      case 'REST':
        borderColor = 'border-green-900';
        icon = <Heart size={40} className="text-green-600" />; titleColor = 'text-green-600';
        break;
      case 'EVENT':
        borderColor = 'border-blue-900';
        icon = <MapIcon size={40} className="text-blue-600" />; titleColor = 'text-blue-500';
        if (room.eventDefinition?.id === 'training_tree') icon = <Target size={40} className="text-emerald-500" />;
        if (room.eventDefinition?.id === 'ramen_shop') icon = <div className="text-3xl">🍜</div>;
        break;
      default:
        icon = <Ghost size={32} className="text-zinc-600" />;
    }

    return (
      <button key={index} onClick={() => selectRoom(room)}
        className={`relative h-72 p-6 rounded border-2 flex flex-col items-center justify-center transition-all duration-500 hover:scale-[1.02] ${borderColor} ${bgColor} hover:bg-zinc-900 group overflow-hidden`}>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/80"></div>
        <div className="z-10 flex flex-col items-center gap-4">
          <div className="p-4 rounded-full bg-black/50 border border-zinc-800">{icon}</div>
          <div className="text-center">
            <div className={`font-serif text-xl font-bold tracking-widest mb-2 ${titleColor}`}>{room.eventDefinition?.title || room.type}</div>
            <div className="text-xs font-mono text-zinc-500 max-w-[150px] leading-tight">{room.description}</div>
          </div>
        </div>
      </button>
    );
  };

  // --- Main Render ---
  if (gameState === GameState.MENU) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center relative font-sans">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-900 via-black to-black opacity-80"></div>
        <div className="z-10 flex flex-col items-center w-full max-w-md px-6">
          <div className="mb-8 p-6 border-4 border-double border-red-900 bg-black/80 transform rotate-1">
            <h1 className="text-6xl md:text-8xl font-black text-red-800 tracking-tighter" style={{ textShadow: '4px 4px 0px #000' }}>SHINOBI WAY</h1>
          </div>
          <p className="text-sm text-zinc-500 tracking-[0.8em] mb-12 uppercase text-center">The Infinite Tower Awaits</p>
          
           <div className="w-full mb-12 p-6 bg-zinc-900/50 border border-zinc-800 rounded">
            <div className="flex justify-between items-end mb-4">
              <label htmlFor="difficulty-slider" className="text-xs font-bold uppercase tracking-widest text-zinc-400">Mission Difficulty</label>
              <span className={`text-2xl font-black ${difficulty < 30 ? 'text-green-500' : difficulty < 60 ? 'text-yellow-500' : difficulty < 85 ? 'text-orange-500' : 'text-red-600'}`}>
                Rank {difficulty < 30 ? 'D' : difficulty < 60 ? 'C' : difficulty < 85 ? 'B' : 'S'}
              </span>
            </div>
            <input id="difficulty-slider" type="range" min="0" max="100" value={difficulty} onChange={(e) => setDifficulty(parseInt(e.target.value))} className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-red-700" />
          </div>
          <button onClick={() => setGameState(GameState.CHAR_SELECT)} className="w-full group relative px-16 py-4 bg-black border border-zinc-800 hover:border-red-800 transition-all overflow-hidden">
            <div className="absolute inset-0 w-0 bg-red-900/20 transition-all duration-300 ease-out group-hover:w-full"></div>
            <span className="relative font-bold text-lg tracking-widest text-zinc-300 group-hover:text-red-500">ENTER TOWER</span>
          </button>
        </div>
      </div>
    );
  }

  if (gameState === GameState.CHAR_SELECT) {
    return (
      <div className="min-h-screen bg-zinc-950 text-gray-200 p-8 flex flex-col items-center justify-center">
        <h2 className="text-2xl font-serif text-zinc-500 mb-12 tracking-[0.2em]">SELECT LINEAGE</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 w-full max-w-7xl">
          {Object.values(Clan).map(clan => {
            const stats = CLAN_STATS[clan];
            const startSkill = CLAN_START_SKILL[clan];
            return (
              <button key={clan} onClick={() => startGame(clan)} className="h-80 bg-black border border-zinc-800 hover:border-red-900 p-6 flex flex-col items-start justify-between transition-all group hover:bg-zinc-900 relative overflow-hidden">
                <div className="absolute -right-8 -top-8 text-8xl font-black text-zinc-900 opacity-20">{clan.charAt(0)}</div>
                <div className="z-10 w-full">
                  <h3 className="text-2xl font-black text-zinc-200 mb-2 group-hover:text-red-600 transition-colors">{clan}</h3>
                  <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-4 border-b border-zinc-800 pb-2">{startSkill.name}</div>
                  <div className="grid grid-cols-3 gap-1 text-[9px] font-mono text-zinc-500">
                    <div className="flex justify-between"><span className="text-red-600">WIL</span><span className="text-zinc-300">{stats.willpower}</span></div>
                    <div className="flex justify-between"><span className="text-blue-600">CHA</span><span className="text-zinc-300">{stats.chakra}</span></div>
                    <div className="flex justify-between"><span className="text-orange-600">STR</span><span className="text-zinc-300">{stats.strength}</span></div>
                    <div className="flex justify-between"><span className="text-purple-600">SPI</span><span className="text-zinc-300">{stats.spirit}</span></div>
                    <div className="flex justify-between"><span className="text-cyan-600">INT</span><span className="text-zinc-300">{stats.intelligence}</span></div>
                    <div className="flex justify-between"><span className="text-indigo-600">CAL</span><span className="text-zinc-300">{stats.calmness}</span></div>
                    <div className="flex justify-between"><span className="text-green-600">SPD</span><span className="text-zinc-300">{stats.speed}</span></div>
                    <div className="flex justify-between"><span className="text-yellow-600">ACC</span><span className="text-zinc-300">{stats.accuracy}</span></div>
                    <div className="flex justify-between"><span className="text-pink-600">DEX</span><span className="text-zinc-300">{stats.dexterity}</span></div>
                  </div>
                </div>
                <div className="w-full pt-4 border-t border-zinc-800 text-xs text-zinc-600 uppercase tracking-wider group-hover:text-red-800 z-10">Begin Journey</div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (gameState === GameState.GAME_OVER) {
    return (
      <div className="min-h-screen bg-black text-red-700 flex flex-col items-center justify-center font-mono relative">
        <Skull size={64} className="mb-6 text-zinc-800" />
        <h1 className="text-6xl font-bold mb-4">DEATH</h1>
        <p className="text-zinc-500 mb-12 text-xl">You fell on Floor {floor} (Level {player?.level})</p>
        <button onClick={() => { setGameState(GameState.MENU); setPlayer(null); setEnemy(null); }} className="px-12 py-4 border border-zinc-800 text-zinc-400 hover:bg-zinc-900 hover:text-white uppercase tracking-widest text-sm">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="h-screen bg-black text-gray-300 flex overflow-hidden font-sans">
      {/* Left Panel */}
      <div className="hidden lg:flex w-[320px] flex-col border-r border-zinc-900 bg-zinc-950 p-4 overflow-y-auto">
        <div className="mb-4 text-center border-b border-zinc-900 pb-3">
          <div className="text-[9px] text-zinc-500 uppercase tracking-[0.3em] font-bold mb-1">Current Arc</div>
          <div className="text-base font-serif text-zinc-200 font-bold">{getStoryArc(floor).label}</div>
        </div>

        <div className="mb-4 flex flex-col gap-2 border-b border-zinc-900 pb-4">
          <div className="flex items-baseline justify-between">
            <span className="text-xs text-zinc-600 uppercase tracking-widest font-bold">Floor</span>
            <span className="text-4xl font-black text-zinc-200 font-serif">{floor}</span>
          </div>
          {player && (
            <div className="mt-2">
              <div className="flex items-baseline justify-between mb-1">
                <span className="text-xs text-yellow-700 uppercase tracking-widest font-bold">Level</span>
                <span className="text-lg font-bold text-yellow-500 font-mono">{player.level}</span>
              </div>
              <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-yellow-600" style={{ width: `${(player.exp / player.maxExp) * 100}%` }}></div>
              </div>
              <div className="flex justify-end text-[9px] text-zinc-600 font-mono mt-1">{player.exp} / {player.maxExp} XP</div>
            </div>
          )}
        </div>

        {player && playerStats && (
          <div className="flex-1 flex flex-col gap-4">
            <div className="space-y-2">
              <StatBar current={player.currentHp} max={playerStats.derived.maxHp} label="Health" color="green" />
              <StatBar current={player.currentChakra} max={playerStats.derived.maxChakra} label="Chakra" color="blue" />
            </div>
            <div className="flex gap-1 flex-wrap">
              {player.activeBuffs.map(buff => (
                <Tooltip key={buff.id} className="w-fit" content={<div className="text-xs p-2 max-w-[200px] font-mono">{getBuffDescription(buff)}</div>}>
                  <div className="px-1.5 py-0.5 bg-zinc-900 border border-zinc-700 text-[9px] text-zinc-300 rounded flex gap-1 items-center cursor-help">
                    {buff.effect.type === EffectType.STUN && <span className="text-yellow-500 font-bold">!</span>}
                    <span>{buff.name} {buff.duration === -1 ? '(∞)' : `(${buff.duration})`}</span>
                  </div>
                </Tooltip>
              ))}
            </div>
            <CharacterSheet player={player} effectivePrimary={playerStats.effectivePrimary} derived={playerStats.derived} />
          </div>
        )}
      </div>

      {/* Center Panel */}
      <div className="flex-1 flex flex-col relative bg-zinc-950">
        <div className="lg:hidden h-14 border-b border-zinc-900 flex items-center justify-between px-4 bg-black">
          <div className="flex gap-4">
            <span className="font-bold text-zinc-200">FL {floor}</span>
            <span className="text-yellow-600 font-bold">LVL {player?.level}</span>
          </div>
          <div className="text-xs">{player?.currentHp} HP</div>
        </div>

        <div className="flex-1 p-6 flex flex-col items-center justify-center relative overflow-y-auto">
          {/* Explore State */}
          {gameState === GameState.EXPLORE && (
            <div className="w-full max-w-6xl z-10 animate-fade-in">
              <h2 className="text-2xl text-center font-serif text-zinc-500 mb-12 tracking-[0.3em]">NEXT CHAMBER</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {roomChoices.map((room, idx) => renderRoomCard(room, idx))}
              </div>
            </div>
          )}

          {/* Combat State */}
          {gameState === GameState.COMBAT && player && enemy && playerStats && enemyStats && (
            <div className="w-full max-w-4xl z-10 flex flex-col h-full justify-center">
              <div className="mb-8 flex flex-col items-center gap-6">
                <div className="flex flex-col md:flex-row items-center gap-8 w-full">
                  {/* Enemy Portrait */}
                  <div className="relative w-40 h-40 shrink-0 bg-black border border-zinc-800 flex items-center justify-center overflow-hidden">
                    {enemy.image ? (
                      <img src={enemy.image} alt={enemy.name} className="w-full h-full object-cover" />
                    ) : (
                      <Ghost className="text-zinc-700" size={64} />
                    )}
                  </div>

                  {/* Enemy Stats */}
                  <div className="flex-1 w-full">
                    <div className={`text-3xl font-black mb-3 tracking-tight uppercase ${enemy.isBoss ? 'text-red-600' : 'text-zinc-200'}`}>{enemy.name}</div>
                    <div className="w-full max-w-md mb-2">
                      <StatBar current={enemy.currentHp} max={enemyStats.derived.maxHp} label="" color="red" />
                    </div>
                    <div className="flex gap-4 text-xs font-mono uppercase tracking-widest text-zinc-500 mb-2">
                      <span>{enemy.tier}</span>
                      <span>Affinity: <span className="text-zinc-300">{enemy.element}</span></span>
                    </div>
                    {/* Enemy Defense Display */}
                    <div className="flex gap-2 text-[9px] font-mono text-zinc-600 mb-2">
                      <span className="text-orange-600">Phys: {enemyStats.derived.physicalDefenseFlat}+{formatPercent(enemyStats.derived.physicalDefensePercent)}</span>
                      <span className="text-purple-600">Elem: {enemyStats.derived.elementalDefenseFlat}+{formatPercent(enemyStats.derived.elementalDefensePercent)}</span>
                      <span className="text-indigo-600">Mind: {enemyStats.derived.mentalDefenseFlat}+{formatPercent(enemyStats.derived.mentalDefensePercent)}</span>
                    </div>
                    {/* Enemy Buffs */}
                    <div className="flex gap-2 h-5 flex-wrap">
                      {enemy.activeBuffs.map(buff => (
                        <div key={buff.id} className="px-1.5 py-0.5 bg-red-950 border border-red-900 text-[8px] text-red-300 rounded">
                          {buff.name} ({buff.duration})
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Skills Grid */}
              <div className="mt-auto grid grid-cols-2 md:grid-cols-4 gap-3">
                {player.skills.map(skill => {
                  const canUse = player.currentChakra >= skill.chakraCost && player.currentHp > skill.hpCost && skill.currentCooldown === 0;
                  const isStunned = player.activeBuffs.some(b => b.effect.type === EffectType.STUN);
                  const isEnemyTurn = turnState === 'ENEMY_TURN';

                  // Predicted damage
                  const prediction = calculateDamage(playerStats.effectivePrimary, playerStats.derived, enemyStats.effectivePrimary, enemyStats.derived, skill, player.element, enemy.element);

                  // Calculate effectiveness for UI
                  const effectiveness = getElementEffectiveness(skill.element, enemy.element);
                  let borderColor = 'border-zinc-800';
                  let effectivenessIcon = null;

                  if (effectiveness > 1.0) {
                    borderColor = 'border-green-600';
                    effectivenessIcon = <div className="absolute top-1 right-1 text-green-500 text-[10px] font-bold">▲</div>;
                  } else if (effectiveness < 1.0) {
                    borderColor = 'border-red-900';
                    effectivenessIcon = <div className="absolute top-1 right-1 text-red-500 text-[10px] font-bold">▼</div>;
                  }

                  // Override border if unusable or toggle active
                  if (!((canUse || skill.isActive) && !isStunned && !isEnemyTurn)) {
                    borderColor = 'border-zinc-900';
                  } else if (skill.isToggle && skill.isActive) {
                    borderColor = 'border-blue-500';
                  }

                  return (
                    <Tooltip key={skill.id} content={
                      <div className="space-y-2 p-1 max-w-[220px]">
                        <div className="font-bold text-zinc-200 flex justify-between">
                          <span>{skill.name}</span>
                          <span className="text-yellow-500">Lv.{skill.level || 1}</span>
                        </div>
                        <div className="text-xs text-zinc-400">{skill.description}</div>
                        <div className="border-t border-zinc-700 my-2 pt-2 space-y-1 text-[10px] font-mono text-zinc-500">
                          <div className="flex justify-between"><span>Damage Type</span><span className={getDamageTypeColor(skill.damageType)}>{skill.damageType}</span></div>
                          <div className="flex justify-between"><span>Property</span><span className="text-zinc-300">{skill.damageProperty}</span></div>
                          <div className="flex justify-between"><span>Method</span><span className="text-zinc-300">{skill.attackMethod}</span></div>
                          {skill.requirements?.intelligence && (
                            <div className="flex justify-between text-cyan-400"><span>Requires INT</span><span>{skill.requirements.intelligence}</span></div>
                          )}
                        </div>
                      </div>
                    }>
                      <button onClick={() => useSkill(skill)} disabled={(!canUse && !skill.isActive) || isStunned || isEnemyTurn}
                        className={`w-full relative p-3 h-28 text-left border transition-all group flex flex-col justify-between overflow-hidden
                          ${(canUse || skill.isActive) && !isStunned && !isEnemyTurn ? `bg-zinc-900 ${borderColor} hover:border-zinc-500` : 'bg-black border-zinc-900 opacity-40 cursor-not-allowed'}
                          ${skill.isToggle && skill.isActive ? 'bg-blue-900/20' : ''}`}>
                        {effectivenessIcon}
                        <div className="relative z-10">
                          <div className="flex justify-between items-start">
                            <div className="font-bold text-xs text-zinc-200 mb-0.5">{skill.name}</div>
                            {(skill.level || 1) > 1 && <div className="text-[8px] text-yellow-500 font-mono">Lv.{skill.level}</div>}
                          </div>
                          <div className="text-[9px] text-zinc-500 uppercase flex items-center gap-1">
                            <span className={getDamageTypeColor(skill.damageType)}>{skill.damageType.charAt(0)}</span>
                            <span>{skill.element}</span>
                          </div>
                        </div>
                        
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 text-right pointer-events-none">
                          <div className="text-[8px] font-black uppercase text-zinc-700">DMG</div>
                          <div className="text-2xl font-black font-serif text-zinc-800 leading-none">{prediction.finalDamage > 0 && !prediction.isMiss ? prediction.finalDamage : '-'}</div>
                        </div>

                        <div className="flex justify-between text-[9px] font-mono relative z-10 mt-auto">
                          <span className={skill.chakraCost > 0 ? "text-blue-400" : "text-zinc-700"}>{skill.chakraCost > 0 ? `${skill.chakraCost} CP` : '-'}</span>
                          <span className={skill.hpCost > 0 ? "text-red-400" : "text-zinc-700"}>{skill.hpCost > 0 ? `${skill.hpCost} HP` : '-'}</span>
                        </div>

                        {skill.currentCooldown > 0 && (
                          <div className="absolute inset-0 bg-black/90 flex items-center justify-center text-2xl font-black text-zinc-700 z-20">{skill.currentCooldown}</div>
                        )}
                      </button>
                    </Tooltip>
                  );
                })}
              </div>
              <div className="mt-3 flex justify-center">
                <button onClick={passTurn} disabled={turnState === 'ENEMY_TURN'}
                  className={`flex items-center gap-2 px-4 py-2 bg-black border border-zinc-800 ${turnState === 'ENEMY_TURN' ? 'opacity-50' : 'hover:border-zinc-600'}`}>
                  <Hourglass size={12} className="text-zinc-600" />
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{turnState === 'ENEMY_TURN' ? 'Enemy Turn...' : 'Pass Turn'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Event State */}
          {gameState === GameState.EVENT && activeEvent && (
            <div className="w-full max-w-2xl bg-black border border-zinc-800 p-10 shadow-2xl z-10 flex flex-col items-center text-center">
              <div className="mb-6 text-blue-900 opacity-50"><MapIcon size={56} /></div>
              <h2 className="text-2xl font-bold text-zinc-200 mb-4 font-serif">{activeEvent.title}</h2>
              <p className="text-base text-zinc-500 mb-10 leading-relaxed max-w-lg">{activeEvent.description}</p>
              <div className="flex flex-col gap-3 w-full">
                {activeEvent.choices.map((choice, idx) => (
                  <button key={idx} onClick={() => handleEventChoice(choice)}
                    className="w-full py-4 px-6 bg-zinc-900 border border-zinc-800 hover:border-zinc-500 transition-colors flex justify-between items-center group">
                    <span className="font-bold text-zinc-300 group-hover:text-white tracking-widest uppercase text-sm">{choice.label}</span>
                    {choice.description && <span className="text-xs text-zinc-600 font-mono">{choice.description}</span>}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Loot State */}
          {gameState === GameState.LOOT && (
            <div className="w-full max-w-6xl z-10">
              <h2 className="text-2xl text-center mb-10 text-zinc-500 font-serif tracking-[0.5em] uppercase">Spoils of War</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                {droppedItems.map(item => (
                  <div key={item.id} className="bg-black border border-zinc-800 p-6 flex flex-col gap-4">
                    <div>
                      <h3 className={`font-bold text-lg mb-1 ${getRarityColor(item.rarity)}`}>{item.name}</h3>
                      <p className="text-[10px] text-zinc-600 uppercase tracking-widest font-bold">{item.type} • {item.rarity}</p>
                    </div>
                    <div className="space-y-1 text-xs font-mono text-zinc-500">
                      {Object.entries(item.stats).map(([key, val]) => (
                        <div key={key} className="flex justify-between uppercase">
                          <span>{key}</span>
                          <span className="text-zinc-200">+{val}</span>
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-3 mt-auto pt-3">
                      <button onClick={() => equipItem(item)} className="py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[10px] font-bold text-zinc-300 uppercase">Equip</button>
                      <button onClick={() => sellItem(item)} className="py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[10px] font-bold text-zinc-500 hover:text-yellow-500 uppercase">Sell (+{Math.floor(item.value * 0.6)})</button>
                    </div>
                  </div>
                ))}

                {droppedSkill && playerStats && (
                  <div className="bg-black border border-blue-900/30 p-6 flex flex-col gap-4">
                    <div>
                      <h3 className={`font-bold text-lg mb-1 ${droppedSkill.tier === SkillTier.FORBIDDEN ? 'text-red-500 animate-pulse' : 'text-blue-100'}`}>{droppedSkill.name}</h3>
                      <p className="text-[10px] text-blue-600 uppercase tracking-widest font-bold">Secret Scroll • {droppedSkill.tier}</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <Scroll className="text-blue-900 shrink-0" size={28} />
                      <p className="text-xs text-zinc-400 italic leading-relaxed">{droppedSkill.description}</p>
                    </div>
                    <div className="space-y-1 text-[10px] font-mono">
                      <div className="flex justify-between"><span className="text-zinc-600">Chakra Cost</span><span className="text-blue-400">{droppedSkill.chakraCost}</span></div>
                      <div className="flex justify-between"><span className="text-zinc-600">Damage Type</span><span className={getDamageTypeColor(droppedSkill.damageType)}>{droppedSkill.damageType}</span></div>
                      <div className="flex justify-between"><span className="text-zinc-600">Property</span><span className="text-zinc-300">{droppedSkill.damageProperty}</span></div>
                      {droppedSkill.requirements?.intelligence && (
                        <div className="flex justify-between"><span className="text-cyan-600">Requires INT</span><span className={playerStats.effectivePrimary.intelligence >= droppedSkill.requirements.intelligence ? 'text-green-400' : 'text-red-400'}>{droppedSkill.requirements.intelligence}</span></div>
                      )}
                    </div>
                    <div className="mt-auto pt-3">
                      {player && player.skills.some(s => s.id === droppedSkill.id) ? (
                        <button onClick={() => learnSkill(droppedSkill)} className="w-full py-2 bg-green-900/20 border border-green-900 text-[10px] font-bold text-green-200 uppercase">Upgrade</button>
                      ) : player && player.skills.length < 4 ? (
                        <button onClick={() => learnSkill(droppedSkill)} className="w-full py-2 bg-blue-900/20 border border-blue-900 text-[10px] font-bold text-blue-200 uppercase">Learn</button>
                      ) : (
                        <div className="grid grid-cols-2 gap-2">
                          {player?.skills.map((s, idx) => (
                            <button key={idx} onClick={() => learnSkill(droppedSkill, idx)} className="py-1 bg-zinc-900 border border-zinc-800 text-[8px] text-zinc-400 hover:text-red-400 uppercase">Replace {s.name}</button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <div className="text-center">
                <button onClick={nextFloor} className="text-zinc-600 hover:text-zinc-300 text-xs uppercase tracking-widest border-b border-transparent hover:border-zinc-600 pb-1">Leave All</button>
              </div>
            </div>
          )}
        </div>

        {/* Logs Footer */}
        <div className="h-56 bg-black border-t border-zinc-900">
          <GameLog logs={logs} />
        </div>
      </div>
    </div>
  );
};

export default App;