/**
 * Button Asset Preset
 */

import type { AssetPreset } from '../assetCompanionConfig';

export const buttonPreset: AssetPreset = {
  id: 'button',
  name: 'Button',
  description: 'Interactive button element',
  aspectRatio: '3:1',
  recommendedResolution: '384x128',
  requiresTransparency: true,
  promptTemplate: `Interactive button element for game UI.

SHAPE:
- Horizontal rectangle with rounded corners (radius ~8-12% of height)
- Clear defined border/edge treatment
- Consistent thickness on all sides

STRUCTURE:
- Outer border: 2-4px defined edge
- Inner fill: gradient or texture suggesting depth
- Center safe zone: middle 60% reserved for text (keep simple)

DEPTH & LIGHTING:
- Subtle 3D appearance through shading
- Light source from top-left implied
- Gentle inner shadow at top edge
- Soft highlight along bottom or lower edge
- Beveled or embossed appearance acceptable

STATES (implied through shading):
- Design should suggest "pressable" affordance
- Surface should read as raised/clickable`,
  outputHints: `Crisp edges suitable for 9-slice scaling. Corners must be cleanly rounded. Interior must have even, text-friendly zone. Transparent background required.`,
};
