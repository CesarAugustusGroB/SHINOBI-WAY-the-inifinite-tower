/**
 * =============================================================================
 * ENEMY TURN SYSTEM - Enemy Turn Processing
 * =============================================================================
 *
 * This system handles all enemy turn processing including:
 * - DoT/Regen buff ticks
 * - Lethal damage and Guts checks
 * - Enemy action execution (attacks, confused, stunned)
 * - Resource recovery (cooldowns, chakra regen)
 * - Terrain hazard application
 *
 * ## ENEMY TURN ORDER
 *
 * 1. Phase 1: DoT/Regen on Enemy
 * 2. Phase 2: DoT/Regen on Player
 * 3. Phase 3: Death Checks (DoT)
 * 4. Phase 4: Enemy Action
 * 5. Phase 5: Resource Recovery
 * 6. Phase 6: Terrain Hazards
 *
 * =============================================================================
 */

import {
  Player,
  Enemy,
  Buff,
  CharacterStats,
  TerrainDefinition,
  EffectType,
  DamageType,
} from '../types';
import {
  checkGuts,
  resistStatus,
  calculateDotDamage,
  calculateDamage,
} from './StatSystem';
import { selectEnemySkill } from './EnemyAISystem';
import { combatLog } from '../utils/combatDebug';
import {
  generateId,
  tickBuffDurations,
  applyMitigation,
  applyTerrainHazard,
} from './CombatCalculationSystem';
import {
  shouldCounterAttack,
  checkGutsPassive,
} from './EquipmentPassiveSystem';
import { chance } from '../utils/rng';
import type { CombatState, EnemyTurnResult } from './CombatWorkflowSystem';

// ============================================================================
// INTERNAL TYPES
// ============================================================================

/**
 * Result of processing buff ticks (DoT/Regen) on an entity.
 */
interface BuffTickResult {
  /** Updated HP after DoT damage and regen healing */
  newHp: number;
  /** Updated buff list with durations decremented */
  updatedBuffs: Buff[];
  /** Log messages from this phase */
  logs: string[];
}

/**
 * Context for tracking guts state across turn phases.
 */
interface GutsContext {
  /** Whether stat-based or artifact guts has been triggered this turn */
  triggered: boolean;
  /** Whether artifact guts specifically was triggered (for caller to update combatState) */
  artifactTriggered: boolean;
}

/**
 * Information about an entity's artifact guts passive.
 */
interface ArtifactGutsInfo {
  hasGuts: boolean;
  healPercent: number;
  source: string;
}

/**
 * Result of checking for lethal damage with guts.
 */
interface LethalCheckResult {
  /** Whether the entity survived */
  survived: boolean;
  /** New HP after guts (1 or healed amount) */
  newHp: number;
  /** Whether guts was triggered */
  gutsTriggered: boolean;
  /** Whether artifact guts specifically was triggered */
  artifactGutsTriggered: boolean;
  /** Log message if guts triggered */
  log?: string;
}

/**
 * Result of executing the enemy's action phase.
 */
interface EnemyActionResult {
  /** Updated player state */
  player: Player;
  /** Updated enemy state */
  enemy: Enemy;
  /** Log messages from this phase */
  logs: string[];
  /** Whether player was defeated */
  playerDefeated: boolean;
  /** Whether enemy was defeated (from confusion or reflection) */
  enemyDefeated: boolean;
  /** Updated guts context */
  gutsContext: GutsContext;
}

/**
 * Result of applying terrain hazards.
 */
interface TerrainHazardPhaseResult {
  /** Player HP after hazard */
  playerHp: number;
  /** Enemy HP after hazard */
  enemyHp: number;
  /** Log messages from hazards */
  logs: string[];
  /** Whether player was defeated */
  playerDefeated: boolean;
  /** Whether enemy was defeated */
  enemyDefeated: boolean;
  /** Updated guts context */
  gutsContext: GutsContext;
}

// ============================================================================
// BUFF TICK PROCESSING
// ============================================================================

/**
 * Process DoT and Regen buff effects on an entity.
 * Handles Bleed, Burn, Poison (damage) and Regen (healing).
 * For players, DoT damage is mitigated by shields.
 *
 * @param entityHp - Current HP of the entity
 * @param entityBuffs - Current buffs on the entity
 * @param entityStats - Calculated stats for DoT damage scaling
 * @param entityName - Name for log messages
 * @param isPlayer - Whether this is the player (enables shield mitigation)
 * @param maxHp - Max HP for capping regen healing (required for player)
 */
