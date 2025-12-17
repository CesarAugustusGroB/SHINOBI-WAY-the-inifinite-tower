/**
 * =============================================================================
 * PLAYER TURN SYSTEM - Player Turn Processing
 * =============================================================================
 *
 * This system handles player turn processing including:
 * - Skill execution (useSkill)
 * - Approach effect application at combat start
 * - Upkeep processing (toggle costs, passive regen)
 *
 * ## PLAYER TURN ORDER
 *
 * 1. Upkeep Phase (processUpkeep):
 *    - Deduct toggle skill upkeep costs
 *    - Auto-deactivate toggles if insufficient resources
 *    - Apply passive skill regeneration
 *    - Apply artifact turn-start passives
 *
 * 2. Action Phase (useSkill):
 *    - Resource validation (chakra, HP costs)
 *    - Stun check
 *    - Damage calculation
 *    - First hit multiplier from approach
 *    - Terrain element amplification
 *    - Damage mitigation on enemy
 *    - Effect application with resistance checks
 *    - Cooldown update
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
  ActionType,
} from '../types';
import {
  calculateDamage,
  resistStatus,
} from './StatSystem';
import { CombatModifiers } from './ApproachSystem';
import { logFlowCheckpoint, logDamage } from '../utils/combatDebug';
import {
  generateId,
  applyMitigation,
  getTerrainElementAmplification,
} from './CombatCalculationSystem';
import {
  processPassivesOnHit,
  processPassivesOnTurnStart,
  checkExecuteThreshold,
} from './EquipmentPassiveSystem';
import type { CombatState, CombatResult, UpkeepResult } from './combat-types';

// ============================================================================
// APPROACH EFFECTS
// ============================================================================

/**
 * Apply approach buffs/debuffs at combat start.
 * Called once when combat begins after player selects an approach.
 *
 * @param player - Current player state
 * @param enemy - Current enemy state
 * @param modifiers - Combat modifiers from the selected approach
 * @returns Updated player and enemy states with approach effects applied
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
// UPKEEP PROCESSING
// ============================================================================

/**
 * Process upkeep phase at the start of player's turn.
 * - Deducts toggle skill upkeep costs (chakra or HP)
 * - Auto-deactivates toggles if player can't afford upkeep
 * - Applies passive skill regeneration bonuses
 * - Applies artifact turn-start passives (regen, chakra restore)
 *
 * @param player - Current player state
 * @param playerStats - Calculated player stats
 * @param enemy - Current enemy (optional, for artifact passives)
 * @returns Updated player state and log messages
 */
export function processUpkeep(
  player: Player,
  playerStats: CharacterStats,
  enemy?: Enemy
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

  // Apply artifact turn-start passives (REGEN, CHAKRA_RESTORE)
  if (enemy) {
    const turnStartResult = processPassivesOnTurnStart(updatedPlayer, enemy);

    // Apply regen from artifact passives
    if (turnStartResult.healToPlayer > 0) {
      const healAmount = Math.min(turnStartResult.healToPlayer, playerStats.derived.maxHp - updatedPlayer.currentHp);
      if (healAmount > 0) {
        updatedPlayer.currentHp += healAmount;
      }
    }

    // Apply chakra restore from artifact passives
    if (turnStartResult.chakraRestored > 0) {
      const chakraAmount = Math.min(turnStartResult.chakraRestored, playerStats.derived.maxChakra - updatedPlayer.currentChakra);
      if (chakraAmount > 0) {
        updatedPlayer.currentChakra += chakraAmount;
      }
    }

    // Add artifact passive logs
    logs.push(...turnStartResult.logs);
  }

  return {
    player: updatedPlayer,
    logs,
    togglesDeactivated
  };
}

// ============================================================================
// SKILL EXECUTION
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
export function useSkill(
  player: Player,
  playerStats: CharacterStats,
  enemy: Enemy,
  enemyStats: CharacterStats,
  skill: Skill,
  combatState?: CombatState
): CombatResult | null {
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
  // Check for FREE_FIRST_SKILL artifact passive - skip chakra cost on first turn
  const skipCost = combatState?.skipFirstSkillCost && combatState?.isFirstTurn;
  let newPlayerChakra = skipCost ? player.currentChakra : player.currentChakra - skill.chakraCost;

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

    // Check execute threshold (instant kill at low HP)
    const enemyMaxHp = enemyStats.derived.maxHp;
    if (checkExecuteThreshold(player, enemy, enemyMaxHp)) {
      finalDamageToEnemy = enemy.currentHp; // Kill
    }

    newEnemyHp -= finalDamageToEnemy;

    // Process artifact on-hit passives (bleed, burn, lifesteal, etc.)
    const onHitResult = processPassivesOnHit(player, enemy, finalDamageToEnemy, damageResult.isCrit);

    // Apply DoT debuffs from artifact passives to enemy
    const newPassiveDebuffs = onHitResult.enemy.activeBuffs.filter(
      b => !enemy.activeBuffs.some(existing => existing.id === b.id)
    );
    newEnemyBuffs = [...newEnemyBuffs, ...newPassiveDebuffs];

    // Apply lifesteal healing from artifact passives
    if (onHitResult.healToPlayer > 0) {
      newPlayerHp = Math.min(playerStats.derived.maxHp, newPlayerHp + onHitResult.healToPlayer);
    }

    // Apply chakra restore from artifact passives
    if (onHitResult.chakraRestored > 0) {
      newPlayerChakra = Math.min(playerStats.derived.maxChakra, newPlayerChakra + onHitResult.chakraRestored);
    }

    // Handle Reflection
    if (mitigation.reflectedDamage > 0) {
      newPlayerHp -= mitigation.reflectedDamage;
      logMsg += ` (Reflected ${mitigation.reflectedDamage}!)`;
    }

    // Construct Log Message
    logMsg = `Used ${skill.name} for ${finalDamageToEnemy} dmg`;
    // Add execute message
    if (checkExecuteThreshold(player, enemy, enemyMaxHp) && enemy.currentHp <= enemyMaxHp * 0.2) {
      logMsg += " EXECUTE!";
    }
    if (skipCost) logMsg += " FREE!";
    if (firstHitApplied) logMsg += " AMBUSH!";
    if (mitigation.messages.length > 0) {
      logMsg += ` [${mitigation.messages.join(', ')}]`;
    }
    if (damageResult.flatReduction > 0) logMsg += ` (${damageResult.flatReduction} blocked)`;
    if (damageResult.elementMultiplier > 1) logMsg += " SUPER EFFECTIVE!";
    else if (damageResult.elementMultiplier < 1) logMsg += " Resisted.";
    if (damageResult.isCrit) logMsg += " CRITICAL!";
    // Add artifact passive logs
    if (onHitResult.logs.length > 0) {
      logMsg += ` [${onHitResult.logs.join(', ')}]`;
    }

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
}
