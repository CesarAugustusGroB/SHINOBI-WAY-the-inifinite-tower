import {
  Enemy,
  ElementType,
  PrimaryAttributes,
  Skill
} from '../types';
import { BOSS_NAMES, SKILLS, AMBUSH_ENEMIES, ENEMY_PREFIXES } from '../constants';
import { calculateDerivedStats } from './StatSystem';

type EnemyArchetype = 'TANK' | 'ASSASSIN' | 'BALANCED' | 'CASTER' | 'GENJUTSU';

interface StoryArc {
  name: string;
  label: string;
  biome: string;
}

export const getStoryArc = (floor: number): StoryArc => {
  if (floor <= 10) return { name: 'ACADEMY_ARC', label: 'Academy Graduation', biome: 'Village Hidden in the Leaves' };
  if (floor <= 25) return { name: 'WAVES_ARC', label: 'Land of Waves', biome: 'Mist Covered Bridge' };
  if (floor <= 50) return { name: 'EXAMS_ARC', label: 'Chunin Exams', biome: 'Forest of Death' };
  if (floor <= 75) return { name: 'ROGUE_ARC', label: 'Sasuke Retrieval', biome: 'Valley of the End' };
  return { name: 'WAR_ARC', label: 'Great Ninja War', biome: 'Divine Tree Roots' };
};

export const generateEnemy = (currentFloor: number, type: 'NORMAL' | 'ELITE' | 'BOSS' | 'AMBUSH', diff: number): Enemy => {
  const arc = getStoryArc(currentFloor);
  const floorMult = 1 + (currentFloor * 0.08);
  const diffMult = 0.75 + (diff / 100);
  const totalScaling = floorMult * diffMult;

  if (type === 'BOSS') {
    const bossData = BOSS_NAMES[currentFloor as keyof typeof BOSS_NAMES] || { name: 'Edo Tensei Legend', element: ElementType.FIRE, skill: SKILLS.RASENGAN };
    
    // Set boss image based on name
    let bossImage: string | undefined;
    if (bossData.name.toLowerCase().includes('haku')) {
      bossImage = '/assets/enemy_boss_haku.png';
    }
    if (bossData.name.toLowerCase().includes('demon')) {
      bossImage = '/assets/enemy_boss_demon_brothers.png';
    }
    
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
      activeBuffs: [],
      image: bossImage
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

  // Set enemy image based on name
  let enemyImage: string | undefined;
  if (name.toLowerCase().includes('puppeteer')) {
    enemyImage = '/assets/enemy_clumsy_puppeteer.png';
  }
  if (name.toLowerCase().includes('monk')) {
    enemyImage = '/assets/enemy_monk.png';
  }
  if (name.toLowerCase().includes('ninja') || name.toLowerCase().includes('shinobi')) {
    enemyImage = '/assets/enemy_exhausted_shinobi.png';
  }

  return {
    name,
    tier: isElite ? (type === 'AMBUSH' ? 'S-Rank Rogue' : 'Jonin') : 'Chunin',
    element: enemyElement,
    skills,
    primaryStats: scaledStats,
    currentHp: derived.maxHp,
    currentChakra: derived.maxChakra,
    activeBuffs: [],
    image: enemyImage
  };
};

export const generateEnemyImage = async (enemy: Enemy, genImageSize: '1K' | '2K' | '4K'): Promise<string | null> => {
  if (!enemy) return null;

  try {
    const { GoogleGenAI } = await import("@google/genai");
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `A dark fantasy, gritty anime style character portrait of a Naruto-inspired ninja enemy named "${enemy.name}". Rank: ${enemy.tier}. Chakra Element: ${enemy.element}. The character looks dangerous and powerful. High contrast, detailed, atmospheric lighting. Close-up or waist-up shot.`;
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: { parts: [{ text: prompt }] },
      config: { imageConfig: { imageSize: genImageSize, aspectRatio: '1:1' } }
    });

    let imageUrl = null;
    if (response.candidates && response.candidates[0].content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if ((part as any).inlineData) {
          imageUrl = `data:image/png;base64,${(part as any).inlineData.data}`;
          break;
        }
      }
    }
    return imageUrl;
  } catch (error) {
    console.error("Image Gen Error", error);
    throw error;
  }
};