export function processBuffTicks(
  entityHp: number,
  entityBuffs: Buff[],
  entityStats: CharacterStats,
  entityName: string,
  isPlayer: boolean,
  maxHp?: number
): BuffTickResult {
  let newHp = entityHp;
  let updatedBuffs = [...entityBuffs];
  const logs: string[] = [];

  updatedBuffs.forEach(buff => {
    if (!buff?.effect) return; // Skip malformed buffs

    // Damage Over Time
    if ([EffectType.DOT, EffectType.BLEED, EffectType.BURN, EffectType.POISON].includes(buff.effect.type) && buff.effect.value) {
      const dotDmg = calculateDotDamage(buff.effect.value, buff.effect.damageType, buff.effect.damageProperty, entityStats.derived);

      if (isPlayer) {
        // Player DoT goes through shield mitigation
        const mitigation = applyMitigation(updatedBuffs, dotDmg, entityName);
        newHp -= mitigation.finalDamage;
        updatedBuffs = mitigation.updatedBuffs;

        const effectName = buff.effect.type.charAt(0) + buff.effect.type.slice(1).toLowerCase();
        if (mitigation.finalDamage > 0) {
          logs.push(`${effectName} deals ${mitigation.finalDamage} to ${entityName}${mitigation.messages.length > 0 ? ` [${mitigation.messages.join(', ')}]` : ''}`);
        } else if (dotDmg > 0) {
          logs.push(`${effectName} blocked by ${entityName}'s shield!`);
        }
      } else {
        // Enemy DoT is direct damage
        newHp -= dotDmg;
        const effectName = buff.effect.type.charAt(0) + buff.effect.type.slice(1).toLowerCase();
        logs.push(`${effectName} deals ${dotDmg} to ${entityName}`);
      }
    }

    // Regen
    if (buff.effect.type === EffectType.REGEN && buff.effect.value) {
      const healAmount = buff.effect.value;
      if (isPlayer && maxHp) {
        newHp = Math.min(maxHp, newHp + healAmount);
      } else {
        newHp += healAmount;
      }
      logs.push(`${entityName} regenerates ${healAmount} HP`);
    }
  });

  // Tick down buff durations
  updatedBuffs = tickBuffDurations(updatedBuffs);

  return { newHp, updatedBuffs, logs };
}

// ============================================================================
// LETHAL DAMAGE CHECK
// ============================================================================

/**
 * Check if damage would be lethal and process guts.
 * Guts can come from either:
 * 1. Stat-based guts (gutsChance from stats, survives at 1 HP)
 * 2. Artifact guts (from equipment, may heal to a percentage)
 *
 * Priority: Stat-based guts is checked first. Artifact guts is only used
 * if stat-based fails AND artifact hasn't been used this combat.
 *
 * @param currentHp - Current HP before damage
 * @param incomingDamage - Damage that would be dealt
 * @param gutsChance - Percentage chance for stat-based guts
 * @param gutsContext - Current guts state for this turn
 * @param artifactGuts - Artifact guts info (if player has artifact with guts)
 * @param artifactGutsUsed - Whether artifact guts was already used this combat
 * @param maxHp - Max HP for calculating artifact guts heal
 */
