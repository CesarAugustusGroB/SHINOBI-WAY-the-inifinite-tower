import { GameEvent, Rarity, RiskLevel } from '../../types';

/**
 * Generic events that can appear in any story arc.
 * These events provide special progression opportunities.
 */
export const GENERIC_EVENTS: GameEvent[] = [
  {
    id: 'ancient_treasure_map',
    title: 'Ancient Treasure Map',
    description:
      'An old scroll falls from a hidden compartment, revealing a map marked with strange symbols. It details the location of treasures far superior to what you usually find.',
    allowedArcs: [], // Empty = available in all arcs
    rarity: Rarity.RARE,
    choices: [
      {
        label: 'Follow the Map',
        description: 'HIGH RISK - The path is dangerous but the reward is permanent',
        riskLevel: RiskLevel.HIGH,
        hintText: 'Fortune favors the bold...',
        outcomes: [
          {
            weight: 60,
            effects: {
              upgradeTreasureQuality: true,
              exp: 50,
              logMessage: 'The map leads to an ancient cache! Your treasure-finding abilities have permanently improved!',
              logType: 'gain',
            },
          },
          {
            weight: 25,
            effects: {
              hpChange: { percent: -25 },
              ryo: 100,
              logMessage: 'The path was treacherous. You found some gold but sustained injuries.',
              logType: 'danger',
            },
          },
          {
            weight: 15,
            effects: {
              hpChange: { percent: -15 },
              logMessage: 'The treasure was already looted. Only traps remained.',
              logType: 'danger',
            },
          },
        ],
      },
      {
        label: 'Sell the Map',
        description: 'SAFE - Guaranteed Ryo',
        riskLevel: RiskLevel.SAFE,
        outcomes: [
          {
            weight: 100,
            effects: {
              ryo: 200,
              logMessage: 'A collector pays well for the mysterious map.',
              logType: 'loot',
            },
          },
        ],
      },
      {
        label: 'Study the Map',
        description: 'LOW RISK - Gain knowledge',
        riskLevel: RiskLevel.LOW,
        outcomes: [
          {
            weight: 70,
            effects: {
              exp: 75,
              statChanges: { intelligence: 1 },
              logMessage: 'The ancient symbols reveal secrets of the old world.',
              logType: 'gain',
            },
          },
          {
            weight: 30,
            effects: {
              exp: 30,
              logMessage: 'The map is too faded to decipher fully.',
              logType: 'info',
            },
          },
        ],
      },
    ],
  },

  {
    id: 'traveling_merchant_caravan',
    title: 'Traveling Merchant Caravan',
    description:
      'A large caravan of merchants has stopped to rest. Their leader notices your shinobi gear and offers you a special opportunity.',
    allowedArcs: [], // Available in all arcs
    rarity: Rarity.RARE,
    choices: [
      {
        label: 'Join Their Network',
        description: 'MEDIUM RISK - Become a trade partner',
        riskLevel: RiskLevel.MEDIUM,
        hintText: 'Connections have value...',
        costs: { ryo: 150 },
        outcomes: [
          {
            weight: 70,
            effects: {
              addMerchantSlot: true,
              logMessage: 'You become part of their trade network! Merchants will now show you more items.',
              logType: 'gain',
            },
          },
          {
            weight: 30,
            effects: {
              ryo: 75,
              logMessage: 'The deal falls through, but they return part of your investment.',
              logType: 'info',
            },
          },
        ],
      },
      {
        label: 'Trade Goods',
        description: 'SAFE - Simple trade',
        riskLevel: RiskLevel.SAFE,
        outcomes: [
          {
            weight: 100,
            effects: {
              ryo: 100,
              exp: 25,
              logMessage: 'A profitable trade! You gained some gold and experience.',
              logType: 'loot',
            },
          },
        ],
      },
      {
        label: 'Help Guard the Caravan',
        description: 'MEDIUM RISK - Protect from bandits',
        riskLevel: RiskLevel.MEDIUM,
        outcomes: [
          {
            weight: 50,
            effects: {
              ryo: 175,
              exp: 50,
              logMessage: 'Bandits attacked! You drove them off and earned a reward.',
              logType: 'gain',
            },
          },
          {
            weight: 30,
            effects: {
              triggerCombat: {
                floor: 0,
                difficulty: 10,
                archetype: 'ASSASSIN',
                name: 'Bandit Leader',
              },
              logMessage: 'A dangerous bandit challenges you directly!',
              logType: 'danger',
            },
          },
          {
            weight: 20,
            effects: {
              exp: 40,
              logMessage: 'No bandits came. The merchants thank you anyway.',
              logType: 'info',
            },
          },
        ],
      },
    ],
  },

  {
    id: 'hidden_shrine_blessing',
    title: 'Hidden Shrine of Fortune',
    description:
      'Deep within a forgotten alcove, you discover an ancient shrine dedicated to a long-forgotten deity of fortune. Faded inscriptions promise blessings to those who make offerings.',
    allowedArcs: [], // Available in all arcs
    rarity: Rarity.EPIC,
    choices: [
      {
        label: 'Make a Generous Offering',
        description: 'HIGH RISK - Large offering for great blessing',
        riskLevel: RiskLevel.HIGH,
        costs: { ryo: 300 },
        hintText: 'The gods reward generosity...',
        outcomes: [
          {
            weight: 55,
            effects: {
              upgradeTreasureQuality: true,
              hpChange: { percent: 50 },
              chakraChange: { percent: 50 },
              logMessage: 'The shrine glows! Divine blessing enhances your fortune permanently!',
              logType: 'gain',
            },
          },
          {
            weight: 30,
            effects: {
              statChanges: { spirit: 2, calmness: 2 },
              exp: 100,
              logMessage: 'The blessing empowers your spirit instead.',
              logType: 'gain',
            },
          },
          {
            weight: 15,
            effects: {
              logMessage: 'The shrine remains silent. The old gods no longer listen.',
              logType: 'danger',
            },
          },
        ],
      },
      {
        label: 'Small Offering',
        description: 'LOW RISK - Modest offering, modest blessing',
        riskLevel: RiskLevel.LOW,
        costs: { ryo: 50 },
        outcomes: [
          {
            weight: 80,
            effects: {
              hpChange: { percent: 30 },
              chakraChange: { percent: 30 },
              exp: 40,
              logMessage: 'A warm glow restores your vitality.',
              logType: 'gain',
            },
          },
          {
            weight: 20,
            effects: {
              exp: 20,
              logMessage: 'A faint acknowledgment. Better than nothing.',
              logType: 'info',
            },
          },
        ],
      },
      {
        label: 'Meditate at the Shrine',
        description: 'SAFE - No offering, seek wisdom',
        riskLevel: RiskLevel.SAFE,
        outcomes: [
          {
            weight: 100,
            effects: {
              chakraChange: { percent: 25 },
              exp: 30,
              logMessage: 'The peaceful atmosphere calms your mind.',
              logType: 'gain',
            },
          },
        ],
      },
    ],
  },
];
