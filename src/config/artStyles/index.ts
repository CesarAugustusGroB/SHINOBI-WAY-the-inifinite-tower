/**
 * Custom Art Styles for Asset Companion
 *
 * Add new art style files to this directory and export them here.
 * Each style should follow the ArtStyle interface from assetCompanionConfig.ts
 *
 * Art styles define HOW the image looks (visual treatment) - separate from
 * asset presets which define WHAT to create (composition, format).
 *
 * Usage:
 *   1. Create a new file (e.g., my-style.ts) exporting an ArtStyle
 *   2. Import and add to CUSTOM_STYLES array below
 *   3. Styles will automatically be available in Asset Companion
 */

import type { ArtStyle } from '../assetCompanionConfig';

// Import custom styles here
import { seinenSublimeAtmosferico } from './seinen-sublime-atmosferico';

/**
 * Custom art styles created via the art-style-creator skill
 * These become the only available art styles in Asset Companion
 */
export const CUSTOM_STYLES: ArtStyle[] = [
  seinenSublimeAtmosferico,
];

/**
 * Example of a complete custom art style definition:
 *
 * export const exampleStyle: ArtStyle = {
 *   id: 'custom-dark-fantasy',
 *   name: 'Dark Fantasy',
 *   description: 'Gritty medieval fantasy with muted colors',
 *   category: 'anime',
 *   promptTemplate: `Dark fantasy style with muted earth tones and deep shadows.
 * Medieval aesthetic with weathered textures and dramatic lighting.
 * Detailed linework with heavy outlines. Atmospheric fog and particle effects.`,
 * };
 */
