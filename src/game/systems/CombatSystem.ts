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

  if (damageResult.isMiss) {
    logMsg = `You used ${skill.name} but MISSED!`;
  } else if (damageResult.isEvaded) {
    logMsg = `You used ${skill.name} but ${enemy.name} EVADED!`;
  } else {
    newEnemyHp -= damageResult.finalDamage;
    logMsg = `Used ${skill.name} for ${damageResult.finalDamage} dmg`;
    if (damageResult.flatReduction > 0) logMsg += ` (${damageResult.flatReduction} blocked)`;
    if (damageResult.elementMultiplier > 1) logMsg += " SUPER EFFECTIVE!";
    else if (damageResult.elementMultiplier < 1) logMsg += " Resisted.";
    if (damageResult.isCrit) logMsg += " CRITICAL!";

    // Apply effects
    if (skill.effects) {
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
    damageDealt: damageResult.finalDamage,
    newEnemyHp,
    newPlayerHp,
    newPlayerChakra,
    newEnemyBuffs,
    newPlayerBuffs: player.activeBuffs,
    logMessage: logMsg,
    logType: damageResult.isMiss || damageResult.isEvaded ? 'info' : 'combat',
    skillsUpdate: newSkills,
    enemyDefeated: newEnemyHp <= 0
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

  // Process DoTs on enemy
  updatedEnemy.activeBuffs.forEach(buff => {
    if ([EffectType.DOT, EffectType.BLEED, EffectType.BURN, EffectType.POISON].includes(buff.effect.type) && buff.effect.value) {
      const dotDmg = calculateDotDamage(buff.effect.value, buff.effect.damageType, buff.effect.damageProperty, enemyStats.derived);
      updatedEnemy.currentHp -= dotDmg;
      logs.push(`${enemy.name} took ${dotDmg} ${buff.name} damage!`);
    }
  });
  updatedEnemy.activeBuffs = updatedEnemy.activeBuffs.filter(b => b.duration > 1 || b.duration === -1).map(b => b.duration === -1 ? b : { ...b, duration: b.duration - 1 });

  // Process DoTs on player
  updatedPlayer.activeBuffs.forEach(buff => {
    if ([EffectType.DOT, EffectType.BLEED, EffectType.BURN, EffectType.POISON].includes(buff.effect.type) && buff.effect.value) {
      const dotDmg = calculateDotDamage(buff.effect.value, buff.effect.damageType, buff.effect.damageProperty, playerStats.derived);
      updatedPlayer.currentHp -= dotDmg;
      logs.push(`You took ${dotDmg} ${buff.name} damage!`);
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
      const gutsResult = checkGuts(updatedPlayer.currentHp, damageResult.finalDamage, playerStats.derived.gutsChance);
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
      if (gutsResult.newHp === 1 && updatedPlayer.currentHp - damageResult.finalDamage <= 0) {
        logs.push("GUTS! You survived a fatal blow!");
      }
      let msg = `${enemy.name} used ${skill.name} for ${damageResult.finalDamage} dmg!`;
      if (damageResult.isCrit) msg += " Crit!";
      logs.push(msg);

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
