/**
 * Custom Art Styles for Asset Companion
 *
 * Add new art style files to this directory and export them here.
 * Each style should follow the StylePreset interface from assetCompanionConfig.ts
 *
 * Usage:
 *   1. Create a new file (e.g., my-style.ts) exporting a StylePreset
 *   2. Import and add to CUSTOM_STYLES array below
 *   3. Styles will automatically be available in Asset Companion
 */

import type { StylePreset } from '../assetCompanionConfig';

// Import custom styles here
// import { myCustomStyle } from './my-style';

/**
 * Custom art styles created via the art-style-creator skill
 * These are merged with STYLE_PRESETS in assetCompanionConfig.ts
 */
export const CUSTOM_STYLES: StylePreset[] = [
  // Add your custom styles here, e.g.:
  // myCustomStyle,
];

/**
 * Example of a complete custom style definition:
 *
 * export const exampleStyle: StylePreset = {
 *   id: 'custom-dark-fantasy',
 *   name: 'Dark Fantasy',
 *   description: 'Gritty medieval fantasy with muted colors',
 *   category: 'anime',
 *   promptTemplate: `Dark fantasy style with muted earth tones and deep shadows.
 * Medieval aesthetic with weathered textures and dramatic lighting.
 * Detailed linework with heavy outlines. Atmospheric fog and particle effects.
 * Inspired by Dark Souls and Berserk manga aesthetics.`,
 * };
 */
