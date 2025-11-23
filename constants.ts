import { Attributes, Clan, ElementType, GameEventDefinition, ItemSlot, Rarity, Skill, Stat, EffectType, SkillTier } from './types';

export const MAX_LOGS = 50;
export const BASE_CRIT_CHANCE = 5;
export const BASE_CRIT_DMG = 1.5;

// --- Elements ---
export const ELEMENTAL_CYCLE: Record<ElementType, ElementType> = {
  [ElementType.FIRE]: ElementType.WIND,
  [ElementType.WIND]: ElementType.LIGHTNING,
  [ElementType.LIGHTNING]: ElementType.EARTH,
  [ElementType.EARTH]: ElementType.WATER,
  [ElementType.WATER]: ElementType.FIRE,
  [ElementType.PHYSICAL]: ElementType.PHYSICAL, // Neutral
};

// --- Starting Stats by Clan ---
export const CLAN_STATS: Record<Clan, Attributes> = {
  [Clan.UZUMAKI]: { hp: 200, maxHp: 200, chakra: 150, maxChakra: 150, str: 12, int: 14, spd: 10, def: 14, gen: 8, acc: 10 },
  [Clan.UCHIHA]: { hp: 120, maxHp: 120, chakra: 100, maxChakra: 100, str: 12, int: 22, spd: 20, def: 8, gen: 18, acc: 18 },
  [Clan.HYUGA]: { hp: 140, maxHp: 140, chakra: 90, maxChakra: 90, str: 18, int: 12, spd: 18, def: 16, gen: 12, acc: 22 },
  [Clan.LEE]: { hp: 180, maxHp: 180, chakra: 30, maxChakra: 30, str: 28, int: 5, spd: 28, def: 12, gen: 0, acc: 15 },
  [Clan.YAMANAKA]: { hp: 130, maxHp: 130, chakra: 140, maxChakra: 140, str: 8, int: 18, spd: 14, def: 8, gen: 24, acc: 16 },
};

// --- Clan Growth Rates (Stats per Level) ---
export const CLAN_GROWTH: Record<Clan, Partial<Attributes>> = {
    [Clan.UZUMAKI]: { maxHp: 25, maxChakra: 20, str: 2, def: 2, int: 1, spd: 1, gen: 1, acc: 1 },
    [Clan.UCHIHA]: { maxHp: 15, maxChakra: 15, str: 1, def: 1, int: 3, spd: 2, gen: 3, acc: 2 },
    [Clan.HYUGA]: { maxHp: 20, maxChakra: 10, str: 2, def: 2, int: 1, spd: 2, gen: 1, acc: 3 },
    [Clan.LEE]: { maxHp: 30, maxChakra: 0, str: 4, def: 1, int: 0, spd: 3, gen: 0, acc: 2 },
    [Clan.YAMANAKA]: { maxHp: 18, maxChakra: 20, str: 1, def: 1, int: 2, spd: 1, gen: 4, acc: 2 },
};

// --- Enemy Prefixes for Generation ---
export const ENEMY_PREFIXES = {
  WEAK: ['Exhausted', 'Clumsy', 'Novice'],
  NORMAL: ['Mist', 'Rock', 'Cloud', 'Sound', 'Rogue'],
  STRONG: ['Veteran', 'Vicious', 'Elite', 'Merciless'],
  DEADLY: ['Demonic', 'Cursed', 'Blood-Thirsty']
};

