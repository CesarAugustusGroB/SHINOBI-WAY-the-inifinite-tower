/**
 * Item Asset Preset
 */

import type { AssetPreset } from '../assetCompanionConfig';

export const itemPreset: AssetPreset = {
  id: 'item',
  name: 'Item',
  description: 'Inventory object',
  aspectRatio: '1:1',
  recommendedResolution: '512x512',
  requiresTransparency: true,
  promptTemplate: `Inventory item or equipment for game UI.

CAMERA & FRAMING:
- Three-quarter view (30-45 degree angle) showing depth
- Object fills 70-85% of frame
- Complete object visible, no cropping
- Slight floating appearance (no ground plane)

COMPOSITION:
- Single object in isolation
- Centered with slight offset toward top (implying resting position)
- Rotation to show most recognizable/interesting angle
- Important features (blade edge, gem, clasp) clearly visible

LIGHTING:
- Primary light from top-left (10-11 o'clock position)
- Soft fill from opposite side
- Subtle ground reflection or ambient occlusion below
- Highlights on reflective/metallic surfaces
- Clear material distinction (metal vs cloth vs leather vs gem)

MATERIAL RENDERING:
- Show material properties: shiny, matte, rough, smooth
- Wear and use appropriate to item type
- Color and texture clearly defined`,
  outputHints: `Transparent background required. Consistent top-left lighting. Drop shadow optional but subtle. Object must read clearly at 64x64 thumbnail size.`,
};
