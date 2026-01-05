/**
 * Enemy Portrait Asset Preset
 */

import type { AssetPreset } from '../assetCompanionConfig';

export const enemyPortraitPreset: AssetPreset = {
  id: 'enemy-portrait',
  name: 'Enemy Portrait',
  description: 'Antagonist portrait for combat UI',
  aspectRatio: '1:1',
  recommendedResolution: '1024x1024',
  requiresTransparency: true,
  promptTemplate: `Antagonist portrait for combat encounter UI.

FRAMING:
- Head and upper torso, filling 70-80% of frame
- Dynamic angle: slight low angle (looking up) or dramatic tilt
- Direct eye contact or menacing gaze toward viewer
- Can crop at shoulders or mid-chest

COMPOSITION:
- Subject dominates frame with imposing presence
- Dark, atmospheric background with vignette toward edges
- Strong silhouette shape - instantly recognizable
- Allow for signature features (scars, masks, weapons) to be visible

LIGHTING:
- Dramatic side or under-lighting for menace
- Strong contrast between lit and shadow areas
- Rim light or back light to create separation
- Eye catch lights for intensity`,
  outputHints: `High contrast for combat UI readability. Dark background for easy removal. Strong value separation between subject and background.`,
};
