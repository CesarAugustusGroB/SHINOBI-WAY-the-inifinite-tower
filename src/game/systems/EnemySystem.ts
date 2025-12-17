/**
 * =============================================================================
 * ENEMY SYSTEM - Enemy Generation & Story Arc Management
 * =============================================================================
 *
 * This system generates enemies with varied archetypes, scaling, and story
 * arc theming. Enemies are the primary combat challenge in the game.
 *
 * ## STORY ARCS (Region-Based)
 *
 * Arcs are determined by the Region's `arc` property.
 *
 * | Arc Name    | Biome                    |
 * |-------------|--------------------------|
 * | ACADEMY_ARC | Village Hidden in Leaves |
 * | WAVES_ARC   | Mist Covered Bridge      |
 * | EXAMS_ARC   | Forest of Death          |
 * | ROGUE_ARC   | Valley of the End        |
 * | WAR_ARC     | Divine Tree Roots        |
 *
 * ## ENEMY ARCHETYPES (5 Types)
 *
 * Each archetype has different base stat distributions:
 *
 * | Archetype | Primary Stats              | Combat Style       |
 * |-----------|----------------------------|-------------------|
 * | TANK      | Willpower 22, Strength 18  | High HP, defense  |
 * | ASSASSIN  | Speed 22, Dexterity 18     | Fast, high crit   |
 * | BALANCED  | All stats 12-14            | No weaknesses     |
 * | CASTER    | Spirit 22, Chakra 18       | Elemental damage  |
 * | GENJUTSU  | Calmness 22, Intelligence 18| Mental attacks  |
 *
 * ## SCALING FORMULA (Danger-Based)
 *
 * totalScaling = dangerMult × progressionMult × diffMult × ENEMY_EASE_FACTOR
 *
 * - dangerMult = DANGER_BASE + (dangerLevel × DANGER_PER_LEVEL)
 *   → D1=0.80, D4=1.25, D7=1.70
 * - progressionMult = 1 + (locationsCleared × PROGRESSION_PER_LOCATION)
 *   → +4% per location cleared globally
 * - diffMult = 0.50 + (difficulty / 200)
 * - ENEMY_EASE_FACTOR = 0.85
 *
 * Example: Danger 4, 5 locations cleared, difficulty 40
 * - dangerMult = 0.65 + (4 × 0.15) = 1.25
 * - progressionMult = 1 + (5 × 0.04) = 1.20
 * - diffMult = 0.50 + 0.20 = 0.70
 * - totalScaling = 1.25 × 1.20 × 0.70 × 0.85 = 0.89× base stats
 *
 * ## ENEMY TYPES
 *
 * - **NORMAL**: Random archetype, standard stats
 * - **ELITE**: TANK or CASTER, +40% willpower, +30% strength/spirit
 * - **AMBUSH**: Always ASSASSIN, uses special enemy templates
 * - **BOSS**: Fixed stats, custom tier "Kage Level", unique skills
 *
 * ## SKILL ASSIGNMENT
 *
 * All enemies have BASIC_ATTACK. Additional skills by archetype:
 * - CASTER → FIREBALL
 * - ASSASSIN → SHURIKEN
 * - GENJUTSU → HELL_VIEWING
 * - High difficulty (>50, 30% chance) → RASENGAN
 *
 * =============================================================================
 */

import {
  Enemy,
  ElementType,
  PrimaryAttributes,
  Skill
} from '../types';
import { BOSS_NAMES, SKILLS, AMBUSH_ENEMIES, ENEMY_PREFIXES } from '../constants';
import { calculateDerivedStats } from './StatSystem';
import { DIFFICULTY, ENEMY_BALANCE } from '../config';
import { pick, chance } from '../utils/rng';

/**
 * Enemy archetype determines base stat distribution and combat style.
 */
type EnemyArchetype = 'TANK' | 'ASSASSIN' | 'BALANCED' | 'CASTER' | 'GENJUTSU';

/**
 * Story arc data returned by getStoryArc.
 */
interface StoryArc {
  /** Internal arc identifier (e.g., 'ACADEMY_ARC') */
  name: string;
  /** Display name for the arc */
  label: string;
  /** Biome/location description for this arc */
  biome: string;
}

/**
 * Arc name to StoryArc data mapping.
 */
const STORY_ARCS: Record<string, StoryArc> = {
  'ACADEMY_ARC': { name: 'ACADEMY_ARC', label: 'Academy Graduation', biome: 'Village Hidden in the Leaves' },
  'WAVES_ARC': { name: 'WAVES_ARC', label: 'Land of Waves', biome: 'Mist Covered Bridge' },
  'EXAMS_ARC': { name: 'EXAMS_ARC', label: 'Chunin Exams', biome: 'Forest of Death' },
  'ROGUE_ARC': { name: 'ROGUE_ARC', label: 'Sasuke Retrieval', biome: 'Valley of the End' },
  'WAR_ARC': { name: 'WAR_ARC', label: 'Great Ninja War', biome: 'Divine Tree Roots' },
};

