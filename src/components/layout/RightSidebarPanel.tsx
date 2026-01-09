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
import './layout.css';

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

// Get drag preview class based on rarity
const getDragPreviewClass = (rarity: Rarity): string => {
  switch (rarity) {
    case Rarity.RARE: return 'drag-preview drag-preview--rare';
    case Rarity.EPIC: return 'drag-preview drag-preview--epic';
    case Rarity.LEGENDARY: return 'drag-preview drag-preview--legendary';
    case Rarity.CURSED: return 'drag-preview drag-preview--cursed';
    default: return 'drag-preview drag-preview--common';
  }
};

// Drag preview component - icon only
const ItemDragPreview: React.FC<{ item: Item }> = ({ item }) => {
  return (
    <div className={getDragPreviewClass(item.rarity)}>
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
      <div className="sidebar">
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
        <div className="wallet">
          <div className="wallet__label">Wallet</div>
          <div className="wallet__amount">
            <Coins className="wallet__icon" />
            <span className="wallet__value">{player.ryo.toLocaleString()}</span>
          </div>
        </div>

        {/* Treasure Hunt Progress - only show when active */}
        {treasureHunt && treasureHunt.isActive && (
          <div className="treasure-hunt">
            <div className="treasure-hunt__header">
              <Map className="treasure-hunt__icon" />
              <span className="treasure-hunt__title">Treasure Hunt</span>
            </div>
            <div className="treasure-hunt__progress">
              <div className="treasure-hunt__pieces">
                {Array.from({ length: treasureHunt.requiredPieces }).map((_, i) => (
                  <div
                    key={i}
                    className={`treasure-hunt__piece ${
                      i < treasureHunt.collectedPieces
                        ? 'treasure-hunt__piece--collected'
                        : 'treasure-hunt__piece--empty'
                    }`}
                  />
                ))}
              </div>
              <span className="treasure-hunt__count">
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
