# Feature Plan: AI Asset Companion Tool

> Converting the AI Image Generator Test into a full companion tool for building game assets

## Requirements Summary

- **Location:** Separate standalone scene from main menu
- **Editing:** AI-only transformations (no manual canvas editing)
- **Art Styles:** Both presets + custom prompts
- **Transparency:** AI background removal using Gemini
- **Export:** Multiple formats (PNG, WebP, JPG, base64)
- **Integration:** Direct save to game asset folders
- **Categories:** All game assets (characters, items, UI, backgrounds, icons)

---

## UI Layout

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        ASSET COMPANION TOOL                    [Back to Menu]│
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────┐    ┌─────────────────────────────────────────────┐ │
│  │   INPUT SOURCE      │    │              PREVIEW                        │ │
│  │ ○ Generate New      │    │  ┌─────────────┐    ┌─────────────┐        │ │
│  │ ○ Upload Image      │    │  │   SOURCE    │ → │   OUTPUT    │        │ │
│  │ ○ Paste Clipboard   │    │  │  (drag &    │    │ (generated) │        │ │
│  │ [📁 Upload] [📋 Paste]│    │  │   drop)     │    │             │        │ │
│  └─────────────────────┘    │  └─────────────┘    └─────────────┘        │ │
│                             └─────────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │   TRANSFORMATION                                                        ││
│  │ ○ Generate from Prompt   ○ Style Transfer   ○ Remove Background        ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │   STYLE PRESETS                                                         ││
│  │  [Naruto Anime] [Pixel 16] [Pixel 32] [Chibi] [Cel-Shade] [Icon Flat]  ││
│  │  [Portrait] [UI Element] [+ Custom Prompt]                              ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │   PROMPT: [                                                           ] ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│  ┌───────────────────┐ ┌───────────────────┐ ┌───────────────────────────┐ │
│  │  SIZE: ○1K ●2K ○4K│ │ CATEGORY: ▼Enemies│ │ FORMAT: PNG ▼  Name: [  ]│ │
│  └───────────────────┘ └───────────────────┘ └───────────────────────────┘ │
│  [  🎨 GENERATE  ]              [  💾 DOWNLOAD  ]       [ 📋 COPY BASE64 ] │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │   RECENT: [🖼️] [🖼️] [🖼️] [🖼️] [🖼️]  (click to re-use)                  ││
│  └─────────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/scenes/AssetCompanion/AssetCompanion.tsx` | Main scene orchestrator |
| `src/scenes/AssetCompanion/AssetCompanion.css` | Scene styling |
| `src/components/assetCompanion/ImageInputPanel.tsx` | Upload, drag-drop, paste |
| `src/components/assetCompanion/StylePresetSelector.tsx` | Style preset grid |
| `src/components/assetCompanion/ExportPanel.tsx` | Export format & download |
| `src/components/assetCompanion/ImagePreview.tsx` | Before/after display |
| `src/hooks/useAssetGeneration.ts` | Enhanced generation hook |
| `src/config/assetCompanionConfig.ts` | Presets & categories |

## Files to Modify

| File | Changes |
|------|---------|
| `src/game/types.ts` | Add `ASSET_COMPANION` to GameState enum |
| `src/config/featureFlags.ts` | Add `ENABLE_ASSET_COMPANION` flag |
| `src/scenes/MainMenu.tsx` | Add Asset Companion button (dev mode) |
| `src/App.tsx` | Add routing for ASSET_COMPANION state |

## Files to Delete

| File | Reason |
|------|--------|
| `src/scenes/ImageTest.tsx` | Replaced by AssetCompanion |

---

## Implementation Phases

### Phase 1: Foundation

1. Add `ASSET_COMPANION` to GameState enum in `types.ts`
2. Add `ENABLE_ASSET_COMPANION` feature flag
3. Create `assetCompanionConfig.ts` with style presets:
   - Naruto Anime Style
   - Pixel Art (16x16, 32x32, 64x64)
   - Chibi/SD Style
   - Cel-Shaded
   - Icon Flat Style
   - Portrait Frame
   - UI Element Style
4. Create empty `AssetCompanion.tsx` scaffold
5. Wire routing in `App.tsx` and button in `MainMenu.tsx`

### Phase 2: Generation Hook

1. Create `useAssetGeneration.ts` hook with methods:
   - `generateFromPrompt(prompt, options)` - Text-to-image
   - `transformWithStyle(sourceImage, stylePreset)` - Style transfer
   - `removeBackground(sourceImage)` - AI background removal
2. Support image-to-image via Gemini contents array:
   ```typescript
   contents: { parts: [{ text: prompt }, { inlineData: { data, mimeType } }] }
   ```

### Phase 3: Input System

1. Create `ImageInputPanel.tsx` with:
   - File input (`<input type="file" accept="image/*">`)
   - Drag-and-drop zone with `onDragOver`/`onDrop`
   - Clipboard paste via `navigator.clipboard.read()`
2. Convert uploaded images to base64 for API

### Phase 4: Style & Transformation UI

1. Create `StylePresetSelector.tsx` - clickable preset cards
2. Add transformation mode radio buttons:
   - Generate from Prompt
   - Style Transfer
   - Remove Background
3. Wire style selection to prompt templates

### Phase 5: Export System

1. Create `ExportPanel.tsx` with:
   - Format selector (PNG, WebP, JPG, base64)
   - Auto-generated filename based on category
   - Download via `<a download>` element
   - Copy base64 to clipboard
2. Asset categories for organization:
   - Enemies & Bosses
   - Characters & NPCs
   - Items & Equipment
   - UI Elements
   - Backgrounds
   - Icons

### Phase 6: Polish

1. Create `ImagePreview.tsx` with source/output comparison
2. Add generation history (max 10 items, clickable to re-use)
3. Loading states and error handling
4. Match existing game theme styling
5. Delete `ImageTest.tsx`

---

## Style Preset Prompts

```typescript
const PRESETS = {
  'naruto-anime': `Dark fantasy, gritty anime style. High contrast,
    detailed, atmospheric lighting. Naruto-inspired aesthetic.`,

  'pixel-16': `16x16 pixel art with limited color palette.
    Clean pixel edges, no anti-aliasing, retro game aesthetic.`,

  'chibi-sd': `Chibi/super-deformed style with large head, small body,
    cute proportions. Expressive eyes, simplified details.`,

  'cel-shaded': `Cel-shaded 3D render style. Bold outlines,
    flat color regions, anime-influenced shading.`,

  'icon-flat': `Flat design icon style. Minimal, clean lines,
    limited colors, no gradients, vector-like.`,

  'portrait-frame': `Character portrait for game UI. Close-up face/bust,
    dramatic lighting, dark background.`,

  'background-removal': `Remove the background completely, making it
    transparent. Keep only the main subject with clean edges.`
};
```

---

## Technical Notes

**Gemini Image-to-Image:**
- Same model (`gemini-3-pro-image-preview`) supports both modes
- Send image as `inlineData` part alongside text prompt

**Background Removal Limitation:**
- Gemini doesn't produce true transparent PNGs
- Outputs image with solid/clean background for easy manual cleanup
- Document this limitation in UI

**Memory Management:**
- Limit history to 10 items
- Clear old base64 data when not needed

---

## Legacy Code Removal

**Delete entirely:**

- `src/scenes/ImageTest.tsx` - All functionality migrated to AssetCompanion

**Remove from App.tsx:**

- `GameState.IMAGE_TEST` case (lines ~1779)
- `onImageTest` callback to MainMenu

**Remove from MainMenu.tsx:**

- "AI Image Generator Test" button
- `onImageTest` prop

**Update types.ts:**

- Remove `IMAGE_TEST` from GameState enum (replaced by `ASSET_COMPANION`)
