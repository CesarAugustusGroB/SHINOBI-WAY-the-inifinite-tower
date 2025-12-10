/**
 * =============================================================================
 * COMBAT CALCULATION SYSTEM - Pure Combat Math Functions
 * =============================================================================
 *
 * This system contains pure calculation functions for combat mechanics.
 * All functions are deterministic (same inputs = same outputs) and have
 * no side effects. They do not modify state.
 *
 * ## RESPONSIBILITIES
 * - Damage mitigation pipeline (shields, invulnerability, reflection, curse)
 * - Buff duration management
 * - Terrain effect calculations (evasion, initiative, element amplification)
 * - Turn order determination
 * - ID generation for buff tracking
 *
 * ## DAMAGE MITIGATION PIPELINE
 * Applied in this order (applyMitigation function):
 * 1. INVULNERABILITY - Blocks ALL damage, returns 0
 * 2. REFLECTION - Calculates damage to return to attacker (before curse)
 * 3. CURSE - Amplifies incoming damage by curse value
 * 4. SHIELD - Absorbs damage, breaks when depleted
 *
 * ## TERRAIN EFFECTS
 * - Element Amplification: +25% damage for matching element (default)
 * - Initiative Modifier: Bonus/penalty to turn order
 * - Evasion Modifier: Bonus/penalty to dodge chance
 * - Hazard: Chance to deal environmental damage at turn end
 *
 * ## DESIGN PRINCIPLES
 * - Pure functions only (no state mutation)
 * - Fully testable in isolation
 * - Reusable across different combat contexts
 *
 * =============================================================================
 */

import {
  Buff,
  EffectType,
  Player,
  Enemy,
  TerrainDefinition,
  ElementType,
  CharacterStats,
} from '../types';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Result of the damage mitigation pipeline.
 * Contains the final damage after all mitigation effects are applied.
 */
export interface MitigationResult {
  /** Damage that actually hits the target after all mitigation */
  finalDamage: number;
  /** Damage reflected back to the attacker (thorns/reflection) */
  reflectedDamage: number;
  /** Updated buff list after shield consumption */
  updatedBuffs: Buff[];
  /** Log messages describing what happened during mitigation */
  messages: string[];
}

// ============================================================================
// BUFF MANAGEMENT
// ============================================================================

/** Generates a random 7-character ID for buff tracking */
export const generateId = () => Math.random().toString(36).substring(2, 9);

/**
 * Decrements buff durations and removes expired buffs.
 * Buffs with duration -1 are permanent and never expire.
 *
 * @param buffs - Array of active buffs
 * @returns New array with durations decremented and expired buffs removed
 */
export function tickBuffDurations(buffs: Buff[]): Buff[] {
  return buffs
    .filter(b => b?.duration > 1 || b?.duration === -1)
    .map(b => b.duration === -1 ? b : { ...b, duration: b.duration - 1 });
}

// ============================================================================
// DAMAGE MITIGATION PIPELINE
// ============================================================================

/**
 * Applies the damage mitigation pipeline to incoming damage.
 * This is the core defensive calculation that happens AFTER the attacker's
 * damage is calculated but BEFORE it's applied to the target's HP.
 *
 * ## Mitigation Order (Critical!)
 * The order of these checks matters for correct behavior:
 *
 * 1. INVULNERABILITY - Complete immunity, blocks everything
 *    - If active, returns 0 damage immediately
 *    - Used by skills like "Substitution" or "Time Stop"
 *
 * 2. REFLECTION (Thorns) - Returns damage to attacker
 *    - Calculates reflected amount BEFORE curse reduces damage
 *    - reflect.value is the % reflected (e.g., 0.3 = 30%)
 *    - Does not reduce incoming damage, just adds counter-damage
 *
 * 3. CURSE - Damage amplification (applied after reflection calculation)
 *    - Increases incoming damage by curse.value (e.g., 0.5 = +50%)
 *    - Applied to cursed targets to make them more vulnerable
 *
 * 4. SHIELD - Damage absorption with durability
 *    - Shield has a health value that absorbs damage
 *    - If shield >= damage: absorbs all, reduces shield value
 *    - If shield < damage: shield breaks, remaining damage goes through
 *
 * @param targetBuffs - Array of buffs on the target being hit
 * @param incomingDamage - Raw damage after attacker's calculation
 * @param targetName - Name for log messages ("You" or enemy name)
 * @returns MitigationResult with final damage and effects
 */
