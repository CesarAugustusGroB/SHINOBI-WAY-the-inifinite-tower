import React, { forwardRef } from 'react';
import { Player, Clan, Buff } from '../game/types';
import StatBar from './StatBar';

interface PlayerHUDProps {
  player: Player;
  playerStats: {
    derived: {
      maxHp: number;
      maxChakra: number;
    };
  };
}

const getClanSymbol = (clan: Clan): { symbol: string; color: string; bgColor: string } => {
  switch (clan) {
    case Clan.UCHIHA:
      return { symbol: '🔥', color: 'text-red-500', bgColor: 'bg-red-950 border-red-700' };
    case Clan.UZUMAKI:
      return { symbol: '🌀', color: 'text-orange-500', bgColor: 'bg-orange-950 border-orange-700' };
    case Clan.HYUGA:
      return { symbol: '👁️', color: 'text-purple-400', bgColor: 'bg-purple-950 border-purple-700' };
    case Clan.NARA:
      return { symbol: '🦌', color: 'text-green-500', bgColor: 'bg-green-950 border-green-700' };
    case Clan.AKIMICHI:
      return { symbol: '🍖', color: 'text-amber-500', bgColor: 'bg-amber-950 border-amber-700' };
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

const PlayerHUD = forwardRef<HTMLDivElement, PlayerHUDProps>(({ player, playerStats }, ref) => {
  const { symbol, color, bgColor } = getClanSymbol(player.clan);
  const visibleBuffs = player.activeBuffs.slice(0, 4);
  const overflowCount = Math.max(0, player.activeBuffs.length - 4);

  return (
    <div
      ref={ref}
      className="w-full bg-gradient-to-r from-zinc-900/95 via-zinc-900/90 to-zinc-900/95 border-y border-zinc-700 px-6 py-3"
    >
      <div className="max-w-4xl mx-auto flex items-center gap-6">
        {/* Clan Avatar */}
        <div className={`w-16 h-16 rounded-lg border-2 ${bgColor} flex items-center justify-center flex-shrink-0 shadow-lg`}>
          <span className={`text-3xl ${color}`}>{symbol}</span>
        </div>

        {/* Stats Section */}
        <div className="flex-1 space-y-2">
          {/* Player Name & Level */}
          <div className="flex items-center gap-3">
            <span className="font-serif font-bold text-zinc-200 text-lg">{player.clan}</span>
            <span className="text-xs font-mono bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded">
              Lv.{player.level}
            </span>
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
      </div>
    </div>
  );
});

PlayerHUD.displayName = 'PlayerHUD';

export default PlayerHUD;
