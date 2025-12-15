import React, { useState, useMemo } from 'react';
import {
  ApproachType,
  TerrainDefinition,
  TerrainType,
  CharacterStats,
  Player,
  Enemy,
} from '../../game/types';
import {
  APPROACH_DEFINITIONS,
  calculateApproachSuccessChance,
  meetsApproachRequirements,
} from '../../game/constants/approaches';
import {
  Sword,
  Eye,
  Brain,
  TreePine,
  Wind,
  X,
  Check,
  AlertTriangle,
  Zap,
} from 'lucide-react';

// Simplified combat node info for approach selection
interface CombatNodeInfo {
  id: string;
  type: 'COMBAT' | 'ELITE' | 'BOSS';
  terrain: TerrainType;
  enemy?: Enemy;
}

interface ApproachSelectorProps {
  node: CombatNodeInfo;
  terrain: TerrainDefinition;
  player: Player;
  playerStats: CharacterStats;
  onSelectApproach: (approach: ApproachType) => void;
  onCancel: () => void;
}

const ApproachSelector: React.FC<ApproachSelectorProps> = ({
  node,
  terrain,
  player,
  playerStats,
  onSelectApproach,
  onCancel,
}) => {
  const [selectedApproach, setSelectedApproach] = useState<ApproachType | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  // Check if this is an elite or boss
  const isEliteOrBoss = node.type === 'ELITE' || node.type === 'BOSS';

  // Get player stats as flat object for calculations
  const stats = useMemo(() => ({
    speed: playerStats.primary.speed,
    dexterity: playerStats.primary.dexterity,
    intelligence: playerStats.primary.intelligence,
    calmness: playerStats.primary.calmness,
    accuracy: playerStats.primary.accuracy,
    willpower: playerStats.primary.willpower,
    strength: playerStats.primary.strength,
    spirit: playerStats.primary.spirit,
    chakra: playerStats.primary.chakra,
  }), [playerStats]);

  // Get player skill IDs
  const skillIds = useMemo(() => player.skills.map(s => s.id), [player.skills]);

  // Calculate approach availability and success chances
  const approaches = useMemo(() => {
    return Object.values(ApproachType).map(approachType => {
      const def = APPROACH_DEFINITIONS[approachType];

      // Bypass not available for elite/boss
      if (approachType === ApproachType.SHADOW_BYPASS && isEliteOrBoss) {
        return {
          type: approachType,
          def,
          available: false,
          reason: 'Cannot bypass Elite or Boss encounters',
          successChance: 0,
        };
      }

      const { meets, reason } = meetsApproachRequirements(
        approachType,
        stats,
        skillIds,
        node.terrain
      );

      const successChance = meets
        ? calculateApproachSuccessChance(approachType, stats, terrain.effects.stealthModifier)
        : 0;

      return {
        type: approachType,
        def,
        available: meets,
        reason,
        successChance: Math.round(successChance),
      };
    });
  }, [stats, skillIds, node.terrain, terrain, isEliteOrBoss]);

  // Get approach icon
  const getApproachIcon = (type: ApproachType): React.ReactNode => {
    switch (type) {
      case ApproachType.FRONTAL_ASSAULT:
        return <Sword className="w-6 h-6" />;
      case ApproachType.STEALTH_AMBUSH:
        return <Eye className="w-6 h-6" />;
      case ApproachType.GENJUTSU_SETUP:
        return <Brain className="w-6 h-6" />;
      case ApproachType.ENVIRONMENTAL_TRAP:
        return <TreePine className="w-6 h-6" />;
      case ApproachType.SHADOW_BYPASS:
        return <Wind className="w-6 h-6" />;
      default:
        return <Zap className="w-6 h-6" />;
    }
  };

  // Get success chance color
  const getSuccessColor = (chance: number): string => {
    if (chance >= 80) return 'text-green-400';
    if (chance >= 60) return 'text-emerald-400';
    if (chance >= 40) return 'text-yellow-400';
    if (chance >= 20) return 'text-orange-400';
    return 'text-red-400';
  };

  // Get success bar color
  const getSuccessBarColor = (chance: number): string => {
    if (chance >= 80) return 'bg-green-500';
    if (chance >= 60) return 'bg-emerald-500';
    if (chance >= 40) return 'bg-yellow-500';
    if (chance >= 20) return 'bg-orange-500';
    return 'bg-red-500';
  };

  // Handle approach selection
  const handleSelect = (approach: ApproachType) => {
    setSelectedApproach(approach);
    setShowConfirm(true);
  };

  // Handle confirm
  const handleConfirm = () => {
    if (selectedApproach) {
      onSelectApproach(selectedApproach);
    }
  };

  const selectedDef = selectedApproach ? APPROACH_DEFINITIONS[selectedApproach] : null;
  const selectedInfo = approaches.find(a => a.type === selectedApproach);

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-zinc-900 border-2 border-zinc-700 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-zinc-700 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-serif text-zinc-200 tracking-wider">
              CHOOSE YOUR APPROACH
            </h2>
            <p className="text-sm text-zinc-500 font-mono mt-1">
              {node.enemy?.name || 'Unknown Enemy'} • {terrain.name}
            </p>
          </div>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-zinc-800 rounded transition-colors"
            aria-label="Close approach selector"
          >
            <X className="w-5 h-5 text-zinc-400" />
          </button>
        </div>

        {/* Approach Cards */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {approaches.map(approach => (
              <button
                key={approach.type}
                onClick={() => approach.available && handleSelect(approach.type)}
                disabled={!approach.available}
                className={`
                  p-4 rounded-lg border-2 text-left transition-all duration-200
                  ${approach.available
                    ? 'bg-zinc-800 border-zinc-600 hover:border-zinc-500 hover:bg-zinc-750 cursor-pointer'
                    : 'bg-zinc-900 border-zinc-800 opacity-50 cursor-not-allowed'
                  }
                  ${selectedApproach === approach.type ? 'ring-2 ring-cyan-500 border-cyan-500' : ''}
                `}
              >
                {/* Icon and Name */}
                <div className="flex items-center gap-3 mb-3">
                  <div className={`
                    p-2 rounded-lg
                    ${approach.available ? 'bg-zinc-700 text-zinc-200' : 'bg-zinc-800 text-zinc-600'}
                  `}>
                    {getApproachIcon(approach.type)}
                  </div>
                  <div>
                    <h3 className={`font-bold ${approach.available ? 'text-zinc-200' : 'text-zinc-500'}`}>
                      {approach.def.name}
                    </h3>
                    {approach.type === ApproachType.FRONTAL_ASSAULT && (
                      <span className="text-xs text-zinc-500">Always Available</span>
                    )}
                  </div>
                </div>

                {/* Description */}
                <p className={`text-sm mb-3 ${approach.available ? 'text-zinc-400' : 'text-zinc-600'}`}>
                  {approach.def.description}
                </p>

                {/* Success Chance */}
                {approach.available && (
                  <div className="mb-3">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-zinc-500">Success Chance</span>
                      <span className={getSuccessColor(approach.successChance)}>
                        {approach.successChance}%
                      </span>
                    </div>
                    <div className="h-2 bg-zinc-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${getSuccessBarColor(approach.successChance)} transition-all duration-300`}
                        style={{ width: `${approach.successChance}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Requirements/Reason */}
                {!approach.available && approach.reason && (
                  <div className="flex items-center gap-2 text-xs text-red-400/70">
                    <AlertTriangle className="w-3 h-3" />
                    {approach.reason}
                  </div>
                )}

                {/* Cost indicators */}
                {approach.available && approach.def.successEffects.chakraCost > 0 && (
                  <div className="text-xs text-blue-400 mt-2">
                    Costs {approach.def.successEffects.chakraCost} Chakra
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Terrain Effects Summary */}
        <div className="p-3 bg-zinc-800/50 border-t border-zinc-700">
          <div className="flex gap-4 text-xs text-zinc-400">
            <span className="font-bold text-zinc-300">Terrain Effects:</span>
            {terrain.effects.stealthModifier !== 0 && (
              <span className={terrain.effects.stealthModifier > 0 ? 'text-green-400' : 'text-red-400'}>
                Stealth {terrain.effects.stealthModifier > 0 ? '+' : ''}{terrain.effects.stealthModifier}%
              </span>
            )}
            {terrain.effects.initiativeModifier !== 0 && (
              <span className={terrain.effects.initiativeModifier > 0 ? 'text-green-400' : 'text-red-400'}>
                Initiative {terrain.effects.initiativeModifier > 0 ? '+' : ''}{terrain.effects.initiativeModifier}
              </span>
            )}
            {terrain.effects.hazard && (
              <span className="text-amber-400">
                {terrain.effects.hazard.type} hazard active
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirm && selectedDef && selectedInfo && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-60">
          <div className="bg-zinc-900 border-2 border-zinc-600 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-serif text-zinc-200 mb-4">
              Confirm Approach
            </h3>

            <div className="flex items-center gap-4 mb-4 p-3 bg-zinc-800 rounded">
              <div className="p-2 bg-zinc-700 rounded">
                {getApproachIcon(selectedApproach!)}
              </div>
              <div>
                <p className="font-bold text-zinc-200">{selectedDef.name}</p>
                <p className={`text-sm ${getSuccessColor(selectedInfo.successChance)}`}>
                  {selectedInfo.successChance}% Success Chance
                </p>
              </div>
            </div>

            {/* On Success */}
            <div className="mb-3">
              <p className="text-xs font-bold text-green-400 mb-1">On Success:</p>
              <ul className="text-xs text-zinc-400 space-y-1 ml-2">
                {selectedDef.successEffects.guaranteedFirst && (
                  <li>• Guaranteed first turn</li>
                )}
                {selectedDef.successEffects.firstHitMultiplier > 1 && (
                  <li>• First hit deals {selectedDef.successEffects.firstHitMultiplier}x damage</li>
                )}
                {selectedDef.successEffects.enemyHpReduction > 0 && (
                  <li>• Enemy loses {selectedDef.successEffects.enemyHpReduction * 100}% HP</li>
                )}
                {selectedDef.successEffects.skipCombat && (
                  <li>• Skip combat entirely (no XP/loot)</li>
                )}
                {selectedDef.successEffects.xpMultiplier > 1 && (
                  <li>• +{Math.round((selectedDef.successEffects.xpMultiplier - 1) * 100)}% XP</li>
                )}
              </ul>
            </div>

            {/* On Failure (only show if different from frontal) */}
            {selectedApproach !== ApproachType.FRONTAL_ASSAULT && (
              <div className="mb-4">
                <p className="text-xs font-bold text-zinc-500 mb-1">On Failure:</p>
                <p className="text-xs text-zinc-500 ml-2">
                  Normal combat (no bonuses or penalties)
                </p>
              </div>
            )}

            {/* Cost warning */}
            {selectedDef.successEffects.chakraCost > 0 && (
              <div className="mb-4 p-2 bg-blue-900/30 border border-blue-800 rounded text-xs text-blue-300">
                This approach costs {selectedDef.successEffects.chakraCost} Chakra
                {player.currentChakra < selectedDef.successEffects.chakraCost && (
                  <span className="text-red-400 block mt-1">
                    Warning: Not enough chakra!
                  </span>
                )}
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-2 px-4 bg-zinc-800 border border-zinc-600 rounded text-zinc-300 hover:bg-zinc-700 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleConfirm}
                disabled={selectedDef.successEffects.chakraCost > player.currentChakra}
                className={`
                  flex-1 py-2 px-4 rounded font-bold flex items-center justify-center gap-2 transition-colors
                  ${selectedDef.successEffects.chakraCost > player.currentChakra
                    ? 'bg-zinc-800 border border-zinc-700 text-zinc-500 cursor-not-allowed'
                    : 'bg-cyan-800 border border-cyan-600 text-cyan-100 hover:bg-cyan-700'
                  }
                `}
              >
                <Check className="w-4 h-4" />
                Engage
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApproachSelector;
