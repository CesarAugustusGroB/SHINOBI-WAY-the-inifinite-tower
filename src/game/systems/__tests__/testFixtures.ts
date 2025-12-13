/**
 * Shared test fixtures for combat system tests
 */

import { PrimaryAttributes, Buff, EffectType, EffectDefinition, PrimaryStat } from '../../types';

// ============================================================================
// BASE STATS
// ============================================================================

/** Baseline stats (all 10) for predictable calculations */
export const BASE_STATS: PrimaryAttributes = {
  willpower: 10,
  chakra: 10,
  strength: 10,
  spirit: 10,
  intelligence: 10,
  calmness: 10,
  speed: 10,
  accuracy: 10,
  dexterity: 10,
};

/** High stats to test soft caps */
export const HIGH_STATS: PrimaryAttributes = {
  willpower: 50,
  chakra: 50,
  strength: 50,
  spirit: 50,
  intelligence: 50,
  calmness: 50,
  speed: 50,
  accuracy: 50,
  dexterity: 50,
};

/** Zero stats for edge case testing */
export const ZERO_STATS: PrimaryAttributes = {
  willpower: 0,
  chakra: 0,
  strength: 0,
  spirit: 0,
  intelligence: 0,
  calmness: 0,
  speed: 0,
  accuracy: 0,
  dexterity: 0,
};

// ============================================================================
// BUFF FIXTURES
// ============================================================================

/** Creates a shield buff with specified value */
export const createShieldBuff = (value: number, duration = 3): Buff => ({
  id: 'test-shield',
  name: 'Test Shield',
  duration,
  effect: {
    type: EffectType.SHIELD,
    value,
    duration,
    chance: 1,
  },
  source: 'test',
});

/** Creates a curse buff (damage amplification) */
export const createCurseBuff = (value = 0.5, duration = 3): Buff => ({
  id: 'test-curse',
  name: 'Test Curse',
  duration,
  effect: {
    type: EffectType.CURSE,
    value, // +50% damage taken by default
    duration,
    chance: 1,
  },
  source: 'test',
});

/** Creates a reflection buff */
export const createReflectionBuff = (value = 0.3, duration = 3): Buff => ({
  id: 'test-reflect',
  name: 'Test Reflection',
  duration,
  effect: {
    type: EffectType.REFLECTION,
    value, // 30% reflected by default
    duration,
    chance: 1,
  },
  source: 'test',
});

/** Creates an invulnerability buff */
export const createInvulnBuff = (duration = 1): Buff => ({
  id: 'test-invuln',
  name: 'Test Invuln',
  duration,
  effect: {
    type: EffectType.INVULNERABILITY,
    duration,
    chance: 1,
  },
  source: 'test',
});

/** Creates a stat buff (+25% to specific stat by default) */
export const createStatBuff = (value = 0.25, duration = 3, targetStat?: PrimaryStat): Buff => ({
  id: 'test-buff',
  name: 'Test Buff',
  duration,
  effect: {
    type: EffectType.BUFF,
    value,
    duration,
    chance: 1,
    targetStat,
  },
  source: 'test',
});

/** Creates a stat debuff (-25% to specific stat by default) */
export const createStatDebuff = (value = 0.25, duration = 3, targetStat?: PrimaryStat): Buff => ({
  id: 'test-debuff',
  name: 'Test Debuff',
  duration,
  effect: {
    type: EffectType.DEBUFF,
    value,
    duration,
    chance: 1,
    targetStat,
  },
  source: 'test',
});

/** Creates a permanent buff (duration -1) */
export const createPermanentBuff = (): Buff => ({
  id: 'test-permanent',
  name: 'Permanent Buff',
  duration: -1,
  effect: {
    type: EffectType.BUFF,
    value: 0.1,
    duration: -1,
    chance: 1,
  },
  source: 'test',
});

/** Creates a buff about to expire (duration 1) */
export const createExpiringBuff = (): Buff => ({
  id: 'test-expiring',
  name: 'Expiring Buff',
  duration: 1,
  effect: {
    type: EffectType.BUFF,
    value: 0.1,
    duration: 1,
    chance: 1,
  },
  source: 'test',
});

