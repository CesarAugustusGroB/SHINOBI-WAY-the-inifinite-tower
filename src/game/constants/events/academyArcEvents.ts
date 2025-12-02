import { EnhancedGameEventDefinition, PrimaryStat, Rarity, RiskLevel } from '../../types';

export const ACADEMY_ARC_EVENTS: EnhancedGameEventDefinition[] = [
  {
    id: 'forbidden_scroll_library',
    title: 'Forbidden Scroll in the Library',
    description:
      'Hidden behind ancient shelves, a sealed scroll glows with forbidden chakra. The elder librarian is nowhere to be found.',
    allowedArcs: ['ACADEMY_ARC'],
    rarity: Rarity.RARE,
    choices: [
      {
        label: 'Open the Scroll',
        description: 'HIGH RISK - Powerful knowledge or punishment',
        riskLevel: RiskLevel.HIGH,
        hintText: 'Some scrolls are sealed for a reason...',
        outcomes: [
          {
            weight: 40,
            effects: {
              statChanges: { intelligence: 3 },
              exp: 60,
              logMessage: 'You absorbed forbidden jutsu knowledge!',
              logType: 'gain',
            },
          },
          {
            weight: 35,
            effects: {
              hpChange: { percent: -20 },
              logMessage:
                'Cursed chakra erupted! The scroll burns and your hands are singed.',
              logType: 'danger',
            },
          },
          {
            weight: 25,
            effects: {
              exp: 100,
              ryo: 200,
              logMessage: 'The scroll revealed the location of a hidden treasure!',
              logType: 'loot',
            },
          },
        ],
      },
      {
        label: 'Take the Scroll Sealed',
        description: 'MEDIUM RISK - Sell it later',
        riskLevel: RiskLevel.MEDIUM,
        outcomes: [
          {
            weight: 70,
            effects: {
              ryo: 150,
              logMessage: 'A collector pays well for sealed curiosities.',
              logType: 'gain',
            },
          },
          {
            weight: 30,
            effects: {
              logMessage: 'The seal breaks en route. The scroll crumbles to dust.',
              logType: 'danger',
            },
          },
        ],
      },
      {
        label: 'Report to Sensei',
        description: 'SAFE - Gain trust',
        riskLevel: RiskLevel.SAFE,
        outcomes: [
          {
            weight: 100,
            effects: {
              exp: 30,
              logMessage: 'Your honesty impresses the academy instructors.',
              logType: 'gain',
            },
          },
        ],
      },
      {
        label: 'Leave It Alone',
        description: 'SAFE - No reward',
        riskLevel: RiskLevel.SAFE,
        outcomes: [
          {
            weight: 100,
            effects: {
              logMessage: 'Wisdom is knowing when not to act.',
              logType: 'info',
            },
          },
        ],
      },
    ],
  },

  {
    id: 'bullying_incident',
    title: 'Bullying Incident',
    description:
      'Older students corner a younger classmate. They seem ready to escalate. You recognize the fear in their eyes.',
    allowedArcs: ['ACADEMY_ARC'],
    rarity: Rarity.COMMON,
    choices: [
      {
        label: 'Intervene Forcefully',
        description: 'MEDIUM RISK - Combat or respect',
        riskLevel: RiskLevel.MEDIUM,
        hintText: 'Direct action has consequences...',
        requirements: { minStat: { stat: PrimaryStat.STRENGTH, value: 15 } },
        outcomes: [
          {
            weight: 60,
            effects: {
              exp: 40,
              logMessage: 'You stand up for the victim. The bullies back down, grudgingly respecting strength.',
              logType: 'gain',
            },
          },
          {
            weight: 40,
            effects: {
              triggerCombat: {
                floor: 0,
                difficulty: 5,
                archetype: 'BALANCED',
                name: 'Bullies',
              },
              logMessage: 'The bullies refuse to back down!',
              logType: 'danger',
            },
          },
        ],
      },
      {
        label: 'Talk Them Down',
        description: 'LOW RISK - Diplomatic approach',
        riskLevel: RiskLevel.LOW,
        requirements: { minStat: { stat: PrimaryStat.INTELLIGENCE, value: 12 } },
        outcomes: [
          {
            weight: 80,
            effects: {
              exp: 25,
              logMessage: 'Your calm words defuse the situation without violence.',
              logType: 'gain',
            },
          },
          {
            weight: 20,
            effects: {
              logMessage: 'They mock you and leave anyway.',
              logType: 'info',
            },
          },
        ],
      },
      {
        label: 'Ignore It',
        description: 'SAFE - No involvement',
        riskLevel: RiskLevel.SAFE,
        outcomes: [
          {
            weight: 100,
            effects: {
              logMessage: 'You walk past. The guilt lingers.',
              logType: 'danger',
            },
          },
        ],
      },
    ],
  },

  {
    id: 'secret_training_ground',
    title: 'Secret Training Ground',
    description:
      'A hidden clearing bears signs of intense training: scorched earth, broken trees, and chalk drawings of chakra points.',
    allowedArcs: ['ACADEMY_ARC'],
    rarity: Rarity.RARE,
    choices: [
      {
        label: 'Train Hard All Night',
        description: 'HIGH RISK - Exhausting but rewarding',
        riskLevel: RiskLevel.HIGH,
        hintText: 'Push your limits or rest?',
        outcomes: [
          {
            weight: 65,
            effects: {
              exp: 120,
              statChanges: { strength: 2, speed: 1 },
              logMessage: 'Grueling training that pushes you to your limits!',
              logType: 'gain',
            },
          },
          {
            weight: 35,
            effects: {
              hpChange: { percent: -15 },
              logMessage: 'You overdo it and collapse from exhaustion.',
              logType: 'danger',
            },
          },
        ],
      },
      {
        label: 'Practice Specific Techniques',
        description: 'MEDIUM RISK - Moderate gains',
        riskLevel: RiskLevel.MEDIUM,
        outcomes: [
          {
            weight: 80,
            effects: {
              exp: 70,
              statChanges: { dexterity: 1 },
              logMessage: 'Focused practice improves your technique.',
              logType: 'gain',
            },
          },
          {
            weight: 20,
            effects: {
              logMessage: 'You fail to make progress and feel discouraged.',
              logType: 'danger',
            },
          },
        ],
      },
      {
        label: 'Meditate and Restore',
        description: 'SAFE - Recover HP and Chakra',
        riskLevel: RiskLevel.SAFE,
        outcomes: [
          {
            weight: 100,
            effects: {
              hpChange: { percent: 30 },
              chakraChange: { percent: 30 },
              logMessage: 'Peaceful meditation restores your spirit.',
              logType: 'gain',
            },
          },
        ],
      },
    ],
  },
];
