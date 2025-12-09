import React from 'react';
import {
  Skill,
  SkillTier,
  Player,
  DamageType,
  ScrollDiscoveryActivity,
  CharacterStats,
} from '../game/types';
import { Scroll, Zap, Brain, Sparkles } from 'lucide-react';
import Tooltip from '../components/Tooltip';
import {
  formatScalingStat,
  getStatColor,
  getElementColor,
  getEffectColor,
  getEffectIcon,
  formatEffectDescription,
} from '../game/utils/tooltipFormatters';

interface ScrollDiscoveryProps {
  scrollDiscovery: ScrollDiscoveryActivity;
  player: Player;
  playerStats: CharacterStats;
  onLearnScroll: (skill: Skill, slotIndex?: number) => void;
  onSkip: () => void;
}

const TIER_COLORS: Record<SkillTier, string> = {
  // Legacy tiers
  [SkillTier.COMMON]: 'text-zinc-400',
  [SkillTier.RARE]: 'text-blue-400',
  [SkillTier.EPIC]: 'text-purple-400',
  [SkillTier.LEGENDARY]: 'text-orange-400',
  [SkillTier.FORBIDDEN]: 'text-red-500 animate-pulse',
  // New tier system
  [SkillTier.BASIC]: 'text-zinc-500',
  [SkillTier.ADVANCED]: 'text-cyan-400',
  [SkillTier.HIDDEN]: 'text-amber-400',
  [SkillTier.KINJUTSU]: 'text-rose-500 animate-pulse',
};

const TIER_BORDER_COLORS: Record<SkillTier, string> = {
  // Legacy tiers
  [SkillTier.COMMON]: 'border-zinc-700',
  [SkillTier.RARE]: 'border-blue-700',
  [SkillTier.EPIC]: 'border-purple-700',
  [SkillTier.LEGENDARY]: 'border-orange-700',
  [SkillTier.FORBIDDEN]: 'border-red-700',
  // New tier system
  [SkillTier.BASIC]: 'border-zinc-700',
  [SkillTier.ADVANCED]: 'border-cyan-700',
  [SkillTier.HIDDEN]: 'border-amber-700',
  [SkillTier.KINJUTSU]: 'border-rose-700',
};

const getDamageTypeColor = (dt: DamageType): string => {
  switch (dt) {
    case DamageType.PHYSICAL: return 'text-orange-400';
    case DamageType.ELEMENTAL: return 'text-cyan-400';
    case DamageType.MENTAL: return 'text-purple-400';
    case DamageType.TRUE: return 'text-red-400';
    default: return 'text-zinc-400';
  }
};