// --- Skills ---
export const SKILLS: Record<string, Skill> = {
  // Common / Basic
  BASIC_ATTACK: {
    id: 'basic_atk', name: 'Taijutsu', tier: SkillTier.COMMON, description: 'A disciplined martial arts strike using raw physical power. Reliable and effective.',
    chakraCost: 0, hpCost: 0, cooldown: 0, currentCooldown: 0, damageMult: 1.0, scalingStat: Stat.STR, element: ElementType.PHYSICAL
  },
  SHURIKEN: {
    id: 'shuriken', name: 'Shuriken', tier: SkillTier.COMMON, description: 'A swift throw of sharpened steel stars. Targets weak points for high critical chance.',
    chakraCost: 0, hpCost: 0, cooldown: 1, currentCooldown: 0, damageMult: 0.8, scalingStat: Stat.ACC, element: ElementType.PHYSICAL,
    critBonus: 25 // +25% Crit Chance
  },
  MUD_WALL: {
    id: 'mud_wall', name: 'Mud Wall', tier: SkillTier.COMMON, description: 'Spits mud that hardens into a defensive barricade.',
    chakraCost: 15, hpCost: 0, cooldown: 4, currentCooldown: 0, damageMult: 0.5, scalingStat: Stat.INT, element: ElementType.EARTH,
    effects: [{ type: EffectType.BUFF, targetStat: Stat.DEF, value: 0.3, duration: 3, chance: 1.0 }]
  },
  PHOENIX_FLOWER: {
    id: 'phoenix_flower', name: 'Phoenix Flower', tier: SkillTier.COMMON, description: 'Volleys of small fireballs controlled with wire.',
    chakraCost: 20, hpCost: 0, cooldown: 2, currentCooldown: 0, damageMult: 1.5, scalingStat: Stat.INT, element: ElementType.FIRE,
    effects: [{ type: EffectType.DOT, value: 5, duration: 2, chance: 0.5 }]
  },

  // Rare
  RASENGAN: {
    id: 'rasengan', name: 'Rasengan', tier: SkillTier.RARE, description: 'A swirling sphere of pure wind chakra that grinds into the target, causing internal rupture.',
    chakraCost: 35, hpCost: 0, cooldown: 3, currentCooldown: 0, damageMult: 2.8, scalingStat: Stat.INT, element: ElementType.WIND,
    effects: [{ type: EffectType.DEBUFF, targetStat: Stat.DEF, value: 0.2, duration: 3, chance: 0.5 }] // Armor Break
  },
  FIREBALL: {
    id: 'fireball', name: 'Fireball', tier: SkillTier.RARE, description: 'A massive, searing projectile of flame exhaled from the lungs. Leaves the target burning.',
    chakraCost: 25, hpCost: 0, cooldown: 3, currentCooldown: 0, damageMult: 2.4, scalingStat: Stat.INT, element: ElementType.FIRE,
    effects: [{ type: EffectType.DOT, value: 15, duration: 3, chance: 0.8 }] // Burn
  },
  GENTLE_FIST: {
    id: 'gentle_fist', name: 'Gentle Fist', tier: SkillTier.RARE, description: 'Precise strikes to chakra points that shut down the opponent flow, causing paralysis.',
    chakraCost: 15, hpCost: 0, cooldown: 2, currentCooldown: 0, damageMult: 1.8, scalingStat: Stat.STR, element: ElementType.PHYSICAL,
    effects: [{ type: EffectType.STUN, duration: 1, chance: 0.4 }] // Stun
  },
  SHARINGAN_2TOMOE: {
    id: 'sharingan_2', name: 'Sharingan (2-Tomoe)', tier: SkillTier.RARE, description: 'Visual prowess that perceives attack trajectories. Increases Accuracy and Crit.',
    chakraCost: 10, hpCost: 0, cooldown: 5, currentCooldown: 0, damageMult: 0, scalingStat: Stat.INT, element: ElementType.FIRE,
    isToggle: true, upkeepCost: 5,
    effects: [{ type: EffectType.BUFF, targetStat: Stat.ACC, value: 0.4, duration: -1, chance: 1.0 }, { type: EffectType.BUFF, targetStat: Stat.SPD, value: 0.2, duration: -1, chance: 1.0 }]
  },
  WATER_PRISON: {
    id: 'water_prison', name: 'Water Prison', tier: SkillTier.RARE, description: 'Traps the enemy in a sphere of heavy water.',
    chakraCost: 30, hpCost: 0, cooldown: 5, currentCooldown: 0, damageMult: 1.2, scalingStat: Stat.INT, element: ElementType.WATER,
    effects: [{ type: EffectType.STUN, duration: 2, chance: 0.7 }]
  },
  HELL_VIEWING: {
    id: 'hell_viewing', name: 'Hell Viewing Technique', tier: SkillTier.RARE, description: 'A Genjutsu that reveals the target\'s worst fears. Bypasses armor, resisted by GEN.',
    chakraCost: 25, hpCost: 0, cooldown: 4, currentCooldown: 0, damageMult: 1.5, scalingStat: Stat.GEN, element: ElementType.PHYSICAL,
    effects: [{ type: EffectType.DEBUFF, targetStat: Stat.STR, value: 0.3, duration: 3, chance: 1.0 }]
  },
  MIND_DESTRUCTION: {
    id: 'mind_destruction', name: 'Mind Body Disturbance', tier: SkillTier.RARE, description: 'Sends chakra into the opponent\'s nervous system to confuse their movement.',
    chakraCost: 30, hpCost: 0, cooldown: 4, currentCooldown: 0, damageMult: 1.8, scalingStat: Stat.GEN, element: ElementType.PHYSICAL,
    effects: [{ type: EffectType.CONFUSION, duration: 3, chance: 1.0 }]
  },

  // Epic
  SHADOW_CLONE: {
    id: 'shadow_clone', name: 'Shadow Clone', tier: SkillTier.EPIC, description: 'Creates solid clones to confuse and overwhelm the enemy.',
    chakraCost: 50, hpCost: 0, cooldown: 6, currentCooldown: 0, damageMult: 0, scalingStat: Stat.INT, element: ElementType.PHYSICAL,
    effects: [{ type: EffectType.BUFF, targetStat: Stat.STR, value: 0.5, duration: 3, chance: 1.0 }, { type: EffectType.BUFF, targetStat: Stat.SPD, value: 0.3, duration: 3, chance: 1.0 }]
  },
  PRIMARY_LOTUS: {
    id: 'primary_lotus', name: 'Primary Lotus', tier: SkillTier.EPIC, description: 'A forbidden technique unlocking the body limits. Devastating power at the cost of health.',
    chakraCost: 0, hpCost: 25, cooldown: 4, currentCooldown: 0, damageMult: 3.8, scalingStat: Stat.STR, element: ElementType.PHYSICAL,
    effects: [{ type: EffectType.BUFF, targetStat: Stat.STR, value: 0.3, duration: 2, chance: 1.0 }]
  },
  CHIDORI: {
    id: 'chidori', name: 'Chidori', tier: SkillTier.EPIC, description: 'A crackling assassination technique. High speed thrust that pierces defenses.',
    chakraCost: 35, hpCost: 0, cooldown: 4, currentCooldown: 0, damageMult: 3.2, scalingStat: Stat.SPD, element: ElementType.LIGHTNING,
    critBonus: 15
  },
  CHIDORI_STREAM: {
    id: 'chidori_stream', name: 'Chidori Stream', tier: SkillTier.EPIC, description: 'Releases lightning chakra in all directions, paralyzing nearby foes.',
    chakraCost: 40, hpCost: 0, cooldown: 4, currentCooldown: 0, damageMult: 2.5, scalingStat: Stat.INT, element: ElementType.LIGHTNING,
    effects: [{ type: EffectType.STUN, duration: 1, chance: 0.8 }]
  },
  SAND_COFFIN: {
    id: 'sand_coffin', name: 'Sand Coffin', tier: SkillTier.EPIC, description: 'Encases the enemy in crushing waves of sand, imploding under pressure.',
    chakraCost: 40, hpCost: 0, cooldown: 5, currentCooldown: 0, damageMult: 2.4, scalingStat: Stat.INT, element: ElementType.EARTH,
    effects: [{ type: EffectType.STUN, duration: 1, chance: 0.7 }]
  },
  WATER_DRAGON: {
    id: 'water_dragon', name: 'Water Dragon', tier: SkillTier.EPIC, description: 'Manifests a majestic dragon of water to crash down upon the foe.',
    chakraCost: 30, hpCost: 0, cooldown: 4, currentCooldown: 0, damageMult: 2.6, scalingStat: Stat.INT, element: ElementType.WATER
  },
  FALSE_SURROUNDINGS: {
    id: 'false_surroundings', name: 'False Surroundings', tier: SkillTier.EPIC, description: 'Alters the perception of the environment, causing the enemy to attack wildly.',
    chakraCost: 45, hpCost: 0, cooldown: 5, currentCooldown: 0, damageMult: 0, scalingStat: Stat.GEN, element: ElementType.PHYSICAL,
    effects: [{ type: EffectType.CONFUSION, duration: 3, chance: 0.8 }]
  },
  TEMPLE_NIRVANA: {
    id: 'temple_nirvana', name: 'Temple of Nirvana', tier: SkillTier.EPIC, description: 'Descending feathers induce a deep, magical slumber. Bypasses armor.',
    chakraCost: 50, hpCost: 0, cooldown: 6, currentCooldown: 0, damageMult: 0, scalingStat: Stat.GEN, element: ElementType.PHYSICAL,
    effects: [{ type: EffectType.STUN, duration: 2, chance: 1.0 }]
  },

  // Legendary / Ambush
  DEMON_SLASH: {
    id: 'demon_slash', name: 'Demon Slash', tier: SkillTier.LEGENDARY, description: 'A brutal, sweeping cleave executed with the Executioner Blade.',
    chakraCost: 0, hpCost: 0, cooldown: 2, currentCooldown: 0, damageMult: 2.0, scalingStat: Stat.STR, element: ElementType.PHYSICAL,
    effects: [{ type: EffectType.DOT, value: 15, duration: 3, chance: 1.0 }] // Bleed
  },
  BONE_DRILL: {
    id: 'bone_drill', name: 'Dance of Clematis', tier: SkillTier.LEGENDARY, description: 'A macabre dance manipulating bone density into a piercing spear.',
    chakraCost: 0, hpCost: 10, cooldown: 3, currentCooldown: 0, damageMult: 2.5, scalingStat: Stat.STR, element: ElementType.PHYSICAL,
    critBonus: 30
  },
  POISON_FOG: {
    id: 'poison_fog', name: 'Ibuse Poison', tier: SkillTier.LEGENDARY, description: 'Exhales a cloud of toxic gas that chokes the life from the victim.',
    chakraCost: 20, hpCost: 0, cooldown: 3, currentCooldown: 0, damageMult: 1.5, scalingStat: Stat.INT, element: ElementType.FIRE,
    effects: [{ type: EffectType.DOT, value: 18, duration: 4, chance: 1.0 }] // Poison
  },
  TSUKUYOMI: {
    id: 'tsukuyomi', name: 'Tsukuyomi', tier: SkillTier.LEGENDARY, description: 'Traps the target in an illusion of torture for what feels like days. Massive Mental Damage.',
    chakraCost: 80, hpCost: 15, cooldown: 6, currentCooldown: 0, damageMult: 4.0, scalingStat: Stat.GEN, element: ElementType.FIRE,
    effects: [{ type: EffectType.STUN, duration: 1, chance: 1.0 }]
  },

  // Boss / Forbidden
  C4_KARURA: {
      id: 'c4_karura', name: 'C4 Karura', tier: SkillTier.FORBIDDEN, description: 'Microscopic clay spiders that disintegrate the target on a cellular level.',
      chakraCost: 100, hpCost: 0, cooldown: 6, currentCooldown: 0, damageMult: 3.5, scalingStat: Stat.INT, element: ElementType.EARTH
  },
  RASENSHURIKEN: {
      id: 'rasenshuriken', name: 'Rasenshuriken', tier: SkillTier.FORBIDDEN, description: 'A microscopic wind blade vortex that severs chakra channels. Massive damage.',
      chakraCost: 120, hpCost: 0, cooldown: 5, currentCooldown: 0, damageMult: 4.5, scalingStat: Stat.INT, element: ElementType.WIND
  },
  AMATERASU: {
      id: 'amaterasu', name: 'Amaterasu', tier: SkillTier.FORBIDDEN, description: 'Inextinguishable black flames that burn until the target is ash.',
      chakraCost: 80, hpCost: 20, cooldown: 5, currentCooldown: 0, damageMult: 1.5, scalingStat: Stat.INT, element: ElementType.FIRE,
      effects: [{ type: EffectType.DOT, value: 50, duration: 5, chance: 1.0 }]
  },
  KIRIN: {
      id: 'kirin', name: 'Kirin', tier: SkillTier.FORBIDDEN, description: 'Harnesses natural lightning from the heavens for an unavoidable strike.',
      chakraCost: 150, hpCost: 0, cooldown: 8, currentCooldown: 0, damageMult: 4.5, scalingStat: Stat.INT, element: ElementType.LIGHTNING
  },
  // NEW BOSS SKILLS
  SHINRA_TENSEI: {
      id: 'shinra_tensei', name: 'Shinra Tensei', tier: SkillTier.FORBIDDEN, description: 'Almighty Push. Repels everything in the vicinity with crushing force.',
      chakraCost: 80, hpCost: 0, cooldown: 5, currentCooldown: 0, damageMult: 3.0, scalingStat: Stat.INT, element: ElementType.WIND,
      effects: [{ type: EffectType.STUN, duration: 1, chance: 0.5 }]
  },
  KAMUI_IMPACT: {
      id: 'kamui_impact', name: 'Kamui', tier: SkillTier.FORBIDDEN, description: 'Space-Time Ninjutsu that warps reality, bypassing defenses.',
      chakraCost: 60, hpCost: 0, cooldown: 4, currentCooldown: 0, damageMult: 3.5, scalingStat: Stat.INT, element: ElementType.PHYSICAL, // Neutral element
      effects: [{ type: EffectType.DEBUFF, targetStat: Stat.ACC, value: 0.5, duration: 2, chance: 1.0 }]
  },
  TENGAI_SHINSEI: {
      id: 'tengai_shinsei', name: 'Tengai Shinsei', tier: SkillTier.FORBIDDEN, description: 'Summons a massive meteorite from the atmosphere. Catastrophic damage.',
      chakraCost: 150, hpCost: 0, cooldown: 8, currentCooldown: 0, damageMult: 5.0, scalingStat: Stat.INT, element: ElementType.EARTH
  }
};

