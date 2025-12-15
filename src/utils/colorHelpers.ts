import { Rarity } from '../game/types';

/**
 * Rarity color utilities - composable functions for different styling needs
 */

// Text color only (for labels, names)
export const getRarityTextColor = (rarity: Rarity): string => {
  switch (rarity) {
    case Rarity.LEGENDARY: return 'text-orange-400';
    case Rarity.EPIC: return 'text-purple-400';
    case Rarity.RARE: return 'text-blue-400';
    case Rarity.CURSED: return 'text-red-600';
    case Rarity.BROKEN: return 'text-stone-500';
    default: return 'text-zinc-400';
  }
};

// Border color only
export const getRarityBorderColor = (rarity: Rarity): string => {
  switch (rarity) {
    case Rarity.LEGENDARY: return 'border-orange-500';
    case Rarity.EPIC: return 'border-purple-500';
    case Rarity.RARE: return 'border-blue-500';
    case Rarity.CURSED: return 'border-red-600';
    case Rarity.BROKEN: return 'border-stone-600';
    default: return 'border-zinc-600';
  }
};

// Background color (with transparency)
export const getRarityBgColor = (rarity: Rarity): string => {
  switch (rarity) {
    case Rarity.LEGENDARY: return 'bg-orange-500/20';
    case Rarity.EPIC: return 'bg-purple-500/20';
    case Rarity.RARE: return 'bg-blue-500/20';
    case Rarity.CURSED: return 'bg-red-600/20';
    case Rarity.BROKEN: return 'bg-stone-500/20';
    default: return 'bg-zinc-500/20';
  }
};

// Combined: text + border (for Bag slots)
export const getRarityTextBorderColor = (rarity: Rarity): string => {
  return `${getRarityTextColor(rarity)} ${getRarityBorderColor(rarity)}`;
};

// Combined: border + background (for drag previews)
export const getRarityDragPreviewColor = (rarity: Rarity): string => {
  return `${getRarityBorderColor(rarity)} ${getRarityBgColor(rarity)}`;
};

// Text color with special effects (for equipment panel)
export const getRarityTextColorWithEffects = (rarity: Rarity): string => {
  switch (rarity) {
    case Rarity.LEGENDARY: return 'text-orange-400 drop-shadow-md';
    case Rarity.EPIC: return 'text-purple-400';
    case Rarity.RARE: return 'text-blue-400';
    case Rarity.CURSED: return 'text-red-600 animate-pulse';
    case Rarity.BROKEN: return 'text-stone-500';
    default: return 'text-zinc-400';
  }
};