const ScrollDiscovery: React.FC<ScrollDiscoveryProps> = ({
  scrollDiscovery,
  player,
  playerStats,
  onLearnScroll,
  onSkip,
}) => {
  const chakraCost = scrollDiscovery.cost?.chakra || 0;
  const canAfford = player.currentChakra >= chakraCost;

  // Check if player already knows the skill
  const alreadyKnows = (skill: Skill) => player.skills.some(s => s.id === skill.id);
  const skillSlotsFull = player.skills.length >= 4;

  // Check skill requirements
  const meetsRequirements = (skill: Skill): { meets: boolean; reason?: string } => {
    if (!skill.requirements) return { meets: true };

    if (skill.requirements.intelligence &&
        playerStats.effectivePrimary.intelligence < skill.requirements.intelligence) {
      return {
        meets: false,
        reason: `Requires ${skill.requirements.intelligence} INT (you have ${Math.floor(playerStats.effectivePrimary.intelligence)})`
      };
    }

    if (skill.requirements.clan && skill.requirements.clan !== player.clan) {
      return { meets: false, reason: `Requires ${skill.requirements.clan} bloodline` };
    }

    return { meets: true };
  };

  return (
    <div className="w-full max-w-4xl z-10">
      <div className="flex items-center justify-center gap-4 mb-2">
        <Scroll className="text-amber-500" size={24} />
        <h2 className="text-2xl text-center text-zinc-500 font-serif tracking-[0.5em] uppercase">
          Ancient Scrolls
        </h2>
        <Scroll className="text-amber-500" size={24} />
      </div>

      <p className="text-center text-zinc-600 text-sm mb-6">
        You discovered ancient jutsu scrolls. Study them to learn new techniques.
      </p>

      <div className="flex items-center justify-center gap-6 mb-8">
        <div className="flex items-center gap-2">
          <Zap className="text-blue-500" size={16} />
          <span className="text-blue-400 font-mono">
            {player.currentChakra} / {playerStats.derived.maxChakra}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Brain className="text-cyan-500" size={16} />
          <span className="text-cyan-400 font-mono">
            INT: {Math.floor(playerStats.effectivePrimary.intelligence)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        {scrollDiscovery.availableScrolls.map((skill) => {
          const known = alreadyKnows(skill);
          const reqCheck = meetsRequirements(skill);
          const canLearn = canAfford && reqCheck.meets && (!skillSlotsFull || known);
          const tierColor = TIER_COLORS[skill.tier];
          const borderColor = TIER_BORDER_COLORS[skill.tier];

          return (
            <Tooltip
              key={skill.id}
              content={
                <div className="space-y-2 p-1 max-w-[280px]">
                  <div className={`font-bold ${tierColor}`}>{skill.name}</div>
                  <div className="text-xs text-zinc-400 italic">{skill.description}</div>

                  <div className="border-t border-zinc-700 pt-2 space-y-1 text-[10px] font-mono">
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
                    <div className="flex justify-between">
                      <span className="text-zinc-600">Element</span>
                      <span className={getElementColor(skill.element)}>{skill.element}</span>
                    </div>
                  </div>

                  {skill.effects && skill.effects.length > 0 && (
                    <div className="border-t border-zinc-700 pt-2">
                      <div className="text-[9px] text-zinc-500 uppercase mb-1">Effects</div>
                      {skill.effects.map((effect, idx) => (
                        <div key={idx} className="text-[10px] flex items-center gap-1">
                          <span className={getEffectColor(effect.type)}>{getEffectIcon(effect.type)}</span>
                          <span className="text-zinc-300">{formatEffectDescription(effect)}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {skill.requirements && (
                    <div className="border-t border-zinc-700 pt-2 text-[10px]">
                      <div className="text-zinc-500">Requirements:</div>
                      {skill.requirements.intelligence && (
                        <div className={playerStats.effectivePrimary.intelligence >= skill.requirements.intelligence ? 'text-green-400' : 'text-red-400'}>
                          INT {skill.requirements.intelligence}
                        </div>
                      )}
                      {skill.requirements.clan && (
                        <div className={player.clan === skill.requirements.clan ? 'text-green-400' : 'text-red-400'}>
                          {skill.requirements.clan} bloodline
                        </div>
                      )}
                    </div>
                  )}
                </div>
              }
            >
              <div className={`bg-black border ${borderColor} p-6 flex flex-col gap-4`}>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className={`font-bold text-lg mb-1 ${tierColor}`}>
                      {skill.name}
                    </h3>
                    <p className="text-[10px] text-zinc-600 uppercase tracking-widest font-bold">
                      {skill.tier} Technique
                    </p>
                  </div>
                  {known && (
                    <span className="text-[10px] bg-green-900/30 text-green-400 px-2 py-1 rounded">
                      Known
                    </span>
                  )}
                </div>

                <p className="text-xs text-zinc-500 italic flex-1">
                  {skill.description}
                </p>

                <div className="space-y-1 text-[10px] font-mono text-zinc-500">
                  <div className="flex justify-between">
                    <span>Chakra Cost</span>
                    <span className="text-blue-400">{skill.chakraCost}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Damage Type</span>
                    <span className={getDamageTypeColor(skill.damageType)}>{skill.damageType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Element</span>
                    <span className={getElementColor(skill.element)}>{skill.element}</span>
                  </div>
                </div>

                {!reqCheck.meets && (
                  <div className="text-[10px] text-red-400 bg-red-900/20 rounded px-2 py-1">
                    {reqCheck.reason}
                  </div>
                )}

                {skillSlotsFull && !known && (
                  <div className="text-[10px] text-amber-400 bg-amber-900/20 rounded px-2 py-1">
                    Skill slots full (4/4) - will replace existing skill
                  </div>
                )}

                <div className="mt-auto pt-3 space-y-2">
                  {/* Upgrade or Learn button */}
                  {(known || (!skillSlotsFull && reqCheck.meets)) && (
                    <button
                      type="button"
                      disabled={!canAfford || !reqCheck.meets}
                      onClick={() => onLearnScroll(skill)}
                      className={`w-full py-3 border text-xs font-bold uppercase transition-colors flex items-center justify-center gap-2
                        ${canAfford && reqCheck.meets
                          ? 'bg-amber-900/20 border-amber-700 text-amber-300 hover:bg-amber-900/40'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-600 cursor-not-allowed'
                        }`}
                    >
                      <Sparkles size={14} />
                      {known ? 'Upgrade Skill' : 'Learn Technique'}
                      {chakraCost > 0 && (
                        <span className={canAfford ? 'text-blue-400' : 'text-red-400'}>
                          (-{chakraCost} Chakra)
                        </span>
                      )}
                    </button>
                  )}

                  {/* Replacement buttons when slots are full */}
                  {!known && player.skills.length > 0 && reqCheck.meets && (
                    <div className="grid grid-cols-2 gap-2">
                      {player.skills.map((s, idx) => (
                        <button
                          type="button"
                          key={idx}
                          disabled={!canAfford}
                          onClick={() => onLearnScroll(skill, idx)}
                          className={`py-2 border text-[9px] uppercase transition-colors
                            ${canAfford
                              ? 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-red-400 hover:border-red-900'
                              : 'bg-zinc-900 border-zinc-800 text-zinc-700 cursor-not-allowed'
                            }`}
                        >
                          Replace {s.name}
                        </button>
                      ))}
                    </div>
                  )}

                  {!canAfford && (
                    <div className="text-[9px] text-red-400 text-center mt-1">
                      Not enough chakra to study
                    </div>
                  )}
                </div>
              </div>
            </Tooltip>
          );
        })}
      </div>

      <div className="text-center">
        <button
          type="button"
          onClick={onSkip}
          className="text-zinc-600 hover:text-zinc-300 text-xs uppercase tracking-widest border-b border-transparent hover:border-zinc-600 pb-1"
        >
          Leave Scrolls
        </button>
      </div>
    </div>
  );
};

export default ScrollDiscovery;
