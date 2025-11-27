import React from 'react';
import { DerivedStats } from '../game/types';
import { Shield, Flame, Eye } from 'lucide-react';
import Tooltip from './Tooltip';
import { formatPercent } from '../game/systems/StatSystem';

interface DerivedStatsPanelProps {
  derived: DerivedStats;
}

const DerivedStatsPanel: React.FC<DerivedStatsPanelProps> = ({ derived }) => {
  const renderDerivedStat = (
    label: string,
    value: string | number,
    description: string,
    color: string = 'text-zinc-400'
  ) => {
    const tooltipContent = (
      <div className="text-xs">
        <div className="font-bold text-zinc-200 mb-1">{label}</div>
        <div className="text-zinc-400">{description}</div>
      </div>
    );

    return (
      <Tooltip content={tooltipContent}>
        <div className="flex justify-between items-center text-[10px] py-1 cursor-help hover:bg-zinc-800/50 px-1 rounded">
          <span className="text-zinc-500 uppercase tracking-wide">{label}</span>
          <span className={`font-mono font-bold ${color}`}>{value}</span>
        </div>
      </Tooltip>
    );
  };

  return (
    <div className="bg-zinc-900/80 p-3 rounded border border-zinc-800">
      <h3 className="text-[9px] font-bold text-zinc-600 mb-2 uppercase tracking-widest">Derived Stats</h3>

      {/* Defense Breakdown */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="bg-zinc-950 p-2 rounded border border-zinc-800">
          <div className="text-[8px] text-orange-600 uppercase tracking-wider mb-1 flex items-center gap-1">
            <Shield size={8} /> Physical
          </div>
          <div className="text-zinc-300 font-mono text-[10px]">
            <span className="text-orange-400">{derived.physicalDefenseFlat}</span>
            <span className="text-zinc-600 mx-1">+</span>
            <span className="text-orange-300">{formatPercent(derived.physicalDefensePercent)}</span>
          </div>
        </div>
        <div className="bg-zinc-950 p-2 rounded border border-zinc-800">
          <div className="text-[8px] text-purple-600 uppercase tracking-wider mb-1 flex items-center gap-1">
            <Flame size={8} /> Elemental
          </div>
          <div className="text-zinc-300 font-mono text-[10px]">
            <span className="text-purple-400">{derived.elementalDefenseFlat}</span>
            <span className="text-zinc-600 mx-1">+</span>
            <span className="text-purple-300">{formatPercent(derived.elementalDefensePercent)}</span>
          </div>
        </div>
        <div className="bg-zinc-950 p-2 rounded border border-zinc-800">
          <div className="text-[8px] text-indigo-600 uppercase tracking-wider mb-1 flex items-center gap-1">
            <Eye size={8} /> Mental
          </div>
          <div className="text-zinc-300 font-mono text-[10px]">
            <span className="text-indigo-400">{derived.mentalDefenseFlat}</span>
            <span className="text-zinc-600 mx-1">+</span>
            <span className="text-indigo-300">{formatPercent(derived.mentalDefensePercent)}</span>
          </div>
        </div>
      </div>

      {/* Other Derived Stats */}
      <div className="space-y-0.5 border-t border-zinc-800 pt-2">
        {renderDerivedStat("Evasion", formatPercent(derived.evasion), "Chance to dodge attacks. Based on Speed.", "text-green-400")}
        {renderDerivedStat("Crit Chance", `${Math.round(derived.critChance)}%`, "Chance to deal critical damage. Based on Dexterity.", "text-pink-400")}
        {renderDerivedStat("Melee Crit", `${derived.critDamageMelee.toFixed(2)}x`, "Critical damage multiplier for melee attacks.", "text-orange-400")}
        {renderDerivedStat("Ranged Crit", `${derived.critDamageRanged.toFixed(2)}x`, "Critical damage multiplier for ranged attacks. Boosted by Accuracy.", "text-yellow-400")}
        {renderDerivedStat("Status Resist", formatPercent(derived.statusResistance), "Chance to resist debuffs. Based on Calmness.", "text-indigo-400")}
        {renderDerivedStat("Guts", formatPercent(derived.gutsChance), "Chance to survive a fatal blow at 1 HP. Based on Willpower.", "text-red-400")}
        {renderDerivedStat("HP Regen", `${derived.hpRegen}/turn`, "Health restored each turn. Based on Willpower.", "text-green-300")}
        {renderDerivedStat("Chakra Regen", `${derived.chakraRegen}/turn`, "Chakra restored each turn. Based on Intelligence.", "text-blue-300")}
      </div>
    </div>
  );
};

export default DerivedStatsPanel;
