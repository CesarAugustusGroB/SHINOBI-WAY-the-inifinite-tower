import { EnhancedGameEventDefinition, PrimaryStat, Rarity, RiskLevel } from '../../types';

export const WAR_ARC_EVENTS: EnhancedGameEventDefinition[] = [
  {
    id: 'white_zetsu_paranoia',
    title: 'White Zetsu Paranoia',
    description:
      'Everything looks normal, but something feels wrong. Shadows move independently. Are these clones of the White Zetsu surrounding you?',
    allowedArcs: ['WAR_ARC'],
    rarity: Rarity.RARE,
    choices: [
      {
        label: 'Attack Preemptively',
        description: 'HIGH RISK - Strike first or strike nothing',
        riskLevel: RiskLevel.HIGH,
        hintText: 'Paranoia can be a weapon... or a trap.',
        outcomes: [
          {
            weight: 40,
            effects: {
              triggerCombat: {
                floor: 0,
                difficulty: 22,
                archetype: 'BALANCED',
                name: 'White Zetsu Army',
              },
              logMessage: 'Your attacks awaken the clones!',
              logType: 'danger',
            },
          },
          {
            weight: 35,
            effects: {
              exp: 150,
              logMessage: 'Your instinct was right! You destroy the clones before they can act.',
              logType: 'gain',
            },
          },
          {
            weight: 25,
            effects: {
              hpChange: { percent: -20 },
              logMessage: 'You attack nothing. Your paranoia exhausts you.',
              logType: 'danger',
            },
          },
        ],
      },
      {
        label: 'Wait and Observe',
        description: 'MEDIUM RISK - Patience tests your nerves',
        riskLevel: RiskLevel.MEDIUM,
        requirements: { minStat: { stat: PrimaryStat.CALMNESS, value: 25 } },
        outcomes: [
          {
            weight: 80,
            effects: {
              exp: 100,
              logMessage: 'Your patience reveals the truth. The clones materialize and you destroy them calmly.',
              logType: 'gain',
            },
          },
          {
            weight: 20,
            effects: {
              triggerCombat: {
                floor: 0,
                difficulty: 20,
                archetype: 'ASSASSIN',
                name: 'White Zetsu',
              },
              logMessage: 'They attack first!',
              logType: 'danger',
            },
          },
        ],
      },
      {
        label: 'Flee Through the Chaos',
        description: 'LOW RISK - Don\'t engage',
        riskLevel: RiskLevel.LOW,
        outcomes: [
          {
            weight: 90,
            effects: {
              logMessage: 'You run. Cowardice tastes bitter.',
              logType: 'danger',
            },
          },
          {
            weight: 10,
            effects: {
              hpChange: { percent: -15 },
              logMessage: 'A clone catches you as you flee!',
              logType: 'danger',
            },
          },
        ],
      },
    ],
  },

  {
    id: 'bijuu_chakra_fragment',
    title: 'Bijuu Chakra Fragment',
    description:
      'Broken divine tree roots glow with immense chakra. A shard of Bijuu power rests here, pulsing with infinite potential.',
    allowedArcs: ['WAR_ARC'],
    rarity: Rarity.RARE,
    choices: [
      {
        label: 'Absorb the Chakra',
        description: 'EXTREME RISK - God-like power or annihilation',
        riskLevel: RiskLevel.EXTREME,
        hintText: 'Only legends speak of surviving this...',
        outcomes: [
          {
            weight: 30,
            effects: {
              statChanges: { chakra: 10, spirit: 8, willpower: 8 },
              exp: 300,
              logMessage: 'The Bijuu power floods through you! You are forever changed.',
              logType: 'loot',
            },
          },
          {
            weight: 50,
            effects: {
              hpChange: { percent: -80 },
              logMessage: 'The power is too great! Your body burns from the inside.',
              logType: 'danger',
            },
          },
          {
            weight: 20,
            effects: {
              exp: 180,
              statChanges: { chakra: 5 },
              logMessage: 'You carefully extract a small portion of the chakra.',
              logType: 'gain',
            },
          },
        ],
      },
      {
        label: 'Contain It Safely',
        description: 'MEDIUM RISK - Scientific approach',
        riskLevel: RiskLevel.MEDIUM,
        requirements: { minStat: { stat: PrimaryStat.INTELLIGENCE, value: 25 } },
        outcomes: [
          {
            weight: 70,
            effects: {
              exp: 200,
              ryo: 500,
              statChanges: { intelligence: 3 },
              logMessage: 'Your brilliant technique safely harnesses the chakra!',
              logType: 'loot',
            },
          },
          {
            weight: 30,
            effects: {
              hpChange: { percent: -30 },
              logMessage: 'Your containment fails. Bijuu chakra overwhelms you.',
              logType: 'danger',
            },
          },
        ],
      },
      {
        label: 'Leave It for the Gods',
        description: 'SAFE - Respect boundaries',
        riskLevel: RiskLevel.SAFE,
        outcomes: [
          {
            weight: 100,
            effects: {
              logMessage: 'Some power is not meant for mortal hands.',
              logType: 'gain',
            },
          },
        ],
      },
    ],
  },
];
