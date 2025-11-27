import React from 'react';
import { Item, Skill, Player, SkillTier, Rarity, ItemSlot } from '../game/types';
import { Scroll } from 'lucide-react';
import Tooltip from '../components/Tooltip';
import {
  formatStatName,
  formatScalingStat,
  getStatColor,
  getElementColor,
  getEffectColor,
  getEffectIcon,
  formatEffectDescription,
} from '../game/utils/tooltipFormatters';

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
        {droppedItems.map(item => {
          // Calculate stat comparison with currently equipped item
          const equippedItem = player?.equipment[item.type as ItemSlot];
          const statComparisons: Record<string, { value: number; delta: number }> = {};

          Object.entries(item.stats).forEach(([key, val]) => {
            const equippedVal = equippedItem?.stats[key as keyof typeof equippedItem.stats] || 0;
            statComparisons[key] = {
              value: val as number,
              delta: (val as number) - (equippedVal as number)
            };
          });

          // Check for stats on equipped item that aren't on new item
          if (equippedItem) {
            Object.entries(equippedItem.stats).forEach(([key, val]) => {
              if (!(key in statComparisons) && val) {
                statComparisons[key] = {
                  value: 0,
                  delta: -(val as number)
                };
              }
            });
          }

          return (
            <Tooltip
              key={item.id}
              content={
                <div className="space-y-2 p-1 max-w-[260px]">
                  <div className={`font-bold ${getRarityColor(item.rarity)}`}>{item.name}</div>
                  <div className="text-[10px] text-zinc-500 uppercase tracking-wider">
                    {item.rarity} {item.type}
                  </div>
                  {item.description && (
                    <div className="text-xs text-zinc-400 italic">{item.description}</div>
                  )}

                  {/* Stats with comparison */}
                  <div className="border-t border-zinc-700 pt-2 space-y-1">
                    {Object.entries(statComparisons).map(([key, data]) => (
                      <div key={key} className="flex justify-between text-[10px] font-mono">
                        <span className="text-zinc-500">{formatStatName(key)}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-zinc-200">+{data.value}</span>
                          {equippedItem && data.delta !== 0 && (
                            <span className={data.delta > 0 ? 'text-green-400' : 'text-red-400'}>
                              ({data.delta > 0 ? '+' : ''}{data.delta})
                            </span>
                          )}
                          {!equippedItem && (
                            <span className="text-blue-400">(new)</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-zinc-700 pt-2 text-[10px] text-yellow-600">
                    Sell Value: {Math.floor(item.value * 0.6)} Ryo
                  </div>
                </div>
              }
            >
              <div className="bg-black border border-zinc-800 p-6 flex flex-col gap-4 cursor-help">
                <div>
                  <h3 className={`font-bold text-lg mb-1 ${getRarityColor(item.rarity)}`}>{item.name}</h3>
                  <p className="text-[10px] text-zinc-600 uppercase tracking-widest font-bold">{item.type} • {item.rarity}</p>
                </div>
                <div className="space-y-1 text-xs font-mono text-zinc-500">
                  {Object.entries(item.stats).map(([key, val]) => (
                    <div key={key} className="flex justify-between uppercase">
                      <span>{formatStatName(key)}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-zinc-200">+{val}</span>
                        {equippedItem && statComparisons[key]?.delta !== 0 && (
                          <span className={statComparisons[key]?.delta > 0 ? 'text-green-400 text-[10px]' : 'text-red-400 text-[10px]'}>
                            ({statComparisons[key]?.delta > 0 ? '+' : ''}{statComparisons[key]?.delta})
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-3 mt-auto pt-3">
                  <button
                    type="button"
                    onClick={() => onEquipItem(item)}
                    className="py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[10px] font-bold text-zinc-300 uppercase"
                  >
                    Equip
                  </button>
                  <button
                    type="button"
                    onClick={() => onSellItem(item)}
                    className="py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[10px] font-bold text-zinc-500 hover:text-yellow-500 uppercase"
                  >
                    Sell (+{Math.floor(item.value * 0.6)})
                  </button>
                </div>
              </div>
            </Tooltip>
          );
        })}

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
              <div className="flex justify-between">
                <span className="text-zinc-600">Scales with</span>
                <span className={getStatColor(droppedSkill.scalingStat)}>{formatScalingStat(droppedSkill.scalingStat)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-600">Element</span>
                <span className={getElementColor(droppedSkill.element)}>{droppedSkill.element}</span>
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

            {/* Effects Section */}
            {droppedSkill.effects && droppedSkill.effects.length > 0 && (
              <div className="border-t border-blue-900/30 pt-3">
                <div className="text-[9px] text-blue-500 uppercase tracking-wider mb-2">Applies Effects</div>
                <div className="space-y-1">
                  {droppedSkill.effects.map((effect, idx) => (
                    <div key={idx} className="text-[10px] flex items-center gap-1.5">
                      <span className={getEffectColor(effect.type)}>{getEffectIcon(effect.type)}</span>
                      <span className="text-zinc-300">{formatEffectDescription(effect)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bonus Stats */}
            {(droppedSkill.critBonus || droppedSkill.penetration || droppedSkill.isToggle) && (
              <div className="border-t border-blue-900/30 pt-3 text-[10px] space-y-1">
                {droppedSkill.critBonus && (
                  <div className="text-yellow-400">+{droppedSkill.critBonus}% Crit Chance</div>
                )}
                {droppedSkill.penetration && (
                  <div className="text-red-400">{Math.round(droppedSkill.penetration * 100)}% Defense Penetration</div>
                )}
                {droppedSkill.isToggle && (
                  <div className="text-amber-400">Toggle Skill - {droppedSkill.upkeepCost} CP/turn upkeep</div>
                )}
              </div>
            )}

            <div className="mt-auto pt-3">
              {player && player.skills.some(s => s.id === droppedSkill.id) ? (
                <button type="button" onClick={() => onLearnSkill(droppedSkill)} className="w-full py-2 bg-green-900/20 border border-green-900 text-[10px] font-bold text-green-200 uppercase">
                  Upgrade
                </button>
              ) : player && player.skills.length < 4 ? (
                <button type="button" onClick={() => onLearnSkill(droppedSkill)} className="w-full py-2 bg-blue-900/20 border border-blue-900 text-[10px] font-bold text-blue-200 uppercase">
                  Learn
                </button>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {player?.skills.map((s, idx) => (
                    <button
                      type="button"
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
        <button type="button" onClick={onLeaveAll} className="text-zinc-600 hover:text-zinc-300 text-xs uppercase tracking-widest border-b border-transparent hover:border-zinc-600 pb-1">
          Leave All
        </button>
      </div>
    </div>
  );
};

export default Loot;