/**
 * Get story arc data by arc name (for region-based system).
 * Use this when the arc is known from the Region config.
 *
 * @param arcName - Arc identifier (e.g., 'WAVES_ARC')
 * @returns StoryArc with name, label, and biome
 */
export const getStoryArcByName = (arcName: string): StoryArc => {
  return STORY_ARCS[arcName] || STORY_ARCS['WAVES_ARC'];
};

/**
 * Generate an enemy with appropriate stats, skills, and theming.
 *
 * ## Enemy Generation Flow:
 * 1. Determine story arc for theming from arcName
 * 2. Calculate total scaling from danger level, progression, and difficulty
 * 3. For BOSS: Use fixed boss data from constants
 * 4. For others: Select archetype and generate base stats
 * 5. Scale stats by totalScaling multiplier
 * 6. Apply type-specific bonuses (ELITE gets +40% willpower, +30% str/spirit)
 * 7. Assign skills based on archetype
 * 8. Select name from arc-appropriate pool
 *
 * @param dangerLevel - Location danger level (1-7)
 * @param locationsCleared - Global count of locations cleared (progression)
 * @param type - Enemy type: NORMAL, ELITE, BOSS, or AMBUSH
 * @param diff - Difficulty value (0-100, affects diffMult)
 * @param arcName - Arc identifier for theming (e.g., 'WAVES_ARC')
 * @returns Fully generated Enemy ready for combat
 */
export const generateEnemy = (
  dangerLevel: number,
  locationsCleared: number,
  type: 'NORMAL' | 'ELITE' | 'BOSS' | 'AMBUSH',
  diff: number,
  arcName: string
): Enemy => {
  const arc = getStoryArcByName(arcName);

  // Calculate scaling multipliers (danger-based formula)
  // Danger scaling: D1=0.80, D4=1.25, D7=1.70
  const dangerMult = DIFFICULTY.DANGER_BASE + (dangerLevel * DIFFICULTY.DANGER_PER_LEVEL);
  // Progression scaling: +4% per location cleared globally
  const progressionMult = 1 + (locationsCleared * DIFFICULTY.PROGRESSION_PER_LOCATION);
  // Difficulty scaling: 50% to 100% based on difficulty value
  const diffMult = DIFFICULTY.DIFFICULTY_BASE + (diff / DIFFICULTY.DIFFICULTY_DIVISOR);
  // Apply global ease factor (0.85 = 15% easier)
  const totalScaling = dangerMult * progressionMult * diffMult * DIFFICULTY.ENEMY_EASE_FACTOR;

  if (type === 'BOSS') {
    const bossData = BOSS_NAMES[dangerLevel as keyof typeof BOSS_NAMES] || { name: 'Edo Tensei Legend', element: ElementType.FIRE, skill: SKILLS.RASENGAN };
    
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
  else if (type === 'ELITE') archetype = chance(0.5) ? 'TANK' : 'CASTER';
  else archetype = pick(['TANK', 'ASSASSIN', 'BALANCED', 'CASTER', 'GENJUTSU'] as const) ?? 'BALANCED';

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
  let enemyElement: ElementType = pick(elements) ?? ElementType.FIRE;
  if (type === 'AMBUSH') {
    const template = pick(AMBUSH_ENEMIES) ?? AMBUSH_ENEMIES[0];
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

    const prefix = pick(namePool) ?? 'Rogue';
    const job = pick(['Ninja', 'Samurai', 'Puppeteer', 'Monk']) ?? 'Ninja';
    name = `${prefix} ${job}`;

    if (archetype === 'CASTER') skills.push(SKILLS.FIREBALL);
    else if (archetype === 'ASSASSIN') skills.push(SKILLS.SHURIKEN);
    else if (archetype === 'GENJUTSU') skills.push(SKILLS.HELL_VIEWING);
    if (diff > 50 && chance(0.3)) skills.push(SKILLS.RASENGAN);
  }

  const isElite = type === 'ELITE' || type === 'AMBUSH';
  if (isElite) {
    scaledStats.willpower = Math.floor(scaledStats.willpower * ENEMY_BALANCE.ELITE_WILLPOWER_MULT);
    scaledStats.strength = Math.floor(scaledStats.strength * ENEMY_BALANCE.ELITE_STRENGTH_MULT);
    scaledStats.spirit = Math.floor(scaledStats.spirit * ENEMY_BALANCE.ELITE_SPIRIT_MULT);
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
  if (name.toLowerCase().includes('samurai')) {
    enemyImage = '/assets/enemy_samurai.png';
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
