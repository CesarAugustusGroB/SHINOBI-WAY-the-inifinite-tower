import React from 'react';
import { Player, ItemSlot, Rarity, PrimaryAttributes, DerivedStats, PrimaryStat } from '../types';
import { 
  Shield, Swords, Zap, Brain, Eye, Activity, User, Heart, 
  Flame, Droplet, Target, Wind, Sparkles, AlertTriangle
} from 'lucide-react';
import Tooltip from './Tooltip';
import { formatPercent } from '../statCalculator';

interface CharacterSheetProps {
  player: Player;
  effectivePrimary: PrimaryAttributes;
  derived: DerivedStats;
}

const CharacterSheet: React.FC<CharacterSheetProps> = ({ player, effectivePrimary, derived }) => {
  
  // ============================================================================
  // STAT RENDERING HELPERS
  // ============================================================================
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
      <Tooltip content={tooltipContent}>
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

  // ============================================================================
  // EQUIPMENT RENDERING
  // ============================================================================
  const getRarityColor = (r: Rarity) => {
    switch(r) {
      case Rarity.LEGENDARY: return 'text-orange-400 drop-shadow-md';
      case Rarity.EPIC: return 'text-purple-400';
      case Rarity.RARE: return 'text-blue-400';
      case Rarity.CURSED: return 'text-red-600 animate-pulse';
      default: return 'text-zinc-400';
    }
  };

  const renderEquip = (slot: ItemSlot) => {
    const item = player.equipment[slot];

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

  // Helper to format stat names
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

  return (
    <div className="flex flex-col gap-4 h-full text-[11px]">
      {/* Header: Clan & Element */}
      <div className="bg-zinc-900/80 p-3 rounded border border-zinc-800">
        <div className="flex items-center gap-3 mb-3 border-b border-zinc-800 pb-2">
          <div className="p-1.5 bg-zinc-950 rounded-full border border-zinc-800">
            <User size={16} className="text-red-600" />
          </div>
          <div>
            <div className="text-sm font-bold text-zinc-200">{player.clan} Clan</div>
            <div className="text-[10px] text-zinc-500">Affinity: {player.element}</div>
          </div>
        </div>

        {/* THE BODY */}
        <div className="mb-3">
          <h3 className="text-[9px] font-bold text-red-900 mb-1 uppercase tracking-widest flex items-center gap-1">
            <Heart size={10} /> The Body
          </h3>
          <div className="space-y-0 bg-zinc-950/50 rounded p-1">
            {renderPrimaryStat(<Heart size={12} />, "WIL", "willpower", "Willpower", "Grit & survival instinct. Governs Max HP, Guts chance (survive fatal blow), and HP regeneration.", "text-red-500")}
            {renderPrimaryStat(<Droplet size={12} />, "CHA", "chakra", "Chakra", "Raw energy capacity. Determines Max Chakra pool size.", "text-blue-500")}
            {renderPrimaryStat(<Swords size={12} />, "STR", "strength", "Strength", "Physical conditioning. Governs Taijutsu damage and Physical Defense.", "text-orange-500")}
          </div>
        </div>

        {/* THE MIND */}
        <div className="mb-3">
          <h3 className="text-[9px] font-bold text-purple-900 mb-1 uppercase tracking-widest flex items-center gap-1">
            <Brain size={10} /> The Mind
          </h3>
          <div className="space-y-0 bg-zinc-950/50 rounded p-1">
            {renderPrimaryStat(<Flame size={12} />, "SPI", "spirit", "Spirit", "Nature affinity. Governs Elemental Ninjutsu damage and Elemental Defense.", "text-purple-500")}
            {renderPrimaryStat(<Brain size={12} />, "INT", "intelligence", "Intelligence", "Tactical acumen. Required to learn complex Jutsus. Governs Chakra regeneration.", "text-cyan-500")}
            {renderPrimaryStat(<Eye size={12} />, "CAL", "calmness", "Calmness", "Mental fortitude. Governs Genjutsu damage/defense and Status Resistance.", "text-indigo-500")}
          </div>
        </div>

        {/* THE TECHNIQUE */}
        <div>
          <h3 className="text-[9px] font-bold text-green-900 mb-1 uppercase tracking-widest flex items-center gap-1">
            <Zap size={10} /> The Technique
          </h3>
          <div className="space-y-0 bg-zinc-950/50 rounded p-1">
            {renderPrimaryStat(<Wind size={12} />, "SPD", "speed", "Speed", "Reflexes & flow. Governs Initiative, Melee Hit chance, and Evasion.", "text-green-500")}
            {renderPrimaryStat(<Target size={12} />, "ACC", "accuracy", "Accuracy", "Marksmanship. Governs Ranged Hit chance and Ranged Critical Damage bonus.", "text-yellow-500")}
            {renderPrimaryStat(<Sparkles size={12} />, "DEX", "dexterity", "Dexterity", "Lethal precision. Governs Critical Hit chance for all attack types.", "text-pink-500")}
          </div>
        </div>
      </div>

      {/* Derived Stats Panel */}
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

      {/* Equipment Section */}
      <div className="flex-1">
        <h3 className="text-[9px] font-bold text-zinc-600 mb-2 uppercase tracking-widest">Equipment</h3>
        {renderEquip(ItemSlot.WEAPON)}
        {renderEquip(ItemSlot.HEAD)}
        {renderEquip(ItemSlot.BODY)}
        {renderEquip(ItemSlot.ACCESSORY)}
      </div>
      
      {/* Wallet */}
      <div className="mt-auto pt-3 border-t border-zinc-800">
        <div className="flex justify-between text-sm items-center">
          <span className="text-zinc-500 text-[10px] uppercase tracking-wider">Wallet</span>
          <span className="text-yellow-500 font-mono font-bold">{player.ryo} <span className="text-[10px] text-zinc-600">Ryō</span></span>
        </div>
      </div>
    </div>
  );
};

export default CharacterSheet;
