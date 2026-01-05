/**
 * NPC Portrait Asset Preset
 */

import type { AssetPreset } from '../assetCompanionConfig';

export const npcPortraitPreset: AssetPreset = {
  id: 'npc-portrait',
  name: 'NPC Portrait',
  description: 'Character portrait for dialogue and UI cards',
  aspectRatio: '3:4',
  recommendedResolution: '768x1024',
  requiresTransparency: true,
  promptTemplate: `Character portrait for game dialogue UI.

FRAMING:
- Bust shot from chest up, head positioned in upper 60% of frame
- Face centered horizontally, slight 3/4 angle (15-30 degrees) preferred
- Shoulders visible to establish body language
- Leave 10-15% headroom above hair/head

COMPOSITION:
- Sharp focus on face, especially eyes and expression
- Neutral or simple gradient background (easy to remove)
- Clean, crisp edges around character silhouette
- No overlapping elements or complex poses

LIGHTING:
- Soft frontal key light with subtle fill
- Gentle rim light to separate subject from background
- Avoid harsh shadows across face`,
  outputHints: `Hard crisp edges for clean cutout. No soft glow or bloom bleeding into background. Silhouette must be clearly defined.`,
};
