import React from 'react';
import { Item, Skill, Player, SkillTier, Rarity } from '../game/types';
import { Scroll } from 'lucide-react';

interface LootProps {
  droppedItems: Item[];
  droppedSkill: Skill | null;
  player: Player | null;
  playerStats: any;
  onEquipItem: (item: Item) => void;
  onSellItem: (item: Item) => void;
  onLearnSkill: (skill: Skill, slotIndex?: number) => void;
  onLeaveAll: () => void;
  getRarityColor: (rarity: Rarity) => string;
  getDamageTypeColor: (dt: string) => string;
}

const Loot: React.FC<LootProps> = ({
  droppedItems,
  droppedSkill,
  player,
  playerStats,
  onEquipItem,
  onSellItem,
  onLearnSkill,
  onLeaveAll,
  getRarityColor,
  getDamageTypeColor
}) => {
  return (
    <div className="w-full max-w-6xl z-10">
      <h2 className="text-2xl text-center mb-10 text-zinc-500 font-serif tracking-[0.5em] uppercase">Spoils of War</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {droppedItems.map(item => (
          <div key={item.id} className="bg-black border border-zinc-800 p-6 flex flex-col gap-4">
            <div>
              <h3 className={`font-bold text-lg mb-1 ${getRarityColor(item.rarity)}`}>{item.name}</h3>
              <p className="text-[10px] text-zinc-600 uppercase tracking-widest font-bold">{item.type} • {item.rarity}</p>
            </div>
            <div className="space-y-1 text-xs font-mono text-zinc-500">
              {Object.entries(item.stats).map(([key, val]) => (
                <div key={key} className="flex justify-between uppercase">
                  <span>{key}</span>
                  <span className="text-zinc-200">+{val}</span>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3 mt-auto pt-3">
              <button
                onClick={() => onEquipItem(item)}
                className="py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[10px] font-bold text-zinc-300 uppercase"
              >
                Equip
              </button>
              <button
                onClick={() => onSellItem(item)}
                className="py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[10px] font-bold text-zinc-500 hover:text-yellow-500 uppercase"
              >
                Sell (+{Math.floor(item.value * 0.6)})
              </button>
            </div>
          </div>
        ))}

        {droppedSkill && playerStats && (
          <div className="bg-black border border-blue-900/30 p-6 flex flex-col gap-4">
            <div>
              <h3 className={`font-bold text-lg mb-1 ${droppedSkill.tier === SkillTier.FORBIDDEN ? 'text-red-500 animate-pulse' : 'text-blue-100'}`}>
                {droppedSkill.name}
              </h3>
              <p className="text-[10px] text-blue-600 uppercase tracking-widest font-bold">Secret Scroll • {droppedSkill.tier}</p>
            </div>
            <div className="flex items-start gap-3">
              <Scroll className="text-blue-900 shrink-0" size={28} />
              <p className="text-xs text-zinc-400 italic leading-relaxed">{droppedSkill.description}</p>
            </div>
            <div className="space-y-1 text-[10px] font-mono">
              <div className="flex justify-between">
                <span className="text-zinc-600">Chakra Cost</span>
                <span className="text-blue-400">{droppedSkill.chakraCost}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-600">Damage Type</span>
                <span className={getDamageTypeColor(droppedSkill.damageType)}>{droppedSkill.damageType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-600">Property</span>
                <span className="text-zinc-300">{droppedSkill.damageProperty}</span>
              </div>
              {droppedSkill.requirements?.intelligence && (
                <div className="flex justify-between">
                  <span className="text-cyan-600">Requires INT</span>
                  <span className={playerStats.effectivePrimary.intelligence >= droppedSkill.requirements.intelligence ? 'text-green-400' : 'text-red-400'}>
                    {droppedSkill.requirements.intelligence}
                  </span>
                </div>
              )}
            </div>
            <div className="mt-auto pt-3">
              {player && player.skills.some(s => s.id === droppedSkill.id) ? (
                <button onClick={() => onLearnSkill(droppedSkill)} className="w-full py-2 bg-green-900/20 border border-green-900 text-[10px] font-bold text-green-200 uppercase">
                  Upgrade
                </button>
              ) : player && player.skills.length < 4 ? (
                <button onClick={() => onLearnSkill(droppedSkill)} className="w-full py-2 bg-blue-900/20 border border-blue-900 text-[10px] font-bold text-blue-200 uppercase">
                  Learn
                </button>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {player?.skills.map((s, idx) => (
                    <button
                      key={idx}
                      onClick={() => onLearnSkill(droppedSkill, idx)}
                      className="py-1 bg-zinc-900 border border-zinc-800 text-[8px] text-zinc-400 hover:text-red-400 uppercase"
                    >
                      Replace {s.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      <div className="text-center">
        <button onClick={onLeaveAll} className="text-zinc-600 hover:text-zinc-300 text-xs uppercase tracking-widest border-b border-transparent hover:border-zinc-600 pb-1">
          Leave All
        </button>
      </div>
    </div>
  );
};

export default Loot;
