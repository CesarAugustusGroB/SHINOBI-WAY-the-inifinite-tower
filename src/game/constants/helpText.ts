import { EffectType, PrimaryStat, Clan, Rarity } from "../types";

export const HELP_TEXT = {
  STATS: {
    BODY: [
      {
        id: PrimaryStat.WILLPOWER,
        name: "Willpower",
        desc: "Grit & Survival.",
        effect: "Increases Max HP (12 per point). Governs Guts chance (survival at 1 HP) and HP Regen."
      },
      {
        id: PrimaryStat.CHAKRA,
        name: "Chakra",
        desc: "Energy Capacity.",
        effect: "Increases Max Chakra (8 per point). Necessary for using high-tier Jutsus."
      },
      {
        id: PrimaryStat.STRENGTH,
        name: "Strength",
        desc: "Physical Power.",
        effect: "Scales Taijutsu damage and Physical Defense."
      }
    ],
    MIND: [
      {
        id: PrimaryStat.SPIRIT,
        name: "Spirit",
        desc: "Elemental Affinity.",
        effect: "Scales Ninjutsu damage and Elemental Defense."
      },
      {
        id: PrimaryStat.INTELLIGENCE,
        name: "Intelligence",
        desc: "Tactical Knowledge.",
        effect: "Required to learn advanced Skills. Governs Chakra Regeneration."
      },
      {
        id: PrimaryStat.CALMNESS,
        name: "Calmness",
        desc: "Mental Fortitude.",
        effect: "Scales Genjutsu damage/defense and Resistance to status effects."
      }
    ],
    TECHNIQUE: [
      {
        id: PrimaryStat.SPEED,
        name: "Speed",
        desc: "Reflexes & Agility.",
        effect: "Governs Turn Initiative, Melee Hit Chance, and Evasion."
      },
      {
        id: PrimaryStat.ACCURACY,
        name: "Accuracy",
        desc: "Precision.",
        effect: "Governs Ranged Hit Chance and Ranged Critical Damage."
      },
      {
        id: PrimaryStat.DEXTERITY,
        name: "Dexterity",
        desc: "Hand Seals & Lethality.",
        effect: "Governs Critical Hit Chance for all attacks (0.5% per point)."
      }
    ]
  },

  DERIVED: [
    { name: "Evasion", desc: "Chance to completely dodge an attack. Capped by Soft Cap (250 Speed)." },
    { name: "Critical Chance", desc: "Chance to deal 1.75x damage. Base 8% + scaling with Dexterity." },
    { name: "Guts", desc: "Chance to survive a lethal blow with 1 HP. Scaling based on Willpower." },
    { name: "Status Resistance", desc: "Chance to ignore negative effects. Scaling based on Calmness." }
  ],

  EFFECTS: [
    { type: EffectType.STUN, label: "Stun", desc: "Target cannot act for the duration." },
    { type: EffectType.BURN, label: "Burn", desc: "Fire Damage over Time." },
    { type: EffectType.BLEED, label: "Bleed", desc: "Physical Damage over Time." },
    { type: EffectType.POISON, label: "Poison", desc: "Toxic Damage over Time (Ignores Defense)." },
    { type: EffectType.SHIELD, label: "Shield", desc: "Temporary HP that absorbs damage. Breaks when depleted." },
    { type: EffectType.REFLECTION, label: "Reflection", desc: "Returns a % of incoming damage back to the attacker." },
    { type: EffectType.INVULNERABILITY, label: "Invulnerability", desc: "Takes 0 damage from all sources." },
    { type: EffectType.CONFUSION, label: "Confusion", desc: "50% chance to hurt self instead of attacking." },
    { type: EffectType.SILENCE, label: "Silence", desc: "Cannot use Chakra-based skills." },
    { type: EffectType.REGEN, label: "Regeneration", desc: "Restores HP at the start of every turn." },
    { type: EffectType.CURSE, label: "Curse", desc: "Increases all damage taken by a percentage." }
  ],

  ELEMENTS: {
    CYCLE: "Fire > Wind > Lightning > Earth > Water > Fire",
    BONUS: "Super Effective hits deal 1.5x Damage, have +20% Crit Chance, and ignore 50% of %-Defense.",
    RESIST: "Resisted hits deal 0.5x Damage."
  },

  // ============================================================================
  // CLANS - The 5 Playable Lineages
  // ============================================================================
  CLANS: [
    {
      id: Clan.UZUMAKI,
      name: "Uzumaki",
      role: "Sustain Tank",
      desc: "Massive reserves of willpower and chakra.",
      strengths: ["Highest HP", "Largest Chakra pool", "Good HP Regeneration"],
      weakness: "Lower Speed and offensive stats",
      strategy: "Outlast enemies with healing and defensive play."
    },
    {
      id: Clan.UCHIHA,
      name: "Uchiha",
      role: "Elemental Glass Cannon",
      desc: "Masters of elemental ninjutsu and precision strikes.",
      strengths: ["High elemental damage (Spirit)", "High Critical Chance", "Fast reflexes (Speed)"],
      weakness: "Low HP and defenses",
      strategy: "Burst enemies down before taking heavy damage."
    },
    {
      id: Clan.HYUGA,
      name: "Hyuga",
      role: "Precision Taijutsu",
      desc: "Surgical strikers with pinpoint accuracy and technique.",
      strengths: ["Highest Accuracy", "High Dexterity (crits)", "Strong Strength & Speed balance"],
      weakness: "Lower chakra capacity",
      strategy: "Use melee attacks to land guaranteed critical hits."
    },
    {
      id: Clan.LEE,
      name: "Lee Disciple",
      role: "Pure Body Specialist",
      desc: "Extreme physical conditioning without any chakra.",
      strengths: ["Extreme Strength", "Extreme Speed", "High Willpower"],
      weakness: "No chakra for jutsus; Low mental stats",
      strategy: "Pure taijutsu focus; rely on physical attacks and buffs."
    },
    {
      id: Clan.YAMANAKA,
      name: "Yamanaka",
      role: "Mind Controller",
      desc: "Tactical masterminds with unshakeable mental fortitude.",
      strengths: ["Highest Intelligence", "Highest Calmness", "Good Chakra pool"],
      weakness: "Physically frail (Low Strength)",
      strategy: "Use status effects and debuffs to control the battlefield."
    }
  ],

  // ============================================================================
  // PROGRESSION - Game Scaling & Difficulty
  // ============================================================================
  PROGRESSION: {
    SCALING: {
      title: "Enemy Scaling Formula",
      formula: "totalScaling = floorMult × diffMult × 0.85",
      breakdown: [
        "floorMult = 1 + (floor × 0.08)  → +8% per floor",
        "diffMult = 0.50 + (difficulty / 200)  → 50%-100%",
        "0.85 = Enemy ease factor (15% reduction)"
      ],
      examples: [
        { floor: 10, difficulty: 40, text: "Floor 10, Diff 40: 1.8 × 0.70 × 0.85 = 1.07×" },
        { floor: 25, difficulty: 50, text: "Floor 25, Diff 50: 3.0 × 0.75 × 0.85 = 1.91×" },
        { floor: 50, difficulty: 100, text: "Floor 50, Diff 100: 5.0 × 1.0 × 0.85 = 4.25×" }
      ]
    },
    DIFFICULTY_RANKS: [
      { rank: "D", range: "0-29", color: "green-500", desc: "Beginner-friendly; low stat scaling" },
      { rank: "C", range: "30-59", color: "yellow-500", desc: "Standard difficulty; moderate scaling" },
      { rank: "B", range: "60-84", color: "orange-500", desc: "Challenging; significant scaling" },
      { rank: "S", range: "85-100", color: "red-600", desc: "Extreme danger; maximum scaling" }
    ],
    RESOURCES: [
      { label: "HP Calculation", formula: "50 + (Willpower × 12) + equipment" },
      { label: "Chakra Calculation", formula: "30 + (Chakra stat × 8) + equipment" },
      { label: "Skill Chakra Cost", formula: "Typical 10-30; Ultimate skills 40-50" },
      { label: "HP Regen", formula: "Scales with Intelligence and Willpower" },
      { label: "Chakra Regen", formula: "Scales with Intelligence and Calmness" }
    ],
    PROGRESSION_DETAILS: [
      { label: "XP per Enemy", formula: "Base 25 + (Floor × 5) + tier bonuses" },
      { label: "Level Up Requirement", formula: "100 × Level XP needed" },
      { label: "Crit Damage Multiplier", formula: "1.75x (Base 8% + 0.4% per Dexterity)" },
      { label: "Hit Chance Formula", formula: "85% + (Attacker Stat - Defender Stat) × 1.5%" }
    ]
  },

  // ============================================================================
  // EQUIPMENT - Loot & Item System
  // ============================================================================
  EQUIPMENT: {
    RARITIES: [
      {
        rarity: Rarity.COMMON,
        color: "text-zinc-500",
        dropRate: "~35%",
        statBonus: "Minimal flat bonuses",
        desc: "Common gear found everywhere."
      },
      {
        rarity: Rarity.RARE,
        color: "text-blue-400",
        dropRate: "~30%",
        statBonus: "Moderate flat bonuses",
        desc: "Better stats than common items."
      },
      {
        rarity: Rarity.EPIC,
        color: "text-purple-400",
        dropRate: "~20%",
        statBonus: "High flat + percent bonuses",
        desc: "Significantly stronger; % multipliers included."
      },
      {
        rarity: Rarity.LEGENDARY,
        color: "text-orange-400",
        dropRate: "~14%",
        statBonus: "Massive bonuses + special effects",
        desc: "Rare power spikes; define builds."
      },
      {
        rarity: Rarity.CURSED,
        color: "text-red-600",
        dropRate: "~1%",
        statBonus: "Mixed beneficial/harmful effects",
        desc: "Risky rewards; extreme stat swings."
      }
    ],
    SLOTS: [
      { slot: "Weapon", primary: "Strength", desc: "Scales Taijutsu damage and physical attacks." },
      { slot: "Head", primary: "Calmness", desc: "Improves mental defense and status resistance." },
      { slot: "Body", primary: "Willpower", desc: "Increases HP and guts chance." },
      { slot: "Accessory", primary: "Speed/Spirit", desc: "Boosts reflexes or elemental power." }
    ],
    SCALING: "Item stats scale with Floor and Difficulty. Higher floors = stronger drops."
  },

  // ============================================================================
  // COMBAT MECHANICS - Approaches & Terrain
  // ============================================================================
  COMBAT_MECHANICS: {
    APPROACHES: [
      { type: "Aggressive", desc: "Offensive stance. Increased damage output but reduced defenses.", color: "red" },
      { type: "Defensive", desc: "Protective stance. Enhanced defenses but lower damage.", color: "blue" },
      { type: "Balanced", desc: "Neutral stance. No bonuses or penalties.", color: "gray" },
      { type: "Evasive", desc: "Mobile stance. Higher evasion chance but inconsistent damage.", color: "green" }
    ],
    TERRAIN: [
      { type: "Open Field", desc: "Standard terrain with no special modifiers." },
      { type: "Forest", desc: "Dense cover. Boosts evasion for both sides." },
      { type: "Water", desc: "Aquatic environment. Water jutsu enhanced, Fire weakened." },
      { type: "Rocky", desc: "Unstable ground. Earth jutsu enhanced, Speed reduced." }
    ]
  },

  // ============================================================================
  // EXPLORATION - Region Hierarchy & Activities
  // ============================================================================
  EXPLORATION: {
    HIERARCHY: [
      { term: "Region", desc: "Themed area containing multiple locations (e.g., Land of Waves)", icon: "map" },
      { term: "Location", desc: "Specific area within a region with danger level 1-7", icon: "location" },
      { term: "Room", desc: "Individual explorable space using 1→2→4 branching structure", icon: "room" }
    ],
    DANGER_LEVELS: {
      desc: "Difficulty scaling within each location, ranging from 1 (easiest) to 7 (hardest)",
      formula: "effectiveFloor = 10 + (dangerLevel × 2) + floor(baseDifficulty / 20)",
      note: "Higher danger levels mean stronger enemies and better rewards"
    },
    ACTIVITIES: [
      { order: 1, activity: "Combat", desc: "Fight room enemy for XP and loot" },
      { order: 2, activity: "Elite Challenge", desc: "Optional guardian fight - choose to fight or escape" },
      { order: 3, activity: "Merchant", desc: "Buy items and equipment with Ryo" },
      { order: 4, activity: "Event", desc: "Story/choice encounter with multiple outcomes" },
      { order: 5, activity: "Scroll Discovery", desc: "Learn new jutsu skills" },
      { order: 6, activity: "Rest", desc: "Restore HP and chakra" },
      { order: 7, activity: "Training", desc: "Spend resources to upgrade stats" },
      { order: 8, activity: "Treasure", desc: "Collect components and Ryo" }
    ],
    ROOM_STATES: [
      { state: "Accessible", desc: "Room can be entered from current position" },
      { state: "Cleared", desc: "All activities in room have been completed" },
      { state: "Exit", desc: "Final room leading to next area or floor" }
    ],
    INTEL_MISSION: {
      title: "Intel Mission",
      desc: "Elite fight at room 10 of each location. Defeating the guardian grants a path choice reward and unlocks new routes."
    },
    ARCHETYPES: [
      {
        archetype: "TANK",
        stats: "High Willpower & Strength",
        playstyle: "Defensive; soaks damage",
        skills: "Shield, Regeneration buffs"
      },
      {
        archetype: "ASSASSIN",
        stats: "High Dexterity & Speed",
        playstyle: "Burst damage with high crits",
        skills: "High-damage single-target skills"
      },
      {
        archetype: "BALANCED",
        stats: "Even distribution",
        playstyle: "Versatile; no clear weakness",
        skills: "Mixed offensive & defensive"
      },
      {
        archetype: "CASTER",
        stats: "High Spirit & Intelligence",
        playstyle: "Elemental damage spam",
        skills: "Element-based AoE attacks"
      },
      {
        archetype: "GENJUTSU",
        stats: "High Calmness & Spirit",
        playstyle: "Control via status effects",
        skills: "Stun, Confusion, Silence, Debuffs"
      }
    ],
    STORY_ARCS: [
      { arc: 1, danger: "1-7", name: "Land of Waves", desc: "Coastal region controlled by Gato. Face bandits and hired ninja." },
      { arc: 2, danger: "1-7", name: "Chunin Exams", desc: "Forest of Death examination. Challenging competitors emerge." },
      { arc: 3, danger: "1-7", name: "Sasuke Retrieval", desc: "Valley of the End. Conflict escalates; stronger foes." },
      { arc: 4, danger: "1-7", name: "Great Ninja War", desc: "Divine Tree Roots. Legendary enemies appear." }
    ]
  },

  // ============================================================================
  // CRAFTING - Synthesis System
  // ============================================================================
  CRAFTING: {
    OVERVIEW: {
      title: "TFT-Style Crafting",
      desc: "Combine components to create powerful artifacts with passive effects"
    },
    COMPONENTS: {
      desc: "Basic crafting materials dropped from enemies",
      examples: [
        { name: "Ninja Steel", use: "Weapon crafting" },
        { name: "Spirit Tag", use: "Seal-based artifacts" },
        { name: "Chakra Pill", use: "Energy restoration items" },
        { name: "Shadow Essence", use: "Stealth artifacts" }
      ]
    },
    ARTIFACTS: {
      desc: "Crafted items with passive effects that trigger during combat",
      triggers: [
        { trigger: "combat_start", desc: "Activates when battle begins" },
        { trigger: "on_hit", desc: "Activates when you deal damage" },
        { trigger: "on_crit", desc: "Activates on critical hits" },
        { trigger: "below_half_hp", desc: "Activates when HP drops below 50%" }
      ]
    },
    BAG: {
      capacity: 8,
      desc: "Your component bag holds up to 8 items (components or artifacts)"
    },
    SYNTHESIS: {
      combine: "Select two components to create an artifact",
      disassemble: "Break an artifact back into components (returns 50% value)",
      tip: "Experiment with different combinations to discover new artifacts!"
    }
  }
};
