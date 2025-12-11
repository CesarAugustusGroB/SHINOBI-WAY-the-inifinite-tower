import React from 'react';
import { useGame } from '../contexts/GameContext';
import { getStoryArc } from '../game/systems/EnemySystem';
import { Item, EquipmentSlot } from '../game/types';
import FloorPanel from './FloorPanel';
import PrimaryStatsPanel from './PrimaryStatsPanel';
import DerivedStatsPanel from './DerivedStatsPanel';
import EquipmentPanel from './EquipmentPanel';
import ComponentBag from './ComponentBag';

interface LeftSidebarPanelProps {
  // Props are now optional - uses context if not provided
  storyArcLabel?: string;
  // Synthesis system props
  selectedComponent?: Item | null;
  onSelectComponent?: (item: Item | null) => void;
  onSellComponent?: (item: Item) => void;
  onSynthesize?: (compA: Item, compB: Item) => void;
  onEquipFromBag?: (item: Item) => void;
  // Equipment panel action props
  onSellEquipped?: (slot: EquipmentSlot, item: Item) => void;
  onUnequipToBag?: (slot: EquipmentSlot, item: Item) => void;
  onDisassembleEquipped?: (slot: EquipmentSlot, item: Item) => void;
}

const LeftSidebarPanel: React.FC<LeftSidebarPanelProps> = ({
  storyArcLabel,
  selectedComponent,
  onSelectComponent,
  onSellComponent,
  onSynthesize,
  onEquipFromBag,
  onSellEquipped,
  onUnequipToBag,
  onDisassembleEquipped,
}) => {
  const { player, playerStats, floor } = useGame();

  // Early return if no player data
  if (!player || !playerStats) return null;

  // Derive story arc label from floor if not provided
  const arcLabel = storyArcLabel ?? getStoryArc(floor).label;
  return (
    <div className="flex flex-col gap-4 h-full text-[11px] rounded-lg p-3 overflow-y-auto">
      <FloorPanel
        floor={floor}
        storyArcLabel={arcLabel}
      />

      <PrimaryStatsPanel
        player={player}
        effectivePrimary={playerStats.effectivePrimary}
      />

      <DerivedStatsPanel
        derived={playerStats.derived}
      />

      <EquipmentPanel
        equipment={player.equipment}
        onSellEquipped={onSellEquipped}
        onUnequip={onUnequipToBag}
        onDisassemble={onDisassembleEquipped}
      />

      {/* Component Bag - only show when player has components or handlers are available */}
      {onSelectComponent && onSellComponent && (
        <ComponentBag
          components={player.componentBag}
          onSelectComponent={onSelectComponent}
          onSellComponent={onSellComponent}
          selectedComponent={selectedComponent || null}
          onSynthesize={onSynthesize}
          onEquipFromBag={onEquipFromBag}
        />
      )}

      {/* Wallet Display */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-3">
        <div className="text-zinc-400 text-xs mb-1">Wallet</div>
        <div className="text-amber-400 font-bold">{player.ryo} Ryō</div>
      </div>
    </div>
  );
};

export default LeftSidebarPanel;
