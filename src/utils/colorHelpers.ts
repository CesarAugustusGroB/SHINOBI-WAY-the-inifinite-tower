import { Rarity, LocationType } from '../game/types';

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

// ============================================================================
// DANGER LEVEL COLORS
// Thresholds: 1-2 green, 3-4 yellow, 5 orange, 6-7 red
// ============================================================================

/** Text color for danger level display */
export const getDangerTextColor = (danger: number): string => {
  if (danger <= 2) return 'text-emerald-400';
  if (danger <= 4) return 'text-yellow-400';
  if (danger === 5) return 'text-orange-400';
  return 'text-red-400';
};

/** Background color for danger level panels */
export const getDangerBgColor = (danger: number): string => {
  if (danger <= 2) return 'bg-emerald-900/30';
  if (danger <= 4) return 'bg-yellow-900/30';
  if (danger === 5) return 'bg-orange-900/30';
  return 'bg-red-900/30';
};

/** Solid background color for danger level bars/dots */
export const getDangerDotColor = (danger: number): string => {
  if (danger <= 2) return 'bg-emerald-500';
  if (danger <= 4) return 'bg-yellow-500';
  if (danger === 5) return 'bg-orange-500';
  return 'bg-red-500';
};

/** Get color for a segment in a danger level bar */
export const getDangerSegmentColor = (segmentLevel: number, currentLevel: number | null): string => {
  if (currentLevel === null || segmentLevel > currentLevel) return 'bg-zinc-800';
  return getDangerDotColor(segmentLevel);
};

// ============================================================================
// LOCATION TYPE COLORS
// ============================================================================

/** Text color for location type labels */
export const getLocationTypeColor = (type: LocationType): string => {
  switch (type) {
    case LocationType.SETTLEMENT: return 'text-blue-400';
    case LocationType.WILDERNESS: return 'text-green-400';
    case LocationType.STRONGHOLD: return 'text-red-400';
    case LocationType.LANDMARK: return 'text-purple-400';
    case LocationType.SECRET: return 'text-yellow-400';
    case LocationType.BOSS: return 'text-orange-500';
    default: return 'text-zinc-400';
  }
};

/** Get label for location type */
export const getLocationTypeLabel = (type: LocationType): string => {
  switch (type) {
    case LocationType.SETTLEMENT: return 'Settlement';
    case LocationType.WILDERNESS: return 'Wilderness';
    case LocationType.STRONGHOLD: return 'Stronghold';
    case LocationType.LANDMARK: return 'Landmark';
    case LocationType.SECRET: return 'Secret';
    case LocationType.BOSS: return 'Boss';
    default: return 'Unknown';
  }
};
