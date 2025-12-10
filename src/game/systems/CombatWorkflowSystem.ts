/**
 * =============================================================================
 * COMBAT WORKFLOW SYSTEM - Turn-Based Combat State Orchestration
 * =============================================================================
 *
 * This system handles the flow of turn-based combat, orchestrating state
 * changes across player and enemy turns. It uses pure calculation functions
 * from CombatCalculationSystem for the actual math.
 *
 * ## RESPONSIBILITIES
 * - Combat state initialization and management
 * - Player skill execution (useSkill)
 * - Enemy turn processing (processEnemyTurn)
 * - Upkeep phase handling (toggle costs, passive regen)
 * - Approach effect application
 *
 * ## COMBAT TURN ORDER
 *
 * ### Player Turn (useSkill):
 * 1. Resource validation (chakra, HP costs)
 * 2. Stun check (prevents action if stunned)
 * 3. Damage calculation (via StatSystem.calculateDamage)
 * 4. First hit multiplier from approach (if first turn)
 * 5. Terrain element amplification
 * 6. Damage mitigation on enemy (via CombatCalculationSystem.applyMitigation)
 * 7. Effect application with resistance checks
 * 8. Cooldown update
 *
 * ### Enemy Turn (processEnemyTurn):
 * 1. Process DoT effects on enemy (Bleed, Burn, Poison)
 * 2. Process Regen effects on enemy
 * 3. Process DoT effects on player (with shield mitigation)
 * 4. Process Regen effects on player
 * 5. Check for DoT deaths (enemy first, then player)
 * 6. Guts check for player if lethal
 * 7. Enemy action (stunned, confused, or attack)
 * 8. Damage mitigation on player
 * 9. Apply enemy skill effects to player
 * 10. Player cooldown reduction
 * 11. Player chakra regeneration
 * 12. Apply terrain hazards to both combatants
 * 13. Final death checks
 *
 * =============================================================================
 */

import {
  Player,
  Enemy,
  Skill,
  EffectType,
  Buff,
  CharacterStats,
  TerrainDefinition,
  ActionType,
} from '../types';
import {
  calculateDamage,
  checkGuts,
  resistStatus,
  calculateDotDamage
} from './StatSystem';
import { CombatModifiers } from './ApproachSystem';
import { selectEnemySkill } from './EnemyAISystem';
import { combatLog, logDamage, logFlowCheckpoint } from '../utils/combatDebug';
import {
  generateId,
  tickBuffDurations,
  applyMitigation,
  getTerrainElementAmplification,
  applyTerrainHazard,
} from './CombatCalculationSystem';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Combat state with approach modifiers and terrain effects.
 * Tracks approach bonuses and terrain effects for the current combat.
 */
export interface CombatState {
  isFirstTurn: boolean;
  firstHitMultiplier: number;
  playerGoesFirst: boolean;
  playerInitiativeBonus: number;
  xpMultiplier: number;
  terrain: TerrainDefinition | null;
  approachApplied: boolean;
}

/**
 * Result of a player skill use, containing all state changes.
 */
export interface CombatResult {
  /** Total damage dealt to the enemy (after mitigation) */
  damageDealt: number;
  /** Enemy's HP after this action */
  newEnemyHp: number;
  /** Player's HP after this action (may decrease from HP costs or reflection) */
  newPlayerHp: number;
  /** Player's chakra after paying skill cost */
  newPlayerChakra: number;
  /** Enemy's updated buff list */
  newEnemyBuffs: Buff[];
  /** Player's updated buff list (may include new self-buffs) */
  newPlayerBuffs: Buff[];
  /** Combat log message describing what happened */
  logMessage: string;
  /** Log type for UI styling */
  logType: 'info' | 'combat' | 'gain' | 'danger';
  /** Updated skill list with cooldowns applied */
  skillsUpdate?: Skill[];
  /** True if enemy HP reached 0 */
  enemyDefeated: boolean;
  /** True if player HP reached 0 (can happen from reflection damage) */
  playerDefeated?: boolean;
}

/**
 * Result of processing the upkeep phase.
 */
