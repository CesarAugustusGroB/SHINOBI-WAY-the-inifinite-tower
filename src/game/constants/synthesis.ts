/**
 * Synthesis Recipes for the Ninja Tool Synthesis System
 *
 * 36 Total Recipes:
 * - 8 self-combinations (same component + same component)
 * - 28 cross-combinations (different components)
 *
 * All artifacts have unique passives themed around Naruto lore.
 */

import { ComponentId, PassiveEffect, PassiveEffectType, ItemStatBonus } from '../types';

export interface ArtifactDefinition {
  name: string;
  recipe: [ComponentId, ComponentId];
  passive: PassiveEffect;
  description: string;
  bonusStats?: Partial<ItemStatBonus>;
  icon?: string;
}

/**
 * Complete synthesis recipe matrix
 */
export const SYNTHESIS_RECIPES: ArtifactDefinition[] = [
  // ═══════════════════════════════════════════════════════════════
  // NINJA STEEL (⚔️ Strength) COMBINATIONS
  // ═══════════════════════════════════════════════════════════════
  {
    name: "Kubikiribōchō",
    recipe: [ComponentId.NINJA_STEEL, ComponentId.NINJA_STEEL],
    passive: { type: PassiveEffectType.BLEED, value: 3, duration: 3, triggerCondition: 'on_hit' },
    description: "Executioner's Blade. Attacks cause Bleed (3% max HP/turn for 3 turns).",
    bonusStats: { critDamage: 0.10 },
    icon: '🗡️',
  },
  {
    name: "Chakra Flow Blade",
    recipe: [ComponentId.NINJA_STEEL, ComponentId.SPIRIT_TAG],
    passive: { type: PassiveEffectType.CONVERT_TO_ELEMENTAL, value: 35 },
    description: "Converts 35% of Physical damage to Elemental, bypassing physical defense.",
    icon: '⚡',
  },
  {
    name: "Samehada",
    recipe: [ComponentId.NINJA_STEEL, ComponentId.CHAKRA_PILL],
    passive: { type: PassiveEffectType.CHAKRA_DRAIN, value: 10, triggerCondition: 'on_hit' },
    description: "The sentient sword. Drains 10 Chakra on hit and restores it to you.",
    icon: '🦈',
  },
  {
    name: "Gunbai War Fan",
    recipe: [ComponentId.NINJA_STEEL, ComponentId.IRON_SAND],
    passive: { type: PassiveEffectType.REFLECT, value: 65, triggerCondition: 'combat_start' },
    description: "Madara's fan. Reflects 65% damage from first attack received.",
    icon: '🪭',
  },
  {
    name: "Nuibari",
    recipe: [ComponentId.NINJA_STEEL, ComponentId.ANBU_MASK],
    passive: { type: PassiveEffectType.PIERCE_DEFENSE, value: 20 },
    description: "Sewing Needle. Attacks ignore 20% of enemy defense permanently.",
    icon: '🪡',
  },
  {
    name: "Kusanagi",
    recipe: [ComponentId.NINJA_STEEL, ComponentId.TRAINING_WEIGHTS],
    passive: { type: PassiveEffectType.PIERCE_DEFENSE, value: 65, triggerCondition: 'on_crit' },
    description: "Grass-Cutting Sword. Critical hits ignore 65% enemy defense.",
    bonusStats: { critChance: 5 },
    icon: '⚔️',
  },
  {
    name: "Hiramekarei",
    recipe: [ComponentId.NINJA_STEEL, ComponentId.SWIFT_SANDALS],
    passive: { type: PassiveEffectType.FREE_FIRST_SKILL },
    description: "Twin Sword. First skill each combat costs 0 Chakra and has no cooldown.",
    icon: '🔱',
  },
  {
    name: "Kabutowari",
    recipe: [ComponentId.NINJA_STEEL, ComponentId.TACTICAL_SCROLL],
    passive: { type: PassiveEffectType.EXECUTE_THRESHOLD, value: 13 },
    description: "Helmet Splitter. Attacks instantly kill enemies below 13% HP.",
    icon: '🪓',
  },

  // ═══════════════════════════════════════════════════════════════
  // SPIRIT TAG (📜 Spirit) COMBINATIONS
  // ═══════════════════════════════════════════════════════════════
  {
    name: "Sage's Scripture",
    recipe: [ComponentId.SPIRIT_TAG, ComponentId.SPIRIT_TAG],
    passive: { type: PassiveEffectType.BURN, value: 5, duration: 3, triggerCondition: 'on_hit' },
    description: "Ancient sage writings. Elemental attacks apply Burn (5% max HP/turn).",
    bonusStats: { spirit: 7 },
    icon: '📖',
  },
  {
    name: "Gourd of Sand",
    recipe: [ComponentId.SPIRIT_TAG, ComponentId.CHAKRA_PILL],
    passive: { type: PassiveEffectType.SHIELD_ON_START, value: 33 },
    description: "Gaara's gourd. Grants shield equal to 33% of max Chakra at combat start.",
    icon: '🏺',
  },
  {
    name: "Totsuka Blade",
    recipe: [ComponentId.SPIRIT_TAG, ComponentId.IRON_SAND],
    passive: { type: PassiveEffectType.SEAL_CHANCE, value: 13, duration: 1 },
    description: "Ethereal sealing sword. 13% chance to Seal (Stun+Silence) for 1 turn.",
    icon: '🌀',
  },
  {
    name: "Konan's Paper Wings",
    recipe: [ComponentId.SPIRIT_TAG, ComponentId.ANBU_MASK],
    passive: { type: PassiveEffectType.COUNTER_ATTACK, value: 27 },
    description: "Angelic paper jutsu. 27% chance to counter-attack when hit.",
    icon: '🦋',
  },
  {
    name: "Explosive Tag Array",
    recipe: [ComponentId.SPIRIT_TAG, ComponentId.TRAINING_WEIGHTS],
    passive: { type: PassiveEffectType.BURN, value: 10, triggerCondition: 'on_crit' },
    description: "Deidara's art. Critical hits cause massive Burn (10% max HP).",
    icon: '💥',
  },
  {
    name: "Flying Thunder God Seal",
    recipe: [ComponentId.SPIRIT_TAG, ComponentId.SWIFT_SANDALS],
    passive: { type: PassiveEffectType.FREE_FIRST_SKILL },
    description: "Minato's mark. Teleport strike - first skill is instant and free.",
    bonusStats: { speed: 3 },
    icon: '⚡',
  },
  {
    name: "Forbidden Scroll",
    recipe: [ComponentId.SPIRIT_TAG, ComponentId.TACTICAL_SCROLL],
    passive: { type: PassiveEffectType.COOLDOWN_RESET_ON_KILL, triggerCondition: 'on_kill' },
    description: "Konoha's sealed scroll. All skill cooldowns reset on killing blow.",
    icon: '📜',
  },

  // ═══════════════════════════════════════════════════════════════
  // CHAKRA PILL (💊 Chakra) COMBINATIONS
  // ═══════════════════════════════════════════════════════════════
  {
    name: "Eight Gates Core",
    recipe: [ComponentId.CHAKRA_PILL, ComponentId.CHAKRA_PILL],
    passive: { type: PassiveEffectType.DAMAGE_REDUCTION, value: -20 }, // Takes MORE damage (penalty stays)
    description: "+35% damage dealt but take 20% more damage. Inner Gates unlocked.",
    bonusStats: { strength: 10, speed: 7 },
    icon: '🔥',
  },
  {
    name: "Yata Mirror",
    recipe: [ComponentId.CHAKRA_PILL, ComponentId.IRON_SAND],
    passive: { type: PassiveEffectType.INVULNERABLE_FIRST_TURN },
    description: "Itachi's ethereal shield. Completely invulnerable for first turn.",
    icon: '🪞',
  },
  {
    name: "Akimichi Food Pills",
    recipe: [ComponentId.CHAKRA_PILL, ComponentId.ANBU_MASK],
    passive: { type: PassiveEffectType.GUTS, value: 20 },
    description: "Colored pills of the Akimichi. Survive lethal blow at 1 HP, heal 20%.",
    icon: '💊',
  },
  {
    name: "Curse Mark Essence",
    recipe: [ComponentId.CHAKRA_PILL, ComponentId.TRAINING_WEIGHTS],
    passive: { type: PassiveEffectType.LIFESTEAL, value: 10 },
    description: "Orochimaru's seal. Heal for 10% of damage dealt.",
    icon: '☯️',
  },
  {
    name: "Sage Mode Chakra",
    recipe: [ComponentId.CHAKRA_PILL, ComponentId.SWIFT_SANDALS],
    passive: { type: PassiveEffectType.CHAKRA_RESTORE, value: 7, triggerCondition: 'turn_start' },
    description: "Natural energy infusion. Restore 7 Chakra at the start of each turn.",
    icon: '🐸',
  },
  {
    name: "Byakugō Seal",
    recipe: [ComponentId.CHAKRA_PILL, ComponentId.TACTICAL_SCROLL],
    passive: { type: PassiveEffectType.REGEN, value: 3, triggerCondition: 'turn_start' },
    description: "Tsunade's forehead diamond. Regenerate 3% max HP each turn.",
    icon: '💎',
  },

  // ═══════════════════════════════════════════════════════════════
  // IRON SAND (🛡️ Willpower) COMBINATIONS
  // ═══════════════════════════════════════════════════════════════
  {
    name: "Susanoo Ribcage",
    recipe: [ComponentId.IRON_SAND, ComponentId.IRON_SAND],
    passive: { type: PassiveEffectType.DAMAGE_REDUCTION, value: 13 },
    description: "Skeletal Susanoo frame. Reduce ALL incoming damage by 13%.",
    bonusStats: { flatPhysicalDef: 7, flatElementalDef: 7 },
    icon: '💀',
  },
  {
    name: "Hokage's Necklace",
    recipe: [ComponentId.IRON_SAND, ComponentId.ANBU_MASK],
    passive: { type: PassiveEffectType.REGEN, value: 5, triggerCondition: 'turn_start' },
    description: "First Hokage's crystal. Regenerate 5% max HP each turn.",
    icon: '📿',
  },
  {
    name: "Puppet Armor Core",
    recipe: [ComponentId.IRON_SAND, ComponentId.TRAINING_WEIGHTS],
    passive: { type: PassiveEffectType.COUNTER_ATTACK, value: 20 },
    description: "Sasori's puppet tech. 20% chance to counter when hit.",
    bonusStats: { flatPhysicalDef: 5 },
    icon: '🤖',
  },
  {
    name: "Jiraiya's Headband",
    recipe: [ComponentId.IRON_SAND, ComponentId.SWIFT_SANDALS],
    passive: { type: PassiveEffectType.GUTS, value: 17 },
    description: "Oil-stained protector. Survive lethal blow once, heal 17%.",
    icon: '🐸',
  },
  {
    name: "Will of Fire Charm",
    recipe: [ComponentId.IRON_SAND, ComponentId.TACTICAL_SCROLL],
    passive: { type: PassiveEffectType.DAMAGE_REDUCTION, value: 10, triggerCondition: 'below_half_hp' },
    description: "Konoha's will. Take 10% less damage when below 50% HP.",
    icon: '🔥',
  },

  // ═══════════════════════════════════════════════════════════════
  // ANBU MASK (🎭 Calmness) COMBINATIONS
  // ═══════════════════════════════════════════════════════════════
  {
    name: "Tsukuyomi Lens",
    recipe: [ComponentId.ANBU_MASK, ComponentId.ANBU_MASK],
    passive: { type: PassiveEffectType.SEAL_CHANCE, value: 10, duration: 2 },
    description: "Genjutsu focus. 10% chance to Seal enemies for 2 turns.",
    bonusStats: { calmness: 7 },
    icon: '👁️',
  },
  {
    name: "Shikamaru's Earrings",
    recipe: [ComponentId.ANBU_MASK, ComponentId.TRAINING_WEIGHTS],
    passive: { type: PassiveEffectType.PIERCE_DEFENSE, value: 17 },
    description: "Asuma's gift. Attacks ignore 17% defense (shadow binding).",
    icon: '💍',
  },
  {
    name: "Kakashi's Bell",
    recipe: [ComponentId.ANBU_MASK, ComponentId.SWIFT_SANDALS],
    passive: { type: PassiveEffectType.COUNTER_ATTACK, value: 17 },
    description: "Training bell. 17% chance to counter-attack (Copy Ninja reflexes).",
    bonusStats: { speed: 2 },
    icon: '🔔',
  },
  {
    name: "Nara Shadow Bind",
    recipe: [ComponentId.ANBU_MASK, ComponentId.TACTICAL_SCROLL],
    passive: { type: PassiveEffectType.SEAL_CHANCE, value: 7, duration: 1, triggerCondition: 'on_hit' },
    description: "Shadow possession notes. 7% chance to immobilize on hit.",
    icon: '🌑',
  },

  // ═══════════════════════════════════════════════════════════════
  // TRAINING WEIGHTS (🏋️ Dexterity) COMBINATIONS
  // ═══════════════════════════════════════════════════════════════
  {
    name: "Weights Released",
    recipe: [ComponentId.TRAINING_WEIGHTS, ComponentId.TRAINING_WEIGHTS],
    passive: { type: PassiveEffectType.FREE_FIRST_SKILL },
    description: "Rock Lee's ultimate form. First skill is instant with double crit chance.",
    bonusStats: { critChance: 10, speed: 5 },
    icon: '💨',
  },
  {
    name: "Gentle Fist Wraps",
    recipe: [ComponentId.TRAINING_WEIGHTS, ComponentId.SWIFT_SANDALS],
    passive: { type: PassiveEffectType.CHAKRA_DRAIN, value: 7, triggerCondition: 'on_hit' },
    description: "Hyūga combat wraps. Drain 7 enemy Chakra on each hit.",
    icon: '🥋',
  },
  {
    name: "Eight Trigrams Map",
    recipe: [ComponentId.TRAINING_WEIGHTS, ComponentId.TACTICAL_SCROLL],
    passive: { type: PassiveEffectType.PIERCE_DEFENSE, value: 27, triggerCondition: 'on_crit' },
    description: "Hyūga technique scroll. Crits ignore 27% defense (tenketsu strikes).",
    icon: '☯️',
  },

  // ═══════════════════════════════════════════════════════════════
  // SWIFT SANDALS (👟 Speed) COMBINATIONS
  // ═══════════════════════════════════════════════════════════════
  {
    name: "Yellow Flash Boots",
    recipe: [ComponentId.SWIFT_SANDALS, ComponentId.SWIFT_SANDALS],
    passive: { type: PassiveEffectType.FREE_FIRST_SKILL },
    description: "Minato's speed. First skill instant, +13% evasion for first turn.",
    bonusStats: { speed: 8 },
    icon: '⚡',
  },
  {
    name: "Body Flicker Sash",
    recipe: [ComponentId.SWIFT_SANDALS, ComponentId.TACTICAL_SCROLL],
    passive: { type: PassiveEffectType.COUNTER_ATTACK, value: 23, triggerCondition: 'on_hit' },
    description: "Shisui's sash. 23% chance to counter with superior speed.",
    icon: '🌀',
  },

  // ═══════════════════════════════════════════════════════════════
  // TACTICAL SCROLL (🧠 Intelligence) COMBINATIONS
  // ═══════════════════════════════════════════════════════════════
  {
    name: "Scroll of Seals",
    recipe: [ComponentId.TACTICAL_SCROLL, ComponentId.TACTICAL_SCROLL],
    passive: { type: PassiveEffectType.COOLDOWN_RESET_ON_KILL },
    description: "Master strategist's notes. All cooldowns reset on any kill.",
    bonusStats: { intelligence: 7, chakra: 3 },
    icon: '📚',
  },

  // ═══════════════════════════════════════════════════════════════
  // HASHIRAMA CELL (🧬) KEKKEI GENKAI COMBINATIONS
  // ═══════════════════════════════════════════════════════════════
  {
    name: "Ten-Tails Husk",
    recipe: [ComponentId.HASHIRAMA_CELL, ComponentId.HASHIRAMA_CELL],
    passive: { type: PassiveEffectType.REGEN, value: 7, triggerCondition: 'turn_start' },
    description: "Vessel of the divine tree. Massive stats and 7% HP regen/turn.",
    bonusStats: { willpower: 13, chakra: 13, strength: 7 },
    icon: '🌳',
  },
  {
    name: "Curse Mark (Heaven)",
    recipe: [ComponentId.HASHIRAMA_CELL, ComponentId.NINJA_STEEL],
    passive: { type: PassiveEffectType.LIFESTEAL, value: 13 },
    description: "Orochimaru's gift. +13% lifesteal but costs 5% HP per turn.",
    bonusStats: { strength: 10, speed: 7 },
    icon: '☯️',
  },
  {
    name: "Rinnegan Fragment",
    recipe: [ComponentId.HASHIRAMA_CELL, ComponentId.SPIRIT_TAG],
    passive: { type: PassiveEffectType.ALL_ELEMENTS },
    description: "Eyes of the Sage. All your attacks count as super-effective.",
    bonusStats: { spirit: 8, intelligence: 5 },
    icon: '👁️',
  },
  {
    name: "Infinite Chakra Core",
    recipe: [ComponentId.HASHIRAMA_CELL, ComponentId.CHAKRA_PILL],
    passive: { type: PassiveEffectType.CHAKRA_RESTORE, value: 13, triggerCondition: 'turn_start' },
    description: "Endless chakra well. Restore 13 Chakra every turn.",
    bonusStats: { chakra: 17 },
    icon: '💫',
  },
  {
    name: "Adamantine Chains",
    recipe: [ComponentId.HASHIRAMA_CELL, ComponentId.IRON_SAND],
    passive: { type: PassiveEffectType.SEAL_CHANCE, value: 20, duration: 2 },
    description: "Uzumaki sealing chains. 20% chance to bind enemies for 2 turns.",
    bonusStats: { willpower: 10, calmness: 7 },
    icon: '⛓️',
  },
  {
    name: "Sharingan Implant",
    recipe: [ComponentId.HASHIRAMA_CELL, ComponentId.ANBU_MASK],
    passive: { type: PassiveEffectType.CLAN_TRAIT_UCHIHA },
    description: "Transplanted eye. Gain Uchiha crit bonuses and copy effects.",
    bonusStats: { calmness: 7, dexterity: 7, critChance: 7 },
    icon: '🔴',
  },
  {
    name: "Byakugan Awakening",
    recipe: [ComponentId.HASHIRAMA_CELL, ComponentId.TRAINING_WEIGHTS],
    passive: { type: PassiveEffectType.CLAN_TRAIT_HYUGA },
    description: "All-seeing eyes. Gain Hyūga chakra disruption abilities.",
    bonusStats: { dexterity: 8, accuracy: 5 },
    icon: '⚪',
  },
  {
    name: "Shadow Mastery",
    recipe: [ComponentId.HASHIRAMA_CELL, ComponentId.TACTICAL_SCROLL],
    passive: { type: PassiveEffectType.CLAN_TRAIT_NARA },
    description: "Nara clan secrets. Enemies have reduced speed and evasion.",
    bonusStats: { intelligence: 10, calmness: 5 },
    icon: '🌑',
  },
  {
    name: "Uzumaki Vitality",
    recipe: [ComponentId.HASHIRAMA_CELL, ComponentId.SWIFT_SANDALS],
    passive: { type: PassiveEffectType.CLAN_TRAIT_UZUMAKI },
    description: "Uzumaki life force. Massive HP pool and chakra reserves.",
    bonusStats: { willpower: 13, chakra: 10, flatHp: 33 },
    icon: '🌀',
  },
];

/**
 * Find a synthesis recipe by component combination
 * Returns null if no valid recipe exists
 */
export function findRecipe(a: ComponentId, b: ComponentId): ArtifactDefinition | null {
  return SYNTHESIS_RECIPES.find(recipe =>
    (recipe.recipe[0] === a && recipe.recipe[1] === b) ||
    (recipe.recipe[0] === b && recipe.recipe[1] === a)
  ) || null;
}

/**
 * Get all recipes that use a specific component
 */
export function getRecipesUsingComponent(componentId: ComponentId): ArtifactDefinition[] {
  return SYNTHESIS_RECIPES.filter(recipe =>
    recipe.recipe[0] === componentId || recipe.recipe[1] === componentId
  );
}

/**
 * Check if two components can be combined
 */
export function canSynthesize(a: ComponentId, b: ComponentId): boolean {
  return findRecipe(a, b) !== null;
}
