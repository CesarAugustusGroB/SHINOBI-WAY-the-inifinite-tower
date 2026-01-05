/**
 * Background Asset Preset
 */

import type { AssetPreset } from '../assetCompanionConfig';

export const backgroundPreset: AssetPreset = {
  id: 'background',
  name: 'Background',
  description: 'Environment backdrop',
  aspectRatio: '16:9',
  recommendedResolution: '1920x1080',
  requiresTransparency: false,
  promptTemplate: `Environment backdrop for game scenes.

DEPTH STRUCTURE:
- Clear three-layer depth: foreground (0-20%), midground (20-60%), background (60-100%)
- Foreground: darker framing elements, silhouettes, or environmental details
- Midground: main area of interest, most detail and color
- Background: atmospheric, less saturated, establishing scale

COMPOSITION:
- Strong focal point in center or rule-of-thirds position
- Leading lines guiding eye toward focal area
- NO characters, figures, or creatures
- Asymmetric balance preferred over perfect symmetry

SAFE ZONES:
- Left 15% and right 15%: keep relatively simple for UI overlay
- Bottom 20%: avoid important details (may be covered by HUD)
- Top 10%: can have detail but leave breathing room

ATMOSPHERE:
- Atmospheric perspective: distant elements less saturated, lighter
- Sense of depth through value gradation
- Environmental storytelling through details`,
  outputHints: `Maintain visual interest while leaving UI-safe margins. Ensure focal point is in center-right area. Avoid text or symbols that conflict with UI.`,
};