export interface UpkeepResult {
  player: Player;
  logs: string[];
  togglesDeactivated: string[];
}

/**
 * Result of processing the enemy's turn.
 */
export interface EnemyTurnResult {
  /** Player's HP after enemy turn (may be reduced by attack, DoT, or hazard) */
  newPlayerHp: number;
  /** Player's updated buff list (duration decremented, expired removed) */
  newPlayerBuffs: Buff[];
  /** Enemy's HP after enemy turn (may be reduced by DoT, confusion, or hazard) */
  newEnemyHp: number;
  /** Enemy's updated buff list (duration decremented, expired removed) */
  newEnemyBuffs: Buff[];
  /** All combat log messages from this turn */
  logMessages: string[];
  /** True if player was defeated this turn */
  playerDefeated: boolean;
  /** True if enemy was defeated this turn (from DoT, confusion, or hazard) */
  enemyDefeated: boolean;
  /** Updated player skills with cooldowns reduced */
  playerSkills: Skill[];
}

// ============================================================================
// COMBAT STATE INITIALIZATION
// ============================================================================

/**
 * Create initial combat state with approach modifiers
 */
export function createCombatState(
  modifiers?: CombatModifiers,
  terrain?: TerrainDefinition
): CombatState {
  return {
    isFirstTurn: true,
    firstHitMultiplier: modifiers?.firstHitMultiplier || 1.0,
    playerGoesFirst: modifiers?.playerGoesFirst || false,
    playerInitiativeBonus: modifiers?.playerInitiativeBonus || 0,
    xpMultiplier: modifiers?.xpMultiplier || 1.0,
    terrain: terrain || null,
    approachApplied: false,
  };
}

/**
 * Apply approach buffs/debuffs at combat start
 */
export function applyApproachEffects(
  player: Player,
  enemy: Enemy,
  modifiers: CombatModifiers
): { player: Player; enemy: Enemy; logs: string[] } {
  const logs: string[] = [];
  let updatedPlayer = { ...player };
  let updatedEnemy = { ...enemy };

  // Apply player buffs from approach
  if (modifiers.playerBuffs && modifiers.playerBuffs.length > 0) {
    updatedPlayer.activeBuffs = [...updatedPlayer.activeBuffs, ...modifiers.playerBuffs];
    logs.push('Your approach grants combat advantages!');
  }

  // Apply enemy debuffs from approach
  if (modifiers.enemyDebuffs && modifiers.enemyDebuffs.length > 0) {
    updatedEnemy.activeBuffs = [...updatedEnemy.activeBuffs, ...modifiers.enemyDebuffs];
    logs.push(`${enemy.name} is affected by your approach!`);
  }

  return { player: updatedPlayer, enemy: updatedEnemy, logs };
}

// ============================================================================
// PLAYER TURN
// ============================================================================

/**
 * Executes a player skill attack against an enemy.
 * This is the main player combat action function.
 *
 * ## Execution Flow:
 * 1. **Resource Check** - Verify player has enough chakra/HP for skill costs
 * 2. **Cooldown Check** - Return null if skill is on cooldown
 * 3. **Stun Check** - Stunned players cannot act
 * 4. **Pay Costs** - Deduct chakra and HP costs
 * 5. **Calculate Damage** - Use StatSystem.calculateDamage()
 * 6. **Apply Modifiers**:
 *    - First hit multiplier from approach (ambush bonus)
 *    - Terrain element amplification
 * 7. **Apply Mitigation** - Enemy shields, invuln, reflection
 * 8. **Handle Reflection** - Damage returned to player
 * 9. **Apply Effects** - Self-buffs and enemy debuffs with resistance
 * 10. **Update Cooldowns** - Set skill on cooldown
 *
 * ## Effect Types:
 * - Self-buffs (BUFF, SHIELD, REFLECTION, REGEN, INVULNERABILITY, HEAL)
 *   always apply to player, no resistance check
 * - Debuffs apply to enemy with status resistance check
 *
 * @param player - Current player state
 * @param playerStats - Calculated player stats (from getPlayerFullStats)
 * @param enemy - Current enemy state
 * @param enemyStats - Calculated enemy stats (from getEnemyFullStats)
 * @param skill - The skill being used
 * @param combatState - Optional combat state for approach/terrain bonuses
 * @returns CombatResult with all state changes, or null if action impossible
 */
