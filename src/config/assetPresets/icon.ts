/**
 * Icon Asset Preset
 */

import type { AssetPreset } from '../assetCompanionConfig';

export const iconPreset: AssetPreset = {
  id: 'icon',
  name: 'Icon',
  description: 'Menu/indicator icon',
  aspectRatio: '1:1',
  recommendedResolution: '256x256',
  requiresTransparency: true,
  promptTemplate: `Symbolic icon for game menus and indicators.

COMPOSITION:
- Single symbol or object, perfectly centered
- Subject fills 60-75% of frame (leave padding for visual breathing room)
- Simple, instantly recognizable silhouette
- Readable at small sizes (design for 32x32 minimum)

DESIGN PRINCIPLES:
- Maximum 2-3 visual elements combined
- Strong figure-ground contrast
- Clean, geometric simplification over realistic detail
- Consistent stroke/line weight throughout
- Avoid fine details that disappear at small scale

SHAPE LANGUAGE:
- Bold, confident shapes
- Avoid thin lines or delicate details
- Rounded corners for friendly, sharp for aggressive/technical
- Negative space is as important as positive space

SILHOUETTE TEST:
- Icon should be recognizable as solid black silhouette
- Shape alone must communicate meaning`,
  outputHints: `Must remain legible at 32x32 and 16x16 pixels. Transparent background. High contrast between icon and background. No gradients that muddy at small scale.`,
};
