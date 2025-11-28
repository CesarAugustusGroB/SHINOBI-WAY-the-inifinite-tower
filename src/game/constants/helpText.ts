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
      formula: "Enemy Stat = (Base × (1 + Floor × 0.08)) × (0.75 + Difficulty × 0.0025)",
      examples: [
        { floor: 1, difficulty: 0, text: "Floor 1, Difficulty D: ~1.0x multiplier" },
        { floor: 25, difficulty: 50, text: "Floor 25, Difficulty B: ~3.0x multiplier" },
        { floor: 50, difficulty: 100, text: "Floor 50, Difficulty S: ~4.6x multiplier" }
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
  // DUNGEONS - Room Types & Enemy Archetypes
  // ============================================================================
  DUNGEONS: {
    ROOM_TYPES: [
      {
        type: "COMBAT",
        desc: "Standard enemy encounter.",
        reward: "Normal loot drop"
      },
      {
        type: "ELITE",
        desc: "Rare, stronger enemy with bonus stats.",
        reward: "Rare+ loot guaranteed"
      },
      {
        type: "BOSS",
        desc: "Story boss; fixed encounter with named enemy.",
        reward: "Epic+ loot guaranteed + story progression"
      },
      {
        type: "EVENT",
        desc: "Choice-based encounter (not combat).",
        reward: "Stat buffs or penalties"
      },
      {
        type: "REST",
        desc: "Safe room to heal and recover.",
        reward: "Full HP/Chakra restore"
      },
      {
        type: "AMBUSH",
        desc: "Surprise encounter; less prepared enemies.",
        reward: "Extra XP bonus"
      }
    ],
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
      { arc: 1, floors: "1-8", name: "Academy", desc: "Training against basic ninja." },
      { arc: 2, floors: "9-17", name: "Chunin Exams", desc: "Challenging competitors emerge." },
      { arc: 3, floors: "18-35", name: "War Arc", desc: "Conflict escalates; stronger foes." },
      { arc: 4, floors: "36-55", name: "Shippuden", desc: "Legendary enemies appear." },
      { arc: 5, floors: "56+", name: "Final War", desc: "Ultimate threat; extreme difficulty." }
    ]
  }
};