export function checkLethalDamage(
  currentHp: number,
  incomingDamage: number,
  gutsChance: number,
  gutsContext: GutsContext,
  artifactGuts?: ArtifactGutsInfo,
  artifactGutsUsed?: boolean,
  maxHp?: number
): LethalCheckResult {
  const hpAfterDamage = currentHp - incomingDamage;

  // Not lethal, no guts needed
  if (hpAfterDamage > 0) {
    return {
      survived: true,
      newHp: hpAfterDamage,
      gutsTriggered: gutsContext.triggered,
      artifactGutsTriggered: gutsContext.artifactTriggered
    };
  }

  // Already used guts this turn
  if (gutsContext.triggered) {
    return {
      survived: false,
      newHp: hpAfterDamage,
      gutsTriggered: true,
      artifactGutsTriggered: gutsContext.artifactTriggered
    };
  }

  // Try stat-based guts first
  const statGutsResult = checkGuts(hpAfterDamage, incomingDamage, gutsChance);
  if (statGutsResult.survived) {
    return {
      survived: true,
      newHp: 1,
      gutsTriggered: true,
      artifactGutsTriggered: gutsContext.artifactTriggered,
      log: `GUTS! You refuse to fall!`
    };
  }

  // Try artifact guts if available and not used this combat
  if (artifactGuts?.hasGuts && !artifactGutsUsed && maxHp) {
    const healAmount = Math.floor(maxHp * (artifactGuts.healPercent / 100));
    return {
      survived: true,
      newHp: Math.max(1, healAmount),
      gutsTriggered: true,
      artifactGutsTriggered: true,
      log: `${artifactGuts.source} triggers GUTS! Restored to ${healAmount} HP!`
    };
  }

  // All guts failed
  return {
    survived: false,
    newHp: hpAfterDamage,
    gutsTriggered: false,
    artifactGutsTriggered: false
  };
}

// ============================================================================
// ENEMY ACTION EXECUTION
// ============================================================================

/**
 * Execute the enemy's action phase.
 * Handles stunned, confused, and normal attack states.
 *
 * @param player - Current player state
 * @param playerStats - Calculated player stats
 * @param enemy - Current enemy state
 * @param enemyStats - Calculated enemy stats
 * @param gutsContext - Current guts state
 * @param combatState - Optional combat state for terrain effects
 */
