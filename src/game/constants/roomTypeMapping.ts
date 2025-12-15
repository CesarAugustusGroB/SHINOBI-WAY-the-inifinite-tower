/**
 * =============================================================================
 * ROOM TYPE MAPPING - Shared utilities for room type colors and icons
 * =============================================================================
 *
 * This module provides consistent room type styling across components.
 * Previously, this logic was duplicated in Card.tsx, EnhancedCard.tsx,
 * and RoomCard.tsx.
 *
 * ## Usage:
 * ```tsx
 * import { getLegacyRoomColors, getBranchingRoomColors } from '../game/constants/roomTypeMapping';
 *
 * // For legacy Room types
 * const colors = getLegacyRoomColors(room.type);
 *
 * // For BranchingRoom types
 * const colors = getBranchingRoomColors(room.type, room.isCleared);
 * ```
 */

import { BranchingRoomType } from '../types';

// ============================================================================
// LEGACY ROOM TYPES (used by Card.tsx, EnhancedCard.tsx)
// ============================================================================

export type LegacyRoomType = 'COMBAT' | 'ELITE' | 'BOSS' | 'EVENT' | 'REST' | 'AMBUSH';

export interface LegacyRoomColors {
  border: string;
  borderHover: string;
  bg: string;
  bgClass: string;
  title: string;
  hideContent?: boolean;
}

/**
 * Get color scheme for legacy Room types.
 * Used by Card.tsx and EnhancedCard.tsx.
 */
export const getLegacyRoomColors = (type: LegacyRoomType): LegacyRoomColors => {
  switch (type) {
    case 'COMBAT':
      return {
        border: 'border-zinc-700',
        borderHover: 'hover:border-zinc-600',
        bg: '',
        bgClass: 'exploration-combat-card',
        title: 'text-gray-400',
        hideContent: true,
      };
    case 'BOSS':
      return {
        border: 'border-red-900',
        borderHover: 'hover:border-red-700',
        bg: 'bg-red-950/20',
        bgClass: '',
        title: 'text-red-500',
      };
    case 'AMBUSH':
      return {
        border: 'border-purple-900',
        borderHover: 'hover:border-purple-700',
        bg: 'bg-purple-950/20',
        bgClass: '',
        title: 'text-purple-500',
      };
    case 'ELITE':
      return {
        border: 'border-yellow-800',
        borderHover: 'hover:border-yellow-700',
        bg: '',
        bgClass: '',
        title: 'text-yellow-600',
      };
    case 'REST':
      return {
        border: 'border-green-900',
        borderHover: 'hover:border-green-700',
        bg: '',
        bgClass: '',
        title: 'text-green-600',
      };
    case 'EVENT':
      return {
        border: 'border-blue-900',
        borderHover: 'hover:border-blue-700',
        bg: '',
        bgClass: '',
        title: 'text-blue-500',
      };
    default:
      return {
        border: 'border-zinc-800',
        borderHover: 'hover:border-zinc-700',
        bg: 'bg-black/60',
        bgClass: '',
        title: 'text-gray-400',
      };
  }
};

/**
 * Get icon color class for legacy Room types.
 * Returns the Tailwind color class for the icon.
 */
export const getLegacyRoomIconColor = (type: LegacyRoomType): string => {
  switch (type) {
    case 'COMBAT':
      return 'text-orange-500';
    case 'BOSS':
      return 'text-red-500';
    case 'AMBUSH':
      return 'text-purple-500';
    case 'ELITE':
      return 'text-yellow-500';
    case 'REST':
      return 'text-green-500';
    case 'EVENT':
      return 'text-blue-500';
    default:
      return 'text-zinc-500';
  }
};

// ============================================================================
// BRANCHING ROOM TYPES (used by RoomCard.tsx)
// ============================================================================

export interface BranchingRoomColors {
  bg: string;
  border: string;
  text: string;
  iconBg: string;
}