export const applyMitigation = (
  targetBuffs: Buff[],
  incomingDamage: number,
  targetName: string
): MitigationResult => {
  let damage = incomingDamage;
  let reflected = 0;
  let currentBuffs = [...targetBuffs];
  const messages: string[] = [];

  // 1. Check Invulnerability (Blocks all damage)
  if (currentBuffs.some(b => b?.effect?.type === EffectType.INVULNERABILITY)) {
    return { finalDamage: 0, reflectedDamage: 0, updatedBuffs: currentBuffs, messages: [`${targetName} is Invulnerable!`] };
  }

  // 2. Check Reflection (Thorns) - Calculate BEFORE curse amplifies damage
  // This prevents cursed targets from reflecting bonus damage back to attackers
  const reflect = currentBuffs.find(b => b?.effect?.type === EffectType.REFLECTION);
  if (reflect?.effect?.value) {
    reflected = Math.floor(damage * reflect.effect.value);
    if (reflected > 0) messages.push(`${targetName} reflects ${reflected} damage!`);
  }

  // 3. Check Curse (Damage Amplification) - Applied after reflection calculation
  const curse = currentBuffs.find(b => b?.effect?.type === EffectType.CURSE);
  if (curse?.effect?.value) {
    const bonusDmg = Math.floor(damage * curse.effect.value);
    damage += bonusDmg;
    messages.push(`${targetName} takes extra damage from Curse!`);
  }

  // 4. Check Shields (Damage Absorption)
  const shieldIndex = currentBuffs.findIndex(b => b?.effect?.type === EffectType.SHIELD);
  if (shieldIndex !== -1 && damage > 0) {
    const shieldBuff = { ...currentBuffs[shieldIndex] };
    const shieldVal = shieldBuff?.effect?.value || 0;

    if (shieldVal >= damage) {
      // Shield absorbs all damage
      messages.push(`Shield absorbed ${damage} damage!`);
      shieldBuff.effect.value = shieldVal - damage;
      currentBuffs[shieldIndex] = shieldBuff;
      damage = 0;
    } else {
      // Shield breaks, remaining damage goes through
      messages.push(`Shield broke! Absorbed ${shieldVal} damage.`);
      damage -= shieldVal;
      currentBuffs.splice(shieldIndex, 1);
    }
  }

  return { finalDamage: damage, reflectedDamage: reflected, updatedBuffs: currentBuffs, messages };
};

// ============================================================================
// TERRAIN CALCULATIONS
// ============================================================================

/**
 * Calculate terrain-modified evasion
 */
export function getTerrainEvasionBonus(terrain: TerrainDefinition | null): number {
  if (!terrain) return 0;
  return terrain.effects.evasionModifier || 0;
}

/**
 * Calculate terrain-modified initiative
 */
export function getTerrainInitiativeBonus(terrain: TerrainDefinition | null): number {
  if (!terrain) return 0;
  return terrain.effects.initiativeModifier || 0;
}

/**
 * Check if terrain amplifies a specific element
 */
export function getTerrainElementAmplification(
  terrain: TerrainDefinition | null,
  attackerElement: ElementType
): number {
  if (!terrain || !terrain.effects.elementAmplify) return 1.0;

  if (terrain.effects.elementAmplify === attackerElement) {
    // Return amplification as multiplier (e.g., 25% = 1.25)
    return 1 + ((terrain.effects.elementAmplifyPercent || 25) / 100);
  }

  return 1.0;
}

/**
 * Apply terrain hazard damage at end of turn
 */
export function applyTerrainHazard(
  target: Player | Enemy,
  terrain: TerrainDefinition | null,
  targetName: string
): { newHp: number; log: string | null } {
  if (!terrain || !terrain.effects.hazard) {
    return { newHp: target.currentHp, log: null };
  }

  const hazard = terrain.effects.hazard;

  // Hazard has a chance to trigger (default 30%)
  if (Math.random() > (hazard.chance || 0.3)) {
    return { newHp: target.currentHp, log: null };
  }

  const damage = hazard.value;
  const newHp = Math.max(1, target.currentHp - damage);

  const hazardDescriptions: Record<string, string> = {
    BURN: 'scorched by flames',
    DROWN: 'pulled under by currents',
    POISON: 'affected by toxic fumes',
    LIGHTNING: 'struck by static discharge',
    FALLING: 'hit by falling debris',
  };

  const description = hazardDescriptions[hazard.type] || 'damaged by the environment';

  return {
    newHp,
    log: `${targetName} was ${description} for ${damage} damage!`,
  };
}

// ============================================================================
// TURN ORDER
// ============================================================================

/**
 * Combat state interface - needed for turn order determination.
 * Re-exported from CombatWorkflowSystem for convenience.
 */
export interface CombatStateForTurnOrder {
  isFirstTurn: boolean;
  playerGoesFirst: boolean;
  playerInitiativeBonus: number;
  terrain: TerrainDefinition | null;
}

/**
 * Determine turn order based on initiative and approach bonuses
 */
export function determineTurnOrder(
  playerStats: CharacterStats,
  enemyStats: CharacterStats,
  combatState: CombatStateForTurnOrder
): 'player' | 'enemy' {
  // Approach guarantees first turn
  if (combatState.playerGoesFirst && combatState.isFirstTurn) {
    return 'player';
  }

  // Calculate initiative
  const playerInit = playerStats.derived.initiative +
    combatState.playerInitiativeBonus +
    getTerrainInitiativeBonus(combatState.terrain);

  const enemyInit = enemyStats.derived.initiative;

  // Higher initiative goes first, with small random factor
  const playerRoll = playerInit + (Math.random() * 10);
  const enemyRoll = enemyInit + (Math.random() * 10);

  return playerRoll >= enemyRoll ? 'player' : 'enemy';
}
