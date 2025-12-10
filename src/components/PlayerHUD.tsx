import React, { forwardRef } from 'react';
import { Player, Clan, Buff } from '../game/types';
import StatBar from './StatBar';
import Tooltip from './Tooltip';
import { Coins, TrendingUp } from 'lucide-react';
import {
  getEffectIcon,
  getEffectColor,
  getBuffDescription,
  getDetailedEffectMechanics,
  getEffectTip,
  getEffectSeverity,
  getSeverityColor,
  isPositiveEffect,
} from '../game/utils/tooltipFormatters';

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
            {visibleBuffs.map((buff, idx) => {
              const isPositive = buff.effect ? isPositiveEffect(buff.effect.type) : true;
              const severity = getEffectSeverity(buff);
              const mechanics = getDetailedEffectMechanics(buff);
              const tip = buff.effect ? getEffectTip(buff.effect.type) : '';

              return (
                <Tooltip
                  key={buff.id || idx}
                  position="top"
                  content={
                    <div className="space-y-2 p-1 max-w-[260px]">
                      {/* Header */}
                      <div className="flex items-center gap-2">
                        <span className={`text-lg ${buff.effect ? getEffectColor(buff.effect.type) : 'text-zinc-400'}`}>
                          {buff.effect ? getEffectIcon(buff.effect.type) : '✨'}
                        </span>
                        <div>
                          <div className={`font-bold uppercase text-sm ${isPositive ? 'text-green-400' : getSeverityColor(severity)}`}>
                            {buff.name}
                          </div>
                          <div className="text-[9px] text-zinc-500 uppercase tracking-wider">
                            {isPositive ? 'Beneficial' : 'Harmful'} Effect
                          </div>
                        </div>
                      </div>

                      {/* Description */}
                      <div className="text-xs text-zinc-300 border-t border-zinc-700 pt-2">
                        {getBuffDescription(buff)}
                      </div>

                      {/* Mechanics Breakdown */}
                      <div className="border-t border-zinc-700 pt-2">
                        <div className="text-[9px] text-zinc-500 uppercase tracking-wider mb-1">Mechanics</div>
                        <div className="space-y-0.5">
                          {mechanics.map((mechanic, i) => (
                            <div key={i} className="text-[10px] text-zinc-400 flex items-start gap-1">
                              <span className="text-zinc-600">•</span>
                              <span>{mechanic}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Source & Duration */}
                      <div className="border-t border-zinc-700 pt-2 flex justify-between text-[10px]">
                        <div>
                          <span className="text-zinc-500">Source: </span>
                          <span className="text-zinc-300">{buff.source || 'Unknown'}</span>
                        </div>
                        <div>
                          <span className="text-zinc-500">Remaining: </span>
                          <span className={buff.duration <= 1 ? 'text-red-400 font-bold' : 'text-zinc-300'}>
                            {buff.duration === -1 ? 'Permanent' : `${buff.duration} turn${buff.duration !== 1 ? 's' : ''}`}
                          </span>
                        </div>
                      </div>

                      {/* Strategic Tip */}
                      {tip && (
                        <div className="border-t border-zinc-700 pt-2 text-[10px] text-amber-400/80 italic">
                          Tip: {tip}
                        </div>
                      )}
                    </div>
                  }
                >
                  <div
                    className={`flex items-center gap-1 rounded px-2 py-1 cursor-help transition-colors ${
                      isPositive
                        ? 'bg-green-950/60 border border-green-700/50 hover:border-green-500/70'
                        : 'bg-red-950/60 border border-red-700/50 hover:border-red-500/70'
                    }`}
                  >
                    <span className="text-sm">{buff.effect ? getEffectIcon(buff.effect.type) : '✨'}</span>
                    {buff.duration !== undefined && buff.duration > 0 && (
                      <span className={`text-xs font-mono ${buff.duration <= 1 ? 'text-red-400' : 'text-zinc-400'}`}>
                        {buff.duration}
                      </span>
                    )}
                  </div>
                </Tooltip>
              );
            })}
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
