import React, { useState } from 'react';
import { Item, EquipmentSlot, Rarity } from '../game/types';
import Tooltip from './Tooltip';

interface EquipmentPanelProps {
  equipment: Record<EquipmentSlot, Item | null>;
  onSellEquipped?: (slot: EquipmentSlot, item: Item) => void;
  onUnequip?: (slot: EquipmentSlot, item: Item) => void;
  onDisassemble?: (slot: EquipmentSlot, item: Item) => void;
}

const EquipmentPanel: React.FC<EquipmentPanelProps> = ({
  equipment,
  onSellEquipped,
  onUnequip,
  onDisassemble,
}) => {
  const [activeMenu, setActiveMenu] = useState<EquipmentSlot | null>(null);

  const getRarityColor = (r: Rarity) => {
    switch (r) {
      case Rarity.LEGENDARY: return 'text-orange-400 drop-shadow-md';
      case Rarity.EPIC: return 'text-purple-400';
      case Rarity.RARE: return 'text-blue-400';
      case Rarity.CURSED: return 'text-red-600 animate-pulse';
      default: return 'text-zinc-400';
    }
  };

  const formatStatName = (key: string): string => {
    const map: Record<string, string> = {
      willpower: 'WIL',
      chakra: 'CHA',
      strength: 'STR',
      spirit: 'SPI',
      intelligence: 'INT',
      calmness: 'CAL',
      speed: 'SPD',
      accuracy: 'ACC',
      dexterity: 'DEX',
      flatHp: 'HP',
      flatChakra: 'Chakra',
      flatPhysicalDef: 'Phys Def',
      flatElementalDef: 'Elem Def',
      flatMentalDef: 'Mind Def',
      percentPhysicalDef: 'Phys %',
      percentElementalDef: 'Elem %',
      percentMentalDef: 'Mind %',
      critChance: 'Crit %',
      critDamage: 'Crit Dmg'
    };
    return map[key] || key.toUpperCase();
  };

  // Themed slot names
  const SLOT_NAMES: Record<EquipmentSlot, string> = {
    [EquipmentSlot.SLOT_1]: 'Primary',
    [EquipmentSlot.SLOT_2]: 'Secondary',
    [EquipmentSlot.SLOT_3]: 'Utility',
    [EquipmentSlot.SLOT_4]: 'Accessory',
  };

  const handleSlotClick = (slot: EquipmentSlot, item: Item | null) => {
    if (!item) return;
    setActiveMenu(activeMenu === slot ? null : slot);
  };

  const handleSell = (slot: EquipmentSlot, item: Item) => {
    onSellEquipped?.(slot, item);
    setActiveMenu(null);
  };

  const handleUnequip = (slot: EquipmentSlot, item: Item) => {
    onUnequip?.(slot, item);
    setActiveMenu(null);
  };

  const handleDisassemble = (slot: EquipmentSlot, item: Item) => {
    onDisassemble?.(slot, item);
    setActiveMenu(null);
  };

  const renderEquip = (slot: EquipmentSlot) => {
    const item = equipment[slot];
    const isMenuOpen = activeMenu === slot;
    const sellValue = item ? Math.floor(item.value * 0.6) : 0;
    const canUnequip = item?.isComponent;
    const canDisassemble = item && !item.isComponent && item.recipe;

    const tooltipContent = item ? (
      <div className="space-y-2">
        <div className={`font-bold ${getRarityColor(item.rarity)}`}>{item.name}</div>
        <div className="text-[10px] uppercase tracking-wider text-zinc-500">
          {item.rarity} {item.isComponent ? 'Component' : (item.type || 'Artifact')}
        </div>
        {item.description && (
          <div className="text-[10px] text-zinc-400 italic">{item.description}</div>
        )}
        {/* Passive effect display for artifacts */}
        {item.passive && (
          <div className="text-[10px] text-purple-400 bg-purple-500/10 rounded px-1 py-0.5">
            Passive: {item.description}
          </div>
        )}
        <div className="space-y-1 text-[10px] font-mono text-zinc-400 pt-2 border-t border-zinc-800">
          {Object.entries(item.stats).map(([key, val]) => (
            <div key={key} className="flex justify-between uppercase">
              <span>{formatStatName(key)}</span>
              <span className="text-zinc-200">+{val}</span>
            </div>
          ))}
        </div>
        <div className="text-[10px] text-yellow-600 pt-1 border-t border-zinc-800">
          Sell: {sellValue} Ryō (60%)
        </div>
        {canDisassemble && (
          <div className="text-[10px] text-amber-400">
            Can disassemble (50% return)
          </div>
        )}
        <div className="text-[9px] text-zinc-500 pt-1">Click for actions</div>
      </div>
    ) : <div className="text-xs text-zinc-500 italic">No item equipped.</div>;

    return (
      <div key={slot} className="relative">
        <Tooltip content={tooltipContent}>
          <div
            onClick={() => handleSlotClick(slot, item)}
            className={`mb-1.5 p-2 border rounded transition-colors cursor-pointer ${
              isMenuOpen
                ? 'border-amber-500 bg-amber-500/10'
                : 'border-zinc-800 bg-black/40 hover:border-zinc-600'
            } ${item ? 'group' : ''}`}
          >
            <div className="flex justify-between items-center mb-0.5">
              <span className="text-[9px] uppercase text-zinc-600 font-bold tracking-wider">
                {SLOT_NAMES[slot]}
              </span>
              {item && (
                <span className={`text-[9px] uppercase ${getRarityColor(item.rarity)} opacity-70`}>
                  {item.rarity}
                </span>
              )}
            </div>
            <div className={`text-xs font-medium truncate font-serif tracking-wide ${
              item ? getRarityColor(item.rarity) : 'text-zinc-700 italic'
            }`}>
              {item ? (item.icon ? `${item.icon} ${item.name}` : item.name) : "Empty"}
            </div>
          </div>
        </Tooltip>

        {/* Action Menu */}
        {isMenuOpen && item && (
          <div className="absolute left-0 right-0 z-20 bg-zinc-900 border border-zinc-700 rounded shadow-lg overflow-hidden">
            {/* Sell button - always available */}
            <button
              type="button"
              onClick={() => handleSell(slot, item)}
              className="w-full px-3 py-2 text-left text-[10px] hover:bg-zinc-800 transition-colors flex justify-between items-center text-yellow-400 hover:text-yellow-300"
            >
              <span>Sell</span>
              <span className="text-zinc-400">+{sellValue} Ryō</span>
            </button>

            {/* Unequip to bag - only for components */}
            {canUnequip && onUnequip && (
              <button
                type="button"
                onClick={() => handleUnequip(slot, item)}
                className="w-full px-3 py-2 text-left text-[10px] hover:bg-zinc-800 transition-colors text-blue-400 hover:text-blue-300 border-t border-zinc-800"
              >
                Move to Bag
              </button>
            )}

            {/* Disassemble - only for artifacts with recipe */}
            {canDisassemble && onDisassemble && (
              <button
                type="button"
                onClick={() => handleDisassemble(slot, item)}
                className="w-full px-3 py-2 text-left text-[10px] hover:bg-zinc-800 transition-colors text-amber-400 hover:text-amber-300 border-t border-zinc-800"
              >
                Disassemble (50%)
              </button>
            )}

            {/* Cancel */}
            <button
              type="button"
              onClick={() => setActiveMenu(null)}
              className="w-full px-3 py-2 text-left text-[10px] hover:bg-zinc-800 transition-colors text-zinc-500 hover:text-zinc-300 border-t border-zinc-800"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex-1">
      <h3 className="text-[9px] font-bold text-zinc-600 mb-2 uppercase tracking-widest">Equipment</h3>
      {renderEquip(EquipmentSlot.SLOT_1)}
      {renderEquip(EquipmentSlot.SLOT_2)}
      {renderEquip(EquipmentSlot.SLOT_3)}
      {renderEquip(EquipmentSlot.SLOT_4)}
    </div>
  );
};

export default EquipmentPanel;