export const useSkill = (
  player: Player,
  playerStats: CharacterStats,
  enemy: Enemy,
  enemyStats: CharacterStats,
  skill: Skill,
  combatState?: CombatState
): CombatResult | null => {
  logFlowCheckpoint('useSkill START', {
    skill: skill.name,
    playerHp: player.currentHp,
    playerChakra: player.currentChakra,
    enemyHp: enemy.currentHp,
    enemyName: enemy.name
  });

  // Resource check
  if (player.currentChakra < skill.chakraCost || player.currentHp <= skill.hpCost) {
    return {
      damageDealt: 0,
      newEnemyHp: enemy.currentHp,
      newPlayerHp: player.currentHp,
      newPlayerChakra: player.currentChakra,
      newEnemyBuffs: enemy.activeBuffs,
      newPlayerBuffs: player.activeBuffs,
      logMessage: "Insufficient Chakra or HP!",
      logType: 'danger',
      enemyDefeated: false
    };
  }

  if (skill.currentCooldown > 0) return null;

  const isStunned = player.activeBuffs.some(b => b?.effect?.type === EffectType.STUN);
  if (isStunned) {
    return {
      damageDealt: 0,
      newEnemyHp: enemy.currentHp,
      newPlayerHp: player.currentHp,
      newPlayerChakra: player.currentChakra,
      newEnemyBuffs: enemy.activeBuffs,
      newPlayerBuffs: player.activeBuffs,
      logMessage: "You are stunned!",
      logType: 'danger',
      enemyDefeated: false
    };
  }

  // Execute attack
  let newPlayerHp = player.currentHp - skill.hpCost;
  let newPlayerChakra = player.currentChakra - skill.chakraCost;

  const damageResult = calculateDamage(
    playerStats.effectivePrimary,
    playerStats.derived,
    enemyStats.effectivePrimary,
    enemyStats.derived,
    skill,
    player.element,
    enemy.element
  );

  let logMsg = '';
  let newEnemyHp = enemy.currentHp;
  let newEnemyBuffs = [...enemy.activeBuffs];
  let newPlayerBuffs = [...player.activeBuffs];
  let finalDamageToEnemy = 0;

  if (damageResult.isMiss) {
    logMsg = `You used ${skill.name} but MISSED!`;
  } else if (damageResult.isEvaded) {
    logMsg = `You used ${skill.name} but ${enemy.name} EVADED!`;
  } else {
    // Apply first hit multiplier from approach if on first turn
    let modifiedDamage = damageResult.finalDamage;
    let firstHitApplied = false;

    if (combatState?.isFirstTurn && combatState.firstHitMultiplier > 1.0) {
      modifiedDamage = Math.floor(modifiedDamage * combatState.firstHitMultiplier);
      firstHitApplied = true;
    }

    // Apply terrain element amplification
    if (combatState?.terrain && player.element) {
      const terrainAmp = getTerrainElementAmplification(combatState.terrain, player.element);
      if (terrainAmp > 1.0) {
        modifiedDamage = Math.floor(modifiedDamage * terrainAmp);
      }
    }

    // Apply Mitigation Logic
    const mitigation = applyMitigation(enemy.activeBuffs, modifiedDamage, enemy.name);
    finalDamageToEnemy = mitigation.finalDamage;
    newEnemyBuffs = mitigation.updatedBuffs;

    newEnemyHp -= finalDamageToEnemy;

    // Handle Reflection
    if (mitigation.reflectedDamage > 0) {
      newPlayerHp -= mitigation.reflectedDamage;
      logMsg += ` (Reflected ${mitigation.reflectedDamage}!)`;
    }

    // Construct Log Message
    logMsg = `Used ${skill.name} for ${finalDamageToEnemy} dmg`;
    if (firstHitApplied) logMsg += " AMBUSH!";
    if (mitigation.messages.length > 0) {
      logMsg += ` [${mitigation.messages.join(', ')}]`;
    }
    if (damageResult.flatReduction > 0) logMsg += ` (${damageResult.flatReduction} blocked)`;
    if (damageResult.elementMultiplier > 1) logMsg += " SUPER EFFECTIVE!";
    else if (damageResult.elementMultiplier < 1) logMsg += " Resisted.";
    if (damageResult.isCrit) logMsg += " CRITICAL!";

    // Debug: Log damage dealt
    logDamage('Player', enemy.name, finalDamageToEnemy, {
      baseDamage: damageResult.finalDamage,
      isCrit: damageResult.isCrit,
      elementMultiplier: damageResult.elementMultiplier,
      enemyHpBefore: enemy.currentHp,
      enemyHpAfter: newEnemyHp
    });

    // Apply effects
    if (skill.effects) {
      skill.effects.forEach(eff => {
        // Self-buffs (applied to player)
        const isSelfBuff = [
          EffectType.BUFF,
          EffectType.SHIELD,
          EffectType.REFLECTION,
          EffectType.REGEN,
          EffectType.INVULNERABILITY,
          EffectType.HEAL
        ].includes(eff.type);

        if (isSelfBuff) {
          // Apply to player (self-buff always succeeds)
          const buff: Buff = { id: generateId(), name: eff.type, duration: eff.duration, effect: eff, source: skill.name };
          newPlayerBuffs.push(buff);
        } else {
          // Debuffs (applied to enemy with resistance check)
          const resisted = !resistStatus(eff.chance, enemyStats.derived.statusResistance);
          if (!resisted && finalDamageToEnemy >= 0) {
            const buff: Buff = { id: generateId(), name: eff.type, duration: eff.duration, effect: eff, source: skill.name };
            newEnemyBuffs.push(buff);
          }
        }
      });
    }
  }

  // Update cooldowns
  const newSkills = player.skills.map(s => s.id === skill.id ? { ...s, currentCooldown: s.cooldown + 1 } : s);

  const result: CombatResult = {
    damageDealt: finalDamageToEnemy,
    newEnemyHp,
    newPlayerHp,
    newPlayerChakra,
    newEnemyBuffs,
    newPlayerBuffs,
    logMessage: logMsg,
    logType: damageResult.isMiss || damageResult.isEvaded ? 'info' : 'combat',
    skillsUpdate: newSkills,
    enemyDefeated: newEnemyHp <= 0,
    playerDefeated: newPlayerHp <= 0
  };

  logFlowCheckpoint('useSkill END', {
    damageDealt: result.damageDealt,
    enemyDefeated: result.enemyDefeated,
    playerDefeated: result.playerDefeated,
    newEnemyHp: result.newEnemyHp
  });

  return result;
};

