import React from 'react';
import {
  ExplorationNode,
  NodeType,
  TerrainDefinition,
  CharacterStats,
  ApproachType,
  Player,
} from '../game/types';
import {
  APPROACH_DEFINITIONS,
  calculateApproachSuccessChance,
  meetsApproachRequirements,
} from '../game/constants/approaches';
import {
  Sword,
  Heart,
  MapPin,
  Crown,
  AlertTriangle,
  Zap,
  HelpCircle,
  Eye,
  Sparkles,
  GraduationCap,
  Dumbbell,
  Award,
  Gift,
  Target,
  Wind,
  Droplets,
  Flame,
  Mountain,
  TreePine,
  ArrowRight,
} from 'lucide-react';

interface NodeDetailPanelProps {
  node: ExplorationNode | null;
  terrain: TerrainDefinition | null;
  isAccessible: boolean;
  isVisited: boolean;
  playerStats: CharacterStats;
  player: Player;
  onEnter: () => void;
}

const NodeDetailPanel: React.FC<NodeDetailPanelProps> = ({
  node,
  terrain,
  isAccessible,
  isVisited,
  playerStats,
  player,
  onEnter,
}) => {
  if (!node) {
    return (
      <div className="w-72 bg-zinc-900/80 border-l border-zinc-700 p-4 flex flex-col">
        <div className="flex-1 flex items-center justify-center">
          <p className="text-zinc-500 text-sm text-center">
            Select a chamber to view details
          </p>
        </div>
      </div>
    );
  }

  // Get display type (handle mystery nodes)
  const displayType = node.type === NodeType.MYSTERY && node.revealedType
    ? node.revealedType
    : node.type;

  // Check if this is a combat node
  const isCombatNode = [NodeType.COMBAT, NodeType.ELITE, NodeType.BOSS, NodeType.AMBUSH_POINT].includes(displayType);

  // Get node description
  const getNodeDescription = (): string => {
    if (node.type === NodeType.MYSTERY && !node.revealedType) {
      return 'An unknown chamber shrouded in mystery. Your Intelligence may reveal its nature...';
    }

    switch (displayType) {
      case NodeType.START:
        return 'Your starting position on this floor.';
      case NodeType.EXIT:
        return 'The passage to the next floor of the tower.';
      case NodeType.COMBAT:
        return 'A hostile presence blocks your path. Prepare for battle.';
      case NodeType.ELITE:
        return 'A formidable opponent awaits. Greater risk, greater reward.';
      case NodeType.BOSS:
        return 'A legendary foe stands before you. This fight will test everything.';
      case NodeType.REST:
        return 'A moment of respite. Recover your strength before continuing.';
      case NodeType.EVENT:
        return 'Something unusual catches your attention. Your choices matter here.';
      case NodeType.TRAP:
        return 'Danger lurks here. A keen eye might spot it in time...';
      case NodeType.SHRINE:
        return 'An ancient shrine pulses with power. Blessings await the worthy.';
      case NodeType.TRAINING:
        return 'A place to hone your skills. Push your limits for permanent growth.';
      case NodeType.TRIAL:
        return 'A test of your abilities. Prove yourself to claim the reward.';
      case NodeType.ANOMALY:
        return 'Reality feels unstable here. The outcome is uncertain...';
      case NodeType.SENSEI:
        return 'A master of the shinobi arts. They may teach you new techniques.';
      case NodeType.AMBUSH_POINT:
        return 'Perfect terrain for a surprise attack. Strike first here.';
      case NodeType.CACHE:
        return 'Hidden supplies left by previous travelers. Claim your reward.';
      default:
        return 'An unexplored chamber.';
    }
  };

  // Get terrain icon
  const getTerrainIcon = (): React.ReactNode => {
    if (!terrain) return null;

    const biome = terrain.biome;
    switch (biome) {
      case 'WAVES':
        return <Droplets className="w-4 h-4 text-blue-400" />;
      case 'EXAMS':
        return <TreePine className="w-4 h-4 text-green-400" />;
      case 'ROGUE':
        return <Mountain className="w-4 h-4 text-orange-400" />;
      case 'WAR':
        return <Flame className="w-4 h-4 text-red-400" />;
      default:
        return <Wind className="w-4 h-4 text-zinc-400" />;
    }
  };

  // Get available approaches for combat nodes
  const getApproachInfo = () => {
    if (!isCombatNode) return null;

    const stats = {
      speed: playerStats.primary.speed,
      dexterity: playerStats.primary.dexterity,
      intelligence: playerStats.primary.intelligence,
      calmness: playerStats.primary.calmness,
      accuracy: playerStats.primary.accuracy,
    };

    const skills = player.skills?.map(s => s.id) || [];
    const isEliteOrBoss = displayType === NodeType.ELITE || displayType === NodeType.BOSS;

    return Object.values(ApproachType).map(approachType => {
      const def = APPROACH_DEFINITIONS[approachType];
      const { meets, reason } = meetsApproachRequirements(
        approachType,
        stats,
        skills,
        node.terrain
      );

      // Bypass not available for elite/boss
      if (approachType === ApproachType.SHADOW_BYPASS && isEliteOrBoss) {
        return {
          type: approachType,
          name: def.name,
          available: false,
          reason: 'Cannot bypass Elite/Boss',
          successChance: 0,
        };
      }

      const successChance = meets
        ? calculateApproachSuccessChance(approachType, stats, terrain?.effects.stealthModifier || 0)
        : 0;

      return {
        type: approachType,
        name: def.name,
        available: meets,
        reason: reason || undefined,
        successChance: Math.round(successChance),
      };
    });
  };

  const approaches = isCombatNode ? getApproachInfo() : null;

  return (
    <div className="w-72 bg-zinc-900/80 border-l border-zinc-700 p-4 flex flex-col">
      {/* Node Header */}
      <div className="mb-4 pb-3 border-b border-zinc-700">
        <h3 className="text-lg font-serif text-zinc-200 tracking-wider uppercase">
          {node.type === NodeType.MYSTERY && !node.revealedType ? '???' : displayType.replace('_', ' ')}
        </h3>
        {node.enemy && (
          <p className="text-sm text-zinc-400 font-mono mt-1">
            {node.enemy.name} - {node.enemy.tier}
          </p>
        )}
      </div>

      {/* Description */}
      <p className="text-sm text-zinc-300 mb-4">
        {getNodeDescription()}
      </p>

      {/* Terrain Info */}
      {terrain && (
        <div className="mb-4 p-2 bg-zinc-800/50 rounded border border-zinc-700">
          <div className="flex items-center gap-2 mb-2">
            {getTerrainIcon()}
            <span className="text-sm font-medium text-zinc-300">{terrain.name}</span>
          </div>
          <p className="text-xs text-zinc-400 mb-2">{terrain.description}</p>

          {/* Terrain Effects */}
          <div className="text-xs space-y-1">
            {terrain.effects.stealthModifier !== 0 && (
              <div className={terrain.effects.stealthModifier > 0 ? 'text-green-400' : 'text-red-400'}>
                Stealth: {terrain.effects.stealthModifier > 0 ? '+' : ''}{terrain.effects.stealthModifier}%
              </div>
            )}
            {terrain.effects.initiativeModifier !== 0 && (
              <div className={terrain.effects.initiativeModifier > 0 ? 'text-green-400' : 'text-red-400'}>
                Initiative: {terrain.effects.initiativeModifier > 0 ? '+' : ''}{terrain.effects.initiativeModifier}
              </div>
            )}
            {terrain.effects.elementAmplify && (
              <div className="text-blue-400">
                {terrain.effects.elementAmplify} +{terrain.effects.elementAmplifyPercent || 25}%
              </div>
            )}
            {terrain.effects.hazard && (
              <div className="text-amber-400">
                Hazard: {terrain.effects.hazard.type} ({terrain.effects.hazard.value} dmg)
              </div>
            )}
          </div>
        </div>
      )}

      {/* Approaches (for combat nodes) */}
      {approaches && (
        <div className="mb-4">
          <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
            Approaches
          </h4>
          <div className="space-y-1">
            {approaches.map(approach => (
              <div
                key={approach.type}
                className={`
                  text-xs p-2 rounded border
                  ${approach.available
                    ? 'bg-zinc-800/50 border-zinc-700 text-zinc-300'
                    : 'bg-zinc-900/50 border-zinc-800 text-zinc-600'
                  }
                `}
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium">{approach.name}</span>
                  {approach.available ? (
                    <span className={`
                      ${approach.successChance >= 80 ? 'text-green-400' :
                        approach.successChance >= 50 ? 'text-yellow-400' : 'text-red-400'}
                    `}>
                      {approach.successChance}%
                    </span>
                  ) : (
                    <span className="text-zinc-600">-</span>
                  )}
                </div>
                {!approach.available && approach.reason && (
                  <p className="text-zinc-600 mt-0.5">{approach.reason}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Special Content */}
      {node.blessings && node.blessings.length > 0 && (
        <div className="mb-4">
          <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
            Blessings Available
          </h4>
          <p className="text-xs text-zinc-500">
            {node.blessings.length} blessing{node.blessings.length > 1 ? 's' : ''} to choose from
          </p>
        </div>
      )}

      {node.trial && (
        <div className="mb-4">
          <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
            Trial
          </h4>
          <p className="text-xs text-zinc-300">{node.trial.name}</p>
          <p className="text-xs text-zinc-500 mt-1">
            Requires: {node.trial.primaryStat} {node.trial.threshold}
          </p>
        </div>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Action Button */}
      {!node.isCleared && (
        <button
          onClick={onEnter}
          disabled={!isAccessible}
          className={`
            w-full py-3 rounded border-2 font-bold uppercase tracking-wider
            flex items-center justify-center gap-2
            transition-all duration-200
            ${isAccessible
              ? 'bg-zinc-800 border-zinc-600 text-zinc-200 hover:bg-zinc-700 hover:border-zinc-500'
              : 'bg-zinc-900 border-zinc-800 text-zinc-600 cursor-not-allowed'
            }
          `}
        >
          {isAccessible ? (
            <>
              Enter Chamber
              <ArrowRight className="w-4 h-4" />
            </>
          ) : (
            'Not Adjacent'
          )}
        </button>
      )}

      {node.isCleared && (
        <div className="w-full py-3 text-center text-zinc-500 text-sm">
          Chamber Cleared
        </div>
      )}
    </div>
  );
};

export default NodeDetailPanel;
