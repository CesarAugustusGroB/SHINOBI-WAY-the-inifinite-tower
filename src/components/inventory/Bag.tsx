import React, { useState } from 'react';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Item, MAX_BAG_SLOTS, Rarity, DragData } from '../../game/types';
import { getRecipesUsingComponent, findRecipe } from '../../game/constants/synthesis';
import { formatStatName } from '../../game/utils/tooltipFormatters';
import Tooltip from '../shared/Tooltip';
import { getRarityTextBorderColor } from '../../utils/colorHelpers';
import './inventory.css';

interface BagProps {
  items: (Item | null)[];
  onSelectComponent: (item: Item | null) => void;
  onSellComponent: (item: Item) => void;
  selectedComponent: Item | null;
  onSynthesize?: (componentA: Item, componentB: Item) => void;
  onEquipFromBag?: (item: Item) => void;
  isDragging?: boolean;
}

interface BagSlotProps {
  item: Item | null;
  index: number;
  isSelected: boolean;
  canCombine: boolean;
  isMenuOpen: boolean;
  sellValue: number;
  globalDragging: boolean;
  onItemClick: (item: Item) => void;
  onContextMenu: (e: React.MouseEvent, item: Item) => void;
  getRarityColor: (r: Rarity) => string;
  getCompatibleRecipes: (item: Item) => { name: string }[];
  children?: React.ReactNode;
}

const BagSlot: React.FC<BagSlotProps> = ({
  item,
  index,
  isSelected,
  canCombine,
  globalDragging,
  onItemClick,
  onContextMenu,
  getRarityColor,
  getCompatibleRecipes,
  children,
}) => {
  const sellValue = item ? Math.floor(item.value * 0.6) : 0;

  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: `bag-${index}`,
  });

  const dragData: DragData | undefined = item
    ? { item, source: { type: 'bag', index } }
    : undefined;

  const {
    attributes,
    listeners,
    setNodeRef: setDragRef,
    transform,
    isDragging,
  } = useDraggable({
    id: `bag-drag-${index}`,
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
    const classes = ['bag__slot'];

    if (isDragging) {
      classes.push('bag__slot--dragging');
    } else if (isOver && globalDragging) {
      classes.push('bag__slot--drop-target');
    } else if (item) {
      if (isSelected) {
        classes.push('bag__slot--selected');
      } else if (canCombine) {
        classes.push('bag__slot--combinable');
      } else {
        classes.push('bag__slot--filled');
      }
    } else {
      classes.push('bag__slot--empty');
    }

    return classes.join(' ');
  };

  return (
    <div className="bag__slot-wrapper">
      <Tooltip
        position="left"
        content={
          item ? (
            <div className="bag__tooltip">
              <div className={`bag__tooltip-name ${getRarityColor(item.rarity)}`}>
                {item.icon} {item.name}
              </div>
              <div className="bag__tooltip-desc">{item.description}</div>
              <div className="bag__tooltip-stats">
                {Object.entries(item.stats).map(([key, val]) => (
                  <div key={key} className="bag__tooltip-stat">
                    <span>{formatStatName(key)}</span>
                    <span className="bag__tooltip-stat-value">+{val}</span>
                  </div>
                ))}
              </div>
              {item.componentId && (
                <div className="bag__tooltip-recipes">
                  <div className="bag__tooltip-recipes-title">Can combine into:</div>
                  {getCompatibleRecipes(item).slice(0, 3).map(recipe => (
                    <div key={recipe.name} className="bag__tooltip-recipe">{recipe.name}</div>
                  ))}
                </div>
              )}
              <div className="bag__tooltip-sell">Sell: {sellValue} Ryo (60%)</div>
              <div className="bag__tooltip-hint">Drag to move - Click for actions</div>
            </div>
          ) : (
            <div className="bag__tooltip-hint">Empty slot - drop items here</div>
          )
        }
      >
        <div
          ref={combinedRef}
          style={style}
          {...attributes}
          {...listeners}
          onClick={() => item && onItemClick(item)}
          onContextMenu={(e) => {
            e.preventDefault();
            if (item) onContextMenu(e, item);
          }}
          className={getSlotClasses()}
        >
          {item ? (
            <span title={item.name}>{item.icon || '?'}</span>
          ) : (
            <span className="bag__slot-empty-icon">·</span>
          )}
        </div>
      </Tooltip>
      {children}
    </div>
  );
};