/**
 * Process upkeep phase at the start of player's turn
 * - Deducts toggle skill upkeep costs (chakra or HP)
 * - Auto-deactivates toggles if player can't afford upkeep
 * - Applies passive skill regeneration bonuses
 */
export function processUpkeep(
  player: Player,
  playerStats: CharacterStats
): UpkeepResult {
  let updatedPlayer = { ...player };
  const logs: string[] = [];
  const togglesDeactivated: string[] = [];

  // Process toggle upkeep costs
  updatedPlayer.skills = updatedPlayer.skills.map(skill => {
    if (!skill.isToggle || !skill.isActive) return skill;

    const upkeepCost = skill.upkeepCost || 0;
    if (upkeepCost <= 0) return skill;

    // Check if player can afford upkeep
    if (updatedPlayer.currentChakra >= upkeepCost) {
      // Pay upkeep cost
      updatedPlayer.currentChakra -= upkeepCost;
      logs.push(`${skill.name} upkeep: -${upkeepCost} CP`);
      return skill;
    } else {
      // Cannot afford - deactivate toggle
      logs.push(`${skill.name} deactivated (insufficient chakra)`);
      togglesDeactivated.push(skill.name);

      // Remove buffs from this toggle
      updatedPlayer.activeBuffs = updatedPlayer.activeBuffs.filter(
        buff => buff.source !== skill.name
      );

      return { ...skill, isActive: false };
    }
  });

  // Apply passive skill regeneration
  const passiveSkills = updatedPlayer.skills.filter(
    s => s.actionType === ActionType.PASSIVE && s.passiveEffect?.regenBonus
  );

  for (const skill of passiveSkills) {
    const regen = skill.passiveEffect?.regenBonus;
    if (regen?.hp && regen.hp > 0) {
      const healAmount = Math.min(regen.hp, playerStats.derived.maxHp - updatedPlayer.currentHp);
      if (healAmount > 0) {
        updatedPlayer.currentHp += healAmount;
        logs.push(`${skill.name}: +${healAmount} HP`);
      }
    }
    if (regen?.chakra && regen.chakra > 0) {
      const chakraAmount = Math.min(regen.chakra, playerStats.derived.maxChakra - updatedPlayer.currentChakra);
      if (chakraAmount > 0) {
        updatedPlayer.currentChakra += chakraAmount;
        logs.push(`${skill.name}: +${chakraAmount} CP`);
      }
    }
  }

  return {
    player: updatedPlayer,
    logs,
    togglesDeactivated
  };
}

