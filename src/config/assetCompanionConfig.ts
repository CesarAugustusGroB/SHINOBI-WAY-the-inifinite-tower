/**
 * Asset Companion Tool Configuration
 *
 * Style presets, asset categories, and prompt templates for AI image generation.
 */

import { CUSTOM_STYLES } from './artStyles';

// ============================================================================
// TYPES
// ============================================================================

export type StyleCategory = 'anime' | 'pixel' | 'stylized' | 'icon' | 'portrait' | 'ui';

export interface StylePreset {
  id: string;
  name: string;
  description: string;
  category: StyleCategory;
  promptTemplate: string;
  /** Optional size override for pixel art styles */
  sizeOverride?: { width: number; height: number };
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
// STYLE PRESETS
// ============================================================================

const BUILT_IN_STYLES: StylePreset[] = [
  // Anime Styles
  {
    id: 'naruto-anime',
    name: 'Naruto Anime',
    description: 'Dark fantasy, gritty anime style matching game aesthetics',
    category: 'anime',
    promptTemplate: `A dark fantasy, gritty anime style. High contrast, detailed,
atmospheric lighting. Naruto-inspired aesthetic with dramatic shadows and
intense expressions. Professional anime quality.`
  },
  {
    id: 'chibi-sd',
    name: 'Chibi/SD',
    description: 'Super-deformed cute style with big heads',
    category: 'stylized',
    promptTemplate: `Chibi/super-deformed style with large head, small body,
cute proportions. Expressive oversized eyes, simplified details,
kawaii aesthetic. Clean lines and vibrant colors.`
  },
  {
    id: 'cel-shaded',
    name: 'Cel-Shaded',
    description: '3D cel-shaded anime render look',
    category: 'stylized',
    promptTemplate: `Cel-shaded 3D render style. Bold black outlines,
flat color regions with sharp shadow cutoffs, anime-influenced shading.
Similar to Guilty Gear or Dragon Ball FighterZ visuals.`
  },

  // Pixel Art Styles
  {
    id: 'pixel-16',
    name: 'Pixel 16x16',
    description: 'Retro 16x16 pixel art icons',
    category: 'pixel',
    promptTemplate: `16x16 pixel art style with extremely limited color palette (max 8 colors).
Clean pixel edges, absolutely no anti-aliasing, retro 8-bit game aesthetic.
Each pixel must be clearly defined. NES/Game Boy style.`,
    sizeOverride: { width: 16, height: 16 }
  },
  {
    id: 'pixel-32',
    name: 'Pixel 32x32',
    description: 'Detailed 32x32 pixel art sprites',
    category: 'pixel',
    promptTemplate: `32x32 pixel art with moderate detail and limited palette (max 16 colors).
Clean pixels, SNES/GBA game sprite aesthetic. No smoothing or gradients.
Sharp pixel edges, suitable for game icons and small sprites.`,
    sizeOverride: { width: 32, height: 32 }
  },
  {
    id: 'pixel-64',
    name: 'Pixel 64x64',
    description: 'High-detail 64x64 pixel art',
    category: 'pixel',
    promptTemplate: `64x64 pixel art with high detail. Clean pixel aesthetic,
expanded palette (max 32 colors). Suitable for detailed game icons,
character portraits, and item sprites. Modern indie pixel art style.`,
    sizeOverride: { width: 64, height: 64 }
  },

  // Icon & UI Styles
  {
    id: 'icon-flat',
    name: 'Flat Icon',
    description: 'Minimal flat design game icons',
    category: 'icon',
    promptTemplate: `Flat design icon style. Minimal, clean geometric lines,
very limited color palette (2-4 colors), no gradients, no shadows,
vector-like appearance. Suitable for mobile game UI icons.`
  },
  {
    id: 'ui-element',
    name: 'UI Element',
    description: 'Dark fantasy game UI components',
    category: 'ui',
    promptTemplate: `Game UI element style. Dark fantasy aesthetic with subtle depth,
metallic or stone textures, subtle glow effects. Consistent with
ninja/shinobi theme. Clean edges for easy integration.`
  },

  // Character Styles
  {
    id: 'portrait-frame',
    name: 'Portrait',
    description: 'Character portraits for game UI',
    category: 'portrait',
    promptTemplate: `Character portrait suitable for game UI. Close-up face or bust shot,
dramatic lighting from the side, dark or neutral background for easy cutout.
Anime style with detailed eyes and expression. High quality character art.`
  },
];

/** All style presets: built-in + custom styles from artStyles/ */
export const STYLE_PRESETS: StylePreset[] = [...BUILT_IN_STYLES, ...CUSTOM_STYLES];

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
 * Get a style preset by ID
 */
export function getStylePreset(id: string): StylePreset | undefined {
  return STYLE_PRESETS.find(preset => preset.id === id);
}

/**
 * Get all presets for a specific category
 */
export function getPresetsByCategory(category: StyleCategory): StylePreset[] {
  return STYLE_PRESETS.filter(preset => preset.category === category);
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
