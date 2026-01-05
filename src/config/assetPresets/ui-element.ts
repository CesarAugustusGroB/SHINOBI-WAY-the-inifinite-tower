/**
 * UI Element Asset Preset
 */

import type { AssetPreset } from '../assetCompanionConfig';

export const uiElementPreset: AssetPreset = {
  id: 'ui-element',
  name: 'UI Element',
  description: 'Panel, frame, or container',
  aspectRatio: '1:1',
  recommendedResolution: '512x512',
  requiresTransparency: true,
  promptTemplate: `UI panel, frame, or container element for game interface.

STRUCTURE:
- Clean geometric shape (rectangle, rounded rectangle, or ornate frame)
- Defined border treatment: solid, double-line, or decorative
- Clear interior space for content (60-70% of total area)
- Consistent corner treatment (all corners match)

BORDER:
- Outer edge: 3-6px defined border
- Optional: decorative corner accents or ornaments
- Inner edge: subtle line or shadow defining content area

SURFACE:
- Semi-transparent or frosted glass effect acceptable
- Subtle texture or grain for visual interest
- Avoid busy patterns that compete with content
- Inner shadow suggesting depth/recession

SYMMETRY:
- Bilateral symmetry (left-right mirror) strongly preferred
- Top-bottom can vary (header area vs content area)
- Corner decorations should match all 4 corners`,
  outputHints: `Transparent background required. Must tile or scale cleanly. Interior must remain uncluttered for content overlay. Crisp, anti-aliased edges.`,
};