export const CLAN_START_SKILL: Record<Clan, Skill> = {
  [Clan.UZUMAKI]: SKILLS.RASENGAN,
  [Clan.UCHIHA]: SKILLS.FIREBALL,
  [Clan.HYUGA]: SKILLS.GENTLE_FIST,
  [Clan.LEE]: SKILLS.PRIMARY_LOTUS,
  [Clan.YAMANAKA]: SKILLS.MIND_DESTRUCTION,
};

export const BASE_ITEM_NAMES = {
  [ItemSlot.WEAPON]: ['Kunai', 'Katana', 'Shuriken', 'War Fan', 'Kama', 'Tanto', 'Samehada (Replica)', 'Executioner Blade', 'Chakra Blades', 'Kusanagi'],
  [ItemSlot.HEAD]: ['Forehead Protector', 'ANBU Mask', 'Hood', 'Straw Hat', 'Kabuto', 'Hokage Hat (Replica)', 'Rebreather', 'Spirit Mask', 'Visor'],
  [ItemSlot.BODY]: ['Flak Jacket', 'Chainmail', 'Kimono', 'Akatsuki Cloak (Tatters)', 'Battle Armor', 'Weighted Clothes', 'Sage Robe'],
  [ItemSlot.ACCESSORY]: ['Ninja Scroll', 'Makimono', 'Soldier Pill Case', 'Family Crest', 'Charm', 'Bell', 'Necklace', 'Prayer Beads', 'Ring']
};

