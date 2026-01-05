/**
 * Seinen Sublime Atmosferico Art Style
 *
 * A hybrid visual style fusing Romantic painting sublime tradition with
 * seinen anime aesthetics and dark fantasy decay. Cosmic horror rendered
 * with surgical precision.
 *
 * Core Principle: "Describe the infinite with exact strokes"
 *
 * @see docs/seinen-sublime-visual-specs.md for complete specifications
 */

import type { ArtStyle } from '../assetCompanionConfig';

export const seinenSublimeAtmosferico: ArtStyle = {
  id: 'seinen-sublime-atmosferico',
  name: 'Seinen Sublime Atmosferico',
  description:
    'Dark atmospheric anime with volumetric fog, precise decay, and cosmic scale. Hybrid cel-shading foreground with painterly backgrounds.',
  category: 'anime',
  promptTemplate: `Seinen atmospheric dark fantasy illustration with cinematic post-processing.
High quality 2D anime rendering with fine crisp lineart on foreground elements transitioning to soft digital atmospheric painting in backgrounds.

COLOR PALETTE (strictly enforced):
- Void Black #050608 for deepest shadows and absolute absence
- Deep Black #0a0c0f for primary backgrounds
- Abyss Blue #1a2633 for deep atmosphere and memory
- Metal Blue #2d3d4a for industrial cold and structures
- Fog Gray #8a9199 for mist and transitions (15-30% opacity layers)
- Fog Light #b8bcc2 for light fog and soft details
- Bone White #e8e4dc for sharp details and revelation (rare, focal)
- Rust Orange #a65d3f as PRIMARY ACCENT for focal points and wounds
Color distribution: 45-55% blacks, 20-30% blues, 15-20% grays, 3-5% bone, 2-5% rust.

DEPTH SYSTEM (three layers):
- Foreground: 100% sharp focus, crisp 1.5-2.5px lineart, full saturation, cel-shaded
- Midground: 60-80% focus, soft 0.75-1.5px lines at 60-80% opacity, fog overlay 15-30%
- Background: 20-40% blur, minimal/no lineart, near-monochrome, fog 40-70%

ATMOSPHERE:
- Dense volumetric fog obscuring horizon (NEVER show clear horizon)
- Minimum 3 fog layers at different depths and speeds
- God rays filtering through mist at 3-8% opacity
- Rust/dust particles floating slowly upward
- Heavy vignette 30-50% at edges using void black
- Subtle film grain 3-8%

COMPOSITION:
- Scale juxtaposition: massive structures vs tiny human figures
- Figure as only vertical element in horizontal void
- Industrial ruins and architectural decay as primary environment
- Decay patterns follow logic: rust drips with gravity, cracks show stress direction

RENDERING:
- Hybrid approach: cel-shaded figures (2-3 value steps) against painterly atmosphere
- High ambient occlusion in recesses using void black
- Rim/back lighting to separate figures from background
- Materials: rusted metal, crumbling concrete, weathered fabric, pale corrupted flesh

MOOD: Melancholic, solitary, post-apocalyptic atmosphere. Oppressive vastness, cosmic dread.
References: Made in Abyss depth, Blame! architecture, Berserk decay, Blade Runner 2049 atmosphere.`,
};