// ============================================================================
// ENEMY TURN
// ============================================================================

/**
 * Processes the enemy's turn in combat.
 * This is the most complex function in the combat system, handling multiple
 * phases of turn processing in a specific order.
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
export const processEnemyTurn = (
  player: Player,
  playerStats: CharacterStats,
  enemy: Enemy,
  enemyStats: CharacterStats,
  combatState?: CombatState
): EnemyTurnResult => {
  combatLog('turn', `=== ENEMY TURN START: ${enemy.name} ===`, {
    enemyHp: enemy.currentHp,
    playerHp: player.currentHp
  });

  let updatedPlayer = { ...player };
  let updatedEnemy = { ...enemy };
  const logs: string[] = [];

  // Track if guts has been used this turn (can only trigger once per turn)
  let gutsTriggeredThisTurn = false;

  // 1. Process DoTs & REGEN on ENEMY
  updatedEnemy.activeBuffs.forEach(buff => {
    if (!buff?.effect) return; // Skip malformed buffs
    // Damage Over Time
    if ([EffectType.DOT, EffectType.BLEED, EffectType.BURN, EffectType.POISON].includes(buff.effect.type) && buff.effect.value) {
      const dotDmg = calculateDotDamage(buff.effect.value, buff.effect.damageType, buff.effect.damageProperty, enemyStats.derived);
      updatedEnemy.currentHp -= dotDmg;
      logs.push(`${enemy.name} took ${dotDmg} ${buff.name} damage!`);
    }
    // Regeneration
    if (buff.effect.type === EffectType.REGEN && buff.effect.value) {
      const healAmt = Math.floor(buff.effect.value);
      updatedEnemy.currentHp += healAmt;
      logs.push(`${enemy.name} regenerated ${healAmt} HP.`);
    }
  });
  updatedEnemy.activeBuffs = tickBuffDurations(updatedEnemy.activeBuffs);

  // 2. Process DoTs & REGEN on PLAYER
  updatedPlayer.activeBuffs.forEach(buff => {
    if (!buff?.effect) return; // Skip malformed buffs
    // Damage Over Time
    if ([EffectType.DOT, EffectType.BLEED, EffectType.BURN, EffectType.POISON].includes(buff.effect.type) && buff.effect.value) {
      const dotDmg = calculateDotDamage(buff.effect.value, buff.effect.damageType, buff.effect.damageProperty, playerStats.derived);

      // Mitigate DoT with Shield
      const mitigation = applyMitigation(updatedPlayer.activeBuffs, dotDmg, "You");
      updatedPlayer.activeBuffs = mitigation.updatedBuffs;
      updatedPlayer.currentHp -= mitigation.finalDamage;

      if (mitigation.finalDamage > 0) logs.push(`You took ${mitigation.finalDamage} ${buff.name} damage!`);
      else logs.push(`Your shield absorbed the ${buff.name}!`);
    }
    // Regeneration
    if (buff.effect.type === EffectType.REGEN && buff.effect.value) {
      const healAmt = Math.floor(buff.effect.value);
      updatedPlayer.currentHp = Math.min(playerStats.derived.maxHp, updatedPlayer.currentHp + healAmt);
      logs.push(`You regenerated ${healAmt} HP.`);
    }
  });
  updatedPlayer.activeBuffs = tickBuffDurations(updatedPlayer.activeBuffs);

  // Check deaths from DoT
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

  if (updatedPlayer.currentHp <= 0) {
    if (!gutsTriggeredThisTurn) {
      const gutsResult = checkGuts(updatedPlayer.currentHp, 0, playerStats.derived.gutsChance);
      if (!gutsResult.survived) {
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
      updatedPlayer.currentHp = 1;
      gutsTriggeredThisTurn = true;
      logs.push("GUTS! You survived a fatal blow!");
    } else {
      // Guts already used this turn, player dies
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
  }

  // Enemy action
  const isStunned = updatedEnemy.activeBuffs.some(b => b?.effect?.type === EffectType.STUN);
  const isConfused = updatedEnemy.activeBuffs.some(b => b?.effect?.type === EffectType.CONFUSION);

  if (isStunned) {
    logs.push(`${enemy.name} is stunned!`);
  } else if (isConfused && Math.random() < 0.5) {
    const confusionDmg = Math.floor(enemyStats.effectivePrimary.strength * 0.5);
    updatedEnemy.currentHp -= confusionDmg;
    logs.push(`${enemy.name} hurt itself in confusion for ${confusionDmg} damage!`);
  } else {
    // Use AI-based skill selection instead of random
    const skill = selectEnemySkill({
      enemy: updatedEnemy,
      enemyStats,
      player: updatedPlayer,
      playerStats
    });
    const damageResult = calculateDamage(
      enemyStats.effectivePrimary,
      enemyStats.derived,
      playerStats.effectivePrimary,
      playerStats.derived,
      skill,
      enemy.element,
      player.element
    );

    if (damageResult.isMiss) {
      logs.push(`${enemy.name} used ${skill.name} but MISSED!`);
    } else if (damageResult.isEvaded) {
      logs.push(`You EVADED ${enemy.name}'s ${skill.name}!`);
    } else {
      // Apply Mitigation on Player
      const mitigation = applyMitigation(updatedPlayer.activeBuffs, damageResult.finalDamage, "You");
      const finalDmg = mitigation.finalDamage;
      updatedPlayer.activeBuffs = mitigation.updatedBuffs;

      // Store HP before damage for guts message check
      const hpBeforeDamage = updatedPlayer.currentHp;

      // Check Guts before applying lethal damage
      const gutsResult = checkGuts(updatedPlayer.currentHp, finalDmg, playerStats.derived.gutsChance);

      // Check if damage would be lethal
      const wouldBeLethal = hpBeforeDamage - finalDmg <= 0;

      if (wouldBeLethal && !gutsTriggeredThisTurn) {
        if (!gutsResult.survived) {
          return {
            newPlayerHp: updatedPlayer.currentHp - finalDmg,
            newPlayerBuffs: updatedPlayer.activeBuffs,
            newEnemyHp: updatedEnemy.currentHp,
            newEnemyBuffs: updatedEnemy.activeBuffs,
            logMessages: logs,
            playerDefeated: true,
            enemyDefeated: false,
            playerSkills: updatedPlayer.skills
          };
        }
        // Guts triggered - survive at 1 HP
        updatedPlayer.currentHp = 1;
        gutsTriggeredThisTurn = true;
        logs.push("GUTS! You survived a fatal blow!");
      } else if (wouldBeLethal && gutsTriggeredThisTurn) {
        // Guts already used this turn, player dies
        return {
          newPlayerHp: updatedPlayer.currentHp - finalDmg,
          newPlayerBuffs: updatedPlayer.activeBuffs,
          newEnemyHp: updatedEnemy.currentHp,
          newEnemyBuffs: updatedEnemy.activeBuffs,
          logMessages: logs,
          playerDefeated: true,
          enemyDefeated: false,
          playerSkills: updatedPlayer.skills
        };
      } else {
        // Non-lethal damage, apply normally
        updatedPlayer.currentHp = gutsResult.newHp;
      }

      let msg = `${enemy.name} used ${skill.name} for ${finalDmg} dmg!`;
      if (mitigation.messages.length > 0) msg += ` [${mitigation.messages.join(', ')}]`;
      if (damageResult.isCrit) msg += " Crit!";
      logs.push(msg);

      // Handle Reflection
      if (mitigation.reflectedDamage > 0) {
        updatedEnemy.currentHp -= mitigation.reflectedDamage;
        logs.push(`You reflected ${mitigation.reflectedDamage} damage back!`);
      }

      // Apply enemy skill effects to player
      if (skill.effects) {
        skill.effects.forEach(eff => {
          if (eff.type !== EffectType.BUFF && eff.type !== EffectType.HEAL) {
            const resisted = !resistStatus(eff.chance, playerStats.derived.statusResistance);
            if (!resisted) {
              updatedPlayer.activeBuffs.push({ id: generateId(), name: eff.type, duration: eff.duration, effect: eff, source: 'Enemy' });
              logs.push(`You are afflicted with ${eff.type}!`);
            } else if (eff.chance > 0) {
              logs.push(`You resisted ${eff.type}!`);
            }
          }
        });
      }
    }
  }

  // Check enemy death from self-damage
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

  // Cooldowns & regen
  updatedPlayer.skills = updatedPlayer.skills.map(s => ({ ...s, currentCooldown: Math.max(0, s.currentCooldown - 1) }));
  updatedPlayer.currentChakra = Math.min(playerStats.derived.maxChakra, updatedPlayer.currentChakra + playerStats.derived.chakraRegen);

  // Apply terrain hazards at end of turn
  if (combatState?.terrain) {
    // Player hazard
    const playerHazard = applyTerrainHazard(updatedPlayer, combatState.terrain, 'You');
    if (playerHazard.log) {
      updatedPlayer.currentHp = playerHazard.newHp;
      logs.push(playerHazard.log);
    }

    // Enemy hazard
    const enemyHazard = applyTerrainHazard(updatedEnemy, combatState.terrain, enemy.name);
    if (enemyHazard.log) {
      updatedEnemy.currentHp = enemyHazard.newHp;
      logs.push(enemyHazard.log);
    }

    // Check for deaths from hazards
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

    if (updatedPlayer.currentHp <= 0) {
      if (!gutsTriggeredThisTurn) {
        const gutsResult = checkGuts(updatedPlayer.currentHp, 0, playerStats.derived.gutsChance);
        if (!gutsResult.survived) {
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
        updatedPlayer.currentHp = 1;
        gutsTriggeredThisTurn = true;
        logs.push("GUTS! You survived the hazard!");
      } else {
        // Guts already used this turn, player dies
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
    }
  }

  const finalResult: EnemyTurnResult = {
    newPlayerHp: updatedPlayer.currentHp,
    newPlayerBuffs: updatedPlayer.activeBuffs,
    newEnemyHp: updatedEnemy.currentHp,
    newEnemyBuffs: updatedEnemy.activeBuffs,
    logMessages: logs,
    playerDefeated: false,
    enemyDefeated: false,
    playerSkills: updatedPlayer.skills
  };

  combatLog('turn', `=== ENEMY TURN END ===`, {
    playerHpAfter: finalResult.newPlayerHp,
    enemyHpAfter: finalResult.newEnemyHp,
    playerDefeated: finalResult.playerDefeated,
    enemyDefeated: finalResult.enemyDefeated
  });

  return finalResult;
};

// ============================================================================
// UTILITIES
// ============================================================================

export const passTurn = (): void => {
  // This is just a signal, the actual turn passing is handled in the component
};
