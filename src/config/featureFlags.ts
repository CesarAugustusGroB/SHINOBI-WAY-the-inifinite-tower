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
  DEBUG_STATE_TRANSITIONS: true,

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

  // ─────────────────────────────────────────────────────────────
  // Development Mode
  // ─────────────────────────────────────────────────────────────

  /** Enable development-only features (ImageTest, etc.) */
  DEV_MODE: process.env.NODE_ENV !== 'production',

  /** Enable Asset Companion tool for generating game assets */
  ENABLE_ASSET_COMPANION: true,
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

  /** Maximum activities per room (0 = unlimited) */
  MAX_ACTIVITIES_PER_ROOM: 3,

  /** Maximum bag capacity */
  MAX_BAG_SIZE: 12,

  /** Maximum equipped skills */
  MAX_EQUIPPED_SKILLS: 4,

  /** Combat log max entries */
  COMBAT_LOG_MAX_ENTRIES: 50,

  // ─────────────────────────────────────────────────────────────
  // Treasure System Balance
  // ─────────────────────────────────────────────────────────────

  /** Treasure config by wealth level - choiceCount, artifactChance, ryoMultiplier */
  TREASURE_CONFIG: {
    LOW: { choiceCount: 2, artifactChance: 0, ryoMultiplier: 0.5 },      // Wealth 1-2
    MEDIUM: { choiceCount: 2, artifactChance: 0, ryoMultiplier: 1.0 },   // Wealth 3-4
    HIGH: { choiceCount: 3, artifactChance: 0.05, ryoMultiplier: 1.5 },  // Wealth 5-6
    RICH: { choiceCount: 3, artifactChance: 0.10, ryoMultiplier: 2.0 },  // Wealth 7
  },

  /** Dice roll probabilities for treasure hunter (trap%, nothing%, piece%) */
  TREASURE_DICE_ODDS: { trap: 30, nothing: 40, piece: 30 },

  /** Trap damage formula: BASE + (dangerLevel * PER_DANGER) as % of max HP */
  TREASURE_TRAP_DAMAGE: { base: 0.05, perDanger: 0.03 },

  /** Map pieces required by danger level */
  TREASURE_MAP_PIECES: { lowDanger: 2, midDanger: 3, highDanger: 4 },
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
