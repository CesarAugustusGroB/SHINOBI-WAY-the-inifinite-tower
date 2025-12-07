import React, { useState } from 'react';
import { Item, MAX_BAG_SLOTS, Rarity } from '../game/types';
import { getRecipesUsingComponent, findRecipe } from '../game/constants/synthesis';
import { formatStatName } from '../game/utils/tooltipFormatters';
import Tooltip from './Tooltip';

interface ComponentBagProps {
  components: Item[];
  onSelectComponent: (item: Item) => void;
  onSellComponent: (item: Item) => void;
  selectedComponent: Item | null;
  onSynthesize?: (componentA: Item, componentB: Item) => void;
}

const ComponentBag: React.FC<ComponentBagProps> = ({
  components,
  onSelectComponent,
  onSellComponent,
  selectedComponent,
  onSynthesize,
}) => {
  const [synthesisMode, setSynthesisMode] = useState(false);

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
          return;
        }
      }
    }
    onSelectComponent(item);
    setSynthesisMode(true);
  };

  const handleSell = (e: React.MouseEvent, item: Item) => {
    e.stopPropagation();
    onSellComponent(item);
    setSynthesisMode(false);
  };

  const cancelSynthesis = () => {
    setSynthesisMode(false);
    onSelectComponent(null as any);
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
          const canCombine = item && canCombineWithSelected(item);

          return (
            <Tooltip
              key={index}
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
                      Sell: {Math.floor(item.value * 0.6)} Ryō (60%)
                    </div>
                  </div>
                ) : (
                  <div className="text-[10px] text-zinc-500">Empty slot</div>
                )
              }
            >
              <div
                onClick={() => item && handleComponentClick(item)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  if (item) handleSell(e, item);
                }}
                className={`
                  aspect-square border rounded p-1 cursor-pointer transition-all
                  flex items-center justify-center text-lg
                  ${item
                    ? `${isSelected
                        ? 'border-amber-500 bg-amber-500/20'
                        : canCombine
                          ? 'border-green-500 bg-green-500/10 animate-pulse'
                          : 'border-zinc-700 bg-zinc-800/50 hover:border-zinc-500'
                      }`
                    : 'border-zinc-800 bg-zinc-900/30'
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
          );
        })}
      </div>

      {/* Help text */}
      <div className="text-[8px] text-zinc-600 mt-2 text-center">
        Click to select • Right-click to sell
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
