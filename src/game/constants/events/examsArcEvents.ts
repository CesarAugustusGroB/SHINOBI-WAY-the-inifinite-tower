import { EnhancedGameEventDefinition, Rarity, RiskLevel } from '../../types';

export const EXAMS_ARC_EVENTS: EnhancedGameEventDefinition[] = [
  {
    id: 'forest_death_trap',
    title: 'Forest of Death Trap',
    description:
      'Kunai attached to wires glint in the shadows. A scroll lies in the center of the clearing—bait for the unwary.',
    allowedArcs: ['EXAMS_ARC'],
    rarity: Rarity.RARE,
    choices: [
      {
        label: 'Disarm Trap Carefully',
        description: 'MEDIUM RISK - Requires focus',
        riskLevel: RiskLevel.MEDIUM,
        costs: { fatigue: 8 },
        outcomes: [
          {
            weight: 70,
            effects: {
              resourceChanges: { morale: 10 },
              ryo: 150,
              logMessage: 'You disarmed the trap and claimed the scroll!',
              logType: 'gain',
            },
          },
          {
            weight: 30,
            effects: {
              hpChange: { percent: -25 },
              resourceChanges: { morale: -5 },
              logMessage: 'Wire snapped! Kunai grazed your arm.',
              logType: 'danger',
            },
          },
        ],
      },
      {
        label: 'Rush and Grab',
        description: 'HIGH RISK - Trust your speed',
        riskLevel: RiskLevel.HIGH,
        requirements: { minStat: { stat: 'Speed', value: 40 } },
        outcomes: [
          {
            weight: 45,
            effects: {
              resourceChanges: { morale: 15 },
              exp: 80,
              logMessage: 'Lightning-fast reflexes! You snatched it!',
              logType: 'gain',
            },
          },
          {
            weight: 55,
            effects: {
              hpChange: { percent: -40 },
              resourceChanges: { fatigue: 15, morale: -10 },
              logMessage: 'The trap activated! Kunai pierced your shoulder!',
              logType: 'danger',
            },
          },
        ],
      },
      {
        label: 'Burn the Trap',
        description: 'LOW RISK - Destroy from range',
        riskLevel: RiskLevel.LOW,
        costs: { chakra: 20 },
        outcomes: [
          {
            weight: 100,
            effects: {
              resourceChanges: { morale: 5 },
              logMessage: 'Fire consumed the trap. The scroll burned too.',
              logType: 'info',
            },
          },
        ],
      },
      {
        label: 'Avoid It',
        description: 'SAFE',
        riskLevel: RiskLevel.SAFE,
        outcomes: [
          {
            weight: 100,
            effects: {
              logMessage: 'Better safe than sorry.',
              logType: 'info',
            },
          },
        ],
      },
    ],
  },

  {
    id: 'rival_team_encounter',
    title: 'Rival Team Encounter',
    description:
      'Another team blocks your path in the forest. They want your scroll, and they look prepared for a fight.',
    allowedArcs: ['EXAMS_ARC'],
    rarity: Rarity.COMMON,
    choices: [
      {
        label: 'Challenge Them to Combat',
        description: 'HIGH RISK - Victory or loss',
        riskLevel: RiskLevel.HIGH,
        outcomes: [
          {
            weight: 50,
            effects: {
              triggerCombat: {
                floor: 0,
                difficulty: 10,
                archetype: 'BALANCED',
                name: 'Rival Team',
              },
              logMessage: 'Combat is inevitable!',
              logType: 'danger',
            },
          },
          {
            weight: 50,
            effects: {
              exp: 100,
              resourceChanges: { morale: 15, fatigue: 10 },
              logMessage: 'Your confident aura intimidates them. They back down.',
              logType: 'gain',
            },
          },
        ],
      },
      {
        label: 'Negotiate a Truce',
        description: 'MEDIUM RISK - Diplomacy or deception',
        riskLevel: RiskLevel.MEDIUM,
        requirements: { minStat: { stat: 'Intelligence', value: 15 } },
        outcomes: [
          {
            weight: 65,
            effects: {
              exp: 40,
              resourceChanges: { morale: 5 },
              logMessage: 'You negotiate a temporary alliance.',
              logType: 'gain',
            },
          },
          {
            weight: 35,
            effects: {
              triggerCombat: {
                floor: 0,
                difficulty: 11,
                archetype: 'BALANCED',
                name: 'Suspicious Rivals',
              },
              logMessage: 'They see through your deception!',
              logType: 'danger',
            },
          },
        ],
      },
      {
        label: 'Flee into the Forest',
        description: 'LOW RISK - Escape without fighting',
        riskLevel: RiskLevel.LOW,
        costs: { fatigue: 12 },
        outcomes: [
          {
            weight: 80,
            effects: {
              resourceChanges: { morale: -5 },
              logMessage: 'You slip away into the dense forest.',
              logType: 'info',
            },
          },
          {
            weight: 20,
            effects: {
              hpChange: { percent: -15 },
              logMessage: 'They throw weapons as you flee. One grazes your back.',
              logType: 'danger',
            },
          },
        ],
      },
    ],
  },

  {
    id: 'giant_serpent_nest',
    title: 'Giant Serpent Nest',
    description:
      'A massive nest of giant snakes blocks the path. The air smells of venom. Legends say they guard treasure here.',
    allowedArcs: ['EXAMS_ARC'],
    rarity: Rarity.RARE,
    choices: [
      {
        label: 'Challenge the Serpents',
        description: 'EXTREME RISK - Legendary loot or death',
        riskLevel: RiskLevel.EXTREME,
        hintText: 'Only the truly brave (or foolish) dare this.',
        requirements: { minMorale: 60 },
        outcomes: [
          {
            weight: 30,
            effects: {
              triggerCombat: {
                floor: 0,
                difficulty: 25,
                archetype: 'TANK',
                name: 'Giant Serpents',
              },
              logMessage: 'The serpents sense your challenge!',
              logType: 'danger',
            },
          },
          {
            weight: 70,
            effects: {
              exp: 200,
              ryo: 500,
              resourceChanges: { morale: 30, fatigue: 15 },
              logMessage: 'You emerge from the nest victorious! The serpents retreat, leaving behind treasure.',
              logType: 'loot',
            },
          },
        ],
      },
      {
        label: 'Move Carefully Around',
        description: 'MEDIUM RISK - Stealth approach',
        riskLevel: RiskLevel.MEDIUM,
        costs: { fatigue: 15, hunger: 10 },
        requirements: { minStat: { stat: 'Dexterity', value: 20 } },
        outcomes: [
          {
            weight: 75,
            effects: {
              exp: 60,
              resourceChanges: { morale: 5 },
              logMessage: 'You slip past the serpents without disturbing them.',
              logType: 'gain',
            },
          },
          {
            weight: 25,
            effects: {
              hpChange: { percent: -30 },
              logMessage: 'A serpent nearly catches you! Venom burns your leg.',
              logType: 'danger',
            },
          },
        ],
      },
      {
        label: 'Leave This Place',
        description: 'SAFE - Avoid danger',
        riskLevel: RiskLevel.SAFE,
        outcomes: [
          {
            weight: 100,
            effects: {
              resourceChanges: { morale: -10 },
              logMessage: 'You avoid the serpents but wonder what treasures were left behind.',
              logType: 'info',
            },
          },
        ],
      },
    ],
  },

  {
    id: 'scroll_merchant',
    title: 'Forbidden Scroll Merchant',
    description:
      'A mysterious hooded figure emerges from the trees. "Rare scrolls, forbidden jutsu, hidden knowledge... for the right price."',
    allowedArcs: ['EXAMS_ARC'],
    rarity: Rarity.RARE,
    choices: [
      {
        label: 'Buy a Forbidden Technique',
        description: 'HIGH RISK - Power at a cost',
        riskLevel: RiskLevel.HIGH,
        costs: { ryo: 300 },
        requirements: { minStat: { stat: 'Spirit', value: 18 } },
        outcomes: [
          {
            weight: 100,
            effects: {
              statChanges: { spirit: 3, intelligence: 2 },
              exp: 80,
              logMessage: 'The forbidden jutsu awakens new power within you!',
              logType: 'loot',
            },
          },
        ],
      },
      {
        label: 'Buy Information',
        description: 'MEDIUM RISK - Knowledge is power',
        riskLevel: RiskLevel.MEDIUM,
        costs: { ryo: 100 },
        outcomes: [
          {
            weight: 70,
            effects: {
              exp: 100,
              resourceChanges: { morale: 5 },
              logMessage: 'The merchant reveals the location of a hidden shortcut.',
              logType: 'loot',
            },
          },
          {
            weight: 30,
            effects: {
              resourceChanges: { morale: -10 },
              logMessage: 'The information is worthless. You feel cheated.',
              logType: 'danger',
            },
          },
        ],
      },
      {
        label: 'Refuse and Move On',
        description: 'SAFE - Trust no one',
        riskLevel: RiskLevel.SAFE,
        outcomes: [
          {
            weight: 100,
            effects: {
              logMessage: 'You avoid the merchant\'s temptations.',
              logType: 'info',
            },
          },
        ],
      },
    ],
  },
];
