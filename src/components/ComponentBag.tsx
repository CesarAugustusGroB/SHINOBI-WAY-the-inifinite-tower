import React, { useState } from 'react';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Item, MAX_BAG_SLOTS, Rarity, DragData } from '../game/types';
import { getRecipesUsingComponent, findRecipe } from '../game/constants/synthesis';
import { formatStatName } from '../game/utils/tooltipFormatters';
import Tooltip from './Tooltip';

interface ComponentBagProps {
  components: Item[];
  onSelectComponent: (item: Item | null) => void;
  onSellComponent: (item: Item) => void;
  selectedComponent: Item | null;
  onSynthesize?: (componentA: Item, componentB: Item) => void;
  onEquipFromBag?: (item: Item) => void;
  isDragging?: boolean;
}

// Individual bag slot component with drag support
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

  // Make this slot droppable (to receive items from equipment or other bag slots)
  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: `bag-${index}`,
  });

  // Make item draggable if slot has an item
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

  // Combine refs
  const combinedRef = (node: HTMLElement | null) => {
    setDropRef(node);
    setDragRef(node);
  };

  const style = transform
    ? {
        transform: CSS.Translate.toString(transform),
      }
    : undefined;

  return (
    <div className="relative">
      <Tooltip
        position="right"
        content={
          item ? (
            <div className="space-y-2 p-1 max-w-[200px]">
              <div className={`font-bold ${getRarityColor(item.rarity)}`}>
                {item.icon} {item.name}
              </div>
              <div className="text-[10px] text-zinc-500">
                {item.description}
              </div>
              <div className="space-y-1 text-[10px] font-mono text-zinc-400 pt-2 border-t border-zinc-800">
                {Object.entries(item.stats).map(([key, val]) => (
                  <div key={key} className="flex justify-between">
                    <span>{formatStatName(key)}</span>
                    <span className="text-zinc-200">+{val}</span>
                  </div>
                ))}
              </div>
              {/* Show compatible recipes */}
              {item.componentId && (
                <div className="pt-2 border-t border-zinc-800">
                  <div className="text-[9px] text-zinc-500 mb-1">Can combine into:</div>
                  {getCompatibleRecipes(item).slice(0, 3).map(recipe => (
                    <div key={recipe.name} className="text-[9px] text-purple-400">
                      {recipe.name}
                    </div>
                  ))}
                </div>
              )}
              <div className="text-[10px] text-yellow-600 pt-1 border-t border-zinc-800">
                Sell: {sellValue} Ryō (60%)
              </div>
              <div className="text-[9px] text-zinc-500 pt-1">Drag to move • Click for actions</div>
            </div>
          ) : (
            <div className="text-[10px] text-zinc-500">Empty slot - drop items here</div>
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
          className={`
            aspect-square border rounded p-1 cursor-pointer transition-all touch-none
            flex items-center justify-center text-lg
            ${isDragging ? 'opacity-50 scale-95' : ''}
            ${isOver && globalDragging ? 'border-amber-500 bg-amber-500/20 scale-105' : ''}
            ${item && !isDragging && !isOver
              ? `${isSelected
                  ? 'border-amber-500 bg-amber-500/20'
                  : canCombine
                    ? 'border-green-500 bg-green-500/10 animate-pulse'
                    : 'border-zinc-700 bg-zinc-800/50 hover:border-zinc-500'
                }`
              : !isOver ? 'border-zinc-800 bg-zinc-900/30' : ''
            }
          `}
        >
          {item ? (
            <span title={item.name}>{item.icon || '?'}</span>
          ) : (
            <span className="text-zinc-700 text-xs">·</span>
          )}
        </div>
      </Tooltip>
      {children}
    </div>
  );
};

const ComponentBag: React.FC<ComponentBagProps> = ({
  components,
  onSelectComponent,
  onSellComponent,
  selectedComponent,
  onSynthesize,
  onEquipFromBag,
  isDragging: globalDragging = false,
}) => {
  const [synthesisMode, setSynthesisMode] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const getRarityColor = (r: Rarity) => {
    switch (r) {
      case Rarity.LEGENDARY: return 'text-orange-400 border-orange-500';
      case Rarity.EPIC: return 'text-purple-400 border-purple-500';
      case Rarity.RARE: return 'text-blue-400 border-blue-500';
      case Rarity.CURSED: return 'text-red-600 border-red-600';
      default: return 'text-zinc-400 border-zinc-600';
    }
  };

  const handleComponentClick = (item: Item) => {
    if (synthesisMode && selectedComponent && selectedComponent.id !== item.id) {
      // Try to synthesize the two components
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
    // Toggle action menu for this item
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

  // Get compatible recipes for the selected component
  const getCompatibleRecipes = (item: Item) => {
    if (!item.componentId) return [];
    return getRecipesUsingComponent(item.componentId).slice(0, 4); // Limit to 4 for display
  };

  // Check if a component can combine with selected
  const canCombineWithSelected = (item: Item) => {
    if (!synthesisMode || !selectedComponent || !selectedComponent.componentId || !item.componentId) return false;
    if (selectedComponent.id === item.id) return false;
    return findRecipe(selectedComponent.componentId, item.componentId) !== null;
  };

  // Create 8-slot grid (4x2)
  const slots = Array(MAX_BAG_SLOTS).fill(null).map((_, i) => components[i] || null);

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-3">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">
          Component Bag ({components.length}/{MAX_BAG_SLOTS})
        </h3>
        {synthesisMode && selectedComponent && (
          <button
            onClick={cancelSynthesis}
            className="text-[9px] text-zinc-500 hover:text-zinc-300 uppercase"
          >
            Cancel
          </button>
        )}
      </div>

      {/* Synthesis mode hint */}
      {synthesisMode && selectedComponent && (
        <div className="text-[9px] text-amber-400 mb-2 px-1">
          Select another component to synthesize with {selectedComponent.name}
        </div>
      )}

      {/* 4x2 Grid */}
      <div className="grid grid-cols-4 gap-1">
        {slots.map((item, index) => {
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
              {/* Action Menu */}
              {isMenuOpen && item && (
                <div className="absolute left-0 top-full mt-1 z-20 bg-zinc-900 border border-zinc-700 rounded shadow-lg overflow-hidden min-w-[100px]">
                  {/* Equip button */}
                  {onEquipFromBag && (
                    <button
                      type="button"
                      onClick={() => handleEquip(item)}
                      className="w-full px-3 py-1.5 text-left text-[10px] hover:bg-zinc-800 transition-colors text-green-400 hover:text-green-300"
                    >
                      Equip
                    </button>
                  )}
                  {/* Synthesize button */}
                  {onSynthesize && item.componentId && (
                    <button
                      type="button"
                      onClick={() => startSynthesis(item)}
                      className="w-full px-3 py-1.5 text-left text-[10px] hover:bg-zinc-800 transition-colors text-purple-400 hover:text-purple-300 border-t border-zinc-800"
                    >
                      Synthesize
                    </button>
                  )}
                  {/* Sell button */}
                  <button
                    type="button"
                    onClick={() => handleSellFromMenu(item)}
                    className="w-full px-3 py-1.5 text-left text-[10px] hover:bg-zinc-800 transition-colors flex justify-between items-center text-yellow-400 hover:text-yellow-300 border-t border-zinc-800"
                  >
                    <span>Sell</span>
                    <span className="text-zinc-400">+{sellValue}</span>
                  </button>
                  {/* Cancel */}
                  <button
                    type="button"
                    onClick={() => setActiveMenu(null)}
                    className="w-full px-3 py-1.5 text-left text-[10px] hover:bg-zinc-800 transition-colors text-zinc-500 hover:text-zinc-300 border-t border-zinc-800"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </BagSlot>
          );
        })}
      </div>

      {/* Help text */}
      <div className="text-[8px] text-zinc-600 mt-2 text-center">
        Drag to reorder/equip • Click for actions • Right-click to quick sell
      </div>

      {/* Synthesis preview when two compatible components are selected */}
      {synthesisMode && selectedComponent && selectedComponent.componentId && (
        <div className="mt-2 pt-2 border-t border-zinc-800">
          <div className="text-[9px] text-zinc-500 mb-1">Available combinations:</div>
          <div className="grid grid-cols-2 gap-1 max-h-20 overflow-y-auto">
            {components
              .filter(c => c.id !== selectedComponent.id && c.componentId)
              .map(c => {
                const recipe = c.componentId && selectedComponent.componentId
                  ? findRecipe(selectedComponent.componentId, c.componentId)
                  : null;
                if (!recipe) return null;
                return (
                  <div
                    key={c.id}
                    onClick={() => handleComponentClick(c)}
                    className="text-[9px] text-purple-400 bg-purple-500/10 rounded px-1 py-0.5 cursor-pointer hover:bg-purple-500/20"
                  >
                    + {c.icon} → {recipe.name}
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ComponentBag;
