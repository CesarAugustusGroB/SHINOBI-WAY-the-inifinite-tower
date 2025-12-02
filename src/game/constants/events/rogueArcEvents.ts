import { EnhancedGameEventDefinition, PrimaryStat, Rarity, RiskLevel } from '../../types';

export const ROGUE_ARC_EVENTS: EnhancedGameEventDefinition[] = [
  {
    id: 'sound_four_ritual',
    title: 'Sound Four Ritual Site',
    description:
      'A forbidden ritual chamber pulses with dark chakra. Four Sound ninja are performing a sealing ceremony on a captive.',
    allowedArcs: ['ROGUE_ARC'],
    rarity: Rarity.RARE,
    choices: [
      {
        label: 'Interrupt the Ritual',
        description: 'HIGH RISK - Stop the ceremony',
        riskLevel: RiskLevel.HIGH,
        outcomes: [
          {
            weight: 50,
            effects: {
              triggerCombat: {
                floor: 0,
                difficulty: 20,
                archetype: 'BALANCED',
                name: 'Sound Four',
              },
              logMessage: 'The ritual breaks! The Sound Four turn to attack you!',
              logType: 'danger',
            },
          },
          {
            weight: 50,
            effects: {
              exp: 150,
              ryo: 400,
              logMessage: 'You disrupt the ritual and the captive escapes. Their gratitude knows no bounds.',
              logType: 'loot',
            },
          },
        ],
      },
      {
        label: 'Observe Secretly',
        description: 'MEDIUM RISK - Gather intelligence',
        riskLevel: RiskLevel.MEDIUM,
        requirements: { minStat: { stat: PrimaryStat.CALMNESS, value: 20 } },
        outcomes: [
          {
            weight: 80,
            effects: {
              exp: 100,
              statChanges: { intelligence: 2 },
              logMessage: 'You learn the Sound Village\'s secrets from the shadows.',
              logType: 'gain',
            },
          },
          {
            weight: 20,
            effects: {
              triggerCombat: {
                floor: 0,
                difficulty: 18,
                archetype: 'ASSASSIN',
                name: 'Sound Ninja Scout',
              },
              logMessage: 'A scout spots you!',
              logType: 'danger',
            },
          },
        ],
      },
      {
        label: 'Slip Away Unnoticed',
        description: 'SAFE - Avoid confrontation',
        riskLevel: RiskLevel.SAFE,
        outcomes: [
          {
            weight: 100,
            effects: {
              logMessage: 'You walk away from the suffering. The screams haunt you.',
              logType: 'danger',
            },
          },
        ],
      },
    ],
  },

  {
    id: 'curse_mark_amplifier',
    title: 'Cursed Seal Amplifier',
    description:
      'A dark shrine contains an artifact that radiates cursed power. Veins of shadow pulse from it. Power calls to you.',
    allowedArcs: ['ROGUE_ARC'],
    rarity: Rarity.RARE,
    choices: [
      {
        label: 'Embrace the Curse',
        description: 'EXTREME RISK - Power or destruction',
        riskLevel: RiskLevel.EXTREME,
        hintText: 'The darkness has a price...',
        outcomes: [
          {
            weight: 35,
            effects: {
              statChanges: { strength: 5, spirit: 5 },
              exp: 200,
              logMessage: 'The curse mark brands itself onto your flesh! Immense power flows, but at what cost?',
              logType: 'loot',
            },
          },
          {
            weight: 35,
            effects: {
              hpChange: { percent: -60 },
              logMessage: 'The curse is too strong! It nearly destroys you from within.',
              logType: 'danger',
            },
          },
          {
            weight: 30,
            effects: {
              exp: 120,
              ryo: 300,
              logMessage: 'You resist the curse and seize the artifact. Its power is contained but no longer amplified.',
              logType: 'gain',
            },
          },
        ],
      },
      {
        label: 'Study the Amplifier',
        description: 'MEDIUM RISK - Learn its secrets',
        riskLevel: RiskLevel.MEDIUM,
        requirements: { minStat: { stat: PrimaryStat.INTELLIGENCE, value: 22 } },
        outcomes: [
          {
            weight: 75,
            effects: {
              exp: 150,
              statChanges: { intelligence: 3 },
              logMessage: 'Your intellect rivals Orochimaru\'s cunning. You understand the curse seal.',
              logType: 'gain',
            },
          },
          {
            weight: 25,
            effects: {
              hpChange: { percent: -25 },
              logMessage: 'The curse\'s backlash burns your mind.',
              logType: 'danger',
            },
          },
        ],
      },
      {
        label: 'Destroy It',
        description: 'LOW RISK - Remove temptation',
        riskLevel: RiskLevel.LOW,
        outcomes: [
          {
            weight: 100,
            effects: {
              logMessage: 'You destroy the shrine. Peace settles over the place.',
              logType: 'gain',
            },
          },
        ],
      },
    ],
  },

  {
    id: 'valley_vision',
    title: 'Valley of the End Vision',
    description:
      'At the valley\'s edge, memories of a legendary battle surface. The statue of a great shinobi watches silently.',
    allowedArcs: ['ROGUE_ARC'],
    rarity: Rarity.COMMON,
    choices: [
      {
        label: 'Meditate on the Memory',
        description: 'SAFE - Gain wisdom',
        riskLevel: RiskLevel.SAFE,
        outcomes: [
          {
            weight: 100,
            effects: {
              exp: 80,
              statChanges: { calmness: 2, intelligence: 1 },
              hpChange: { percent: 20 },
              chakraChange: { percent: 20 },
              logMessage: 'The valley\'s essence teaches you about bonds and sacrifice.',
              logType: 'gain',
            },
          },
        ],
      },
      {
        label: 'Challenge the Statue',
        description: 'HIGH RISK - Test yourself',
        riskLevel: RiskLevel.HIGH,
        outcomes: [
          {
            weight: 40,
            effects: {
              exp: 180,
              logMessage: 'You overcome your inner demons. The statue bows in respect.',
              logType: 'gain',
            },
          },
          {
            weight: 60,
            effects: {
              hpChange: { percent: -35 },
              logMessage: 'The challenge defeats you. You collapse in exhaustion.',
              logType: 'danger',
            },
          },
        ],
      },
      {
        label: 'Leave Respectfully',
        description: 'SAFE - Honor the fallen',
        riskLevel: RiskLevel.SAFE,
        outcomes: [
          {
            weight: 100,
            effects: {
              logMessage: 'You leave an offering and depart with honor.',
              logType: 'gain',
            },
          },
        ],
      },
    ],
  },
];