const CLEARED_COLORS: BranchingRoomColors = {
  bg: 'bg-zinc-900/80',
  border: 'border-zinc-700',
  text: 'text-zinc-500',
  iconBg: 'bg-zinc-800',
};

const DEFAULT_COLORS: BranchingRoomColors = {
  bg: 'bg-zinc-900',
  border: 'border-zinc-700',
  text: 'text-zinc-400',
  iconBg: 'bg-zinc-800',
};

/**
 * Color schemes for each BranchingRoomType.
 * Each room type has a distinct gradient and accent color.
 */
const BRANCHING_ROOM_COLOR_MAP: Record<BranchingRoomType, BranchingRoomColors> = {
  [BranchingRoomType.START]: {
    bg: 'bg-gradient-to-b from-cyan-950 to-zinc-950',
    border: 'border-cyan-700',
    text: 'text-cyan-400',
    iconBg: 'bg-cyan-900/50',
  },
  [BranchingRoomType.VILLAGE]: {
    bg: 'bg-gradient-to-b from-emerald-950 to-zinc-950',
    border: 'border-emerald-700',
    text: 'text-emerald-400',
    iconBg: 'bg-emerald-900/50',
  },
  [BranchingRoomType.OUTPOST]: {
    bg: 'bg-gradient-to-b from-orange-950 to-zinc-950',
    border: 'border-orange-700',
    text: 'text-orange-400',
    iconBg: 'bg-orange-900/50',
  },
  [BranchingRoomType.SHRINE]: {
    bg: 'bg-gradient-to-b from-indigo-950 to-zinc-950',
    border: 'border-indigo-700',
    text: 'text-indigo-400',
    iconBg: 'bg-indigo-900/50',
  },
  [BranchingRoomType.CAMP]: {
    bg: 'bg-gradient-to-b from-amber-950 to-zinc-950',
    border: 'border-amber-700',
    text: 'text-amber-400',
    iconBg: 'bg-amber-900/50',
  },
  [BranchingRoomType.RUINS]: {
    bg: 'bg-gradient-to-b from-stone-900 to-zinc-950',
    border: 'border-stone-600',
    text: 'text-stone-400',
    iconBg: 'bg-stone-800/50',
  },
  [BranchingRoomType.BRIDGE]: {
    bg: 'bg-gradient-to-b from-slate-900 to-zinc-950',
    border: 'border-slate-600',
    text: 'text-slate-400',
    iconBg: 'bg-slate-800/50',
  },
  [BranchingRoomType.BOSS_GATE]: {
    bg: 'bg-gradient-to-b from-red-950 to-zinc-950',
    border: 'border-red-700',
    text: 'text-red-400',
    iconBg: 'bg-red-900/50',
  },
  [BranchingRoomType.FOREST]: {
    bg: 'bg-gradient-to-b from-green-950 to-zinc-950',
    border: 'border-green-700',
    text: 'text-green-400',
    iconBg: 'bg-green-900/50',
  },
  [BranchingRoomType.CAVE]: {
    bg: 'bg-gradient-to-b from-violet-950 to-zinc-950',
    border: 'border-violet-700',
    text: 'text-violet-400',
    iconBg: 'bg-violet-900/50',
  },
  [BranchingRoomType.BATTLEFIELD]: {
    bg: 'bg-gradient-to-b from-rose-950 to-zinc-950',
    border: 'border-rose-700',
    text: 'text-rose-400',
    iconBg: 'bg-rose-900/50',
  },
};

/**
 * Get color scheme for BranchingRoom types.
 * Used by RoomCard.tsx and LocationMap.tsx.
 *
 * @param type - The BranchingRoomType
 * @param isCleared - Whether the room has been cleared
 * @returns Color scheme for the room
 */
export const getBranchingRoomColors = (
  type: BranchingRoomType,
  isCleared: boolean = false
): BranchingRoomColors => {
  if (isCleared) {
    return CLEARED_COLORS;
  }
  return BRANCHING_ROOM_COLOR_MAP[type] || DEFAULT_COLORS;
};
