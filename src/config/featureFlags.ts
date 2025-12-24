/**
 * Feature Flags and Launch Properties
 *
 * Configure game features, debug options, and runtime behavior.
 * These can be toggled during development or for testing.
 */

export const FeatureFlags = {
  // ─────────────────────────────────────────────────────────────
  // Debug & Development
  // ─────────────────────────────────────────────────────────────

  /** Enable debug overlay with game state info */
  DEBUG_OVERLAY: false,

  /** Log combat calculations to console */
  DEBUG_COMBAT_LOG: false,

  /** Log state transitions */
  DEBUG_STATE_TRANSITIONS: false,

  /** Skip character selection (use default clan) */
  SKIP_CHAR_SELECT: false,

  /** Start with boosted stats for testing */
  DEBUG_BOOSTED_STATS: false,

  // ─────────────────────────────────────────────────────────────
  // Gameplay Features
  // ─────────────────────────────────────────────────────────────

  /** Enable the synthesis/crafting system */
  ENABLE_SYNTHESIS: true,

  /** Enable elite challenge encounters */
  ENABLE_ELITE_CHALLENGES: true,

  /** Enable story arc events */
  ENABLE_STORY_EVENTS: true,

  /** Enable AI-generated enemy images (requires GEMINI_API_KEY) */
  ENABLE_AI_IMAGES: false,

  /** Enable training rooms in exploration */
  ENABLE_TRAINING: true,

  // ─────────────────────────────────────────────────────────────
  // UI Features
  // ─────────────────────────────────────────────────────────────

  /** Show floating damage numbers in combat */
  SHOW_FLOATING_TEXT: true,

  /** Enable combat animations */
  ENABLE_COMBAT_ANIMATIONS: true,

  /** Show tooltips on hover */
  ENABLE_TOOLTIPS: true,

  // ─────────────────────────────────────────────────────────────
  // Experimental Features
  // ─────────────────────────────────────────────────────────────

  /** Enable experimental combat UI (Pattern A) */
  EXPERIMENTAL_COMBAT_UI: false,

  /** Enable new loot preview system */
  EXPERIMENTAL_LOOT_PREVIEW: false,
} as const;

export const LaunchProperties = {
  // ─────────────────────────────────────────────────────────────
  // Game Balance
  // ─────────────────────────────────────────────────────────────

  /** Starting gold amount */
  STARTING_RYO: 100,

  /** Starting HP percentage (0-1) */
  STARTING_HP_PERCENT: 1.0,

  /** Default clan for SKIP_CHAR_SELECT (matches Clan enum value) */
  DEFAULT_CLAN: 'Uchiha' as const,

  /** XP multiplier for all gains */
  XP_MULTIPLIER: 1.0,

  /** Gold multiplier for all gains */
  RYO_MULTIPLIER: 1.0,

  /** Loot drop rate multiplier */
  LOOT_MULTIPLIER: 1.0,

  // ─────────────────────────────────────────────────────────────
  // Difficulty Modifiers
  // ─────────────────────────────────────────────────────────────

  /** Enemy stat scaling multiplier */
  ENEMY_SCALING_MULTIPLIER: 1.0,

  /** Enemy damage multiplier */
  ENEMY_DAMAGE_MULTIPLIER: 1.0,

  /** Player damage multiplier */
  PLAYER_DAMAGE_MULTIPLIER: 1.0,

  // ─────────────────────────────────────────────────────────────
  // System Limits
  // ─────────────────────────────────────────────────────────────

  /** Maximum bag capacity */
  MAX_BAG_SIZE: 12,

  /** Maximum equipped skills */
  MAX_EQUIPPED_SKILLS: 4,

  /** Combat log max entries */
  COMBAT_LOG_MAX_ENTRIES: 50,
} as const;

// Type exports for type-safe access
export type FeatureFlagKey = keyof typeof FeatureFlags;
export type LaunchPropertyKey = keyof typeof LaunchProperties;

// Helper functions
export function isFeatureEnabled(flag: FeatureFlagKey): boolean {
  return FeatureFlags[flag];
}

export function getProperty<K extends LaunchPropertyKey>(
  key: K
): (typeof LaunchProperties)[K] {
  return LaunchProperties[key];
}
