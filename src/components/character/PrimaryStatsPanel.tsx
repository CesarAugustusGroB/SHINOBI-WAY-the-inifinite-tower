import React from 'react';
import { Player, PrimaryAttributes } from '../../game/types';
import {
  Swords, Brain, Flame, Droplet, Target, Wind, Sparkles, User, Heart, Eye
} from 'lucide-react';
import Tooltip from '../shared/Tooltip';

interface PrimaryStatsPanelProps {
  player: Player;
  effectivePrimary: PrimaryAttributes;
}

const PrimaryStatsPanel: React.FC<PrimaryStatsPanelProps> = ({ player, effectivePrimary }) => {
  const renderPrimaryStat = (
    icon: React.ReactNode,
    label: string,
    key: keyof PrimaryAttributes,
    subLabel: string,
    description: string,
    color: string = 'text-zinc-500'
  ) => {
    const base = player.primaryStats[key];
    const effective = effectivePrimary[key];
    const diff = effective - base;

    const tooltipContent = (
      <div className="text-xs space-y-1">
        <div className="font-bold text-zinc-200 mb-1">{subLabel}</div>
        <div className="text-zinc-400">{description}</div>
        <div className="border-t border-zinc-800 mt-2 pt-2 font-mono text-zinc-500">
          <div className="flex justify-between"><span>Base</span> <span className="text-zinc-300">{base}</span></div>
          <div className="flex justify-between"><span>Bonus</span> <span className={diff > 0 ? "text-green-400" : diff < 0 ? "text-red-400" : "text-zinc-500"}>{diff >= 0 ? '+' : ''}{diff}</span></div>
          <div className="flex justify-between border-t border-zinc-800 mt-1 pt-1"><span>Total</span> <span className="text-zinc-200 font-bold">{effective}</span></div>
        </div>
      </div>
    );

    return (
      <Tooltip content={tooltipContent} position="right">
        <div className="flex items-center justify-between text-xs text-zinc-400 py-1.5 px-2 rounded hover:bg-zinc-800 transition-colors group cursor-help">
          <div className="flex items-center gap-2">
            <span className={`${color} group-hover:text-zinc-300 transition-colors`}>{icon}</span>
            <div>
              <div className="text-zinc-300 font-medium text-[11px]">{label}</div>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className={`font-mono font-bold text-sm ${diff > 0 ? 'text-green-400' : diff < 0 ? 'text-red-400' : 'text-zinc-200'}`}>
              {effective}
            </span>
            {diff !== 0 && (
              <span className="text-[9px] text-zinc-600 font-mono">
                ({diff >= 0 ? '+' : ''}{diff})
              </span>
            )}
          </div>
        </div>
      </Tooltip>
    );
  };

  return (
    <div className="primary-stats-panel p-3 rounded border border-zinc-800">
      {/* Header: Clan & Element */}
      <div className="flex items-center gap-3 mb-3 border-b border-zinc-800 pb-2">
        <div className="p-1.5 bg-zinc-950 rounded-full border border-zinc-800">
          <User size={16} className="text-red-600" />
        </div>
        <div>
          <div className="text-sm font-bold text-zinc-200">{player.clan} Clan</div>
          <div className="text-[10px] text-zinc-500">Affinity: {player.element}</div>
        </div>
      </div>

      {/* THE SPIRIT */}
      <div className="mb-3">
        <h3 className="text-[9px] font-bold text-purple-900 mb-1 uppercase tracking-widest flex items-center gap-1">
          <Flame size={10} /> The Spirit
        </h3>
        <div className="space-y-0 bg-zinc-950/50 rounded p-1">
          {renderPrimaryStat(<Heart size={12} />, "Willpower", "willpower", "Willpower", "Grit & survival instinct. Governs Max HP, Guts chance (survive fatal blow), and HP regeneration.", "text-red-500")}
          {renderPrimaryStat(<Droplet size={12} />, "Chakra", "chakra", "Chakra", "Raw energy capacity. Determines Max Chakra pool size.", "text-blue-500")}
          {renderPrimaryStat(<Flame size={12} />, "Spirit", "spirit", "Spirit", "Nature affinity. Governs Elemental Ninjutsu damage and Elemental Defense.", "text-purple-500")}
        </div>
      </div>

      {/* THE MIND */}
      <div className="mb-3">
        <h3 className="text-[9px] font-bold text-cyan-900 mb-1 uppercase tracking-widest flex items-center gap-1">
          <Brain size={10} /> The Mind
        </h3>
        <div className="space-y-0 bg-zinc-950/50 rounded p-1">
          {renderPrimaryStat(<Brain size={12} />, "Intelligence", "intelligence", "Intelligence", "Tactical acumen. Required to learn complex Jutsus. Governs Chakra regeneration.", "text-cyan-500")}
          {renderPrimaryStat(<Eye size={12} />, "Calmness", "calmness", "Calmness", "Mental fortitude. Governs Genjutsu damage/defense and Status Resistance.", "text-indigo-500")}
          {renderPrimaryStat(<Target size={12} />, "Accuracy", "accuracy", "Accuracy", "Marksmanship. Governs Ranged Hit chance and Ranged Critical Damage bonus.", "text-yellow-500")}
        </div>
      </div>

      {/* THE BODY */}
      <div>
        <h3 className="text-[9px] font-bold text-orange-900 mb-1 uppercase tracking-widest flex items-center gap-1">
          <Swords size={10} /> The Body
        </h3>
        <div className="space-y-0 bg-zinc-950/50 rounded p-1">
          {renderPrimaryStat(<Swords size={12} />, "Strength", "strength", "Strength", "Physical conditioning. Governs Taijutsu damage and Physical Defense.", "text-orange-500")}
          {renderPrimaryStat(<Wind size={12} />, "Speed", "speed", "Speed", "Reflexes & flow. Governs Initiative, Melee Hit chance, and Evasion.", "text-green-500")}
          {renderPrimaryStat(<Sparkles size={12} />, "Dexterity", "dexterity", "Dexterity", "Lethal precision. Governs Critical Hit chance for all attack types.", "text-pink-500")}
        </div>
      </div>
    </div>
  );
};

export default PrimaryStatsPanel;
