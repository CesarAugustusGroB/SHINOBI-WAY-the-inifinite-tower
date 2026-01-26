/**
 * Centralized activity display labels and names.
 * Use these constants for consistent activity naming across UI components.
 */

import type { RoomActivities } from '../types';

/**
 * Short labels for UI display (icons, cards, tags).
 * These are concise versions suitable for small UI elements.
 */
export const ACTIVITY_LABELS: Record<keyof RoomActivities, string> = {
  combat: 'Combat',
  eliteChallenge: 'Elite',
  merchant: 'Shop',
  event: 'Event',
  scrollDiscovery: 'Scroll',
  rest: 'Rest',
  training: 'Train',
  treasure: 'Treasure',
  infoGathering: 'Intel',
};

/**
 * Full descriptive names for tooltips, help text, and detailed displays.
 * These are the complete names suitable for descriptions and documentation.
 */
export const ACTIVITY_FULL_NAMES: Record<keyof RoomActivities, string> = {
  combat: 'Combat',
  eliteChallenge: 'Elite Challenge',
  merchant: 'Merchant',
  event: 'Event',
  scrollDiscovery: 'Scroll Discovery',
  rest: 'Rest',
  training: 'Training',
  treasure: 'Treasure',
  infoGathering: 'Intel Gathering',
};