const Bag: React.FC<BagProps> = ({
  items,
  onSelectComponent,
  onSellComponent,
  selectedComponent,
  onSynthesize,
  onEquipFromBag,
  isDragging: globalDragging = false,
}) => {
  const [synthesisMode, setSynthesisMode] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const itemCount = items.filter(item => item !== null).length;
  const getRarityColor = getRarityTextBorderColor;

  const handleComponentClick = (item: Item) => {
    if (synthesisMode && selectedComponent && selectedComponent.id !== item.id) {
      if (onSynthesize && selectedComponent.componentId && item.componentId) {
        const recipe = findRecipe(selectedComponent.componentId, item.componentId);
        if (recipe) {
          onSynthesize(selectedComponent, item);
          setSynthesisMode(false);
          setActiveMenu(null);
          return;
        }
      }
    }
    setActiveMenu(activeMenu === item.id ? null : item.id);
    onSelectComponent(item);
  };

  const handleEquip = (item: Item) => {
    onEquipFromBag?.(item);
    setActiveMenu(null);
    setSynthesisMode(false);
  };

  const startSynthesis = (item: Item) => {
    onSelectComponent(item);
    setSynthesisMode(true);
    setActiveMenu(null);
  };

  const handleSell = (e: React.MouseEvent, item: Item) => {
    e.stopPropagation();
    onSellComponent(item);
    setSynthesisMode(false);
    setActiveMenu(null);
  };

  const handleSellFromMenu = (item: Item) => {
    onSellComponent(item);
    setSynthesisMode(false);
    setActiveMenu(null);
  };

  const cancelSynthesis = () => {
    setSynthesisMode(false);
    setActiveMenu(null);
    onSelectComponent(null);
  };

  const getCompatibleRecipes = (item: Item) => {
    if (!item.componentId) return [];
    return getRecipesUsingComponent(item.componentId).slice(0, 4);
  };

  const canCombineWithSelected = (item: Item) => {
    if (!synthesisMode || !selectedComponent || !selectedComponent.componentId || !item.componentId) return false;
    if (selectedComponent.id === item.id) return false;
    return findRecipe(selectedComponent.componentId, item.componentId) !== null;
  };

  return (
    <div className="bag">
      <div className="bag__header">
        <h3 className="bag__title">Bag ({itemCount}/{MAX_BAG_SLOTS})</h3>
        {synthesisMode && selectedComponent && (
          <button type="button" onClick={cancelSynthesis} className="bag__cancel">Cancel</button>
        )}
      </div>

      {synthesisMode && selectedComponent && (
        <div className="bag__synthesis-hint">
          Select another component to synthesize with {selectedComponent.name}
        </div>
      )}

      <div className="bag__grid">
        {items.map((item, index) => {
          const isSelected = selectedComponent?.id === item?.id;
          const canCombine = item ? canCombineWithSelected(item) : false;
          const isMenuOpen = item && activeMenu === item.id && !synthesisMode;
          const sellValue = item ? Math.floor(item.value * 0.6) : 0;

          return (
            <BagSlot
              key={index}
              item={item}
              index={index}
              isSelected={isSelected}
              canCombine={canCombine}
              isMenuOpen={!!isMenuOpen}
              sellValue={sellValue}
              globalDragging={globalDragging}
              onItemClick={handleComponentClick}
              onContextMenu={handleSell}
              getRarityColor={getRarityColor}
              getCompatibleRecipes={getCompatibleRecipes}
            >
              {isMenuOpen && item && (
                <div className="bag__menu">
                  {onEquipFromBag && (
                    <button
                      type="button"
                      onClick={() => handleEquip(item)}
                      className="bag__menu-btn bag__menu-btn--equip"
                    >
                      Equip
                    </button>
                  )}
                  {onSynthesize && item.componentId && (
                    <button
                      type="button"
                      onClick={() => startSynthesis(item)}
                      className="bag__menu-btn bag__menu-btn--synthesize"
                    >
                      Synthesize
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleSellFromMenu(item)}
                    className="bag__menu-btn bag__menu-btn--sell"
                  >
                    <span>Sell</span>
                    <span className="bag__menu-price">+{sellValue}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveMenu(null)}
                    className="bag__menu-btn bag__menu-btn--cancel"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </BagSlot>
          );
        })}
      </div>

      <div className="bag__help">
        Drag to reorder/equip - Click for actions - Right-click to quick sell
      </div>

      {synthesisMode && selectedComponent && selectedComponent.componentId && (
        <div className="bag__synthesis-preview">
          <div className="bag__synthesis-title">Available combinations:</div>
          <div className="bag__synthesis-grid">
            {items
              .filter((c): c is Item => c !== null && c.id !== selectedComponent.id && !!c.componentId)
              .map(c => {
                const recipe = c.componentId && selectedComponent.componentId
                  ? findRecipe(selectedComponent.componentId, c.componentId)
                  : null;
                if (!recipe) return null;
                return (
                  <div
                    key={c.id}
                    onClick={() => handleComponentClick(c)}
                    className="bag__synthesis-option"
                  >
                    + {c.icon} - {recipe.name}
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
};

export default Bag;
