import { EffectType, PrimaryStat } from "../types";

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
  }
};
