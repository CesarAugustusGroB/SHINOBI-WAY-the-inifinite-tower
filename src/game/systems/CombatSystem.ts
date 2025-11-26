import {
  Player,
  Enemy,
  Skill,
  EffectType,
  Buff,
  CharacterStats,
  DamageResult
} from '../types';
import {
  calculateDamage,
  checkGuts,
  resistStatus,
  calculateDotDamage
} from './StatSystem';

const generateId = () => Math.random().toString(36).substring(2, 9);

// ============================================================================
// DAMAGE MITIGATION HELPER
// Handles Shields, Invulnerability, Curses, and Reflection
// ============================================================================
interface MitigationResult {
  finalDamage: number;
  reflectedDamage: number;
  updatedBuffs: Buff[];
  messages: string[];
}

const applyMitigation = (
  targetBuffs: Buff[],
  incomingDamage: number,
  targetName: string
): MitigationResult => {
  let damage = incomingDamage;
  let reflected = 0;
  let currentBuffs = [...targetBuffs];
  const messages: string[] = [];

  // 1. Check Invulnerability (Blocks all damage)
  if (currentBuffs.some(b => b.effect.type === EffectType.INVULNERABILITY)) {
    return { finalDamage: 0, reflectedDamage: 0, updatedBuffs: currentBuffs, messages: [`${targetName} is Invulnerable!`] };
  }

  // 2. Check Curse (Damage Amplification)
  const curse = currentBuffs.find(b => b.effect.type === EffectType.CURSE);
  if (curse && curse.effect.value) {
    const bonusDmg = Math.floor(damage * curse.effect.value);
    damage += bonusDmg;
    messages.push(`${targetName} takes extra damage from Curse!`);
  }

  // 3. Check Reflection (Thorns)
  const reflect = currentBuffs.find(b => b.effect.type === EffectType.REFLECTION);
  if (reflect && reflect.effect.value) {
    reflected = Math.floor(damage * reflect.effect.value);
    if (reflected > 0) messages.push(`${targetName} reflects ${reflected} damage!`);
  }

  // 4. Check Shields (Damage Absorption)
  const shieldIndex = currentBuffs.findIndex(b => b.effect.type === EffectType.SHIELD);
  if (shieldIndex !== -1 && damage > 0) {
    const shieldBuff = { ...currentBuffs[shieldIndex] };
    const shieldVal = shieldBuff.effect.value || 0;

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

export interface CombatResult {
  damageDealt: number;
  newEnemyHp: number;
  newPlayerHp: number;
  newPlayerChakra: number;
  newEnemyBuffs: Buff[];
  newPlayerBuffs: Buff[];
  logMessage: string;
  logType: 'info' | 'combat' | 'gain' | 'danger';
  skillsUpdate?: Skill[];
  enemyDefeated: boolean;
  playerDefeated?: boolean; // Added for reflection kills
}

export const useSkill = (
  player: Player,
  playerStats: CharacterStats,
  enemy: Enemy,
  enemyStats: CharacterStats,
  skill: Skill
): CombatResult | null => {
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

  const isStunned = player.activeBuffs.some(b => b.effect.type === EffectType.STUN);
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
    // Apply Mitigation Logic
    const mitigation = applyMitigation(enemy.activeBuffs, damageResult.finalDamage, enemy.name);
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
    if (mitigation.messages.length > 0) {
      logMsg += ` [${mitigation.messages.join(', ')}]`;
    }
    if (damageResult.flatReduction > 0) logMsg += ` (${damageResult.flatReduction} blocked)`;
    if (damageResult.elementMultiplier > 1) logMsg += " SUPER EFFECTIVE!";
    else if (damageResult.elementMultiplier < 1) logMsg += " Resisted.";
    if (damageResult.isCrit) logMsg += " CRITICAL!";

    // Apply effects
    if (skill.effects && finalDamageToEnemy >= 0) {
      skill.effects.forEach(eff => {
        const resisted = eff.type !== EffectType.BUFF && eff.type !== EffectType.HEAL && !resistStatus(eff.chance, enemyStats.derived.statusResistance);
        if (!resisted) {
          if (eff.type !== EffectType.BUFF && eff.type !== EffectType.HEAL) {
            const buff: Buff = { id: generateId(), name: eff.type, duration: eff.duration, effect: eff, source: skill.name };
            newEnemyBuffs.push(buff);
          }
        }
      });
    }
  }

  // Update cooldowns
  const newSkills = player.skills.map(s => s.id === skill.id ? { ...s, currentCooldown: s.cooldown + 1 } : s);

  return {
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
};

export interface EnemyTurnResult {
  newPlayerHp: number;
  newPlayerBuffs: Buff[];
  newEnemyHp: number;
  newEnemyBuffs: Buff[];
  logMessages: string[];
  playerDefeated: boolean;
  enemyDefeated: boolean;
  playerSkills: Skill[];
}

export const processEnemyTurn = (
  player: Player,
  playerStats: CharacterStats,
  enemy: Enemy,
  enemyStats: CharacterStats
): EnemyTurnResult => {
  let updatedPlayer = { ...player };
  let updatedEnemy = { ...enemy };
  const logs: string[] = [];

  // 1. Process DoTs & REGEN on ENEMY
  updatedEnemy.activeBuffs.forEach(buff => {
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
  updatedEnemy.activeBuffs = updatedEnemy.activeBuffs.filter(b => b.duration > 1 || b.duration === -1).map(b => b.duration === -1 ? b : { ...b, duration: b.duration - 1 });

  // 2. Process DoTs & REGEN on PLAYER
  updatedPlayer.activeBuffs.forEach(buff => {
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
  updatedPlayer.activeBuffs = updatedPlayer.activeBuffs.filter(b => b.duration > 1 || b.duration === -1).map(b => b.duration === -1 ? b : { ...b, duration: b.duration - 1 });

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
    logs.push("GUTS! You survived a fatal blow!");
  }

  // Enemy action
  const isStunned = updatedEnemy.activeBuffs.some(b => b.effect.type === EffectType.STUN);
  const isConfused = updatedEnemy.activeBuffs.some(b => b.effect.type === EffectType.CONFUSION);

  if (isStunned) {
    logs.push(`${enemy.name} is stunned!`);
  } else if (isConfused && Math.random() < 0.5) {
    const confusionDmg = Math.floor(enemyStats.effectivePrimary.strength * 0.5);
    updatedEnemy.currentHp -= confusionDmg;
    logs.push(`${enemy.name} hurt itself in confusion for ${confusionDmg} damage!`);
  } else {
    const skill = updatedEnemy.skills[Math.floor(Math.random() * updatedEnemy.skills.length)];
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

      // Check Guts before applying lethal damage
      const gutsResult = checkGuts(updatedPlayer.currentHp, finalDmg, playerStats.derived.gutsChance);
      
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
      
      updatedPlayer.currentHp = gutsResult.newHp;
      if (gutsResult.newHp === 1 && (updatedPlayer.currentHp - finalDmg <= 0)) {
        logs.push("GUTS! You survived a fatal blow!");
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

  return {
    newPlayerHp: updatedPlayer.currentHp,
    newPlayerBuffs: updatedPlayer.activeBuffs,
    newEnemyHp: updatedEnemy.currentHp,
    newEnemyBuffs: updatedEnemy.activeBuffs,
    logMessages: logs,
    playerDefeated: false,
    enemyDefeated: false,
    playerSkills: updatedPlayer.skills
  };
};

export const passTurn = (): void => {
  // This is just a signal, the actual turn passing is handled in the component
};
