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
import { useGame } from '../../contexts/GameContext';
import { Item, EquipmentSlot, DragData, Rarity, TreasureHunt } from '../../game/types';
import EquipmentPanel from '../inventory/EquipmentPanel';
import Bag from '../inventory/Bag';
import { Coins, Map } from 'lucide-react';
import { getRarityDragPreviewColor } from '../../utils/colorHelpers';

interface RightSidebarPanelProps {
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
  // Treasure hunt tracking
  treasureHunt?: TreasureHunt | null;
}

// Drag preview component - icon only
const ItemDragPreview: React.FC<{ item: Item }> = ({ item }) => {
  return (
    <div
      className={`w-10 h-10 flex items-center justify-center rounded border-2 ${getRarityDragPreviewColor(item.rarity)} backdrop-blur-sm shadow-lg text-xl`}
    >
      {item.icon || '?'}
    </div>
  );
};

const RightSidebarPanel: React.FC<RightSidebarPanelProps> = ({
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
  treasureHunt,
}) => {
  const { player } = useGame();
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
  if (!player) return null;

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

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col gap-4 h-full text-[11px] rounded-lg p-3 overflow-y-auto">
        <EquipmentPanel
          equipment={player.equipment}
          onSellEquipped={onSellEquipped}
          onUnequip={onUnequipToBag}
          onDisassemble={onDisassembleEquipped}
          onStartSynthesis={onStartSynthesisEquipped}
          isDragging={!!activeDrag}
        />

        {/* Bag - only show when handlers are available */}
        {onSelectComponent && onSellComponent && (
          <Bag
            items={player.bag}
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
          {/* Ryo */}
          <div className="flex items-center gap-2 flex-shrink-0 px-3 py-1 bg-zinc-800/50 rounded border border-zinc-700">
            <Coins className="w-4 h-4 text-yellow-500" />
            <span className="text-yellow-400 font-bold text-sm">{player.ryo.toLocaleString()}</span>
          </div>
        </div>

        {/* Treasure Hunt Progress - only show when active */}
        {treasureHunt && treasureHunt.isActive && (
          <div className="bg-zinc-900/50 border border-amber-800/50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <Map className="w-4 h-4 text-amber-400" />
              <span className="text-amber-400 text-xs font-medium">Treasure Hunt</span>
            </div>
            {/* Map pieces progress */}
            <div className="flex items-center gap-2 px-2 py-1.5 bg-zinc-800/50 rounded border border-zinc-700">
              <div className="flex gap-1 flex-1">
                {Array.from({ length: treasureHunt.requiredPieces }).map((_, i) => (
                  <div
                    key={i}
                    className={`h-2.5 flex-1 rounded-sm transition-colors ${
                      i < treasureHunt.collectedPieces
                        ? 'bg-amber-500'
                        : 'bg-zinc-700'
                    }`}
                  />
                ))}
              </div>
              <span className="text-amber-300 text-xs font-medium ml-1">
                {treasureHunt.collectedPieces}/{treasureHunt.requiredPieces}
              </span>
            </div>
          </div>
        )}

      </div>

      {/* Drag overlay - shows item preview while dragging */}
      <DragOverlay>
        {activeDrag && <ItemDragPreview item={activeDrag.item} />}
      </DragOverlay>
    </DndContext>
  );
};

export default RightSidebarPanel;
