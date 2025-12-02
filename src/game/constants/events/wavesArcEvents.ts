import { EnhancedGameEventDefinition, PrimaryStat, Rarity, RiskLevel } from '../../types';

export const WAVES_ARC_EVENTS: EnhancedGameEventDefinition[] = [
  {
    id: 'bridge_worker_plea',
    title: "Bridge Worker's Plea",
    description:
      "A desperate worker approaches you. 'Mist ninja have taken my child. They'll release her for... protection money. Can you help?'",
    allowedArcs: ['WAVES_ARC'],
    rarity: Rarity.COMMON,
    choices: [
      {
        label: 'Hunt Down the Kidnappers',
        description: 'HIGH RISK - Combat for justice',
        riskLevel: RiskLevel.HIGH,
        hintText: 'You might save a life... or lose yours.',
        outcomes: [
          {
            weight: 50,
            effects: {
              triggerCombat: {
                floor: 0,
                difficulty: 10,
                archetype: 'BALANCED',
                name: 'Mist Kidnappers',
              },
              logMessage: 'You track down the kidnappers!',
              logType: 'danger',
            },
          },
          {
            weight: 50,
            effects: {
              exp: 80,
              ryo: 300,
              logMessage: 'You rescue the child and earn the eternal gratitude of the family!',
              logType: 'loot',
            },
          },
        ],
      },
      {
        label: 'Negotiate Payment Terms',
        description: 'MEDIUM RISK - Expensive but safer',
        riskLevel: RiskLevel.MEDIUM,
        costs: { ryo: 200 },
        requirements: { minStat: { stat: PrimaryStat.INTELLIGENCE, value: 14 } },
        outcomes: [
          {
            weight: 70,
            effects: {
              logMessage: "You broker a deal. The child's parents are grateful, if poorer.",
              logType: 'gain',
            },
          },
          {
            weight: 30,
            effects: {
              logMessage: 'The kidnappers take your money and disappear. No one knows if the child was ever released.',
              logType: 'danger',
            },
          },
        ],
      },
      {
        label: 'Give What You Can Spare',
        description: 'SAFE - Small help',
        riskLevel: RiskLevel.SAFE,
        costs: { ryo: 50 },
        outcomes: [
          {
            weight: 100,
            effects: {
              logMessage: 'Your kindness provides hope, though it may not be enough.',
              logType: 'gain',
            },
          },
        ],
      },
      {
        label: 'Walk Away',
        description: 'SAFE - No risk',
        riskLevel: RiskLevel.SAFE,
        outcomes: [
          {
            weight: 100,
            effects: {
              logMessage: "You hear screams in the distance that haunt you for days.",
              logType: 'danger',
            },
          },
        ],
      },
    ],
  },

  {
    id: 'mist_ambush_cache',
    title: 'Mist Ninja Cache',
    description:
      'A hidden supply depot of Mist ninja rests near the shore. Weapons, scrolls, and supplies are stacked haphazardly. The guards just left.',
    allowedArcs: ['WAVES_ARC'],
    rarity: Rarity.RARE,
    choices: [
      {
        label: 'Raid the Cache',
        description: 'HIGH RISK - Loot or ambush',
        riskLevel: RiskLevel.HIGH,
        hintText: 'The guards could return at any moment...',
        outcomes: [
          {
            weight: 45,
            effects: {
              ryo: 250,
              logMessage: 'You grab weapons and supplies before fleeing. Excellent haul!',
              logType: 'loot',
            },
          },
          {
            weight: 55,
            effects: {
              triggerCombat: {
                floor: 0,
                difficulty: 15,
                archetype: 'BALANCED',
                name: 'Mist Guards',
              },
              logMessage: 'The guards return while youre looting!',
              logType: 'danger',
            },
          },
        ],
      },
      {
        label: 'Sabotage Quietly',
        description: 'MEDIUM RISK - Destroy supplies',
        riskLevel: RiskLevel.MEDIUM,
        requirements: { minStat: { stat: PrimaryStat.DEXTERITY, value: 18 } },
        outcomes: [
          {
            weight: 75,
            effects: {
              ryo: 150,
              exp: 60,
              logMessage: 'You sabotage their supplies without being detected!',
              logType: 'gain',
            },
          },
          {
            weight: 25,
            effects: {
              triggerCombat: {
                floor: 0,
                difficulty: 12,
                archetype: 'ASSASSIN',
                name: 'Mist Ninja',
              },
              logMessage: 'A hidden guard spots you!',
              logType: 'danger',
            },
          },
        ],
      },
      {
        label: 'Leave It Untouched',
        description: 'SAFE - Avoid attention',
        riskLevel: RiskLevel.SAFE,
        outcomes: [
          {
            weight: 100,
            effects: {
              logMessage: 'Discretion is sometimes the best strategy.',
              logType: 'info',
            },
          },
        ],
      },
    ],
  },

  {
    id: 'tazuna_request',
    title: "Tazuna's Request",
    description:
      'The bridge builder approaches with a proposition: help with bridge construction and he will pay extra. The work is hard but honest.',
    allowedArcs: ['WAVES_ARC'],
    rarity: Rarity.COMMON,
    choices: [
      {
        label: 'Work the Full Shift',
        description: 'MEDIUM RISK - Hard labor for payment',
        riskLevel: RiskLevel.MEDIUM,
        outcomes: [
          {
            weight: 100,
            effects: {
              ryo: 200,
              logMessage: 'Honest work earns honest pay. Your muscles ache but your spirit feels lighter.',
              logType: 'gain',
            },
          },
        ],
      },
      {
        label: 'Negotiate Better Terms',
        description: 'LOW RISK - Skilled negotiation',
        riskLevel: RiskLevel.LOW,
        requirements: { minStat: { stat: PrimaryStat.INTELLIGENCE, value: 16 } },
        outcomes: [
          {
            weight: 80,
            effects: {
              ryo: 300,
              logMessage: 'Your negotiation skills net you a much better rate.',
              logType: 'gain',
            },
          },
          {
            weight: 20,
            effects: {
              ryo: 150,
              logMessage: 'Tazuna refuses your demands and pays less out of spite.',
              logType: 'danger',
            },
          },
        ],
      },
      {
        label: 'Decline Politely',
        description: 'SAFE - No commitment',
        riskLevel: RiskLevel.SAFE,
        outcomes: [
          {
            weight: 100,
            effects: {
              logMessage: 'You have more pressing matters to attend to.',
              logType: 'info',
            },
          },
        ],
      },
    ],
  },
];
