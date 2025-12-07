import React, { forwardRef } from 'react';
import { Player, Clan, Buff } from '../game/types';
import StatBar from './StatBar';
import { Coins, TrendingUp } from 'lucide-react';

interface PlayerHUDProps {
  player: Player;
  playerStats: {
    derived: {
      maxHp: number;
      maxChakra: number;
    };
  };
  floor?: number;
  biome?: string;
}

const getClanSymbol = (clan: Clan): { symbol: string; color: string; bgColor: string } => {
  switch (clan) {
    case Clan.UCHIHA:
      return { symbol: '🔥', color: 'text-red-500', bgColor: 'bg-red-950 border-red-700' };
    case Clan.UZUMAKI:
      return { symbol: '🌀', color: 'text-orange-500', bgColor: 'bg-orange-950 border-orange-700' };
    case Clan.HYUGA:
      return { symbol: '👁️', color: 'text-purple-400', bgColor: 'bg-purple-950 border-purple-700' };
    case Clan.LEE:
      return { symbol: '💪', color: 'text-green-500', bgColor: 'bg-green-950 border-green-700' };
    case Clan.YAMANAKA:
      return { symbol: '💠', color: 'text-cyan-500', bgColor: 'bg-cyan-950 border-cyan-700' };
    default:
      return { symbol: '忍', color: 'text-zinc-400', bgColor: 'bg-zinc-900 border-zinc-700' };
  }
};

const getBuffIcon = (buff: Buff): string => {
  const effectType = buff.effect?.type?.toLowerCase() || buff.name?.toLowerCase() || '';

  if (effectType.includes('burn') || effectType.includes('fire')) return '🔥';
  if (effectType.includes('poison')) return '☠️';
  if (effectType.includes('bleed')) return '🩸';
  if (effectType.includes('stun')) return '⚡';
  if (effectType.includes('shield') || effectType.includes('defense')) return '🛡️';
  if (effectType.includes('regen') || effectType.includes('heal')) return '💚';
  if (effectType.includes('speed') || effectType.includes('haste')) return '💨';
  if (effectType.includes('strength') || effectType.includes('attack')) return '⚔️';
  if (effectType.includes('chakra')) return '💠';
  return '✨';
};

const PlayerHUD = forwardRef<HTMLDivElement, PlayerHUDProps>(({ player, playerStats, floor, biome }, ref) => {
  const { symbol, color, bgColor } = getClanSymbol(player.clan);
  const visibleBuffs = player.activeBuffs.slice(0, 4);
  const overflowCount = Math.max(0, player.activeBuffs.length - 4);
  const xpPercent = Math.min(100, (player.exp / player.maxExp) * 100);

  return (
    <div
      ref={ref}
      className="w-full bg-gradient-to-r from-zinc-900/95 via-zinc-900/90 to-zinc-900/95 border-y border-zinc-700 px-6 py-3"
    >
      <div className="max-w-5xl mx-auto flex items-center gap-6">
        {/* Clan Avatar */}
        <div className={`w-14 h-14 rounded-lg border-2 ${bgColor} flex items-center justify-center flex-shrink-0 shadow-lg`}>
          <span className={`text-2xl ${color}`}>{symbol}</span>
        </div>

        {/* Stats Section */}
        <div className="flex-1 space-y-1">
          {/* Player Name & Level */}
          <div className="flex items-center gap-3">
            <span className="font-serif font-bold text-zinc-200">{player.clan}</span>
            <span className="text-xs font-mono bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded">
              Lv.{player.level}
            </span>
            {/* XP Bar inline */}
            <div className="flex items-center gap-2 flex-1 max-w-[150px]">
              <TrendingUp className="w-3 h-3 text-amber-500" />
              <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 transition-all duration-300"
                  style={{ width: `${xpPercent}%` }}
                />
              </div>
              <span className="text-[9px] text-zinc-500 font-mono">
                {player.exp}/{player.maxExp}
              </span>
            </div>
          </div>

          {/* HP & Chakra Bars */}
          <div className="flex gap-4">
            <div className="flex-1">
              <StatBar
                current={player.currentHp}
                max={playerStats.derived.maxHp}
                label="HP"
                color="red"
                showValue={true}
              />
            </div>
            <div className="flex-1">
              <StatBar
                current={player.currentChakra}
                max={playerStats.derived.maxChakra}
                label="CP"
                color="blue"
                showValue={true}
              />
            </div>
          </div>
        </div>

        {/* Ryo */}
        <div className="flex items-center gap-2 flex-shrink-0 px-3 py-1 bg-zinc-800/50 rounded border border-zinc-700">
          <Coins className="w-4 h-4 text-yellow-500" />
          <span className="text-yellow-400 font-bold text-sm">{player.ryo.toLocaleString()}</span>
        </div>

        {/* Buffs Section */}
        {player.activeBuffs.length > 0 && (
          <div className="flex items-center gap-2 flex-shrink-0">
            {visibleBuffs.map((buff, idx) => (
              <div
                key={buff.id || idx}
                className="flex items-center gap-1 bg-zinc-800/80 border border-zinc-600 rounded px-2 py-1"
                title={buff.name || 'Active Effect'}
              >
                <span className="text-sm">{getBuffIcon(buff)}</span>
                {buff.duration !== undefined && buff.duration > 0 && (
                  <span className="text-xs font-mono text-zinc-400">{buff.duration}</span>
                )}
              </div>
            ))}
            {overflowCount > 0 && (
              <div className="text-xs font-mono text-zinc-500">
                +{overflowCount}
              </div>
            )}
          </div>
        )}

        {/* Floor Info */}
        {floor !== undefined && (
          <div className="flex-shrink-0 text-right border-l border-zinc-700 pl-4">
            <div className="flex items-center gap-2">
              <span className="text-zinc-500 text-[10px] uppercase tracking-wider">Floor</span>
              <span className="text-xl font-black text-amber-500">{floor}</span>
            </div>
            {biome && (
              <div className="text-[9px] text-zinc-600 truncate max-w-[100px]">{biome}</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
});

PlayerHUD.displayName = 'PlayerHUD';

export default PlayerHUD;
