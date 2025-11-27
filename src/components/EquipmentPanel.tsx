import React from 'react';
import { Item, ItemSlot, Rarity } from '../game/types';
import Tooltip from './Tooltip';

interface EquipmentPanelProps {
  equipment: Record<ItemSlot, Item | null>;
}

const EquipmentPanel: React.FC<EquipmentPanelProps> = ({ equipment }) => {
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

  const renderEquip = (slot: ItemSlot) => {
    const item = equipment[slot];

    const tooltipContent = item ? (
      <div className="space-y-2">
        <div className={`font-bold ${getRarityColor(item.rarity)}`}>{item.name}</div>
        <div className="text-[10px] uppercase tracking-wider text-zinc-500">{item.rarity} {item.type}</div>
        <div className="space-y-1 text-[10px] font-mono text-zinc-400 pt-2 border-t border-zinc-800">
          {Object.entries(item.stats).map(([key, val]) => (
            <div key={key} className="flex justify-between uppercase">
              <span>{formatStatName(key)}</span>
              <span className="text-zinc-200">+{val}</span>
            </div>
          ))}
        </div>
        <div className="text-[10px] text-yellow-600 pt-1">Value: {item.value} Ryō</div>
      </div>
    ) : <div className="text-xs text-zinc-500 italic">No item equipped.</div>;

    return (
      <Tooltip content={tooltipContent}>
        <div className="mb-1.5 p-2 border border-zinc-800 bg-black/40 rounded hover:border-zinc-600 transition-colors group cursor-pointer">
          <div className="flex justify-between items-center mb-0.5">
            <span className="text-[9px] uppercase text-zinc-600 font-bold tracking-wider">{slot}</span>
            {item && <span className={`text-[9px] uppercase ${getRarityColor(item.rarity)} opacity-70`}>{item.rarity}</span>}
          </div>
          <div className={`text-xs font-medium truncate font-serif tracking-wide ${item ? getRarityColor(item.rarity) : 'text-zinc-700 italic'}`}>
            {item ? item.name : "Empty"}
          </div>
        </div>
      </Tooltip>
    );
  };

  return (
    <div className="flex-1">
      <h3 className="text-[9px] font-bold text-zinc-600 mb-2 uppercase tracking-widest">Equipment</h3>
      {renderEquip(ItemSlot.WEAPON)}
      {renderEquip(ItemSlot.HEAD)}
      {renderEquip(ItemSlot.BODY)}
      {renderEquip(ItemSlot.ACCESSORY)}
    </div>
  );
};

export default EquipmentPanel;
