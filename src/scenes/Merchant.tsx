import React from 'react';
import { Item, Player, Rarity, EquipmentSlot, DamageType, SLOT_MAPPING, TreasureQuality, MAX_MERCHANT_SLOTS } from '../game/types';
import { Coins, RefreshCw, ShoppingBag, Gem } from 'lucide-react';
import Tooltip from '../components/Tooltip';
import { formatStatName } from '../game/utils/tooltipFormatters';
import { MERCHANT } from '../game/config';
import { calculateMerchantRerollCost } from '../game/systems/RegionSystem';

interface MerchantProps {
  merchantItems: Item[];
  discountPercent: number;
  player: Player | null;
  playerStats: any;
  dangerLevel: number;
  baseDifficulty: number;
  onBuyItem: (item: Item) => void;
  onLeave: () => void;
  onReroll: () => void;
  onBuySlot: () => void;
  onUpgradeQuality: () => void;
  getRarityColor: (rarity: Rarity) => string;
  getDamageTypeColor: (dt: DamageType) => string;
  isProcessing?: boolean;
}

const Merchant: React.FC<MerchantProps> = ({
  merchantItems,
  discountPercent,
  player,
  playerStats,
  dangerLevel,
  baseDifficulty,
  onBuyItem,
  onLeave,
  onReroll,
  onBuySlot,
  onUpgradeQuality,
  getRarityColor,
  getDamageTypeColor,
  isProcessing = false
}) => {
  const rerollCost = calculateMerchantRerollCost(dangerLevel, baseDifficulty, MERCHANT.REROLL_BASE_COST, MERCHANT.REROLL_FLOOR_SCALING);
  const getPrice = (item: Item) => {
    // Apply price multiplier (80% more expensive) then discount
    const basePrice = item.value * MERCHANT.ITEM_PRICE_MULTIPLIER;
    return Math.floor(basePrice * (1 - discountPercent / 100));
  };

  const canAfford = (item: Item) => {
    return player && player.ryo >= getPrice(item);
  };

  return (
    <div className="w-full max-w-6xl z-10">
      <div className="flex items-center justify-center gap-4 mb-2">
        <h2 className="text-2xl text-center text-zinc-500 font-serif tracking-[0.5em] uppercase">Merchant</h2>
        {discountPercent > 0 && (
          <span className="bg-yellow-600 text-black text-xs font-bold px-2 py-1 rounded">
            {discountPercent}% OFF!
          </span>
        )}
      </div>
      <div className="flex items-center justify-center gap-2 mb-4">
        <Coins className="text-yellow-500" size={16} />
        <span className="text-yellow-500 font-mono">{player?.ryo || 0} Ryō</span>
      </div>

      {/* Merchant Services Section */}
      {player && (
        <div className="flex flex-wrap items-center justify-center gap-3 mb-8 p-4 bg-zinc-900/50 border border-zinc-800 rounded">
          {/* Player Status */}
          <div className="flex items-center gap-4 text-[10px] text-zinc-500 mr-4">
            <span>Quality: <span className="text-zinc-300">{player.treasureQuality}</span></span>
            <span>Slots: <span className="text-zinc-300">{player.merchantSlots}/{MAX_MERCHANT_SLOTS}</span></span>
          </div>

          {/* Reroll Button */}
          <Tooltip content={<span>Refresh merchant inventory</span>}>
            <button
              type="button"
              onClick={onReroll}
              disabled={isProcessing || player.ryo < rerollCost}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase bg-zinc-800 border border-zinc-700 text-zinc-300 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw size={12} />
              Reroll ({rerollCost} Ryō)
            </button>
          </Tooltip>

          {/* Buy Slot Button */}
          {player.merchantSlots < MAX_MERCHANT_SLOTS && (
            <Tooltip content={<span>Merchants will show more items</span>}>
              <button
                type="button"
                onClick={onBuySlot}
                disabled={isProcessing || player.ryo < MERCHANT.SLOT_COSTS[player.merchantSlots]}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase bg-blue-900/30 border border-blue-800 text-blue-300 hover:bg-blue-900/50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ShoppingBag size={12} />
                +1 Slot ({MERCHANT.SLOT_COSTS[player.merchantSlots]} Ryō)
              </button>
            </Tooltip>
          )}

          {/* Upgrade Quality Button */}
          {player.treasureQuality !== TreasureQuality.RARE && (
            <Tooltip content={<span>Improve quality of treasure drops</span>}>
              <button
                type="button"
                onClick={onUpgradeQuality}
                disabled={isProcessing || player.ryo < (player.treasureQuality === TreasureQuality.BROKEN ? MERCHANT.QUALITY_UPGRADE_COSTS.COMMON : MERCHANT.QUALITY_UPGRADE_COSTS.RARE)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase bg-purple-900/30 border border-purple-800 text-purple-300 hover:bg-purple-900/50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Gem size={12} />
                Quality ↑ ({player.treasureQuality === TreasureQuality.BROKEN ? MERCHANT.QUALITY_UPGRADE_COSTS.COMMON : MERCHANT.QUALITY_UPGRADE_COSTS.RARE} Ryō)
              </button>
            </Tooltip>
          )}
        </div>
      )}

      {merchantItems.length === 0 ? (
        <p className="text-center text-zinc-600 mb-10">The merchant has nothing left to sell.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {merchantItems.map(item => {
            // Map legacy ItemSlot to EquipmentSlot, or use SLOT_1 for items without type
            const targetSlot = item.type ? SLOT_MAPPING[item.type] : EquipmentSlot.SLOT_1;
            const equippedItem = player?.equipment[targetSlot];
            const statComparisons: Record<string, { value: number; delta: number }> = {};
            const price = getPrice(item);
            const affordable = canAfford(item);

            Object.entries(item.stats).forEach(([key, val]) => {
              const equippedVal = equippedItem?.stats[key as keyof typeof equippedItem.stats] || 0;
              statComparisons[key] = {
                value: val as number,
                delta: (val as number) - (equippedVal as number)
              };
            });

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

                    {/* Passive effect display for artifacts */}
                    {!item.isComponent && item.passive && (
                      <div className="text-[10px] text-purple-400 bg-purple-500/10 rounded px-1 py-0.5">
                        Passive: {item.description}
                      </div>
                    )}

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

                    <div className="border-t border-zinc-700 pt-2 text-[10px]">
                      <span className={affordable ? 'text-yellow-500' : 'text-red-500'}>
                        Price: {price} Ryō
                        {discountPercent > 0 && (
                          <span className="text-zinc-600 line-through ml-2">{item.value}</span>
                        )}
                      </span>
                    </div>
                  </div>
                }
              >
                <div className="bg-black border border-yellow-900/30 p-6 flex flex-col gap-4 cursor-help">
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
                  <div className="mt-auto pt-3 space-y-2">
                    <div className="text-center">
                      <span className={`text-sm font-mono ${affordable ? 'text-yellow-500' : 'text-red-500'}`}>
                        {price} Ryō
                        {discountPercent > 0 && (
                          <span className="text-zinc-600 line-through ml-2 text-xs">{item.value}</span>
                        )}
                      </span>
                    </div>
                    <button
                      type="button"
                      disabled={isProcessing || !affordable}
                      onClick={(e) => { e.stopPropagation(); onBuyItem(item); }}
                      className={`w-full py-2 border text-[10px] font-bold uppercase disabled:opacity-50 disabled:cursor-not-allowed ${
                        affordable
                          ? 'bg-yellow-900/20 border-yellow-900 text-yellow-200 hover:bg-yellow-900/40'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-500'
                      }`}
                    >
                      {affordable ? 'Buy & Equip' : 'Cannot Afford'}
                    </button>
                  </div>
                </div>
              </Tooltip>
            );
          })}
        </div>
      )}

      <div className="text-center">
        <button
          type="button"
          onClick={onLeave}
          className="text-zinc-600 hover:text-zinc-300 text-xs uppercase tracking-widest border-b border-transparent hover:border-zinc-600 pb-1"
        >
          Leave Shop
        </button>
      </div>
    </div>
  );
};

export default Merchant;
