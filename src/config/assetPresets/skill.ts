/**
 * Skill Asset Preset
 */

import type { AssetPreset } from '../assetCompanionConfig';

export const skillPreset: AssetPreset = {
  id: 'skill',
  name: 'Skill',
  description: 'Ability effect visualization',
  aspectRatio: '1:1',
  recommendedResolution: '512x512',
  requiresTransparency: true,
  promptTemplate: `Skill or ability effect for combat visualization.

COMPOSITION:
- Energy/effect radiating from center point
- Dynamic, explosive, or flowing motion implied
- Fills frame edge-to-edge for maximum impact
- Clear focal point at energy source/center

STRUCTURE:
- Core: bright, intense center (20-30% of frame)
- Mid-zone: main effect area with detail (30-50%)
- Outer: dissipating particles, wisps, fading energy (20-30%)

MOTION & ENERGY:
- Directional flow or radial burst pattern
- Speed lines, motion blur, or particle trails
- Asymmetric variation within overall symmetry
- Sense of power and dynamism

PARTICLE DISTRIBUTION:
- Larger particles/elements near center
- Smaller, scattered particles toward edges
- Density decreases with distance from center
- Some particles escaping frame edges for energy feel

GLOW & TRANSPARENCY:
- Bright core with soft glow falloff
- Transparent edges for compositing
- Additive blending appearance (light adds, doesn't occlude)`,
  outputHints: `Transparent background for additive blending. Core should be brightest element. Edges must fade cleanly to full transparency. Design for overlay compositing.`,
};
