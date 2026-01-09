import React, { useState } from 'react';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Item, EquipmentSlot, Rarity, DragData } from '../../game/types';
import Tooltip from '../shared/Tooltip';
import { formatStatName } from '../../game/utils/tooltipFormatters';
import { getRarityTextColorWithEffects } from '../../utils/colorHelpers';
import './inventory.css';

interface EquipmentPanelProps {
  equipment: Record<EquipmentSlot, Item | null>;
  onSellEquipped?: (slot: EquipmentSlot, item: Item) => void;
  onUnequip?: (slot: EquipmentSlot, item: Item) => void;
  onDisassemble?: (slot: EquipmentSlot, item: Item) => void;
  onStartSynthesis?: (slot: EquipmentSlot, item: Item) => void;
  isDragging?: boolean;
}

const EquipmentPanel: React.FC<EquipmentPanelProps> = ({
  equipment,
  onSellEquipped,
  onUnequip,
  onDisassemble,
  onStartSynthesis,
  isDragging: globalDragging = false,
}) => {
  const [activeMenu, setActiveMenu] = useState<EquipmentSlot | null>(null);

  const getRarityColor = getRarityTextColorWithEffects;

  const SLOT_NAMES: Record<EquipmentSlot, string> = {
    [EquipmentSlot.SLOT_1]: 'Primary (+50%)',
    [EquipmentSlot.SLOT_2]: 'Secondary',
    [EquipmentSlot.SLOT_3]: 'Secondary',
    [EquipmentSlot.SLOT_4]: 'Secondary',
  };

  const isPrimarySlot = (slot: EquipmentSlot) => slot === EquipmentSlot.SLOT_1;

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

  const handleStartSynthesis = (slot: EquipmentSlot, item: Item) => {
    onStartSynthesis?.(slot, item);
    setActiveMenu(null);
  };

  const renderEquip = (slot: EquipmentSlot) => {
    const item = equipment[slot];
    const isMenuOpen = activeMenu === slot;
    const sellValue = item ? Math.floor(item.value * 0.6) : 0;
    const canUnequip = !!item;
    const canDisassemble = item && !item.isComponent && item.recipe;

    const { setNodeRef: setDropRef, isOver } = useDroppable({
      id: `equip-${slot}`,
    });

    const dragData: DragData | undefined = item
      ? { item, source: { type: 'equipment', slot } }
      : undefined;

    const {
      attributes,
      listeners,
      setNodeRef: setDragRef,
      transform,
      isDragging,
    } = useDraggable({
      id: `equip-drag-${slot}`,
      data: dragData,
      disabled: !item,
    });

    const combinedRef = (node: HTMLElement | null) => {
      setDropRef(node);
      setDragRef(node);
    };

    const style = transform
      ? { transform: CSS.Translate.toString(transform) }
      : undefined;

    const getSlotClasses = () => {
      const classes = ['equipment-panel__slot'];

      if (isDragging) {
        classes.push('equipment-panel__slot--dragging');
      } else if (isOver && globalDragging) {
        classes.push('equipment-panel__slot--drop-target');
      } else if (isMenuOpen) {
        classes.push('equipment-panel__slot--selected');
      } else if (isPrimarySlot(slot)) {
        classes.push('equipment-panel__slot--primary');
      } else if (item) {
        classes.push('equipment-panel__slot--filled');
      } else {
        classes.push('equipment-panel__slot--empty');
      }

      return classes.join(' ');
    };

    const tooltipContent = item ? (
      <div className="equipment-panel__tooltip">
        <div className={`equipment-panel__tooltip-name ${getRarityColor(item.rarity)}`}>{item.name}</div>
        <div className="equipment-panel__tooltip-type">
          {item.rarity} {item.isComponent ? 'Component' : (item.type || 'Artifact')}
        </div>
        {item.description && (
          <div className="equipment-panel__tooltip-desc">{item.description}</div>
        )}
        {item.passive && (
          <div className="equipment-panel__tooltip-passive">
            Passive: {item.description}
          </div>
        )}
        <div className="equipment-panel__tooltip-stats">
          {Object.entries(item.stats).map(([key, val]) => (
            <div key={key} className="equipment-panel__tooltip-stat">
              <span>{formatStatName(key)}</span>
              <span className="equipment-panel__tooltip-stat-value">+{val}</span>
            </div>
          ))}
        </div>
        <div className="equipment-panel__tooltip-sell">Sell: {sellValue} Ryo (60%)</div>
        {canDisassemble && (
          <div className="equipment-panel__tooltip-disassemble">Can disassemble (50% return)</div>
        )}
        <div className="equipment-panel__tooltip-hint">Drag to move - Click for actions</div>
      </div>
    ) : (
      <div className="equipment-panel__tooltip-empty">Empty slot - drop items here</div>
    );

    return (
      <div key={slot} className="equipment-panel__slot-wrapper">
        <Tooltip content={tooltipContent} position="left">
          <div
            ref={combinedRef}
            style={style}
            {...attributes}
            {...listeners}
            onClick={() => handleSlotClick(slot, item)}
            className={getSlotClasses()}
          >
            <div className={`equipment-panel__slot-header ${isDragging ? 'equipment-panel__slot-invisible' : ''}`}>
              <span className={`equipment-panel__slot-label ${isPrimarySlot(slot) ? 'equipment-panel__slot-label--primary' : ''}`}>
                {SLOT_NAMES[slot]}
              </span>
              {item && (
                <span className={`equipment-panel__slot-rarity ${getRarityColor(item.rarity)}`}>
                  {item.rarity}
                </span>
              )}
            </div>
            <div className={`equipment-panel__slot-name ${
              item ? getRarityColor(item.rarity) : 'equipment-panel__slot-name--empty'
            } ${isDragging ? 'equipment-panel__slot-invisible' : ''}`}>
              {item ? (item.icon ? `${item.icon} ${item.name}` : item.name) : "Empty"}
            </div>
          </div>
        </Tooltip>

        {isMenuOpen && item && (
          <div className="equipment-panel__menu">
            <button
              type="button"
              onClick={() => handleSell(slot, item)}
              className="equipment-panel__menu-btn equipment-panel__menu-btn--sell"
            >
              <span>Sell</span>
              <span className="equipment-panel__menu-price">+{sellValue} Ryo</span>
            </button>

            {canUnequip && onUnequip && (
              <button
                type="button"
                onClick={() => handleUnequip(slot, item)}
                className="equipment-panel__menu-btn equipment-panel__menu-btn--unequip"
              >
                Move to Bag
              </button>
            )}

            {item.isComponent && onStartSynthesis && (
              <button
                type="button"
                onClick={() => handleStartSynthesis(slot, item)}
                className="equipment-panel__menu-btn equipment-panel__menu-btn--synthesize"
              >
                Synthesize
              </button>
            )}

            {canDisassemble && onDisassemble && (
              <button
                type="button"
                onClick={() => handleDisassemble(slot, item)}
                className="equipment-panel__menu-btn equipment-panel__menu-btn--disassemble"
              >
                Disassemble (50%)
              </button>
            )}

            <button
              type="button"
              onClick={() => setActiveMenu(null)}
              className="equipment-panel__menu-btn equipment-panel__menu-btn--cancel"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="equipment-panel">
      <h3 className="equipment-panel__title">Equipment</h3>
      {renderEquip(EquipmentSlot.SLOT_1)}
      {renderEquip(EquipmentSlot.SLOT_2)}
      {renderEquip(EquipmentSlot.SLOT_3)}
      {renderEquip(EquipmentSlot.SLOT_4)}
    </div>
  );
};

export default EquipmentPanel;
