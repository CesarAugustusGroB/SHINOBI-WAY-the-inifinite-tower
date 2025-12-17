/**
 * Random Number Generator Utility
 * Centralizes all randomness for deterministic testing support
 */

/**
 * Interface for random number generation
 * Implement this interface to create deterministic/seeded RNG for testing
 */
export interface RandomGenerator {
  /** Returns a random number between 0 (inclusive) and 1 (exclusive) */
  random(): number;
}

/**
 * Default RNG using Math.random()
 */
export const defaultRng: RandomGenerator = {
  random: () => Math.random(),
};

/**
 * Seeded RNG for deterministic testing
 * Uses mulberry32 algorithm for reproducibility
 */
export function createSeededRng(seed: number): RandomGenerator {
  let state = seed;
  return {
    random: () => {
      state |= 0;
      state = (state + 0x6d2b79f5) | 0;
      let t = Math.imul(state ^ (state >>> 15), 1 | state);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    },
  };
}

// Global RNG instance - can be swapped for testing
let globalRng: RandomGenerator = defaultRng;

/**
 * Set the global RNG instance
 * Use this in tests to inject a seeded RNG
 */
export function setGlobalRng(rng: RandomGenerator): void {
  globalRng = rng;
}

/**
 * Reset global RNG to default Math.random()
 */
export function resetGlobalRng(): void {
  globalRng = defaultRng;
}

/**
 * Get the current global RNG
 */
export function getGlobalRng(): RandomGenerator {
  return globalRng;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Returns a random number between 0 (inclusive) and 1 (exclusive)
 */
export function random(rng: RandomGenerator = globalRng): number {
  return rng.random();
}

/**
 * Returns true with the given probability (0-1)
 * @param probability - Chance of returning true (0 = never, 1 = always)
 */
export function chance(probability: number, rng: RandomGenerator = globalRng): boolean {
  return rng.random() < probability;
}

/**
 * Returns true with the given percentage chance (0-100)
 * @param percent - Chance of returning true (0 = never, 100 = always)
 */
export function percentChance(percent: number, rng: RandomGenerator = globalRng): boolean {
  return rng.random() * 100 < percent;
}

/**
 * Returns a random integer between min (inclusive) and max (inclusive)
 */
export function randomInt(min: number, max: number, rng: RandomGenerator = globalRng): number {
  return min + Math.floor(rng.random() * (max - min + 1));
}

/**
 * Returns a random float between min (inclusive) and max (exclusive)
 */
export function randomFloat(min: number, max: number, rng: RandomGenerator = globalRng): number {
  return min + rng.random() * (max - min);
}

/**
 * Picks a random element from an array
 * Returns undefined if array is empty
 */
export function pick<T>(array: readonly T[], rng: RandomGenerator = globalRng): T | undefined {
  if (array.length === 0) return undefined;
  return array[Math.floor(rng.random() * array.length)];
}

/**
 * Picks a random element from an array (non-empty version)
 * Throws if array is empty
 */
export function pickRequired<T>(array: readonly T[], rng: RandomGenerator = globalRng): T {
  if (array.length === 0) {
    throw new Error('Cannot pick from empty array');
  }
  return array[Math.floor(rng.random() * array.length)];
}

/**
 * Picks a random element based on weights
 * @param items - Array of items
 * @param getWeight - Function to get weight for each item
 */
export function weightedPick<T>(
  items: readonly T[],
  getWeight: (item: T) => number,
  rng: RandomGenerator = globalRng
): T | undefined {
  if (items.length === 0) return undefined;

  const totalWeight = items.reduce((sum, item) => sum + getWeight(item), 0);
  if (totalWeight <= 0) return items[0];

  let roll = rng.random() * totalWeight;
  for (const item of items) {
    roll -= getWeight(item);
    if (roll <= 0) return item;
  }
  return items[items.length - 1];
}

/**
 * Shuffles an array in place (Fisher-Yates algorithm)
 * Returns the same array reference for chaining
 */
export function shuffle<T>(array: T[], rng: RandomGenerator = globalRng): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(rng.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

/**
 * Returns a shuffled copy of an array (does not mutate original)
 */
export function shuffled<T>(array: readonly T[], rng: RandomGenerator = globalRng): T[] {
  return shuffle([...array], rng);
}

/**
 * Generates a random ID string
 */
export function generateId(rng: RandomGenerator = globalRng): string {
  return rng.random().toString(36).substring(2, 9);
}

/**
 * Generates a unique ID with timestamp prefix
 */
export function generateUniqueId(prefix: string = '', rng: RandomGenerator = globalRng): string {
  const timestamp = Date.now();
  const random = rng.random().toString(36).substring(2, 9);
  return prefix ? `${prefix}-${timestamp}-${random}` : `${timestamp}-${random}`;
}

/**
 * Roll a d100 (1-100)
 */
export function d100(rng: RandomGenerator = globalRng): number {
  return Math.floor(rng.random() * 100) + 1;
}

/**
 * Roll dice (e.g., d6, d20)
 * @param sides - Number of sides on the die
 */
export function roll(sides: number, rng: RandomGenerator = globalRng): number {
  return Math.floor(rng.random() * sides) + 1;
}
