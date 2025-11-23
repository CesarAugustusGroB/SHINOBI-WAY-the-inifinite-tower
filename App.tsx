import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { 
  GameState, Player, Clan, Stat, Skill, Attributes, Enemy, LogEntry, 
  Room, Item, ItemSlot, Rarity, ElementType, GameEventDefinition, EffectType, Buff, EffectDefinition, SkillTier
} from './types';
import { 
  CLAN_STATS, CLAN_START_SKILL, SKILLS, MAX_LOGS, ELEMENTAL_CYCLE, 
  BASE_CRIT_CHANCE, BASE_ITEM_NAMES, BOSS_NAMES, AMBUSH_ENEMIES, EVENTS, CLAN_GROWTH, ENEMY_PREFIXES
} from './constants';
import StatBar from './components/StatBar';
import GameLog from './components/GameLog';
import CharacterSheet from './components/CharacterSheet';
import Tooltip from './components/Tooltip';
import { 
  Sword, Shield, Skull, Heart, 
  Ghost, HelpCircle, Flame, Map as MapIcon, ArrowUpCircle, Scroll, Hourglass,
  Image as ImageIcon, Loader, Target
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

// Define window.aistudio for API Key Selection
declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
  interface Window {
    aistudio?: AIStudio;
  }
}

// Internal Types for Generator
type EnemyArchetype = 'TANK' | 'ASSASSIN' | 'BALANCED' | 'CASTER';

// Define the current "feel" of the game based on floor
const getStoryArc = (floor: number) => {
    if (floor <= 10) return { name: 'ACADEMY_ARC', label: 'Academy Graduation', biome: 'Village Hidden in the Leaves' };
    if (floor <= 25) return { name: 'WAVES_ARC', label: 'Land of Waves', biome: 'Mist Covered Bridge' };
    if (floor <= 50) return { name: 'EXAMS_ARC', label: 'Chunin Exams', biome: 'Forest of Death' };
    if (floor <= 75) return { name: 'ROGUE_ARC', label: 'Sasuke Retrieval', biome: 'Valley of the End' };
    return { name: 'WAR_ARC', label: 'Great Ninja War', biome: 'Divine Tree Roots' };
};

const generateId = () => Math.random().toString(36).substring(2, 9);

