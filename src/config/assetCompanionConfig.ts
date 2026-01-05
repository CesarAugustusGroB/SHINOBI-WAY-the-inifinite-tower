/**
 * Asset Companion Tool Configuration
 *
 * Configuration for AI image generation tool.
 * - Asset presets (WHAT to create) are loaded from ./assetPresets/
 * - Art styles (HOW it looks) are loaded from ./artStyles/
 * - Prompt pipeline: [User Prompt] + [Asset Preset] + [Art Style] + [Output Hints]
 */

import { CUSTOM_STYLES } from './artStyles';
import { ASSET_PRESETS } from './assetPresets';

// Re-export for consumers
export { ASSET_PRESETS };

// ============================================================================
// TYPES
// ============================================================================

/** Supported aspect ratios for generated images */
export type AspectRatio = '1:1' | '16:9' | '9:16' | '4:3' | '3:4' | '2:3' | '3:2' | '3:1';

/** Art style categories (no pixel art) */
export type ArtStyleCategory = 'anime' | 'stylized' | 'icon' | 'portrait' | 'ui';

/**
 * Asset Preset - Defines WHAT to create (compositional, format-focused)
 * Style-agnostic: only describes framing, aspect ratio, and output requirements
 */
export interface AssetPreset {
  id: string;
  name: string;
  description: string;
  /** Aspect ratio for the generated image */
  aspectRatio: AspectRatio;
  /** Recommended minimum resolution (e.g., "512x512", "1024x576") */
  recommendedResolution: string;
  /** Whether the asset typically needs transparency */
  requiresTransparency: boolean;
  /** Compositional prompt - describes framing, layout, NOT visual style */
  promptTemplate: string;
  /** Optional output hints appended at the end */
  outputHints?: string;
}

/**
 * Art Style - Defines HOW it looks (purely aesthetic)
 * Describes visual treatment: colors, rendering technique, mood
 */
export interface ArtStyle {
  id: string;
  name: string;
  description: string;
  category: ArtStyleCategory;
  /** Visual style prompt - colors, rendering technique, mood */
  promptTemplate: string;
}

export type AssetCategoryId = 'enemies' | 'characters' | 'items' | 'ui' | 'backgrounds' | 'icons';

export interface AssetCategory {
  id: AssetCategoryId;
  name: string;
  folder: string;
  icon: string;
}

export type TransformationType =
  | 'generate'           // Text-to-image (existing)
  | 'styleTransfer'      // Apply style to uploaded image
  | 'backgroundRemoval'; // Remove background via AI prompt

export type ImageSize = '1K' | '2K' | '4K';
export type ExportFormat = 'png' | 'webp' | 'jpg' | 'base64';

// ============================================================================
// ART STYLES (HOW it looks - purely aesthetic)
// ============================================================================

/** Art styles only from custom styles in artStyles/ */
export const ART_STYLES: ArtStyle[] = CUSTOM_STYLES;

// ============================================================================
// ASSET CATEGORIES
// ============================================================================

export const ASSET_CATEGORIES: AssetCategory[] = [
  { id: 'enemies', name: 'Enemies & Bosses', folder: 'enemies', icon: 'Skull' },
  { id: 'characters', name: 'Characters & NPCs', folder: 'characters', icon: 'User' },
  { id: 'items', name: 'Items & Equipment', folder: 'items', icon: 'Package' },
  { id: 'ui', name: 'UI Elements', folder: 'ui', icon: 'Layout' },
  { id: 'backgrounds', name: 'Backgrounds', folder: 'backgrounds', icon: 'Image' },
  { id: 'icons', name: 'Icons', folder: 'icons', icon: 'Circle' },
];

// ============================================================================
// PROMPT TEMPLATES
// ============================================================================

export const TRANSFORMATION_PROMPTS = {
  backgroundRemoval: `Remove the background completely from this image.
Make the background solid white or transparent. Keep only the main subject
with clean, precise edges. Preserve all details of the main subject.`,

  styleTransfer: (styleName: string, stylePrompt: string, customInstructions?: string) => `
Transform this image into ${styleName} style.
${stylePrompt}
${customInstructions ? `Additional instructions: ${customInstructions}` : ''}
Preserve the original subject's key features, pose, and composition.
`,
};

// ============================================================================
// DEFAULT VALUES
// ============================================================================

export const DEFAULT_CONFIG = {
  imageSize: '2K' as ImageSize,
  exportFormat: 'png' as ExportFormat,
  category: 'enemies' as AssetCategoryId,
  maxHistoryItems: 10,
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get an art style by ID
 */
export function getArtStyle(id: string): ArtStyle | undefined {
  return ART_STYLES.find(style => style.id === id);
}

/**
 * Get all art styles for a specific category
 */
export function getArtStylesByCategory(category: ArtStyleCategory): ArtStyle[] {
  return ART_STYLES.filter(style => style.category === category);
}

/**
 * Get an asset preset by ID
 */
export function getAssetPreset(id: string): AssetPreset | undefined {
  return ASSET_PRESETS.find(preset => preset.id === id);
}

/**
 * Generate a suggested filename based on category and style
 */
export function generateFilename(
  category: AssetCategoryId,
  styleId: string | null,
  customName?: string
): string {
  const timestamp = Date.now();
  const styleSuffix = styleId ? `_${styleId}` : '';
  const name = customName || `${category}${styleSuffix}_${timestamp}`;
  return name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_-]/g, '');
}

/**
 * Get asset category by ID
 */
export function getAssetCategory(id: AssetCategoryId): AssetCategory | undefined {
  return ASSET_CATEGORIES.find(cat => cat.id === id);
}
