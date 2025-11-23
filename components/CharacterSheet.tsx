import React from 'react';
import { Player, ItemSlot, Rarity, Attributes } from '../types';
import { Shield, Swords, Zap, Brain, Eye, Activity, User } from 'lucide-react';
import Tooltip from './Tooltip';

interface CharacterSheetProps {
  player: Player;
  effectiveStats: Attributes;
}

const CharacterSheet: React.FC<CharacterSheetProps> = ({ player, effectiveStats }) => {
  
  const renderStat = (icon: React.ReactNode, label: string, key: keyof Attributes, subLabel: string, description: string) => {
      const base = player.stats[key];
      const effective = effectiveStats[key];
      const diff = effective - base;
      const isPositive = diff > 0;

      const tooltipContent = (
          <div className="text-xs space-y-1">
              <div className="font-bold text-zinc-200 mb-1">{subLabel}</div>
              <div className="text-zinc-400">{description}</div>
              <div className="border-t border-zinc-800 mt-2 pt-2 font-mono text-zinc-500">
                  <div className="flex justify-between"><span>Base</span> <span className="text-zinc-300">{base}</span></div>
                  <div className="flex justify-between"><span>Equipment</span> <span className={diff > 0 ? "text-green-400" : "text-zinc-500"}>+{diff}</span></div>
                  <div className="flex justify-between border-t border-zinc-800 mt-1 pt-1"><span>Total</span> <span className="text-zinc-200 font-bold">{effective}</span></div>
              </div>
          </div>
      );

      return (
        <Tooltip content={tooltipContent}>
            <div className="flex items-center justify-between text-xs text-zinc-400 py-2 px-2 rounded hover:bg-zinc-800 transition-colors group border-b border-zinc-800/50 last:border-0 cursor-help">
            <div className="flex items-center gap-3">
                <span className="text-zinc-500 group-hover:text-zinc-300 transition-colors">{icon}</span>
                <div>
                    <div className="text-zinc-300 font-medium">{label}</div>
                    <div className="text-[10px] text-zinc-600">{subLabel}</div>
                </div>
            </div>
            <div className="flex items-center gap-1.5">
                <span className={`font-mono font-bold text-sm ${isPositive ? 'text-green-400' : 'text-zinc-200'}`}>
                    {effective}
                </span>
                {isPositive && (
                    <span className="text-[10px] text-zinc-600 font-mono">
                        (+{diff})
                    </span>
                )}
            </div>
            </div>
        </Tooltip>
      );
  };

  const getRarityColor = (r: Rarity) => {
      switch(r) {
          case Rarity.LEGENDARY: return 'text-orange-400 drop-shadow-md';
          case Rarity.EPIC: return 'text-purple-400';
          case Rarity.RARE: return 'text-blue-400';
          case Rarity.CURSED: return 'text-red-600 animate-pulse';
          default: return 'text-zinc-400';
      }
  }

  const renderEquip = (slot: ItemSlot) => {
    const item = player.equipment[slot];

    const tooltipContent = item ? (
        <div className="space-y-2">
            <div className={`font-bold ${getRarityColor(item.rarity)}`}>{item.name}</div>
            <div className="text-[10px] uppercase tracking-wider text-zinc-500">{item.rarity} {item.type}</div>
            <div className="space-y-1 text-[10px] font-mono text-zinc-400 pt-2 border-t border-zinc-800">
                 {Object.entries(item.stats).map(([key, val]) => (
                     <div key={key} className="flex justify-between uppercase">
                         <span>{key === 'maxHp' ? 'HP' : key === 'maxChakra' ? 'Chakra' : key}</span>
                         <span className="text-zinc-200">+{val}</span>
                     </div>
                 ))}
            </div>
            <div className="text-[10px] text-yellow-600 pt-1">Value: {item.value} Ryō</div>
        </div>
    ) : <div className="text-xs text-zinc-500 italic">No item equipped.</div>;

    return (
      <Tooltip content={tooltipContent}>
        <div className="mb-2 p-3 border border-zinc-800 bg-black/40 rounded hover:border-zinc-600 transition-colors group cursor-pointer">
            <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] uppercase text-zinc-600 font-bold tracking-wider">{slot}</span>
                {item && <span className={`text-[10px] uppercase ${getRarityColor(item.rarity)} opacity-70`}>{item.rarity}</span>}
            </div>
            <div className={`text-sm font-medium truncate font-serif tracking-wide ${item ? getRarityColor(item.rarity) : 'text-zinc-700 italic'}`}>
            {item ? item.name : "Empty"}
            </div>
        </div>
      </Tooltip>
    );
  };

  return (
    <div className="flex flex-col gap-6 h-full">
        <div className="bg-zinc-900/80 p-4 rounded border border-zinc-800">
             <div className="flex items-center gap-3 mb-4 border-b border-zinc-800 pb-3">
                <div className="p-2 bg-zinc-950 rounded-full border border-zinc-800">
                    <User size={20} className="text-red-600" />
                </div>
                <div>
                    <div className="text-sm font-bold text-zinc-200">{player.clan} Clan</div>
                    <div className="text-xs text-zinc-500">Affinity: {player.element}</div>
                </div>
             </div>

            <h3 className="text-[10px] font-bold text-zinc-600 mb-2 uppercase tracking-widest pl-1">Attributes</h3>
            <div className="space-y-0">
                {renderStat(<Swords size={14} />, "STR", "str", "Taijutsu Power", "Increases damage of Physical and Taijutsu skills.")}
                {renderStat(<Brain size={14} />, "INT", "int", "Ninshū & Regen", "Increases Ninjutsu damage and Chakra regeneration.")}
                {renderStat(<Zap size={14} />, "SPD", "spd", "Speed & Crit", "Increases Critical Hit chance and Evasion chance.")}
                {renderStat(<Shield size={14} />, "DEF", "def", "Mitigation", "Reduces incoming physical and elemental damage.")}
                {renderStat(<Eye size={14} />, "GEN", "gen", "Control", "Increases potency of Genjutsu and resistance to control effects.")}
                {renderStat(<Activity size={14} />, "ACC", "acc", "Accuracy", "Increases hit rate against fast enemies.")}
            </div>
        </div>

        <div className="flex-1">
             <h3 className="text-[10px] font-bold text-zinc-600 mb-3 uppercase tracking-widest pl-1">Equipment</h3>
             {renderEquip(ItemSlot.WEAPON)}
             {renderEquip(ItemSlot.HEAD)}
             {renderEquip(ItemSlot.BODY)}
             {renderEquip(ItemSlot.ACCESSORY)}
        </div>
        
        <div className="mt-auto pt-4 border-t border-zinc-800">
            <div className="flex justify-between text-sm items-center">
                <span className="text-zinc-500 text-xs uppercase tracking-wider">Wallet</span>
                <span className="text-yellow-500 font-mono font-bold">{player.ryo} <span className="text-xs text-zinc-600">Ryō</span></span>
            </div>
        </div>
    </div>
  );
};

export default CharacterSheet;