// ============================================================================
// IMPORTS FOR MOCK CREATORS
// ============================================================================
import {
  Player,
  Enemy,
  Skill,
  Item,
  Clan,
  ElementType,
  SkillTier,
  ActionType,
  DamageType,
  DamageProperty,
  AttackMethod,
  EquipmentSlot,
  Rarity,
  ComponentId,
  ItemStatBonus,
  TerrainDefinition,
  TerrainType,
  TreasureQuality,
  DEFAULT_MERCHANT_SLOTS,
  MAX_BAG_SLOTS,
} from '../../types';

// ============================================================================
// MOCK PLAYER CREATOR
// ============================================================================

/** Creates a complete mock player for testing */
export const createMockPlayer = (overrides: Partial<Player> = {}): Player => ({
  clan: Clan.UZUMAKI,
  level: 1,
  exp: 0,
  maxExp: 100,
  primaryStats: { ...BASE_STATS },
  currentHp: 170,
  currentChakra: 110,
  element: ElementType.FIRE,
  ryo: 100,
  equipment: {
    [EquipmentSlot.SLOT_1]: null,
    [EquipmentSlot.SLOT_2]: null,
    [EquipmentSlot.SLOT_3]: null,
    [EquipmentSlot.SLOT_4]: null,
  },
  skills: [],
  activeBuffs: [],
  bag: Array(MAX_BAG_SLOTS).fill(null),
  treasureQuality: TreasureQuality.BROKEN,
  merchantSlots: DEFAULT_MERCHANT_SLOTS,
  ...overrides,
});

// ============================================================================
// MOCK ENEMY CREATOR
// ============================================================================

/** Creates a complete mock enemy for testing */
export const createMockEnemy = (overrides: Partial<Enemy> = {}): Enemy => ({
  name: 'Test Enemy',
  tier: 'Chunin',
  primaryStats: { ...BASE_STATS },
  currentHp: 170,
  currentChakra: 110,
  element: ElementType.WATER,
  skills: [],
  activeBuffs: [],
  ...overrides,
});

// ============================================================================
// MOCK SKILL CREATOR
// ============================================================================

/** Creates a mock skill with configurable properties */
export const createMockSkill = (overrides: Partial<Skill> = {}): Skill => ({
  id: 'test-skill',
  name: 'Test Skill',
  tier: SkillTier.BASIC,
  description: 'A test skill',
  actionType: ActionType.MAIN,
  chakraCost: 10,
  hpCost: 0,
  cooldown: 0,
  currentCooldown: 0,
  damageMult: 2.0,
  scalingStat: PrimaryStat.STRENGTH,
  damageType: DamageType.PHYSICAL,
  damageProperty: DamageProperty.NORMAL,
  attackMethod: AttackMethod.MELEE,
  element: ElementType.PHYSICAL,
  ...overrides,
});

// ============================================================================
// MOCK ITEM CREATORS
// ============================================================================

/** Creates a mock component item */
export const createMockComponent = (
  componentId: ComponentId = ComponentId.NINJA_STEEL,
  stats: ItemStatBonus = { strength: 10 }
): Item => ({
  id: `component-${Math.random().toString(36).substring(2, 9)}`,
  name: 'Test Component',
  rarity: Rarity.COMMON,
  stats,
  value: 100,
  description: 'A test component',
  isComponent: true,
  componentId,
  icon: '⚔️',
});

/** Creates a mock artifact item */
export const createMockArtifact = (
  recipe: [ComponentId, ComponentId] = [ComponentId.NINJA_STEEL, ComponentId.NINJA_STEEL],
  stats: ItemStatBonus = { strength: 20 }
): Item => ({
  id: `artifact-${Math.random().toString(36).substring(2, 9)}`,
  name: 'Test Artifact',
  rarity: Rarity.EPIC,
  stats,
  value: 300,
  description: 'A test artifact',
  isComponent: false,
  recipe,
  icon: '🗡️',
});

// ============================================================================
// MOCK TERRAIN CREATOR
// ============================================================================

/** Creates a mock terrain definition */
export const createMockTerrain = (overrides: Partial<TerrainDefinition> = {}): TerrainDefinition => ({
  id: TerrainType.OPEN_GROUND,
  name: 'Open Ground',
  description: 'An open area',
  biome: 'Academy',
  effects: {
    stealthModifier: 0,
    visibilityRange: 2,
    hiddenRoomBonus: 0,
    movementCost: 1,
    initiativeModifier: 0,
    evasionModifier: 0,
  },
  ...overrides,
});