export function executeEnemyAction(
  player: Player,
  playerStats: CharacterStats,
  enemy: Enemy,
  enemyStats: CharacterStats,
  gutsContext: GutsContext,
  combatState?: CombatState
): EnemyActionResult {
  let updatedPlayer = { ...player };
  let updatedEnemy = { ...enemy };
  const logs: string[] = [];
  let playerDefeated = false;
  let enemyDefeated = false;
  const updatedGutsContext = { ...gutsContext };

  // Check for stun
  const isStunned = enemy.activeBuffs.some(b => b?.effect?.type === EffectType.STUN);
  if (isStunned) {
    logs.push(`${enemy.name} is STUNNED and cannot act!`);
    return {
      player: updatedPlayer,
      enemy: updatedEnemy,
      logs,
      playerDefeated: false,
      enemyDefeated: false,
      gutsContext: updatedGutsContext
    };
  }

  // Check for confusion (50% chance to hit self)
  const isConfused = enemy.activeBuffs.some(b => b?.effect?.type === EffectType.CONFUSION);
  if (isConfused && chance(0.5)) {
    const selfDamage = Math.floor(enemyStats.effectivePrimary.strength * 0.5);
    updatedEnemy.currentHp -= selfDamage;
    logs.push(`${enemy.name} is CONFUSED and hits itself for ${selfDamage}!`);

    if (updatedEnemy.currentHp <= 0) {
      return {
        player: updatedPlayer,
        enemy: updatedEnemy,
        logs,
        playerDefeated: false,
        enemyDefeated: true,
        gutsContext: updatedGutsContext
      };
    }

    return {
      player: updatedPlayer,
      enemy: updatedEnemy,
      logs,
      playerDefeated: false,
      enemyDefeated: false,
      gutsContext: updatedGutsContext
    };
  }

  // Normal enemy attack
  const selectedSkill = selectEnemySkill({ enemy, enemyStats, player, playerStats });
  if (!selectedSkill) {
    logs.push(`${enemy.name} has no available skills!`);
    return {
      player: updatedPlayer,
      enemy: updatedEnemy,
      logs,
      playerDefeated: false,
      enemyDefeated: false,
      gutsContext: updatedGutsContext
    };
  }

  // Calculate damage
  const damageResult = calculateDamage(
    enemyStats.effectivePrimary,
    enemyStats.derived,
    playerStats.effectivePrimary,
    playerStats.derived,
    selectedSkill,
    enemy.element,
    player.element
  );

  if (damageResult.isMiss) {
    logs.push(`${enemy.name} uses ${selectedSkill.name} but MISSES!`);
  } else if (damageResult.isEvaded) {
    logs.push(`${enemy.name} uses ${selectedSkill.name} but you EVADE!`);
  } else {
    // Apply mitigation
    const mitigation = applyMitigation(player.activeBuffs, damageResult.finalDamage, 'You');
    updatedPlayer.activeBuffs = mitigation.updatedBuffs;

    // Check lethal damage
    const artifactGuts = checkGutsPassive(player);
    const lethalCheck = checkLethalDamage(
      updatedPlayer.currentHp,
      mitigation.finalDamage,
      playerStats.derived.gutsChance,
      updatedGutsContext,
      artifactGuts,
      combatState?.artifactGutsUsed,
      playerStats.derived.maxHp
    );

    updatedPlayer.currentHp = lethalCheck.newHp;
    updatedGutsContext.triggered = lethalCheck.gutsTriggered;
    updatedGutsContext.artifactTriggered = lethalCheck.artifactGutsTriggered;

    // Build log message
    let logMsg = `${enemy.name} uses ${selectedSkill.name} for ${mitigation.finalDamage} damage`;
    if (mitigation.messages.length > 0) {
      logMsg += ` [${mitigation.messages.join(', ')}]`;
    }
    if (damageResult.isCrit) logMsg += " CRITICAL!";
    if (damageResult.elementMultiplier > 1) logMsg += " SUPER EFFECTIVE!";
    else if (damageResult.elementMultiplier < 1) logMsg += " Resisted.";
    logs.push(logMsg);

    // Handle reflection damage to enemy
    if (mitigation.reflectedDamage > 0) {
      updatedEnemy.currentHp -= mitigation.reflectedDamage;
      logs.push(`Reflection deals ${mitigation.reflectedDamage} to ${enemy.name}!`);

      if (updatedEnemy.currentHp <= 0) {
        return {
          player: updatedPlayer,
          enemy: updatedEnemy,
          logs,
          playerDefeated: false,
          enemyDefeated: true,
          gutsContext: updatedGutsContext
        };
      }
    }

    // Add guts log if triggered
    if (lethalCheck.log) {
      logs.push(lethalCheck.log);
    }

    // Check player death
    if (!lethalCheck.survived) {
      return {
        player: updatedPlayer,
        enemy: updatedEnemy,
        logs,
        playerDefeated: true,
        enemyDefeated: false,
        gutsContext: updatedGutsContext
      };
    }

    // Apply enemy skill effects (debuffs on player)
    if (selectedSkill.effects) {
      selectedSkill.effects.forEach(eff => {
        // Skip self-buff effects
        const isSelfBuff = [
          EffectType.BUFF,
          EffectType.SHIELD,
          EffectType.REFLECTION,
          EffectType.REGEN,
          EffectType.INVULNERABILITY,
          EffectType.HEAL
        ].includes(eff.type);

        if (!isSelfBuff) {
          // Debuff with resistance check
          const resisted = !resistStatus(eff.chance, playerStats.derived.statusResistance);
          if (!resisted) {
            const buff: Buff = {
              id: generateId(),
              name: eff.type,
              duration: eff.duration,
              effect: eff,
              source: selectedSkill.name
            };
            updatedPlayer.activeBuffs.push(buff);
          }
        }
      });
    }

    // Check for counter attack
    const counterCheck = shouldCounterAttack(player);
    if (counterCheck.shouldCounter && chance(counterCheck.chance / 100)) {
      const counterDamage = Math.floor(playerStats.effectivePrimary.strength * 0.3);
      updatedEnemy.currentHp -= counterDamage;
      logs.push(`Counter attack deals ${counterDamage} to ${enemy.name}!`);

      if (updatedEnemy.currentHp <= 0) {
        return {
          player: updatedPlayer,
          enemy: updatedEnemy,
          logs,
          playerDefeated: false,
          enemyDefeated: true,
          gutsContext: updatedGutsContext
        };
      }
    }
  }

  // Update enemy skill cooldowns
  updatedEnemy.skills = updatedEnemy.skills.map(s =>
    s.id === selectedSkill.id ? { ...s, currentCooldown: s.cooldown + 1 } : s
  );

  return {
    player: updatedPlayer,
    enemy: updatedEnemy,
    logs,
    playerDefeated,
    enemyDefeated,
    gutsContext: updatedGutsContext
  };
}

// ============================================================================
// POST-TURN RESOURCE PROCESSING
// ============================================================================

/**
 * Process post-turn resource recovery.
 * - Reduces all skill cooldowns by 1
 * - Restores chakra based on chakraRegen stat
 *
 * @param skills - Player's skill list
 * @param currentChakra - Current chakra
 * @param maxChakra - Maximum chakra
 * @param chakraRegen - Chakra regeneration per turn
 */
