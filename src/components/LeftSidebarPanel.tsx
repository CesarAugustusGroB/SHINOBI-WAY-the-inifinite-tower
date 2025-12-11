import React, { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  DragStartEvent,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { useGame } from '../contexts/GameContext';
import { getStoryArc } from '../game/systems/EnemySystem';
import { Item, EquipmentSlot, DragData, Rarity } from '../game/types';
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
  onStartSynthesisEquipped?: (slot: EquipmentSlot, item: Item) => void;
  // Drag-and-drop handlers
  onReorderBag?: (fromIndex: number, toIndex: number) => void;
  onDragBagToEquip?: (item: Item, bagIndex: number, targetSlot: EquipmentSlot) => void;
  onDragEquipToBag?: (item: Item, slot: EquipmentSlot, targetBagIndex?: number) => void;
  onSwapEquipment?: (fromSlot: EquipmentSlot, toSlot: EquipmentSlot) => void;
}

// Drag preview component
const ItemDragPreview: React.FC<{ item: Item }> = ({ item }) => {
  const getRarityColor = (r: Rarity) => {
    switch (r) {
      case Rarity.LEGENDARY: return 'border-orange-500 bg-orange-500/20';
      case Rarity.EPIC: return 'border-purple-500 bg-purple-500/20';
      case Rarity.RARE: return 'border-blue-500 bg-blue-500/20';
      case Rarity.CURSED: return 'border-red-600 bg-red-600/20';
      default: return 'border-zinc-500 bg-zinc-500/20';
    }
  };

  return (
    <div
      className={`px-3 py-2 rounded border-2 ${getRarityColor(item.rarity)} backdrop-blur-sm shadow-lg`}
    >
      <span className="text-lg mr-2">{item.icon || '?'}</span>
      <span className="text-sm font-medium text-white">{item.name}</span>
    </div>
  );
};

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
  onStartSynthesisEquipped,
  onReorderBag,
  onDragBagToEquip,
  onDragEquipToBag,
  onSwapEquipment,
}) => {
  const { player, playerStats, floor } = useGame();
  const [activeDrag, setActiveDrag] = useState<DragData | null>(null);

  // Configure sensors - require 8px movement to start drag (prevents accidental drags on clicks)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Early return if no player data
  if (!player || !playerStats) return null;

  const handleDragStart = (event: DragStartEvent) => {
    const data = event.active.data.current as DragData | undefined;
    if (data) {
      setActiveDrag(data);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDrag(null);

    if (!over) return;

    const activeData = active.data.current as DragData | undefined;
    if (!activeData) return;

    const overId = over.id as string;

    // Parse target ID to determine action
    if (overId.startsWith('bag-')) {
      const toIndex = parseInt(overId.split('-')[1], 10);

      if (activeData.source.type === 'bag') {
        // Bag to bag: reorder
        onReorderBag?.(activeData.source.index, toIndex);
      } else if (activeData.source.type === 'equipment') {
        // Equipment to bag: unequip
        onDragEquipToBag?.(activeData.item, activeData.source.slot, toIndex);
      }
    } else if (overId.startsWith('equip-')) {
      const targetSlot = overId.replace('equip-', '') as EquipmentSlot;

      if (activeData.source.type === 'bag') {
        // Bag to equipment: equip to specific slot
        onDragBagToEquip?.(activeData.item, activeData.source.index, targetSlot);
      } else if (activeData.source.type === 'equipment') {
        // Equipment to equipment: swap slots
        onSwapEquipment?.(activeData.source.slot, targetSlot);
      }
    }
  };

  // Derive story arc label from floor if not provided
  const arcLabel = storyArcLabel ?? getStoryArc(floor).label;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
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
          onStartSynthesis={onStartSynthesisEquipped}
          isDragging={!!activeDrag}
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
            isDragging={!!activeDrag}
          />
        )}

        {/* Wallet Display */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-3">
          <div className="text-zinc-400 text-xs mb-1">Wallet</div>
          <div className="text-amber-400 font-bold">{player.ryo} Ryō</div>
        </div>
      </div>

      {/* Drag overlay - shows item preview while dragging */}
      <DragOverlay>
        {activeDrag && <ItemDragPreview item={activeDrag.item} />}
      </DragOverlay>
    </DndContext>
  );
};

export default LeftSidebarPanel;