const App: React.FC = () => {
  // --- State ---
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [floor, setFloor] = useState(1);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [player, setPlayer] = useState<Player | null>(null);
  const [enemy, setEnemy] = useState<Enemy | null>(null);
  const [roomChoices, setRoomChoices] = useState<Room[]>([]);
  const [droppedItems, setDroppedItems] = useState<Item[]>([]);
  const [droppedSkill, setDroppedSkill] = useState<Skill | null>(null);
  const [activeEvent, setActiveEvent] = useState<GameEventDefinition | null>(null);
  
  // New Difficulty State
  const [difficulty, setDifficulty] = useState<number>(20); // Default 20/100
  
  // Turn Management
  const [turnState, setTurnState] = useState<'PLAYER' | 'ENEMY_TURN'>('PLAYER');

  // Image Generation State
  const [genImageSize, setGenImageSize] = useState<'1K' | '2K' | '4K'>('1K');
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  // --- Helpers ---
  const addLog = useCallback((text: string, type: LogEntry['type'] = 'info', details?: string) => {
    setLogs(prev => {
      const newEntry: LogEntry = { id: Date.now(), text, type, details };
      const newLogs = [...prev, newEntry];
      if (newLogs.length > MAX_LOGS) newLogs.shift();
      return newLogs;
    });
  }, []);

  // --- Stat Calculation ---
  const getEffectiveAttributes = useCallback((p: Player): Attributes => {
    const eff = { ...p.stats }; // Start with base stats

    // Add Equipment Bonuses
    Object.values(p.equipment).forEach(item => {
      if (item && item.stats) {
        (Object.keys(item.stats) as Array<keyof Attributes>).forEach(key => {
             const bonus = item.stats[key] || 0;
             if (key === 'hp') {
                 eff.maxHp += bonus; 
             } else if (key === 'chakra') {
                 eff.maxChakra += bonus;
             } else {
                 eff[key] = (eff[key] || 0) + bonus;
             }
        });
      }
    });

    // Add Buffs / Debuffs
    p.activeBuffs.forEach(buff => {
        if (buff.effect.type === EffectType.BUFF || buff.effect.type === EffectType.DEBUFF) {
            if (buff.effect.targetStat && buff.effect.value) {
                const multiplier = buff.effect.type === EffectType.BUFF ? (1 + buff.effect.value) : (1 - buff.effect.value);
                const statVal = eff[buff.effect.targetStat];
                eff[buff.effect.targetStat] = Math.floor(statVal * multiplier);
            }
        }
    });

    return eff;
  }, []);

  const effectiveStats = useMemo(() => {
      return player ? getEffectiveAttributes(player) : null;
  }, [player, getEffectiveAttributes]);

  // --- Helper for Buff Description ---
  const getBuffDescription = (buff: Buff) => {
      const { type, value, targetStat } = buff.effect;
      switch (type) {
          case EffectType.STUN: return "Cannot perform any actions.";
          case EffectType.DOT: return `Takes ${value} damage at the start of each turn.`;
          case EffectType.BUFF: return `Increases ${targetStat} by ${Math.round((value || 0) * 100)}%.`;
          case EffectType.DEBUFF: return `Decreases ${targetStat} by ${Math.round((value || 0) * 100)}%.`;
          case EffectType.DRAIN: return `Attacks drain ${Math.round((value || 0) * 100)}% damage as HP.`;
          case EffectType.CONFUSION: return "50% chance to hurt self in confusion.";
          case EffectType.SILENCE: return "Cannot use skills. Forces basic attacks.";
          default: return buff.name;
      }
  };

  // --- Image Generation ---
  const generateEnemyImage = async () => {
    if (!enemy) return;
    
    // Check/Request API Key
    if (window.aistudio) {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        if (!hasKey) {
            await window.aistudio.openSelectKey();
        }
    }

    setIsGeneratingImage(true);
    try {
      // Create fresh instance to ensure we use the latest key
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `A dark fantasy, gritty anime style character portrait of a Naruto-inspired ninja enemy named "${enemy.name}". 
      Rank: ${enemy.tier}. Chakra Element: ${enemy.element}. 
      The character looks dangerous and powerful. High contrast, detailed, atmospheric lighting. Close-up or waist-up shot.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-image-preview',
        contents: { parts: [{ text: prompt }] },
        config: {
          imageConfig: {
            imageSize: genImageSize,
            aspectRatio: '1:1'
          }
        }
      });

      let imageUrl = null;
      if (response.candidates && response.candidates[0].content && response.candidates[0].content.parts) {
          for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
              imageUrl = `data:image/png;base64,${part.inlineData.data}`;
              break;
            }
          }
      }

      if (imageUrl) {
        setEnemy(prev => prev ? { ...prev, image: imageUrl } : null);
        addLog(`Visualized ${enemy.name} via Genjutsu!`, 'gain');
      } else {
        addLog("Genjutsu failed (No image returned).", 'danger');
      }
    } catch (error: any) {
      console.error("Image Gen Error", error);
      // Retry logic for permission errors (403)
      if (error.toString().includes("403") || error.toString().includes("Permission denied") || error.toString().includes("PERMISSION_DENIED")) {
          addLog("Access denied. Please select a valid API Key.", 'danger');
          if (window.aistudio) {
              await window.aistudio.openSelectKey();
          }
      } else {
          addLog("Failed to visualize enemy.", 'danger');
      }
    } finally {
      setIsGeneratingImage(false);
    }
  };

  // --- Combat Math ---
  const calculateDamage = (attackerStats: Attributes, defenderStats: Attributes, skill: Skill, attackerElement: ElementType, defenderElement: ElementType) => {
      // 0. Accuracy / Evasion Check
      const hitChance = 92 + (attackerStats.acc - defenderStats.spd);
      const finalHitChance = Math.max(50, Math.min(100, hitChance));
      const isMiss = Math.random() * 100 > finalHitChance;

      if (isMiss) {
          return { damage: 0, isCrit: false, elMult: 1.0, isMiss: true, rawDamage: 0 };
      }

      // 1. Base Damage
      let statVal = attackerStats[skill.scalingStat.toLowerCase() as keyof Attributes] || 10;
      let rawDamage = statVal * skill.damageMult;

      // 2. Elemental Effectiveness
      let elMult = 1.0;
      if (ELEMENTAL_CYCLE[skill.element] === defenderElement) elMult = 1.5;
      if (ELEMENTAL_CYCLE[defenderElement] === skill.element) elMult = 0.5;

      // 3. Critical Hit (Based on Speed Diff)
      const spdDiff = attackerStats.spd - defenderStats.spd;
      const baseCrit = BASE_CRIT_CHANCE + (skill.critBonus || 0);
      const critChance = baseCrit + Math.max(0, spdDiff); 
      const isCrit = Math.random() * 100 < critChance;
      const critMult = isCrit ? 1.5 : 1.0;

      // 4. Mitigation (Defense or Genjutsu Resistance)
      // GEN skills hit Mental Resistance (GEN), others hit Physical Defense (DEF)
      const defenseStat = skill.scalingStat === Stat.GEN ? defenderStats.gen : defenderStats.def;
      const mitigation = 1 + (defenseStat / 100);
      
      const finalDamage = Math.max(1, Math.floor((rawDamage * elMult * critMult) / mitigation));

      return { damage: finalDamage, isCrit, elMult, isMiss: false, rawDamage: Math.floor(rawDamage) };
  };

  // --- Leveling ---
  const checkLevelUp = (p: Player): Player => {
      let currentPlayer = { ...p };
      let leveledUp = false;

      while (currentPlayer.exp >= currentPlayer.maxExp) {
          leveledUp = true;
          currentPlayer.exp -= currentPlayer.maxExp;
          currentPlayer.level += 1;
          currentPlayer.maxExp = currentPlayer.level * 100; // Simple Linear Scaling
          
          // Apply Growth
          const growth = CLAN_GROWTH[currentPlayer.clan];
          const s = currentPlayer.stats;
          currentPlayer.stats = {
              hp: s.hp, // Current HP stays same before heal logic
              maxHp: s.maxHp + (growth.maxHp || 0),
              chakra: s.chakra, 
              maxChakra: s.maxChakra + (growth.maxChakra || 0),
              str: s.str + (growth.str || 0),
              int: s.int + (growth.int || 0),
              spd: s.spd + (growth.spd || 0),
              def: s.def + (growth.def || 0),
              gen: s.gen + (growth.gen || 0),
              acc: s.acc + (growth.acc || 0)
          };
      }

      if (leveledUp) {
          // Full Heal on Level Up to Effective Max
          const eff = getEffectiveAttributes(currentPlayer);
          currentPlayer.stats.hp = eff.maxHp;
          currentPlayer.stats.chakra = eff.maxChakra;
          addLog(`LEVEL UP! You reached Level ${currentPlayer.level}. Stats increased & Fully Healed!`, 'gain');
      }

      return currentPlayer;
  };

  // --- Generators ---
  
  const generateEnemy = (
      currentFloor: number, 
      type: 'NORMAL' | 'ELITE' | 'BOSS' | 'AMBUSH', 
      diff: number // 0 - 100
  ): Enemy => {
      const arc = getStoryArc(currentFloor);

      // 1. Calculate Global Multipliers
      // REVISED DIFFICULTY ALGORITHM: Easier Slope
      // Floor scaling: Linear (10% per floor) instead of Exponential to prevent runaway stats
      const floorMult = 1 + (currentFloor * 0.1); 
      
      // Difficulty scaling: 
      // Old: 1.0 (0) -> 3.0 (100)
      // New: 0.75 (0) -> 1.75 (100)
      // This makes the baseline game easier and max difficulty less impossible.
      const diffMult = 0.75 + (diff / 100); 
      
      const totalScaling = floorMult * diffMult;

      // 2. Handle Bosses
      if (type === 'BOSS') {
          const bossData = BOSS_NAMES[currentFloor as keyof typeof BOSS_NAMES] || { name: `Edo Tensei Legend`, element: ElementType.FIRE, skill: SKILLS.RASENGAN };
          return {
              name: bossData.name,
              tier: 'Kage Level',
              element: bossData.element,
              isBoss: true,
              skills: [SKILLS.BASIC_ATTACK, SKILLS.FIREBALL, bossData.skill], 
              stats: {
                  // Reduced Base HP from 800 to 500 to make bosses less spongy
                  hp: Math.floor(500 * totalScaling), maxHp: Math.floor(500 * totalScaling), 
                  chakra: 1000, maxChakra: 1000,
                  // Reduced Base Stats from 25/15 to 20/12
                  str: Math.floor(20 * totalScaling), int: Math.floor(20 * totalScaling),
                  spd: Math.floor(15 + (currentFloor * 0.5) + (diff * 0.05)), // Reduced speed scaling significantly
                  def: Math.floor(12 * totalScaling), 
                  gen: 20, acc: 20
              },
              dropRateBonus: 50 + diff,
              activeBuffs: []
          };
      }

      // 3. Determine Archetype
      let archetype: EnemyArchetype = 'BALANCED';
      if (type === 'AMBUSH') archetype = 'ASSASSIN';
      else if (type === 'ELITE') archetype = Math.random() > 0.5 ? 'TANK' : 'CASTER';
      else archetype = ['TANK', 'ASSASSIN', 'BALANCED', 'CASTER'][Math.floor(Math.random() * 4)] as EnemyArchetype;

      // Base Stat Template
      let baseStats = { hp: 100, str: 10, int: 10, spd: 10, def: 5 };
      
      switch (archetype) {
          case 'TANK':     baseStats = { hp: 180, str: 12, int: 5,  spd: 6,  def: 12 }; break;
          case 'ASSASSIN': baseStats = { hp: 90,  str: 16, int: 8,  spd: 18, def: 4 };  break;
          case 'CASTER':   baseStats = { hp: 80,  str: 5,  int: 20, spd: 12, def: 3 };  break;
          case 'BALANCED': baseStats = { hp: 120, str: 10, int: 10, spd: 10, def: 8 };  break;
      }

      // 4. Name & Identity Generation
      let name = "";
      let skills = [SKILLS.BASIC_ATTACK];
      let enemyElement = Object.values(ElementType)[Math.floor(Math.random() * 4)];

      if (type === 'AMBUSH') {
          const template = AMBUSH_ENEMIES[Math.floor(Math.random() * AMBUSH_ENEMIES.length)];
          name = template.name;
          enemyElement = template.element;
          skills.push(template.skill);
      } else {
          // Generate Random Name based on Arc
          let namePool = ENEMY_PREFIXES.NORMAL;
          
          if (arc.name === 'WAVES_ARC') namePool = ['Mist', 'Demon Brother', 'Mercenary', 'Missing-nin', 'Hunter-nin'];
          else if (arc.name === 'EXAMS_ARC') namePool = ['Sand', 'Sound', 'Rain', 'Grass', 'Curse Mark'];
          else if (arc.name === 'ROGUE_ARC') namePool = ['Sound Four', 'Curse Mark L2', 'Rogue', 'Experiment'];
          else if (arc.name === 'WAR_ARC') namePool = ['Reanimated', 'White Zetsu', 'Masked', 'Seven Swordsmen'];
          else {
              if (diff > 75) namePool = ENEMY_PREFIXES.DEADLY;
              else if (diff > 40) namePool = ENEMY_PREFIXES.STRONG;
              else if (diff < 10) namePool = ENEMY_PREFIXES.WEAK;
          }
          
          const prefix = namePool[Math.floor(Math.random() * namePool.length)];
          const job = ['Ninja', 'Samurai', 'Puppeteer', 'Monk'][Math.floor(Math.random() * 4)];
          name = `${prefix} ${job}`;

          // Generate Skills based on Archetype
          if (archetype === 'CASTER' || archetype === 'BALANCED') skills.push(SKILLS.FIREBALL);
          if (archetype === 'ASSASSIN') skills.push(SKILLS.SHURIKEN);
          // Chance for extra skill based on difficulty
          if (diff > 50 && Math.random() < 0.3) skills.push(SKILLS.RASENGAN); 
      }

      const isElite = type === 'ELITE' || type === 'AMBUSH';
      const eliteMult = isElite ? 1.5 : 1;

      return {
          name: name,
          tier: isElite ? (type === 'AMBUSH' ? 'S-Rank Rogue' : 'Jonin') : 'Chunin',
          element: enemyElement,
          skills: skills,
          stats: {
              hp: Math.floor(baseStats.hp * totalScaling * eliteMult), 
              maxHp: Math.floor(baseStats.hp * totalScaling * eliteMult),
              chakra: 150, maxChakra: 150,
              str: Math.floor(baseStats.str * totalScaling * eliteMult), 
              int: Math.floor(baseStats.int * totalScaling * eliteMult),
              spd: Math.floor(baseStats.spd * totalScaling), // Slower scaling for SPD
              def: Math.floor(baseStats.def * totalScaling * eliteMult),
              gen: 10, acc: 10 + Math.floor(diff / 10)
          },
          activeBuffs: []
      };
  };

  const generateItem = (currentFloor: number, diff: number, guaranteedRarity?: Rarity): Item => {
    const slots = [ItemSlot.WEAPON, ItemSlot.HEAD, ItemSlot.BODY, ItemSlot.ACCESSORY];
    const slot = slots[Math.floor(Math.random() * slots.length)];

    // 1. Calculate Rarity (Luck affected by Difficulty)
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

    // 2. Calculate Stat Multipliers
    const rarityMult = { [Rarity.COMMON]: 1, [Rarity.RARE]: 1.8, [Rarity.EPIC]: 3.5, [Rarity.LEGENDARY]: 6, [Rarity.CURSED]: 1 };
    // Quality Roll: 0.8x to 1.7x approx
    const qualityRoll = 0.8 + (Math.random() * 0.4) + (diff * 0.005); 
    
    const floorScaling = 1 + (currentFloor * 0.12);
    const finalMult = floorScaling * rarityMult[rarity] * qualityRoll;

    // 3. Affix
    let prefix = "";
    if (qualityRoll > 1.4) prefix = "Pristine ";
    else if (qualityRoll < 0.9) prefix = "Rusty ";
    else if (rarity === Rarity.LEGENDARY) prefix = "Sage's ";

    const baseName = BASE_ITEM_NAMES[slot][Math.floor(Math.random() * BASE_ITEM_NAMES[slot].length)];
    
    // 4. Assign Stats
    const mainStatVal = Math.floor((5 + Math.random() * 5) * finalMult);
    const subStatVal = Math.floor((2 + Math.random() * 3) * finalMult);
    
    const stats: Partial<Attributes> = {};
    
    switch (slot) {
        case ItemSlot.WEAPON:
            stats.str = mainStatVal;
            stats.acc = subStatVal; 
            // Chance for GEN on high quality weapons (Mental/Chakra blades)
            if (Math.random() > 0.7) stats.gen = Math.floor(subStatVal * 0.8); 
            break;
        case ItemSlot.HEAD:
            stats.def = Math.floor(mainStatVal * 0.7); 
            // 50% chance for GEN instead of INT on headgear
            if (Math.random() > 0.5) {
                stats.gen = subStatVal;
            } else {
                stats.int = subStatVal; 
            }
            break;
        case ItemSlot.BODY:
            stats.maxHp = mainStatVal * 12; 
            stats.def = subStatVal; 
            break;
        case ItemSlot.ACCESSORY:
            // Accessories split between SPEED and GENJUTSU focus
            if (Math.random() > 0.5) {
                stats.spd = mainStatVal; 
                stats.maxChakra = subStatVal * 8; 
            } else {
                stats.gen = mainStatVal; // Main stat GEN
                stats.int = Math.floor(subStatVal * 0.5); // Sub stat INT
            }
            break;
    }

    return {
      id: generateId(),
      name: `${prefix}${rarity !== Rarity.COMMON ? rarity + ' ' : ''}${baseName}`,
      type: slot,
      rarity,
      value: Math.floor(mainStatVal * 25),
      stats
    };
  };

  const generateSkillLoot = (enemyTier: string, currentFloor: number): Skill | null => {
      let possibleTiers: SkillTier[] = [SkillTier.COMMON];
      
      if (enemyTier === 'Chunin') {
          possibleTiers = [SkillTier.COMMON, SkillTier.RARE];
      } else if (enemyTier === 'Jonin') {
          possibleTiers = [SkillTier.RARE, SkillTier.EPIC];
      } else if (enemyTier === 'Akatsuki' || enemyTier === 'Kage Level' || enemyTier.includes('S-Rank')) {
          possibleTiers = [SkillTier.EPIC, SkillTier.LEGENDARY];
      } else if (enemyTier === 'Guardian') {
          possibleTiers = [SkillTier.FORBIDDEN];
      }

      const candidates = Object.values(SKILLS).filter(s => possibleTiers.includes(s.tier));
      if (candidates.length === 0) return SKILLS.SHURIKEN;

      return candidates[Math.floor(Math.random() * candidates.length)];
  };

  const generateRooms = (currentFloor: number, diff: number) => {
    const rooms: Room[] = [];
    const arc = getStoryArc(currentFloor);

    // --- 1. BOSS FLOORS (Narrative Checkpoints) ---
    if (currentFloor % 10 === 0) {
        let bossDesc = "A terrifying chakra pressure crushes the air.";
        if (arc.name === 'ACADEMY_ARC') bossDesc = "A rogue sensei blocks your graduation.";
        if (arc.name === 'WAVES_ARC') bossDesc = "The Mist Demon waits on the bridge.";
        if (arc.name === 'EXAMS_ARC') bossDesc = "The Proctor blocks your path. Only the strong pass.";
        if (arc.name === 'ROGUE_ARC') bossDesc = "The curse mark glows on your enemy.";
        if (arc.name === 'WAR_ARC') bossDesc = "A Reanimated Legend stands before you.";

        rooms.push({ 
            type: 'BOSS', 
            description: bossDesc, 
            enemy: generateEnemy(currentFloor, 'BOSS', diff) 
        });
        setRoomChoices(rooms);
        return;
    }

    // --- 2. DYNAMIC GENERATION ---
    const count = 3;
    
    for (let i = 0; i < count; i++) {
        const roll = Math.random();
        
        // -- SPECIAL: Rival Encounter (5% chance, increases in later arcs) --
        const rivalChance = arc.name === 'ROGUE_ARC' ? 0.15 : 0.05;
        if (roll < rivalChance && currentFloor > 5) {
             rooms.push({
                type: 'ELITE', // Reusing ELITE type for UI compatibility
                description: 'Your rival has found you. They look stronger...',
                enemy: {
                    ...generateEnemy(currentFloor, 'ELITE', diff + 20),
                    name: 'Rival Ninja',
                    tier: 'Fated Rival',
                    dropRateBonus: 100
                }
             });
             continue;
        }

        // -- OPTION A: The "Safe" Option (Rest or Training) --
        if (i === 0) {
            // In Chunin Exams (Forest of Death), Resting is dangerous/rare
            const restThreshold = arc.name === 'EXAMS_ARC' ? 0.2 : 0.4;
            
            if (Math.random() < restThreshold) {
                // 10% chance for ICHIRAKU RAMEN (Super Rest)
                if (Math.random() < 0.1) {
                    rooms.push({ 
                        type: 'EVENT', 
                        description: 'A hidden Ramen stand! The smell is divine.',
                        eventDefinition: {
                            id: 'ramen_shop', title: 'Ichiraku Ramen', description: 'Teuchi offers you a special bowl on the house.',
                            choices: [{ label: 'Eat Ramen', type: 'HEAL_ALL', description: 'Full Heal + Buff' }]
                        }
                    });
                } else {
                    rooms.push({ type: 'REST', description: 'A brief respite in the shadows.' });
                }
            } else {
                 // If not resting, it's TRAINING
                rooms.push({ 
                    type: 'EVENT',
                    description: 'A quiet spot suitable for training.',
                    eventDefinition: {
                        id: 'training_tree', title: 'Tree Climbing Practice', description: 'Focus your chakra to your feet.',
                        choices: [
                            { label: 'Train Hard', type: 'GAIN_XP', value: 50 + (currentFloor * 5), description: 'Gain XP' },
                            { label: 'Meditate', type: 'HEAL_CHAKRA', description: 'Restore Chakra' }
                        ]
                    }
                });
            }
            continue;
        }

        // -- OPTION B & C: The Danger Options --
        let ambushRate = 0.1 + (diff * 0.002);
        if (arc.name === 'WAR_ARC') ambushRate += 0.2; // War is chaotic

        if (roll < ambushRate) {
            rooms.push({ 
                type: 'AMBUSH', 
                description: arc.name === 'WAVES_ARC' ? 'Mist thickens around you...' : 'Killer Intent spikes nearby!', 
                enemy: generateEnemy(currentFloor, 'AMBUSH', diff) 
            });
        } else if (roll < ambushRate + 0.3) {
            // Thematic Events based on Arc
            const eventDef = EVENTS[Math.floor(Math.random() * EVENTS.length)]; 
            rooms.push({ type: 'EVENT', description: 'An odd occurrence.', eventDefinition: eventDef });
        } else {
            // Standard Combat
            const enemy = generateEnemy(currentFloor, 'NORMAL', diff);
            // Flavor text based on Arc
            let combatDesc = "A rogue ninja blocks the path.";
            if (arc.name === 'EXAMS_ARC') combatDesc = "Another team wants your scroll.";
            if (arc.name === 'WAR_ARC') combatDesc = "White Zetsu clones emerge!";
            
            rooms.push({ type: 'COMBAT', description: combatDesc, enemy: enemy });
        }
    }
    setRoomChoices(rooms);
  };

  // --- Flow Control ---
  const startGame = (clan: Clan) => {
    const baseStats = CLAN_STATS[clan];
    const startSkill = CLAN_START_SKILL[clan];
    
    const newPlayer: Player = {
        clan,
        level: 1,
        exp: 0,
        maxExp: 100,
        stats: { ...baseStats },
        element: clan === Clan.UCHIHA ? ElementType.FIRE : clan === Clan.UZUMAKI ? ElementType.WIND : clan === Clan.LEE ? ElementType.PHYSICAL : ElementType.PHYSICAL,
        ryo: 100,
        equipment: {
            [ItemSlot.WEAPON]: null, [ItemSlot.HEAD]: null, [ItemSlot.BODY]: null, [ItemSlot.ACCESSORY]: null,
        },
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
        if (!player || !effectiveStats) return;
        setPlayer({
            ...player,
            stats: { ...player.stats, hp: effectiveStats.maxHp, chakra: effectiveStats.maxChakra }
        });
        addLog(`You rested. HP & Chakra fully restored.`, 'gain');
        nextFloor();
    } else if (room.type === 'EVENT' && room.eventDefinition) {
        setActiveEvent(room.eventDefinition);
        setGameState(GameState.EVENT);
    } else if (['COMBAT', 'ELITE', 'BOSS', 'AMBUSH'].includes(room.type)) {
        if (room.enemy) {
            setEnemy(room.enemy);
            setTurnState('PLAYER');
            setGameState(GameState.COMBAT);
            addLog(`Engaged: ${room.enemy.name}`, 'danger');
            if (room.type === 'AMBUSH') addLog("DANGER! An S-Rank Rogue blocks your path!", 'danger');
        }
    }
  };

  const handleEventChoice = (choice: GameEventDefinition['choices'][0]) => {
    if (!player) return;

    const effStats = getEffectiveAttributes(player);
    let text = "";
    let type: LogEntry['type'] = 'info';
    let next = true;

    switch(choice.type) {
        case 'LEAVE':
            text = "You chose to leave.";
            break;
        case 'HEAL_CHAKRA':
            setPlayer(p => p ? ({ ...p, stats: { ...p.stats, chakra: effStats.maxChakra } }) : null);
            text = "You prayed and restored your Chakra.";
            type = 'gain';
            break;
        case 'HEAL_HP':
            const healAmt = Math.floor(effStats.maxHp * 0.3);
            setPlayer(p => p ? ({ ...p, stats: { ...p.stats, hp: Math.min(effStats.maxHp, p.stats.hp + healAmt) } }) : null);
            text = `You tended to your wounds. +${healAmt} HP.`;
            type = 'gain';
            break;
        case 'HEAL_ALL':
            setPlayer(p => p ? ({ ...p, stats: { ...p.stats, hp: effStats.maxHp, chakra: effStats.maxChakra } }) : null);
            text = "You meditated deeply. HP & Chakra fully restored.";
            type = 'gain';
            break;
        case 'GAIN_XP':
            const xpGain = choice.value || 20;
            setPlayer(prev => {
               if(!prev) return null;
               let updated = { ...prev, exp: prev.exp + xpGain };
               return checkLevelUp(updated);
            });
            text = `You trained hard. Gained ${xpGain} Experience.`;
            type = 'gain';
            break;
        case 'GAMBLE_HP':
             if (Math.random() < (choice.chance || 0.5)) {
                const gain = choice.value || 10;
                setPlayer(p => p ? ({ ...p, stats: { ...p.stats, maxHp: p.stats.maxHp + gain, hp: p.stats.hp + gain } }) : null);
                text = `Success! Max HP increased by ${gain}.`;
                type = 'gain';
             } else {
                const loss = Math.floor(player.stats.hp * 0.5);
                setPlayer(p => p ? ({ ...p, stats: { ...p.stats, hp: Math.max(1, p.stats.hp - loss) } }) : null);
                text = `Failure. You lost ${loss} HP in the experiment.`;
                type = 'danger';
             }
             break;
        case 'TRADE':
             if (player.ryo >= (choice.value || 150)) {
                 const item = generateItem(floor, difficulty, Rarity.RARE);
                 setPlayer(p => p ? ({ ...p, ryo: p.ryo - (choice.value || 150) }) : null);
                 setDroppedItems([item]);
                 setDroppedSkill(null);
                 setGameState(GameState.LOOT);
                 text = `You bought a mystery item: ${item.name}`;
                 type = 'loot';
                 next = false; 
             } else {
                 text = "Not enough Ryō.";
                 type = 'danger';
                 next = true; 
             }
             break;
        case 'FIGHT_GHOST':
             const ghost: Enemy = {
                 name: 'Vengeful Spirit', tier: 'Spirit', element: ElementType.WIND,
                 stats: { ...player.stats, hp: Math.floor(player.stats.maxHp * 0.8) }, 
                 skills: [SKILLS.BASIC_ATTACK, SKILLS.RASENGAN],
                 dropRateBonus: 20,
                 activeBuffs: []
             };
             setEnemy(ghost);
             setTurnState('PLAYER');
             setGameState(GameState.COMBAT);
             addLog("The spirit shrieks and attacks!", 'danger');
             next = false;
             break;
        case 'CHALLENGE_GUARDIAN':
             const guardian: Enemy = {
                 name: 'Temple Guardian', tier: 'Guardian', element: ElementType.FIRE,
                 stats: { 
                     hp: player.stats.maxHp * 1.5, maxHp: player.stats.maxHp * 1.5,
                     chakra: 1000, maxChakra: 1000,
                     str: player.stats.str * 1.2, int: player.stats.int * 1.2,
                     spd: player.stats.spd, def: player.stats.def, gen: 20, acc: 20
                 },
                 skills: [SKILLS.BASIC_ATTACK, SKILLS.FIREBALL, SKILLS.AMATERASU],
                 dropRateBonus: 100,
                 activeBuffs: []
             };
             setEnemy(guardian);
             setTurnState('PLAYER');
             setGameState(GameState.COMBAT);
             addLog("The Temple Guardian awakens with a roar!", 'danger');
             next = false;
             break;
    }
    
    if (next) {
        addLog(text, type);
        nextFloor();
    }
  };

  const nextFloor = () => {
    setFloor(f => f + 1);
    setPlayer(p => {
        if(!p) return null;
        const eff = getEffectiveAttributes(p);
        const intStat = eff.int;
        const newChakra = Math.min(eff.maxChakra, p.stats.chakra + intStat);
        const newHp = Math.min(eff.maxHp, p.stats.hp);
        return { ...p, stats: { ...p.stats, chakra: newChakra, hp: newHp } };
    });
    generateRooms(floor + 1, difficulty);
    setGameState(GameState.EXPLORE);
  };

  // --- Combat Logic ---
  const applyEffects = (effects: EffectDefinition[], targetType: 'PLAYER' | 'ENEMY', sourceId: string = 'Skill', pRef: Player, eRef: Enemy) => {
      const newPBuffs = [...pRef.activeBuffs];
      const newEBuffs = [...eRef.activeBuffs];
      
      effects.forEach(eff => {
          if (Math.random() <= eff.chance) {
              const name = eff.targetStat ? `${eff.targetStat} ${eff.value && eff.value > 0 ? 'Up' : 'Down'}` : eff.type;
              // Determine name based on effect type
              let buffName = name;
              if (eff.type === EffectType.DOT) buffName = "DoT";
              if (eff.type === EffectType.STUN) buffName = "Stun";
              if (eff.type === EffectType.CONFUSION) buffName = "Confused";
              if (eff.type === EffectType.SILENCE) buffName = "Silenced";

              const buff: Buff = {
                  id: generateId(),
                  name: buffName,
                  duration: eff.duration,
                  effect: eff,
                  source: sourceId
              };

              if (targetType === 'PLAYER') {
                  newPBuffs.push(buff);
                  addLog(`You gained ${buffName}!`, 'gain');
              } else {
                  newEBuffs.push(buff);
                  addLog(`Enemy afflicted with ${buffName}!`, 'gain');
              }
          }
      });
      
      return { newPBuffs, newEBuffs };
  };

  const processTurnEffects = (p: Player, e: Enemy) => {
      let newPlayer = { ...p };
      let newEnemy = { ...e };
      let newBuffs: Buff[] = [];
      let newEnemyBuffs: Buff[] = [];

      // 1. Toggle Upkeep
      const activeToggles = p.skills.filter(s => s.isToggle && s.isActive);
      let totalUpkeep = 0;
      activeToggles.forEach(s => totalUpkeep += (s.upkeepCost || 0));
      
      if (totalUpkeep > 0) {
          if (p.stats.chakra >= totalUpkeep) {
              newPlayer.stats.chakra -= totalUpkeep;
          } else {
              // Deactivate all toggles
              newPlayer.skills = newPlayer.skills.map(s => s.isToggle ? { ...s, isActive: false } : s);
              // Remove buffs
              const toggleIds = activeToggles.map(s => s.id);
              newPlayer.activeBuffs = newPlayer.activeBuffs.filter(b => !toggleIds.includes(b.source));
              addLog("Chakra depleted! Toggles deactivated.", 'danger');
          }
      }
      
      // 2. Process Player Buffs
      p.activeBuffs.forEach(buff => {
          if (buff.effect.type === EffectType.DOT && buff.effect.value) {
              newPlayer.stats.hp -= buff.effect.value;
              addLog(`You took ${buff.effect.value} damage from ${buff.name}.`, 'danger');
          }
          if (buff.duration === -1) {
              newBuffs.push(buff);
          } else if (buff.duration > 1) {
              newBuffs.push({ ...buff, duration: buff.duration - 1 });
          }
      });
      newPlayer.activeBuffs = newBuffs;

      // 3. Process Enemy Buffs
      e.activeBuffs.forEach(buff => {
          if (buff.effect.type === EffectType.DOT && buff.effect.value) {
              newEnemy.stats.hp -= buff.effect.value;
              addLog(`${e.name} took ${buff.effect.value} damage from ${buff.name}.`, 'combat');
          }
          if (buff.duration > 1) newEnemyBuffs.push({ ...buff, duration: buff.duration - 1 });
      });
      newEnemy.activeBuffs = newEnemyBuffs;

      return { newPlayer, newEnemy };
  };

  const useSkill = (skill: Skill) => {
    if (!player || !enemy) return;

    const effStats = getEffectiveAttributes(player);

    // Handle Toggle
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
                         if (Math.random() <= eff.chance) {
                             const name = eff.targetStat ? `${eff.targetStat} Up` : eff.type;
                             newBuffs.push({
                                 id: generateId(),
                                 name: name,
                                 duration: eff.duration,
                                 effect: eff,
                                 source: skill.id
                             });
                             addLog(`You gained ${name}!`, 'gain');
                         }
                    });
                }
            }
            return { ...prev, skills: newSkills, activeBuffs: newBuffs };
        });
        setTurnState('ENEMY_TURN'); // Toggle uses turn
        return;
    }

    // Resource Check
    if (player.stats.chakra < skill.chakraCost || player.stats.hp <= skill.hpCost) {
        addLog("Insufficient Chakra or HP!", 'danger');
        return;
    }
    if (skill.currentCooldown > 0) return;

    const isStunned = player.activeBuffs.some(b => b.effect.type === EffectType.STUN);
    if (isStunned) {
        addLog("You are stunned and cannot move!", 'danger');
        setTurnState('ENEMY_TURN');
        return;
    }

    // Player Action
    const pStats = { ...player.stats, chakra: player.stats.chakra - skill.chakraCost, hp: player.stats.hp - skill.hpCost };
    const { damage, isCrit, elMult, isMiss } = calculateDamage(effStats, enemy.stats, skill, player.element, enemy.element);
    
    let logMsg = '';
    let newEnemyHp = enemy.stats.hp;
    let finalEnemy = { ...enemy };
    let finalPlayer = { ...player, stats: pStats };

    if (isMiss) {
        logMsg = `You used ${skill.name} but missed!`;
        addLog(logMsg, 'info');
    } else {
        newEnemyHp -= damage;
        logMsg = `Used ${skill.name} for ${damage} dmg.`;
        if (elMult > 1.0) logMsg += " Super Effective!";
        else if (elMult < 1.0) logMsg += " Resisted.";
        if (isCrit) logMsg += " CRITICAL!";
        addLog(logMsg, 'combat');

        // Apply Effects
        if (skill.effects) {
            const { newPBuffs, newEBuffs } = applyEffects(skill.effects, 'ENEMY', skill.name, finalPlayer, finalEnemy);
            // Apply beneficial to player, negative to enemy
            // Simplified logic: Skill definition determines target implicitly by type usually, but here we need explicit handling
            // We'll assume skill effects target enemy unless type is BUFF/HEAL
            
            skill.effects.forEach(eff => {
                if (eff.type === EffectType.BUFF || eff.type === EffectType.HEAL) {
                    // Beneficial to Player
                     if (Math.random() <= eff.chance) {
                         const buff: Buff = { id: generateId(), name: `${eff.targetStat || eff.type} Up`, duration: eff.duration, effect: eff, source: skill.name };
                         finalPlayer.activeBuffs = [...finalPlayer.activeBuffs, buff];
                         addLog(`You gained ${buff.name}!`, 'gain');
                     }
                } else {
                    // Harmful to Enemy
                    if (Math.random() <= eff.chance) {
                         const buff: Buff = { id: generateId(), name: `${eff.targetStat || eff.type}`, duration: eff.duration, effect: eff, source: skill.name };
                         finalEnemy.activeBuffs = [...finalEnemy.activeBuffs, buff];
                         addLog(`Enemy afflicted with ${buff.name}!`, 'gain');
                    }
                }
            });
        }
    }

    // Update Cooldowns
    finalPlayer.skills = finalPlayer.skills.map(s => s.id === skill.id ? { ...s, currentCooldown: s.cooldown + 1 } : s);

    if (newEnemyHp <= 0) {
        finalEnemy.stats.hp = 0;
        setEnemy(finalEnemy);
        setPlayer(finalPlayer);
        handleVictory();
    } else {
        finalEnemy.stats.hp = newEnemyHp;
        setEnemy(finalEnemy);
        setPlayer(finalPlayer);
        setTurnState('ENEMY_TURN');
    }
  };

  // --- Enemy Turn Effect ---
  useEffect(() => {
    if (turnState === 'ENEMY_TURN' && player && enemy) {
        const timer = setTimeout(() => {
            // 1. Process DoTs/Durations (Start of Turn)
            // Note: We process player and enemy effects at start of Enemy Turn (simplification of "Round")
            const { newPlayer: processedP, newEnemy: processedE } = processTurnEffects(player, enemy);

            // Check Deaths from DoTs
            if (processedE.stats.hp <= 0) {
                setPlayer(processedP);
                setEnemy(processedE); // Visual update before victory
                handleVictory();
                setTurnState('PLAYER');
                return;
            }
            if (processedP.stats.hp <= 0) {
                setGameState(GameState.GAME_OVER);
                return;
            }

            // 2. Enemy Action
            const isStunned = processedE.activeBuffs.some(b => b.effect.type === EffectType.STUN);
            const isConfused = processedE.activeBuffs.some(b => b.effect.type === EffectType.CONFUSION);
            const isSilenced = processedE.activeBuffs.some(b => b.effect.type === EffectType.SILENCE);

            let finalP = { ...processedP };
            let finalE = { ...processedE };

            if (isStunned) {
                addLog(`${processedE.name} is stunned!`, 'gain');
            } else if (isConfused && Math.random() < 0.5) {
                 // Confusion Hit Self
                 const confusionDmg = Math.floor(processedE.stats.str * 0.5);
                 finalE.stats.hp -= confusionDmg;
                 addLog(`${processedE.name} is confused and hurt itself for ${confusionDmg} damage!`, 'gain');
            } else {
                // Standard Turn
                // Filter skills based on Silence
                let availableSkills = processedE.skills;
                if (isSilenced) {
                    availableSkills = processedE.skills.filter(s => s.id === 'basic_atk' || s.chakraCost === 0);
                    if (availableSkills.length === 0) availableSkills = [SKILLS.BASIC_ATTACK]; // Fallback
                    addLog(`${processedE.name} is silenced and forced to use Taijutsu!`, 'gain');
                }

                const skill = availableSkills[Math.floor(Math.random() * availableSkills.length)];
                const defStats = getEffectiveAttributes(processedP);

                const { damage, isCrit, isMiss } = calculateDamage(processedE.stats, defStats, skill, processedE.element, processedP.element);

                if (isMiss) {
                    addLog(`${processedE.name} used ${skill.name} but missed you!`, 'gain');
                } else {
                    finalP.stats.hp -= damage;
                    let msg = `${processedE.name} used ${skill.name} for ${damage} dmg!`;
                    if (isCrit) msg += " Crit!";
                    addLog(msg, 'danger');

                    if (skill.effects) {
                        skill.effects.forEach(eff => {
                            if (Math.random() <= eff.chance) {
                                const isBeneficial = eff.type === EffectType.BUFF || eff.type === EffectType.HEAL;
                                const buff: Buff = { id: generateId(), name: eff.type, duration: eff.duration, effect: eff, source: 'Enemy' };
                                if (!isBeneficial) {
                                    finalP.activeBuffs = [...finalP.activeBuffs, buff];
                                    addLog(`You are afflicted with ${eff.type}!`, 'danger');
                                }
                            }
                        });
                    }
                }
            }

            // Check Death from Attack or Self-Hit
            if (finalE.stats.hp <= 0) {
                setPlayer(finalP);
                setEnemy(finalE); 
                handleVictory();
                setTurnState('PLAYER');
                return;
            }
            if (finalP.stats.hp <= 0) {
                setGameState(GameState.GAME_OVER);
                return;
            }

            // 3. Cooldowns & Regen
            finalP.skills = finalP.skills.map(s => ({ ...s, currentCooldown: Math.max(0, s.currentCooldown - 1) }));
            const regen = Math.floor(getEffectiveAttributes(finalP).int * 0.15);
            finalP.stats.chakra = Math.min(getEffectiveAttributes(finalP).maxChakra, finalP.stats.chakra + regen);

            setPlayer(finalP);
            setEnemy(finalE);
            setTurnState('PLAYER');

        }, 800);

        return () => clearTimeout(timer);
    }
  }, [turnState, player, enemy]); // Effect runs when turnState becomes ENEMY_TURN
  
  const passTurn = () => {
    addLog("You focus on defense and wait.", 'info');
    setTurnState('ENEMY_TURN');
  };

  const handleVictory = () => {
    addLog("Enemy Defeated!", 'gain');
    
    setEnemy(null); // Clear immediately prevents multiple triggers from effects
    
    setPlayer(prev => {
        if (!prev) return null;
        
        const isBoss = enemy?.isBoss;
        const isAmbush = enemy?.tier.includes('S-Rank');
        const isGuardian = enemy?.tier === 'Guardian';
        const enemyTier = enemy?.tier || 'Chunin';

        const baseExp = 25 + (floor * 5);
        const tierBonus = isGuardian ? 300 : enemyTier === 'Jonin' ? 20 : enemyTier === 'Akatsuki' || enemyTier === 'Kage Level' ? 200 : isAmbush ? 100 : 0;
        const expGain = baseExp + tierBonus;
        
        let updatedPlayer = { ...prev, exp: prev.exp + expGain };
        addLog(`Gained ${expGain} Experience.`, 'info');

        updatedPlayer = checkLevelUp(updatedPlayer);

        const ryoGain = (floor * 15) + Math.floor(Math.random() * 25);
        updatedPlayer.ryo += ryoGain;
        
        // Generate Loot
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
        if(!prev) return null;
        
        const getItemHp = (it: Item | null) => (it?.stats?.maxHp || it?.stats?.hp || 0);
        const oldItem = prev.equipment[item.type];
        const hpDiff = getItemHp(item) - getItemHp(oldItem);
        
        const newEquip = { ...prev.equipment, [item.type]: item };
        
        // Recover HP if new item grants MaxHP
        const newHp = prev.stats.hp + hpDiff;

        return { 
            ...prev, 
            equipment: newEquip,
            stats: { ...prev.stats, hp: newHp }
        };
    });
    
    addLog(`Equipped ${item.name}.`, 'loot');
    nextFloor();
  };

  const learnSkill = (skill: Skill, slotIndex?: number) => {
      if (!player) return;
      
      let newSkills = [...player.skills];
      const existingIndex = newSkills.findIndex(s => s.id === skill.id);

      if (existingIndex !== -1) {
          // Upgrade Logic
          const existing = newSkills[existingIndex];
          const currentLevel = existing.level || 1;
          
          // Growth logic: +20% base damage per level (additive relative to base)
          const growth = skill.damageMult * 0.2; 
          const newDamageMult = existing.damageMult + growth;
          
          // Boost effects if any
          let newEffects = existing.effects;
          if (newEffects) {
             newEffects = newEffects.map(e => ({
                 ...e,
                 value: e.value ? e.value * 1.1 : e.value // 10% potency increase
             }));
          }

          newSkills[existingIndex] = {
              ...existing,
              level: currentLevel + 1,
              damageMult: newDamageMult,
              effects: newEffects
          };
          addLog(`Upgraded ${existing.name} to Level ${currentLevel + 1}!`, 'gain');
      } else {
          if (slotIndex !== undefined) {
              addLog(`Forgot ${newSkills[slotIndex].name} to learn ${skill.name}.`, 'loot');
              newSkills[slotIndex] = { ...skill, level: 1 };
          } else {
              if (newSkills.length < 4) {
                  newSkills.push({ ...skill, level: 1 });
                  addLog(`Learned ${skill.name}.`, 'loot');
              } else {
                  return; 
              }
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
  const renderRoomCard = (room: Room, index: number) => {
      let borderColor = 'border-zinc-800';
      let bgColor = 'bg-black/60';
      let icon = <HelpCircle size={32} className="text-gray-600" />;
      let titleColor = 'text-gray-400';
      let shadow = '';

      switch (room.type) {
          case 'BOSS':
              borderColor = 'border-red-900';
              bgColor = 'bg-red-950/20';
              icon = <Skull size={48} className="text-red-600 animate-pulse" />;
              titleColor = 'text-red-500';
              shadow = 'shadow-[0_0_30px_rgba(153,27,27,0.2)]';
              break;
          case 'AMBUSH':
              borderColor = 'border-purple-900';
              bgColor = 'bg-purple-950/20';
              icon = <Flame size={48} className="text-purple-600" />;
              titleColor = 'text-purple-500';
              shadow = 'shadow-[0_0_20px_rgba(147,51,234,0.15)]';
              break;
          case 'ELITE':
              borderColor = 'border-yellow-800';
              icon = <Sword size={40} className="text-yellow-600" />;
              titleColor = 'text-yellow-600';
              break;
          case 'REST':
              borderColor = 'border-green-900';
              icon = <Heart size={40} className="text-green-600" />;
              titleColor = 'text-green-600';
              break;
          case 'EVENT':
              borderColor = 'border-blue-900';
              icon = <MapIcon size={40} className="text-blue-600" />;
              titleColor = 'text-blue-500';
              
              // Custom Icons for Training/Ramen
              if (room.eventDefinition?.id === 'training_tree') icon = <Target size={40} className="text-emerald-500" />;
              if (room.eventDefinition?.id === 'ramen_shop') icon = <div className="text-3xl">🍜</div>;
              break;
          default:
              icon = <Ghost size={32} className="text-zinc-600" />;
      }

      return (
        <button 
            key={index}
            onClick={() => selectRoom(room)}
            className={`
                relative h-72 p-6 rounded border-2 flex flex-col items-center justify-center transition-all duration-500 hover:scale-[1.02]
                ${borderColor} ${bgColor} ${shadow} hover:bg-zinc-900 group overflow-hidden
            `}
        >
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/80"></div>
            <div className="z-10 flex flex-col items-center gap-4">
                <div className="p-4 rounded-full bg-black/50 border border-zinc-800 group-hover:border-zinc-600 transition-colors">
                    {icon}
                </div>
                <div className="text-center">
                    <div className={`font-serif text-xl font-bold tracking-widest mb-2 ${titleColor}`}>
                        {room.eventDefinition?.title || room.type}
                    </div>
                    <div className="text-xs font-mono text-zinc-500 max-w-[150px] leading-tight">{room.description}</div>
                </div>
            </div>
        </button>
      );
  };

  // --- Main Render ---

  if (gameState === GameState.MENU) {
    return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center relative font-sans selection:bg-red-900">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-900 via-black to-black opacity-80"></div>
            <div className="z-10 flex flex-col items-center w-full max-w-md px-6">
                <div className="mb-8 p-6 border-4 border-double border-red-900 bg-black/80 transform rotate-1">
                    <h1 className="text-6xl md:text-8xl font-black text-red-800 tracking-tighter" style={{ textShadow: '4px 4px 0px #000' }}>
                        SHINOBI WAY
                    </h1>
                </div>
                <p className="text-sm text-zinc-500 tracking-[0.8em] mb-12 uppercase text-center">The Infinite Tower Awaits</p>
                
                {/* Difficulty Slider */}
                <div className="w-full mb-12 p-6 bg-zinc-900/50 border border-zinc-800 rounded">
                    <div className="flex justify-between items-end mb-4">
                        <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Mission Difficulty</label>
                        <span className={`text-2xl font-black ${
                            difficulty < 30 ? 'text-green-500' : 
                            difficulty < 60 ? 'text-yellow-500' : 
                            difficulty < 85 ? 'text-orange-500' : 'text-red-600'
                        }`}>
                            Rank {difficulty < 30 ? 'D' : difficulty < 60 ? 'C' : difficulty < 85 ? 'B' : 'S'}
                        </span>
                    </div>
                    <input 
                        type="range" 
                        min="0" 
                        max="100" 
                        value={difficulty} 
                        onChange={(e) => setDifficulty(parseInt(e.target.value))} 
                        className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-red-700"
                    />
                    <div className="mt-2 flex justify-between text-[10px] text-zinc-600 font-mono">
                        <span>Safe</span>
                        <span>Standard</span>
                        <span>Deadly</span>
                    </div>
                    <div className="mt-4 text-xs text-zinc-500 text-center italic">
                        {difficulty < 30 ? "For new genin. Safer path." : 
                         difficulty < 60 ? "Standard mission parameters." : 
                         difficulty < 85 ? "High risk. High reward." : "Suicide mission. Legendary loot awaits."}
                    </div>
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full max-w-7xl">
                  {Object.values(Clan).map(clan => {
                      const startSkill = CLAN_START_SKILL[clan];
                      const baseStat = CLAN_STATS[clan][startSkill.scalingStat.toLowerCase() as keyof Attributes];
                      const basePower = Math.floor(baseStat * startSkill.damageMult);
                      
                      return (
                      <button key={clan} onClick={() => startGame(clan)} 
                        className="h-96 bg-black border border-zinc-800 hover:border-red-900 p-8 flex flex-col items-start justify-between transition-all group hover:bg-zinc-900 relative overflow-hidden">
                          <div className="absolute -right-12 -top-12 text-9xl font-black text-zinc-900 opacity-20 group-hover:opacity-10 transition-opacity select-none">
                              {clan.charAt(0)}
                          </div>
                          <div className="z-10 w-full">
                            <h3 className="text-3xl font-black text-zinc-200 mb-2 group-hover:text-red-600 transition-colors">{clan}</h3>
                            <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-6 border-b border-zinc-800 pb-2 flex items-center justify-between w-full gap-4">
                                <span className="truncate">{startSkill.name} Style</span>
                                {basePower > 0 && (
                                    <span className="text-zinc-400 whitespace-nowrap bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">
                                        Pwr: {basePower}
                                    </span>
                                )}
                            </div>
                            <div className="space-y-2 font-mono text-xs text-zinc-400">
                                <div className="flex justify-between"><span>HP</span> <span className="text-zinc-200">{CLAN_STATS[clan].hp}</span></div>
                                <div className="flex justify-between"><span>CHAKRA</span> <span className="text-zinc-200">{CLAN_STATS[clan].chakra}</span></div>
                                <div className="flex justify-between"><span>STR</span> <span className="text-zinc-200">{CLAN_STATS[clan].str}</span></div>
                                <div className="flex justify-between"><span>INT</span> <span className="text-zinc-200">{CLAN_STATS[clan].int}</span></div>
                            </div>
                          </div>
                          <div className="w-full pt-4 border-t border-zinc-800 text-xs text-zinc-600 uppercase tracking-wider group-hover:text-red-800 transition-colors z-10">
                              Begin Journey
                          </div>
                      </button>
                  )})}
              </div>
          </div>
      );
  }

  if (gameState === GameState.GAME_OVER) {
      return (
        <div className="min-h-screen bg-black text-red-700 flex flex-col items-center justify-center font-mono relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/diagmonds-light.png')] opacity-10 pointer-events-none"></div>
            <div className="z-10 flex flex-col items-center relative">
                <Skull size={64} className="mb-6 text-zinc-800" />
                <h1 className="text-6xl font-bold mb-4 tracking-tighter">DEATH</h1>
                <div className="w-16 h-1 bg-red-900 mb-8"></div>
                <p className="text-zinc-500 mb-12 text-xl">You fell on Floor {floor} (Level {player?.level})</p>
                <button onClick={() => {
                    setGameState(GameState.MENU);
                    setPlayer(null);
                    setEnemy(null);
                    setDroppedItems([]);
                    setDroppedSkill(null);
                }} className="relative z-50 px-12 py-4 border border-zinc-800 text-zinc-400 hover:bg-zinc-900 hover:text-white hover:border-zinc-600 transition-all uppercase tracking-widest text-sm cursor-pointer pointer-events-auto">
                    Try Again
                </button>
            </div>
        </div>
      );
  }

  return (
    <div className="h-screen bg-black text-gray-300 flex overflow-hidden font-sans">
        {/* Left Panel - Character */}
        <div className="hidden lg:flex w-[350px] flex-col border-r border-zinc-900 bg-zinc-950 p-6 overflow-y-auto custom-scrollbar">
            
            {/* Arc Indicator */}
            <div className="mb-6 text-center border-b border-zinc-900 pb-4">
                <div className="text-[10px] text-zinc-500 uppercase tracking-[0.3em] font-bold mb-1">
                    Current Arc
                </div>
                <div className="text-lg font-serif text-zinc-200 font-bold tracking-wide">
                    {getStoryArc(floor).label}
                </div>
                <div className="text-[10px] text-zinc-600 font-mono mt-1">
                    Biome: {getStoryArc(floor).biome}
                </div>
            </div>

            <div className="mb-8 flex flex-col gap-2 border-b border-zinc-900 pb-6">
                <div className="flex items-baseline justify-between">
                    <span className="text-xs text-zinc-600 uppercase tracking-widest font-bold">Floor</span>
                    <span className="text-5xl font-black text-zinc-200 font-serif">{floor}</span>
                </div>
                {player && (
                    <div className="mt-2">
                        <div className="flex items-baseline justify-between mb-1">
                            <span className="text-xs text-yellow-700 uppercase tracking-widest font-bold">Level</span>
                            <span className="text-xl font-bold text-yellow-500 font-mono">{player.level}</span>
                        </div>
                        <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                            <div className="h-full bg-yellow-600" style={{ width: `${(player.exp / player.maxExp) * 100}%` }}></div>
                        </div>
                        <div className="flex justify-end text-[10px] text-zinc-600 font-mono mt-1">
                            {player.exp} / {player.maxExp} XP
                        </div>
                    </div>
                )}
            </div>
            {player && effectiveStats && (
                <div className="flex-1 flex flex-col gap-6">
                    <div className="space-y-2">
                        <StatBar current={player.stats.hp} max={effectiveStats.maxHp} label="Health" color="green" />
                        <StatBar current={player.stats.chakra} max={effectiveStats.maxChakra} label="Chakra" color="blue" />
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        {player.activeBuffs.map(buff => (
                             <Tooltip key={buff.id} className="w-fit" content={<div className="text-xs p-2 max-w-[200px] font-mono">{getBuffDescription(buff)}</div>}>
                                 <div className="px-2 py-1 bg-zinc-900 border border-zinc-700 text-[10px] text-zinc-300 rounded flex gap-1 items-center cursor-help">
                                     {buff.effect.type === EffectType.STUN && <span className="text-yellow-500 font-bold">!</span>}
                                     <span>{buff.name} {buff.duration === -1 ? '(∞)' : `(${buff.duration})`}</span>
                                 </div>
                             </Tooltip>
                        ))}
                    </div>
                    <CharacterSheet player={player} effectiveStats={effectiveStats} />
                </div>
            )}
        </div>

        {/* Center Panel - Main Viewport */}
        <div className="flex-1 flex flex-col relative bg-zinc-950">
            {/* Mobile Header */}
            <div className="lg:hidden h-14 border-b border-zinc-900 flex items-center justify-between px-4 bg-black">
                <div className="flex gap-4">
                    <span className="font-bold text-zinc-200">FL {floor}</span>
                    <span className="text-yellow-600 font-bold">LVL {player?.level}</span>
                </div>
                <div className="text-xs flex flex-col items-end">
                    <span>{player?.stats.hp} HP</span>
                    <span className="text-[8px] text-zinc-500 uppercase">{getStoryArc(floor).label}</span>
                </div>
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
                {gameState === GameState.COMBAT && player && enemy && effectiveStats && (
                    <div className="w-full max-w-4xl z-10 flex flex-col h-full justify-center">
                         {/* Enemy Visual */}
                         <div className="mb-12 flex flex-col items-center justify-center relative gap-6">
                            <div className="flex flex-col md:flex-row items-center gap-8 w-full">
                              {/* Enemy Portrait / Generator */}
                              <div className="relative w-48 h-48 shrink-0 bg-black border border-zinc-800 flex items-center justify-center overflow-hidden group shadow-[0_0_20px_rgba(0,0,0,0.5)]">
                                {enemy.image ? (
                                  <img src={enemy.image} alt={enemy.name} className="w-full h-full object-cover animate-fade-in" />
                                ) : (
                                  <div className="flex flex-col items-center gap-2 p-4 w-full">
                                     {isGeneratingImage ? (
                                       <Loader className="animate-spin text-zinc-500" size={32} />
                                     ) : (
                                       <>
                                        <ImageIcon className="text-zinc-700 mb-1" size={32} />
                                        <div className="flex gap-1 mb-2 w-full justify-center">
                                            {(['1K', '2K', '4K'] as const).map(size => (
                                                <button 
                                                  key={size}
                                                  onClick={() => setGenImageSize(size)}
                                                  className={`text-[10px] px-1.5 py-0.5 border ${genImageSize === size ? 'border-blue-500 text-blue-400 bg-blue-950/30' : 'border-zinc-800 text-zinc-600 hover:border-zinc-600'}`}
                                                >
                                                    {size}
                                                </button>
                                            ))}
                                        </div>
                                        <button 
                                          onClick={generateEnemyImage}
                                          className="text-[10px] uppercase tracking-widest border border-zinc-700 hover:border-blue-500 hover:text-blue-400 hover:bg-blue-950/20 text-zinc-500 px-3 py-1.5 transition-all w-full"
                                        >
                                          Visualize
                                        </button>
                                       </>
                                     )}
                                  </div>
                                )}
                                {/* Frame Decoration */}
                                <div className="absolute inset-0 border-2 border-zinc-800 pointer-events-none"></div>
                              </div>

                              {/* Enemy Stats */}
                              <div className="flex-1 w-full">
                                <div className={`text-4xl font-black mb-4 tracking-tight uppercase ${enemy.isBoss ? 'text-red-600' : 'text-zinc-200'}`}>{enemy.name}</div>
                                <div className="w-full max-w-md mb-2">
                                    <StatBar current={enemy.stats.hp} max={enemy.stats.maxHp} label="" color="red" />
                                </div>
                                <div className="flex gap-6 text-xs font-mono uppercase tracking-widest text-zinc-500 mb-2">
                                    <span>{enemy.tier}</span>
                                    <span>Affinity: <span className="text-zinc-300">{enemy.element}</span></span>
                                </div>
                                {/* Enemy Buffs */}
                                <div className="flex gap-2 h-6 flex-wrap">
                                    {enemy.activeBuffs.map(buff => (
                                        <Tooltip key={buff.id} className="w-fit" content={<div className="text-xs p-2 max-w-[200px] font-mono text-red-200">{getBuffDescription(buff)}</div>}>
                                            <div className="px-2 py-0.5 bg-red-950 border border-red-900 text-[9px] text-red-300 rounded flex gap-1 items-center cursor-help">
                                                {buff.name} {buff.duration === -1 ? '' : `(${buff.duration})`}
                                            </div>
                                        </Tooltip>
                                    ))}
                                </div>
                              </div>
                            </div>
                         </div>

                         {/* Skills Grid */}
                         <div className="mt-auto grid grid-cols-2 md:grid-cols-4 gap-4">
                             {player.skills.map(skill => {
                                 const canUse = player.stats.chakra >= skill.chakraCost && player.stats.hp > skill.hpCost && skill.currentCooldown === 0;
                                 const isStunned = player.activeBuffs.some(b => b.effect.type === EffectType.STUN);
                                 const isEnemyTurn = turnState === 'ENEMY_TURN';

                                 let displayDmg = 0;
                                 let rawDmg = 0;
                                 
                                 // Calculate Predicted Damage against current enemy
                                 const prediction = calculateDamage(effectiveStats, enemy.stats, skill, player.element, enemy.element);
                                 displayDmg = prediction.damage;
                                 rawDmg = prediction.rawDamage;
                                 
                                 return (
                                     <Tooltip 
                                        key={skill.id}
                                        content={
                                            <div className="space-y-2 p-1">
                                                <div className="font-bold text-zinc-200 flex justify-between">
                                                    <span>{skill.name}</span>
                                                    <span className="text-yellow-500">Lv.{skill.level || 1}</span>
                                                </div>
                                                <div className="text-xs text-zinc-400">{skill.description}</div>
                                                <div className="border-t border-zinc-700 my-2 pt-2 space-y-1 text-[10px] font-mono text-zinc-500">
                                                    <div className="flex justify-between"><span>Scaling</span> <span className="text-zinc-300">{skill.scalingStat} x{skill.damageMult.toFixed(1)}</span></div>
                                                    <div className="flex justify-between"><span>Base Power</span> <span className="text-zinc-300">{rawDmg}</span></div>
                                                    <div className="flex justify-between"><span>Vs Defense</span> <span className="text-zinc-300">-{Math.round(rawDmg - displayDmg)}</span></div>
                                                    {prediction.elMult > 1 && <div className="text-green-500">Super Effective (x1.5)</div>}
                                                    {prediction.elMult < 1 && <div className="text-red-500">Resisted (x0.5)</div>}
                                                </div>
                                            </div>
                                        }
                                     >
                                     <button
                                         onClick={() => useSkill(skill)}
                                         disabled={(!canUse && !skill.isActive) || isStunned || isEnemyTurn}
                                         className={`
                                             w-full relative p-4 h-36 text-left border transition-all group flex flex-col justify-between overflow-hidden
                                             ${(canUse || skill.isActive) && !isStunned && !isEnemyTurn
                                                ? 'bg-zinc-900 border-zinc-800 hover:border-zinc-500 hover:bg-zinc-800' 
                                                : 'bg-black border-zinc-900 opacity-40 cursor-not-allowed'}
                                             ${skill.isToggle && skill.isActive ? 'border-blue-500 bg-blue-900/20' : ''}
                                         `}
                                     >
                                         <div className="relative z-10">
                                            <div className="flex justify-between items-start">
                                                <div className="font-bold text-sm text-zinc-200 mb-1">{skill.name}</div>
                                                {(skill.level || 1) > 1 && <div className="text-[9px] text-yellow-500 font-mono">Lv.{skill.level}</div>}
                                            </div>
                                            <div className="text-[10px] text-zinc-500 uppercase flex items-center gap-2">
                                                {skill.element}
                                            </div>
                                         </div>
                                         
                                         {/* Power Indicator */}
                                         <div className="absolute right-3 top-1/2 -translate-y-1/2 text-right pointer-events-none">
                                             <div className="text-[9px] font-black uppercase text-zinc-700 tracking-widest group-hover:text-zinc-500 transition-colors">DMG</div>
                                             <div className="text-3xl font-black font-serif text-zinc-800 group-hover:text-zinc-600 transition-colors leading-none">{displayDmg > 0 ? displayDmg : '-'}</div>
                                             {skill.critBonus && <div className="text-[8px] text-yellow-700 font-bold mt-1">+Crit</div>}
                                         </div>

                                         <div className="flex justify-between text-xs font-mono relative z-10 mt-auto">
                                             <span className={skill.chakraCost > 0 ? "text-blue-400" : "text-zinc-700"}>{skill.chakraCost > 0 ? `${skill.chakraCost} CP` : '-'}</span>
                                             <span className={skill.hpCost > 0 ? "text-red-400" : "text-zinc-700"}>{skill.hpCost > 0 ? `${skill.hpCost} HP` : '-'}</span>
                                         </div>
                                         
                                         {skill.currentCooldown > 0 && (
                                             <div className="absolute inset-0 bg-black/90 flex items-center justify-center text-3xl font-black text-zinc-700 z-20">
                                                 {skill.currentCooldown}
                                             </div>
                                         )}
                                         {skill.isToggle && (
                                             <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                                         )}
                                     </button>
                                     </Tooltip>
                                 )
                             })}
                         </div>
                         <div className="mt-4 flex justify-center">
                             <button 
                                 onClick={passTurn}
                                 disabled={turnState === 'ENEMY_TURN'}
                                 className={`flex items-center gap-3 px-6 py-3 bg-black border border-zinc-800 transition-all group
                                  ${turnState === 'ENEMY_TURN' ? 'opacity-50 cursor-wait' : 'hover:border-zinc-600 hover:bg-zinc-900'}
                                 `}
                             >
                                 <Hourglass size={14} className="text-zinc-600 group-hover:text-zinc-300" />
                                 <span className="text-xs font-bold text-zinc-500 group-hover:text-zinc-200 uppercase tracking-widest">
                                     {turnState === 'ENEMY_TURN' ? 'Enemy Turn...' : 'Pass Turn'}
                                 </span>
                             </button>
                         </div>
                    </div>
                )}

                {/* Event State */}
                {gameState === GameState.EVENT && activeEvent && (
                    <div className="w-full max-w-2xl bg-black border border-zinc-800 p-12 shadow-2xl z-10 flex flex-col items-center text-center">
                        <div className="mb-6 text-blue-900 opacity-50"><MapIcon size={64} /></div>
                        <h2 className="text-3xl font-bold text-zinc-200 mb-6 font-serif tracking-wide">{activeEvent.title}</h2>
                        <p className="text-lg text-zinc-500 mb-12 leading-relaxed max-w-lg">{activeEvent.description}</p>
                        <div className="flex flex-col gap-4 w-full">
                            {activeEvent.choices.map((choice, idx) => (
                                <button 
                                    key={idx}
                                    onClick={() => handleEventChoice(choice)}
                                    className="w-full py-5 px-8 bg-zinc-900 border border-zinc-800 hover:border-zinc-500 hover:bg-zinc-800 transition-colors flex justify-between items-center group"
                                >
                                    <span className="font-bold text-zinc-300 group-hover:text-white tracking-widest uppercase text-sm">{choice.label}</span>
                                    {choice.description && <span className="text-xs text-zinc-600 group-hover:text-zinc-400 font-mono">{choice.description}</span>}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                 {/* Loot State */}
                 {gameState === GameState.LOOT && (
                    <div className="w-full max-w-6xl z-10">
                        <h2 className="text-3xl text-center mb-12 text-zinc-500 font-serif tracking-[0.5em] uppercase">Spoils of War</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                            {droppedItems.map(item => {
                                const equipped = player?.equipment[item.type];
                                const statKeys = Array.from(new Set([
                                    ...Object.keys(item.stats),
                                    ...(equipped?.stats ? Object.keys(equipped.stats) : [])
                                ]));

                                return (
                                <div key={item.id} className="bg-black border border-zinc-800 p-8 flex flex-col gap-6 relative group hover:border-zinc-600 transition-colors">
                                    <div>
                                        <h3 className={`font-bold text-xl mb-1 ${item.rarity === Rarity.LEGENDARY ? 'text-orange-400' : item.rarity === Rarity.EPIC ? 'text-purple-400' : item.rarity === Rarity.RARE ? 'text-blue-400' : 'text-zinc-300'}`}>{item.name}</h3>
                                        <p className="text-xs text-zinc-600 uppercase tracking-widest font-bold">{item.type} • {item.rarity}</p>
                                    </div>
                                    
                                    <div className="space-y-2 text-sm font-mono text-zinc-500">
                                        {equipped ? (
                                            <div className="text-[10px] text-zinc-700 uppercase mb-2 pb-1 border-b border-zinc-900 flex justify-between">
                                                <span>Replaces: <span className={`${equipped.rarity === Rarity.LEGENDARY ? 'text-orange-900' : equipped.rarity === Rarity.EPIC ? 'text-purple-900' : 'text-zinc-600'}`}>{equipped.name}</span></span>
                                            </div>
                                        ) : (
                                             <div className="text-[10px] text-zinc-700 uppercase mb-2 pb-1 border-b border-zinc-900">
                                                Equips to Empty Slot
                                            </div>
                                        )}

                                        {statKeys.map(key => {
                                            const attrKey = key as keyof Attributes;
                                            const newVal = item.stats[attrKey] || 0;
                                            const oldVal = equipped?.stats?.[attrKey] || 0;
                                            const diff = newVal - oldVal;
                                            
                                            if (newVal === 0 && oldVal === 0) return null;

                                            return (
                                                <div key={key} className="flex justify-between items-center border-b border-zinc-900 pb-1 last:border-0">
                                                    <span className={`uppercase ${newVal === 0 ? 'text-zinc-600' : 'text-zinc-400'}`}>{key}</span>
                                                    <div className="flex items-center gap-2">
                                                        <span className={newVal === 0 ? 'text-zinc-700' : 'text-zinc-200'}>
                                                            {newVal > 0 ? `+${newVal}` : '-'}
                                                        </span>
                                                        {diff !== 0 && (
                                                            <span className={`text-xs font-bold ${diff > 0 ? 'text-green-500' : 'text-red-500'}`}>
                                                                {diff > 0 ? `(+${diff})` : `(${diff})`}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 mt-auto pt-4">
                                        <button onClick={() => equipItem(item)} className="py-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-bold text-zinc-300 uppercase tracking-widest transition-colors hover:text-white hover:border-zinc-600">Equip</button>
                                        <button onClick={() => sellItem(item)} className="py-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-bold text-zinc-500 hover:text-yellow-500 uppercase tracking-widest transition-colors">Sell (+{Math.floor(item.value * 0.6)})</button>
                                    </div>
                                </div>
                            );
                            })}
                            
                            {/* Skill Drop Card */}
                            {droppedSkill && (
                                <div className="bg-black border border-blue-900/30 p-8 flex flex-col gap-6 relative group hover:border-blue-500 transition-colors shadow-[0_0_15px_rgba(30,58,138,0.1)]">
                                    <div>
                                        <h3 className={`font-bold text-xl mb-1 ${droppedSkill.tier === SkillTier.FORBIDDEN ? 'text-red-500 animate-pulse' : 'text-blue-100'}`}>{droppedSkill.name}</h3>
                                        <p className="text-xs text-blue-600 uppercase tracking-widest font-bold">Secret Scroll • {droppedSkill.tier}</p>
                                    </div>
                                    
                                    <div className="flex items-start gap-4">
                                        <Scroll className="text-blue-900 shrink-0" size={32} />
                                        <p className="text-sm text-zinc-400 italic leading-relaxed">{droppedSkill.description}</p>
                                    </div>
                                    
                                    <div className="space-y-2 mt-4 text-xs font-mono">
                                        <div className="flex justify-between border-b border-zinc-900 pb-1">
                                            <span className="text-zinc-600 uppercase">Chakra Cost</span>
                                            <span className="text-blue-400 font-bold">{droppedSkill.chakraCost}</span>
                                        </div>
                                        <div className="flex justify-between border-b border-zinc-900 pb-1">
                                            <span className="text-zinc-600 uppercase">Base Power</span>
                                            <span className="text-zinc-300">
                                                {player && getEffectiveAttributes(player)[droppedSkill.scalingStat.toLowerCase() as keyof Attributes] ? 
                                                 Math.floor(getEffectiveAttributes(player)[droppedSkill.scalingStat.toLowerCase() as keyof Attributes] * droppedSkill.damageMult) : 0}
                                            </span>
                                        </div>
                                        <div className="flex justify-between border-b border-zinc-900 pb-1">
                                            <span className="text-zinc-600 uppercase">Scaling</span>
                                            <span className="text-zinc-300">{droppedSkill.scalingStat}</span>
                                        </div>
                                        <div className="flex justify-between border-b border-zinc-900 pb-1">
                                            <span className="text-zinc-600 uppercase">Cooldown</span>
                                            <span className="text-zinc-300">{droppedSkill.cooldown} turns</span>
                                        </div>
                                    </div>

                                    <div className="mt-auto pt-4">
                                        {player && player.skills.some(s => s.id === droppedSkill.id) ? (
                                            <button onClick={() => learnSkill(droppedSkill)} className="w-full py-3 bg-green-900/20 hover:bg-green-900/40 border border-green-900 hover:border-green-500 text-xs font-bold text-green-200 uppercase tracking-widest transition-colors">
                                                Upgrade Skill (+Power)
                                            </button>
                                        ) : (
                                            player && player.skills.length < 4 ? (
                                                <button onClick={() => learnSkill(droppedSkill)} className="w-full py-3 bg-blue-900/20 hover:bg-blue-900/40 border border-blue-900 hover:border-blue-500 text-xs font-bold text-blue-200 uppercase tracking-widest transition-colors">
                                                    Learn Technique
                                                </button>
                                            ) : (
                                                <div className="grid grid-cols-2 gap-2">
                                                    {player?.skills.map((s, idx) => (
                                                        <button key={idx} onClick={() => learnSkill(droppedSkill, idx)} className="py-2 bg-zinc-900 border border-zinc-800 text-[9px] text-zinc-400 hover:text-red-400 hover:border-red-900 transition-colors uppercase">
                                                            Replace {s.name}
                                                        </button>
                                                    ))}
                                                </div>
                                            )
                                        )}
                                    </div>
                                </div>
                            )}

                        </div>
                        <div className="text-center">
                            <button onClick={nextFloor} className="text-zinc-600 hover:text-zinc-300 text-xs uppercase tracking-widest border-b border-transparent hover:border-zinc-600 pb-1 transition-all">Leave All</button>
                        </div>
                    </div>
                )}
            </div>

            {/* Logs Footer */}
            <div className="h-64 bg-black border-t border-zinc-900 p-0">
                <GameLog logs={logs} />
            </div>
        </div>
    </div>
  );
};

export default App;