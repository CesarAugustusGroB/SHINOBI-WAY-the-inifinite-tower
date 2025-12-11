import React from 'react';
import { Enemy, Item, Player, CharacterStats, Rarity } from '../game/types';
import { Shield, Zap, Swords, Wind } from 'lucide-react';
import { getEscapeChanceDescription } from '../game/systems/EliteChallengeSystem';
import { getEnemyFullStats } from '../game/systems/StatSystem';

interface EliteChallengeProps {
  enemy: Enemy;
  artifact: Item;
  player: Player;
  playerStats: CharacterStats;
  onFight: () => void;
  onEscape: () => void;
}

const EliteChallenge: React.FC<EliteChallengeProps> = ({
  enemy,
  artifact,
  player,
  playerStats,
  onFight,
  onEscape
}) => {
  const escapeInfo = getEscapeChanceDescription(playerStats);
  const enemyStats = getEnemyFullStats(enemy);

  const getRarityColor = (rarity: Rarity): string => {
    switch (rarity) {
      case Rarity.COMMON: return 'text-zinc-400';
      case Rarity.RARE: return 'text-blue-400';
      case Rarity.EPIC: return 'text-purple-400';
      case Rarity.LEGENDARY: return 'text-amber-400';
      case Rarity.CURSED: return 'text-red-500';
      default: return 'text-zinc-400';
    }
  };

  return (
    <div className="w-full max-w-2xl bg-black border border-zinc-800 p-8 shadow-2xl z-10 flex flex-col items-center">
      {/* Header */}
      <div className="mb-6 text-red-900 opacity-70">
        <Shield size={48} />
      </div>
      <h2 className="text-xl font-bold text-zinc-200 mb-2 font-serif tracking-wide uppercase">
        Artifact Guardian
      </h2>
      <p className="text-sm text-zinc-600 mb-8 text-center max-w-md">
        A powerful guardian stands between you and a rare artifact. Will you fight or flee?
      </p>

      {/* Enemy Info */}
      <div className="w-full bg-zinc-900/50 border border-zinc-800 p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-lg font-bold text-red-400">{enemy.name}</h3>
            <p className="text-[10px] text-zinc-600 uppercase tracking-wider">{enemy.tier} Guardian</p>
          </div>
          <div className="text-right">
            <div className="text-xs text-zinc-500">Element</div>
            <div className="text-sm text-zinc-300">{enemy.element}</div>
          </div>
        </div>

        {/* Enemy Stats Preview */}
        <div className="grid grid-cols-3 gap-2 text-[10px] font-mono">
          <div className="flex justify-between">
            <span className="text-zinc-600">HP</span>
            <span className="text-red-400">{enemyStats.derived.maxHp}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-600">ATK</span>
            <span className="text-orange-400">{enemy.primaryStats.strength}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-600">SPD</span>
            <span className="text-cyan-400">{enemy.primaryStats.speed}</span>
          </div>
        </div>
      </div>

      {/* Artifact Preview */}
      <div className="w-full bg-zinc-900/50 border border-amber-900/30 p-4 mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Zap size={16} className="text-amber-500" />
          <span className="text-[10px] text-amber-600 uppercase tracking-wider">Guarded Artifact</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h4 className={`font-bold ${getRarityColor(artifact.rarity)}`}>
              {artifact.icon && <span className="mr-2">{artifact.icon}</span>}
              {artifact.name}
            </h4>
            <p className="text-[10px] text-zinc-600">{artifact.rarity}</p>
          </div>
        </div>
        {artifact.description && (
          <p className="text-xs text-zinc-500 italic mt-2">{artifact.description}</p>
        )}
        {/* Show key stats */}
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[10px] font-mono text-zinc-400">
          {Object.entries(artifact.stats).slice(0, 4).map(([key, val]) => (
            val ? <span key={key}>+{val} {key.toUpperCase()}</span> : null
          ))}
        </div>
      </div>

      {/* Choice Buttons */}
      <div className="w-full space-y-3">
        {/* Fight Button */}
        <button
          type="button"
          onClick={onFight}
          className="w-full py-4 bg-red-900/20 hover:bg-red-900/40 border border-red-900 transition-colors group"
        >
          <div className="flex items-center justify-center gap-3">
            <Swords size={20} className="text-red-500 group-hover:text-red-400" />
            <div className="text-left">
              <div className="text-sm font-bold text-red-200 uppercase tracking-wider">
                Challenge Guardian
              </div>
              <div className="text-[10px] text-zinc-500">
                Face the guardian in combat. Victory: Claim the artifact.
              </div>
            </div>
          </div>
        </button>

        {/* Escape Button */}
        <button
          type="button"
          onClick={onEscape}
          className="w-full py-4 bg-cyan-900/20 hover:bg-cyan-900/40 border border-cyan-900 transition-colors group"
        >
          <div className="flex items-center justify-center gap-3">
            <Wind size={20} className="text-cyan-500 group-hover:text-cyan-400" />
            <div className="text-left flex-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-cyan-200 uppercase tracking-wider">
                  Attempt Escape
                </span>
                <span className={`text-sm font-mono ${escapeInfo.chance >= 60 ? 'text-green-400' : escapeInfo.chance >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                  {escapeInfo.chance}%
                </span>
              </div>
              <div className="text-[10px] text-zinc-500">
                Use your speed to slip away. Your Speed: {escapeInfo.speedValue} (+{escapeInfo.speedBonus}% bonus)
              </div>
              <div className="text-[9px] text-zinc-600 mt-1">
                Failure: Must fight anyway
              </div>
            </div>
          </div>
        </button>
      </div>

      {/* Escape Formula Hint */}
      <div className="mt-6 text-[9px] text-zinc-700 text-center">
        Escape chance = 30% base + (Speed x 2), max 80%
      </div>
    </div>
  );
};

export default EliteChallenge;
