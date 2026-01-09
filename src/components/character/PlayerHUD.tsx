import React, { forwardRef } from 'react';
import { Player, Clan, Buff } from '../../game/types';
import StatBar from '../shared/StatBar';
import Tooltip from '../shared/Tooltip';
import { TrendingUp } from 'lucide-react';
import {
  getEffectIcon,
  getEffectColor,
  getBuffDescription,
  getDetailedEffectMechanics,
  getEffectTip,
  getEffectSeverity,
  getSeverityColor,
  isPositiveEffect,
} from '../../game/utils/tooltipFormatters';
import './character.css';

interface PlayerHUDProps {
  player: Player;
  playerStats: {
    derived: {
      maxHp: number;
      maxChakra: number;
    };
  };
  biome?: string;
}

const getClanData = (clan: Clan): { symbol: string; modifier: string } => {
  switch (clan) {
    case Clan.UCHIHA:
      return { symbol: '🔥', modifier: 'uchiha' };
    case Clan.UZUMAKI:
      return { symbol: '🌀', modifier: 'uzumaki' };
    case Clan.HYUGA:
      return { symbol: '👁️', modifier: 'hyuga' };
    case Clan.LEE:
      return { symbol: '💪', modifier: 'lee' };
    case Clan.YAMANAKA:
      return { symbol: '💠', modifier: 'yamanaka' };
    default:
      return { symbol: '忍', modifier: '' };
  }
};

const PlayerHUD = forwardRef<HTMLDivElement, PlayerHUDProps>(({ player, playerStats, biome }, ref) => {
  const { symbol, modifier } = getClanData(player.clan);
  const visibleBuffs = player.activeBuffs.slice(0, 4);
  const overflowCount = Math.max(0, player.activeBuffs.length - 4);
  const xpPercent = Math.min(100, (player.exp / player.maxExp) * 100);

  return (
    <div ref={ref} className="player-hud">
      <div className="player-hud__content">
        {/* Clan Avatar */}
        <div className={`player-hud__avatar player-hud__avatar--${modifier}`}>
          <span className="player-hud__avatar-symbol">{symbol}</span>
        </div>

        {/* Stats Section */}
        <div className="player-hud__stats">
          {/* Player Name & Level */}
          <div className="player-hud__info">
            <span className="player-hud__name">{player.clan}</span>
            <span className="player-hud__level">Lv.{player.level}</span>
            {/* XP Bar inline */}
            <div className="player-hud__xp">
              <TrendingUp className="player-hud__xp-icon" />
              <div className="player-hud__xp-track">
                <div
                  className="player-hud__xp-fill"
                  style={{ width: `${xpPercent}%` }}
                />
              </div>
              <span className="player-hud__xp-value">
                {player.exp}/{player.maxExp}
              </span>
            </div>
          </div>

          {/* HP & Chakra Bars */}
          <div className="player-hud__bars">
            <div className="player-hud__bar">
              <StatBar
                current={player.currentHp}
                max={playerStats.derived.maxHp}
                label="HP"
                color="red"
                showValue={true}
              />
            </div>
            <div className="player-hud__bar">
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
          <div className="player-hud__buffs">
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
                    <div className="player-hud__buff-tooltip">
                      {/* Header */}
                      <div className="player-hud__buff-tooltip-header">
                        <span className={`player-hud__buff-tooltip-icon ${buff.effect ? getEffectColor(buff.effect.type) : 'text-zinc-400'}`}>
                          {buff.effect ? getEffectIcon(buff.effect.type) : '✨'}
                        </span>
                        <div>
                          <div className={`player-hud__buff-tooltip-name ${isPositive ? 'player-hud__buff-tooltip-name--positive' : getSeverityColor(severity)}`}>
                            {buff.name}
                          </div>
                          <div className="player-hud__buff-tooltip-type">
                            {isPositive ? 'Beneficial' : 'Harmful'} Effect
                          </div>
                        </div>
                      </div>

                      {/* Description */}
                      <div className="player-hud__buff-tooltip-desc">
                        {getBuffDescription(buff)}
                      </div>

                      {/* Mechanics Breakdown */}
                      <div className="player-hud__buff-tooltip-section">
                        <div className="player-hud__buff-tooltip-section-title">Mechanics</div>
                        <div>
                          {mechanics.map((mechanic, i) => (
                            <div key={i} className="player-hud__buff-tooltip-mechanic">
                              <span className="player-hud__buff-tooltip-bullet">•</span>
                              <span>{mechanic}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Source & Duration */}
                      <div className="player-hud__buff-tooltip-footer">
                        <div>
                          <span className="player-hud__buff-tooltip-label">Source: </span>
                          <span className="player-hud__buff-tooltip-value">{buff.source || 'Unknown'}</span>
                        </div>
                        <div>
                          <span className="player-hud__buff-tooltip-label">Remaining: </span>
                          <span className={buff.duration <= 1 ? 'player-hud__buff-tooltip-value--expiring' : 'player-hud__buff-tooltip-value'}>
                            {buff.duration === -1 ? 'Permanent' : `${buff.duration} turn${buff.duration !== 1 ? 's' : ''}`}
                          </span>
                        </div>
                      </div>

                      {/* Strategic Tip */}
                      {tip && (
                        <div className="player-hud__buff-tooltip-tip">
                          Tip: {tip}
                        </div>
                      )}
                    </div>
                  }
                >
                  <div className={`player-hud__buff ${isPositive ? 'player-hud__buff--positive' : 'player-hud__buff--negative'}`}>
                    <span className="player-hud__buff-icon">{buff.effect ? getEffectIcon(buff.effect.type) : '✨'}</span>
                    {buff.duration !== undefined && buff.duration > 0 && (
                      <span className={`player-hud__buff-duration ${buff.duration <= 1 ? 'player-hud__buff-duration--expiring' : ''}`}>
                        {buff.duration}
                      </span>
                    )}
                  </div>
                </Tooltip>
              );
            })}
            {overflowCount > 0 && (
              <div className="player-hud__buff-overflow">
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