export function processPostTurnResources(
  skills: Player['skills'],
  currentChakra: number,
  maxChakra: number,
  chakraRegen: number
): { skills: Player['skills']; newChakra: number } {
  // Reduce cooldowns
  const updatedSkills = skills.map(s => ({
    ...s,
    currentCooldown: Math.max(0, s.currentCooldown - 1)
  }));

  // Chakra regen
  const newChakra = Math.min(maxChakra, currentChakra + chakraRegen);

  return { skills: updatedSkills, newChakra };
}

// ============================================================================
// TERRAIN HAZARD PROCESSING
// ============================================================================

/**
 * Apply terrain hazards to both combatants.
 * Terrain has a 30% chance per turn to deal damage to both player and enemy.
 *
 * @param playerHp - Current player HP
 * @param enemyHp - Current enemy HP
 * @param player - Player for terrain effect calculation
 * @param enemy - Enemy for terrain effect calculation
 * @param terrain - Terrain definition
 * @param playerStats - Player stats for guts check
 * @param gutsContext - Current guts state for this turn
 */
export function applyTerrainHazardsPhase(
  playerHp: number,
  enemyHp: number,
  player: Player,
  enemy: Enemy,
  terrain: TerrainDefinition,
  playerStats: CharacterStats,
  gutsContext: GutsContext
): TerrainHazardPhaseResult {
  let newPlayerHp = playerHp;
  let newEnemyHp = enemyHp;
  const logs: string[] = [];
  let playerDefeated = false;
  let enemyDefeated = false;
  const updatedGutsContext = { ...gutsContext };

  // Apply player hazard
  const playerHazard = applyTerrainHazard({ ...player, currentHp: playerHp }, terrain, 'You');
  if (playerHazard.log) {
    newPlayerHp = playerHazard.newHp;
    logs.push(playerHazard.log);
  }

  // Apply enemy hazard
  const enemyHazard = applyTerrainHazard({ ...enemy, currentHp: enemyHp }, terrain, enemy.name);
  if (enemyHazard.log) {
    newEnemyHp = enemyHazard.newHp;
    logs.push(enemyHazard.log);
  }

  // Check for deaths from hazards
  if (newEnemyHp <= 0) {
    enemyDefeated = true;
  }

  if (newPlayerHp <= 0 && !enemyDefeated) {
    if (!updatedGutsContext.triggered) {
      const gutsResult = checkGuts(newPlayerHp, 0, playerStats.derived.gutsChance);
      if (!gutsResult.survived) {
        playerDefeated = true;
      } else {
        newPlayerHp = 1;
        updatedGutsContext.triggered = true;
        logs.push("GUTS! You survived the hazard!");
      }
    } else {
      // Guts already used this turn, player dies
      playerDefeated = true;
    }
  }

  return {
    playerHp: newPlayerHp,
    enemyHp: newEnemyHp,
    logs,
    playerDefeated,
    enemyDefeated,
    gutsContext: updatedGutsContext
  };
}

// ============================================================================
// ENEMY TURN ORCHESTRATOR
// ============================================================================

/**
 * Processes the enemy's turn in combat.
 * This is the main orchestrator function that coordinates all phases
 * of enemy turn processing in the correct order.
 *
 * ## Turn Processing Order (Critical for correct behavior!)
 *
 * ### Phase 1: DoT/Regen on Enemy
 * - Process all DoT effects (Bleed, Burn, Poison) dealing damage
 * - Process Regen effects healing the enemy
 * - Decrement buff durations, remove expired buffs
 *
 * ### Phase 2: DoT/Regen on Player
 * - Process all DoT effects on player
 * - DoT damage goes through shield mitigation (can be absorbed)
 * - Process Regen effects healing the player
 * - Decrement buff durations, remove expired buffs
 *
 * ### Phase 3: Death Checks (DoT)
 * - Check if enemy died from DoT → early return with victory
 * - Check if player died from DoT → Guts check → defeat or survive at 1 HP
 *
 * ### Phase 4: Enemy Action
 * - If STUNNED: Skip action, log message
 * - If CONFUSED (50% chance): Enemy hits itself for 50% strength damage
 * - Otherwise: Select random skill and attack player
 *   - Calculate damage using StatSystem
 *   - Apply mitigation (player shields, reflection)
 *   - Guts check on lethal damage
 *   - Apply skill effects with status resistance
 *
 * ### Phase 5: Resource Recovery
 * - Reduce all player skill cooldowns by 1
 * - Restore chakra based on chakraRegen stat
 *
 * ### Phase 6: Terrain Hazards
 * - 30% chance per turn to trigger hazard
 * - Deals fixed damage to both player and enemy
 * - Final death checks with Guts for player
 *
 * @param player - Current player state
 * @param playerStats - Calculated player stats
 * @param enemy - Current enemy state
 * @param enemyStats - Calculated enemy stats
 * @param combatState - Optional combat state for terrain effects
 * @returns EnemyTurnResult with all state changes
 */