// --- Bosses Updated for Story Arcs ---
export const BOSS_NAMES = {
  // Academy Arc
  10: { name: 'Mizuki', element: ElementType.PHYSICAL, skill: SKILLS.DEMON_SLASH }, 
  // Land of Waves Arc
  20: { name: 'Zabuza Momochi', element: ElementType.WATER, skill: SKILLS.WATER_DRAGON },
  // Chunin Exams Arc
  30: { name: 'Orochimaru', element: ElementType.WIND, skill: SKILLS.POISON_FOG },
  40: { name: 'Neji Hyuga', element: ElementType.PHYSICAL, skill: SKILLS.GENTLE_FIST },
  50: { name: 'Gaara', element: ElementType.EARTH, skill: SKILLS.SAND_COFFIN },
  // Rogue Arc (Sasuke Retrieval)
  60: { name: 'Kimimaro', element: ElementType.PHYSICAL, skill: SKILLS.BONE_DRILL },
  70: { name: 'Sasuke Uchiha', element: ElementType.LIGHTNING, skill: SKILLS.CHIDORI },
  // War Arc
  80: { name: 'Pain', element: ElementType.WIND, skill: SKILLS.SHINRA_TENSEI }, 
  90: { name: 'Obito Uchiha', element: ElementType.FIRE, skill: SKILLS.KAMUI_IMPACT },
  100: { name: 'Madara Uchiha', element: ElementType.FIRE, skill: SKILLS.TENGAI_SHINSEI },
};

