/**
 * Asset Presets for Asset Companion
 *
 * Asset presets define WHAT to create (compositional requirements).
 * Each preset specifies framing, aspect ratio, transparency needs.
 *
 * Usage:
 *   1. Create a new file (e.g., my-preset.ts) exporting an AssetPreset
 *   2. Import and add to ASSET_PRESETS array below
 *   3. Presets will automatically be available in Asset Companion
 */

import type { AssetPreset } from '../assetCompanionConfig';

// Import all presets
import { npcPortraitPreset } from './npc-portrait';
import { enemyPortraitPreset } from './enemy-portrait';
import { backgroundPreset } from './background';
import { buttonPreset } from './button';
import { uiElementPreset } from './ui-element';
import { iconPreset } from './icon';
import { itemPreset } from './item';
import { skillPreset } from './skill';

/**
 * All asset presets available in Asset Companion
 */
export const ASSET_PRESETS: AssetPreset[] = [
  npcPortraitPreset,
  enemyPortraitPreset,
  backgroundPreset,
  buttonPreset,
  uiElementPreset,
  iconPreset,
  itemPreset,
  skillPreset,
];

// Re-export individual presets for direct imports
export {
  npcPortraitPreset,
  enemyPortraitPreset,
  backgroundPreset,
  buttonPreset,
  uiElementPreset,
  iconPreset,
  itemPreset,
  skillPreset,
};