export function processEnemyTurn(
  player: Player,
  playerStats: CharacterStats,
  enemy: Enemy,
  enemyStats: CharacterStats,
  combatState?: CombatState
): EnemyTurnResult {
  combatLog('turn', `=== ENEMY TURN START: ${enemy.name} ===`, {
    enemyHp: enemy.currentHp,
    playerHp: player.currentHp
  });

  let updatedPlayer = { ...player };
  let updatedEnemy = { ...enemy };
  const logs: string[] = [];

  // Initialize guts tracking context
  let gutsContext: GutsContext = { triggered: false, artifactTriggered: false };

  // ============================================
  // Phase 1: Process DoT/Regen on Enemy
  // ============================================
  const enemyTickResult = processBuffTicks(
    updatedEnemy.currentHp,
    updatedEnemy.activeBuffs,
    enemyStats,
    enemy.name,
    false
  );
  updatedEnemy.currentHp = enemyTickResult.newHp;
  updatedEnemy.activeBuffs = enemyTickResult.updatedBuffs;
  logs.push(...enemyTickResult.logs);

  // ============================================
  // Phase 2: Process DoT/Regen on Player
  // ============================================
  const playerTickResult = processBuffTicks(
    updatedPlayer.currentHp,
    updatedPlayer.activeBuffs,
    playerStats,
    'You',
    true,
    playerStats.derived.maxHp
  );
  updatedPlayer.currentHp = playerTickResult.newHp;
  updatedPlayer.activeBuffs = playerTickResult.updatedBuffs;
  logs.push(...playerTickResult.logs);

  // ============================================
  // Phase 3: Check DoT Deaths
  // ============================================
  // Enemy died from DoT
  if (updatedEnemy.currentHp <= 0) {
    return {
      newPlayerHp: updatedPlayer.currentHp,
      newPlayerBuffs: updatedPlayer.activeBuffs,
      newEnemyHp: updatedEnemy.currentHp,
      newEnemyBuffs: updatedEnemy.activeBuffs,
      logMessages: logs,
      playerDefeated: false,
      enemyDefeated: true,
      playerSkills: updatedPlayer.skills
    };
  }

  // Player died from DoT - check guts
  if (updatedPlayer.currentHp <= 0) {
    const artifactGuts = checkGutsPassive(updatedPlayer);
    const lethalCheck = checkLethalDamage(
      updatedPlayer.currentHp,
      0, // No additional damage, just checking current HP
      playerStats.derived.gutsChance,
      gutsContext,
      artifactGuts,
      combatState?.artifactGutsUsed,
      playerStats.derived.maxHp
    );

    if (!lethalCheck.survived) {
      return {
        newPlayerHp: updatedPlayer.currentHp,
        newPlayerBuffs: updatedPlayer.activeBuffs,
        newEnemyHp: updatedEnemy.currentHp,
        newEnemyBuffs: updatedEnemy.activeBuffs,
        logMessages: logs,
        playerDefeated: true,
        enemyDefeated: false,
        playerSkills: updatedPlayer.skills
      };
    }

    updatedPlayer.currentHp = lethalCheck.newHp;
    gutsContext.triggered = lethalCheck.gutsTriggered;
    gutsContext.artifactTriggered = lethalCheck.artifactGutsTriggered;
    if (lethalCheck.log) {
      logs.push(lethalCheck.log);
    }
  }

  // ============================================
  // Phase 4: Execute Enemy Action
  // ============================================
  const actionResult = executeEnemyAction(
    updatedPlayer,
    playerStats,
    updatedEnemy,
    enemyStats,
    gutsContext,
    combatState
  );

  updatedPlayer = actionResult.player;
  updatedEnemy = actionResult.enemy;
  logs.push(...actionResult.logs);
  gutsContext = actionResult.gutsContext;

  // Check for defeats from enemy action
  if (actionResult.playerDefeated) {
    return {
      newPlayerHp: updatedPlayer.currentHp,
      newPlayerBuffs: updatedPlayer.activeBuffs,
      newEnemyHp: updatedEnemy.currentHp,
      newEnemyBuffs: updatedEnemy.activeBuffs,
      logMessages: logs,
      playerDefeated: true,
      enemyDefeated: false,
      playerSkills: updatedPlayer.skills,
      artifactGutsTriggered: gutsContext.artifactTriggered
    };
  }

  if (actionResult.enemyDefeated) {
    return {
      newPlayerHp: updatedPlayer.currentHp,
      newPlayerBuffs: updatedPlayer.activeBuffs,
      newEnemyHp: updatedEnemy.currentHp,
      newEnemyBuffs: updatedEnemy.activeBuffs,
      logMessages: logs,
      playerDefeated: false,
      enemyDefeated: true,
      playerSkills: updatedPlayer.skills,
      artifactGutsTriggered: gutsContext.artifactTriggered
    };
  }

  // ============================================
  // Phase 5: Resource Recovery
  // ============================================
  const resources = processPostTurnResources(
    updatedPlayer.skills,
    updatedPlayer.currentChakra,
    playerStats.derived.maxChakra,
    playerStats.derived.chakraRegen
  );
  updatedPlayer.skills = resources.skills;
  updatedPlayer.currentChakra = resources.newChakra;

  // ============================================
  // Phase 6: Terrain Hazards
  // ============================================
  if (combatState?.terrain) {
    const hazardResult = applyTerrainHazardsPhase(
      updatedPlayer.currentHp,
      updatedEnemy.currentHp,
      updatedPlayer,
      updatedEnemy,
      combatState.terrain,
      playerStats,
      gutsContext
    );

    updatedPlayer.currentHp = hazardResult.playerHp;
    updatedEnemy.currentHp = hazardResult.enemyHp;
    logs.push(...hazardResult.logs);
    gutsContext = hazardResult.gutsContext;

    // Check for hazard defeats
    if (hazardResult.enemyDefeated) {
      return {
        newPlayerHp: updatedPlayer.currentHp,
        newPlayerBuffs: updatedPlayer.activeBuffs,
        newEnemyHp: updatedEnemy.currentHp,
        newEnemyBuffs: updatedEnemy.activeBuffs,
        logMessages: logs,
        playerDefeated: false,
        enemyDefeated: true,
        playerSkills: updatedPlayer.skills,
        artifactGutsTriggered: gutsContext.artifactTriggered
      };
    }

    if (hazardResult.playerDefeated) {
      return {
        newPlayerHp: updatedPlayer.currentHp,
        newPlayerBuffs: updatedPlayer.activeBuffs,
        newEnemyHp: updatedEnemy.currentHp,
        newEnemyBuffs: updatedEnemy.activeBuffs,
        logMessages: logs,
        playerDefeated: true,
        enemyDefeated: false,
        playerSkills: updatedPlayer.skills,
        artifactGutsTriggered: gutsContext.artifactTriggered
      };
    }
  }

  // ============================================
  // Final Result
  // ============================================
  const finalResult: EnemyTurnResult = {
    newPlayerHp: updatedPlayer.currentHp,
    newPlayerBuffs: updatedPlayer.activeBuffs,
    newEnemyHp: updatedEnemy.currentHp,
    newEnemyBuffs: updatedEnemy.activeBuffs,
    logMessages: logs,
    playerDefeated: false,
    enemyDefeated: false,
    playerSkills: updatedPlayer.skills,
    artifactGutsTriggered: gutsContext.artifactTriggered,
  };

  combatLog('turn', `=== ENEMY TURN END ===`, {
    playerHpAfter: finalResult.newPlayerHp,
    enemyHpAfter: finalResult.newEnemyHp,
    playerDefeated: finalResult.playerDefeated,
    enemyDefeated: finalResult.enemyDefeated
  });

  return finalResult;
}
