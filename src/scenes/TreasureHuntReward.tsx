import React, { useEffect, useState } from 'react';
import { Item, Skill, Rarity, SkillTier, DamageType } from '../game/types';
import { Scroll, MapPin, Coins, Sparkles, Award } from 'lucide-react';
import Tooltip from '../components/shared/Tooltip';
import { formatStatName, getStatColor, formatScalingStat, getEffectColor, getEffectIcon, formatEffectDescription } from '../game/utils/tooltipFormatters';

interface TreasureHuntReward {
  items: Item[];
  skills: Skill[];
  ryo: number;
  piecesCollected: number;
  wealthLevel: number;
}

interface TreasureHuntRewardProps {
  reward: TreasureHuntReward;
  onClaim: () => void;
  getRarityColor: (rarity: Rarity) => string;
  getDamageTypeColor: (dt: DamageType) => string;
}

const TreasureHuntRewardScene: React.FC<TreasureHuntRewardProps> = ({
  reward,
  onClaim,
  getRarityColor,
  getDamageTypeColor,
}) => {
  const [showContent, setShowContent] = useState(false);

  // Entrance animation
  useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 300);
    return () => clearTimeout(timer);
  }, []);

  // Keyboard handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        onClaim();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClaim]);

  // Map pieces visualization
  const renderMapCompletion = () => {
    const pieces = [];
    for (let i = 0; i < reward.piecesCollected; i++) {
      pieces.push(
        <div
          key={i}
          className="w-10 h-10 rounded-lg border-2 border-amber-500 bg-amber-500/20 flex items-center justify-center animate-pulse"
          style={{ animationDelay: `${i * 150}ms` }}
        >
          <MapPin className="w-5 h-5 text-amber-400" />
        </div>
      );
    }
    return pieces;
  };

  // Render item reward card
  const renderItemCard = (item: Item, index: number) => (
    <Tooltip
      key={item.id}
      content={
        <div className="space-y-2 p-1 max-w-[260px]">
          <div className={`font-bold ${getRarityColor(item.rarity)}`}>{item.name}</div>
          <div className="text-[10px] text-zinc-500 uppercase tracking-wider">
            {item.rarity} {item.isComponent ? 'Component' : 'Artifact'}
          </div>
          {item.description && (
            <div className="text-xs text-zinc-400 italic">{item.description}</div>
          )}
          <div className="border-t border-zinc-700 pt-2 space-y-1">
            {Object.entries(item.stats).map(([key, val]) => (
              <div key={key} className="flex justify-between text-[10px] font-mono">
                <span className="text-zinc-500">{formatStatName(key)}</span>
                <span className="text-zinc-200">+{val}</span>
              </div>
            ))}
          </div>
          {item.passive && (
            <div className="border-t border-purple-900/30 pt-2">
              <div className="text-[10px] text-purple-400">
                Passive: {item.description}
              </div>
            </div>
          )}
        </div>
      }
    >
      <div
        className={`
          relative bg-gradient-to-b from-zinc-900 to-black
          border-2 rounded-lg p-4
          transition-all duration-500 cursor-help hover:scale-105
          ${item.passive ? 'border-purple-700/50 ring-1 ring-purple-500/20' : 'border-amber-900/50'}
        `}
        style={{
          animationDelay: `${index * 100 + 500}ms`,
        }}
      >
          {/* Artifact sparkle */}
          {item.passive && (
            <div className="absolute -top-2 -right-2">
              <Sparkles className="w-6 h-6 text-purple-400 animate-pulse" />
            </div>
          )}

          <div className="flex flex-col items-center gap-2">
            <span className="text-3xl">{item.icon || '📦'}</span>
            <div className={`text-center font-bold ${getRarityColor(item.rarity)}`}>
              {item.name}
            </div>
            <div className="text-[9px] text-zinc-500 uppercase tracking-wider">
              {item.rarity} {item.isComponent ? 'Component' : 'Artifact'}
            </div>

            {/* Quick stats */}
            <div className="text-[10px] text-zinc-400 space-y-0.5 mt-1">
              {Object.entries(item.stats).slice(0, 2).map(([key, val]) => (
                <div key={key} className="flex justify-between gap-3">
                  <span>{formatStatName(key)}</span>
                  <span className="text-zinc-200">+{val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Tooltip>
    );

  // Render skill scroll card
  const renderSkillCard = (skill: Skill, index: number) => (
    <Tooltip
      key={skill.id}
      content={
        <div className="space-y-2 p-1 max-w-[280px]">
          <div className={`font-bold ${skill.tier === SkillTier.FORBIDDEN ? 'text-red-500' : 'text-blue-200'}`}>
            {skill.name}
          </div>
          <div className="text-[10px] text-blue-600 uppercase">{skill.tier} Jutsu</div>
          <div className="text-xs text-zinc-400 italic">{skill.description}</div>

          <div className="border-t border-blue-900/30 pt-2 space-y-1 text-[10px]">
            <div className="flex justify-between">
              <span className="text-zinc-600">Chakra Cost</span>
              <span className="text-blue-400">{skill.chakraCost}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-600">Damage Type</span>
              <span className={getDamageTypeColor(skill.damageType)}>{skill.damageType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-600">Scales with</span>
              <span className={getStatColor(skill.scalingStat)}>{formatScalingStat(skill.scalingStat)}</span>
            </div>
          </div>

          {skill.effects && skill.effects.length > 0 && (
            <div className="border-t border-blue-900/30 pt-2">
              <div className="text-[9px] text-blue-500 uppercase mb-1">Effects</div>
              {skill.effects.map((effect, idx) => (
                <div key={idx} className="text-[10px] flex items-center gap-1.5">
                  <span className={getEffectColor(effect.type)}>{getEffectIcon(effect.type)}</span>
                  <span className="text-zinc-300">{formatEffectDescription(effect)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      }
    >
      <div
        className={`
          relative bg-gradient-to-b from-blue-950/50 to-black
          border-2 border-blue-900/50 rounded-lg p-4
          transition-all duration-500 cursor-help
          hover:scale-105 hover:border-blue-700
        `}
        style={{ animationDelay: `${index * 100 + 600}ms` }}
      >
        <div className="flex flex-col items-center gap-2">
          <Scroll className="w-8 h-8 text-blue-400" />
          <div className={`text-center font-bold ${skill.tier === SkillTier.FORBIDDEN ? 'text-red-400' : 'text-blue-200'}`}>
            {skill.name}
          </div>
          <div className="text-[9px] text-blue-600 uppercase tracking-wider">
            {skill.tier} Scroll
          </div>
        </div>
      </div>
    </Tooltip>
  );

  return (
    <div className="w-full max-w-4xl mx-auto z-10 relative">
      {/* Ambient particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-amber-400/30 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${2 + Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      {/* Header with trophy */}
      <div className={`text-center mb-8 transition-all duration-700 ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
        <div className="inline-flex items-center justify-center w-20 h-20 mb-4 rounded-full bg-gradient-to-br from-amber-600 to-amber-900 shadow-lg shadow-amber-900/50 animate-bounce">
          <Award className="w-10 h-10 text-amber-200" />
        </div>
        <h2 className="text-3xl text-amber-400 font-serif tracking-[0.2em] uppercase mb-2">
          Map Complete!
        </h2>
        <p className="text-zinc-500 text-sm">
          You've assembled all {reward.piecesCollected} map pieces
        </p>
      </div>

      {/* Map pieces display */}
      <div className={`flex justify-center gap-2 mb-8 transition-all duration-700 delay-200 ${showContent ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
        {renderMapCompletion()}
      </div>

      {/* Rewards section */}
      <div className={`transition-all duration-700 delay-500 ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <div className="text-center mb-4">
          <span className="text-zinc-500 text-xs uppercase tracking-wider">Your Rewards</span>
          <div className="w-24 h-px bg-gradient-to-r from-transparent via-amber-600 to-transparent mx-auto mt-2" />
        </div>

        {/* Reward cards grid */}
        <div className="flex flex-wrap justify-center gap-4 mb-6">
          {/* Item rewards */}
          {reward.items.map((item, index) => renderItemCard(item, index))}

          {/* Skill rewards */}
          {reward.skills.map((skill, index) => renderSkillCard(skill, index))}

          {/* Ryo reward */}
          {reward.ryo > 0 && (
            <div
              className="
                bg-gradient-to-b from-yellow-950/30 to-black
                border-2 border-yellow-900/50 rounded-lg p-4
                transition-all duration-500 hover:scale-105
              "
            >
              <div className="flex flex-col items-center gap-2">
                <Coins className="w-8 h-8 text-yellow-500" />
                <div className="text-yellow-400 text-2xl font-bold">{reward.ryo}</div>
                <div className="text-yellow-600 text-[9px] uppercase tracking-wider">Ryō</div>
              </div>
            </div>
          )}
        </div>

        {/* Wealth level indicator */}
        <div className="text-center text-zinc-600 text-[10px] mb-6">
          Wealth Level {reward.wealthLevel} • {reward.piecesCollected} Pieces Collected
        </div>

        {/* Claim button */}
        <div className="flex justify-center">
          <button
            type="button"
            onClick={onClaim}
            className="
              px-8 py-3 bg-gradient-to-b from-amber-600 to-amber-800
              border-2 border-amber-500 rounded-lg
              text-amber-100 font-bold uppercase tracking-wider
              hover:from-amber-500 hover:to-amber-700
              hover:shadow-lg hover:shadow-amber-900/50
              transition-all duration-300
              animate-pulse
            "
          >
            Claim Rewards
            <span className="ml-2 text-amber-300/70 text-xs">[SPACE]</span>
          </button>
        </div>
      </div>

      {/* Bottom decorative line */}
      <div className="mt-10 flex items-center justify-center gap-4">
        <div className="w-20 h-px bg-gradient-to-r from-transparent to-amber-600/50" />
        <MapPin className="w-4 h-4 text-amber-600/50" />
        <div className="w-20 h-px bg-gradient-to-l from-transparent to-amber-600/50" />
      </div>
    </div>
  );
};

export default TreasureHuntRewardScene;