export const AMBUSH_ENEMIES = [
    { name: 'Zabuza Momochi', element: ElementType.WATER, skill: SKILLS.DEMON_SLASH },
    { name: 'Kimimaro', element: ElementType.PHYSICAL, skill: SKILLS.BONE_DRILL },
    { name: 'Hanzo the Salamander', element: ElementType.FIRE, skill: SKILLS.POISON_FOG }
];

export const EVENTS: GameEventDefinition[] = [
    {
        id: 'orochimaru_lab',
        title: "Orochimaru's Lab",
        description: "The air is thick with antiseptic and decay. Vats of green liquid bubble ominously. A forbidden scroll lies open, detailing a procedure to merge flesh with snake essence.",
        choices: [
            { label: "Undergo Experiment", type: 'GAMBLE_HP', value: 50, chance: 0.5, description: "50% Chance: +50 Max HP. Fail: -50% Current HP." },
            { label: "Leave", type: 'LEAVE', description: "Do not tamper with nature." }
        ]
    },
    {
        id: 'fresh_grave',
        title: "Fresh Grave",
        description: "A freshly dug grave in a field of red spider lilies. A high-quality weapon protrudes from the loose earth. The spirit of the fallen warrior seems restless.",
        choices: [
            { label: "Desecrate", type: 'FIGHT_GHOST', description: "Steal the weapon. Fight a vengeful spirit." },
            { label: "Pray", type: 'HEAL_CHAKRA', description: "Pay respects. Fully restore Chakra." }
        ]
    },
    {
        id: 'merchant',
        title: "Wandering Merchant",
        description: "A mysterious figure in a tattered hood sits by a small fire. He gestures to a sealed box.",
        choices: [
            { label: "Buy Mystery Box", type: 'TRADE', value: 150, description: "Cost: 150 Ryō." },
            { label: "Leave", type: 'LEAVE', description: "Save your money." }
        ]
    },
    {
        id: 'training_dummy',
        title: "Abandoned Training Grounds",
        description: "An old training stump used by legendary ninja. It still bears the scars of a thousand strikes.",
        choices: [
            { label: "Train Form", type: 'GAIN_XP', value: 50, description: "Practice Kata. Gain 50 Experience." }, 
            { label: 'Meditate', type: 'HEAL_ALL', description: 'Deep meditation. Fully recover HP and Chakra.' }
        ]
    },
    {
        id: 'forbidden_temple',
        title: "Forbidden Temple",
        description: "You discovered a sealed temple emitting a terrifying chakra pressure. Inside lies a forbidden scroll, but it is guarded by a monstrous entity.",
        choices: [
            { label: "Challenge Guardian", type: 'CHALLENGE_GUARDIAN', description: "Fight a powerful foe for a Forbidden Technique." },
            { label: "Leave", type: 'LEAVE', description: "The risk is too great." }
        ]
    }
];