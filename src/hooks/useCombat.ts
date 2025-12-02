import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import {
  Player,
  Enemy,
  Skill,
  Buff,
  EffectType,
  GameState,
} from '../game/types';
import { getEnemyFullStats } from '../game/systems/StatSystem';
import {
  processEnemyTurn,
  useSkill as useSkillCombat,
  CombatState,
  createCombatState,
  applyApproachEffects,
} from '../game/systems/CombatSystem';
import { ApproachResult, getCombatModifiers } from '../game/systems/ApproachSystem';
import { CombatRef } from '../scenes/Combat';
import { TIMING } from '../game/config';

export type TurnState = 'PLAYER' | 'ENEMY_TURN';

// Type for character stats (same structure for player and enemy)
export type FullStats = ReturnType<typeof getEnemyFullStats>;

export interface UseCombatProps {
  player: Player | null;
  playerStats: FullStats | null;
  addLog: (text: string, type?: string, details?: string) => void;
  setPlayer: React.Dispatch<React.SetStateAction<Player | null>>;
  setGameState: (state: GameState) => void;
  onVictory: (enemy: Enemy, combatState: CombatState | null) => void;

  // Shared state from useCombatExplorationState
  combatState: CombatState | null;
  setCombatState: React.Dispatch<React.SetStateAction<CombatState | null>>;
  approachResult: ApproachResult | null;
  setApproachResult: React.Dispatch<React.SetStateAction<ApproachResult | null>>;
}

export interface UseCombatReturn {
  enemy: Enemy | null;
  enemyStats: FullStats | null;
  turnState: TurnState;
  combatRef: React.RefObject<CombatRef | null>;
  setEnemy: React.Dispatch<React.SetStateAction<Enemy | null>>;
  setTurnState: React.Dispatch<React.SetStateAction<TurnState>>;
  useSkill: (skill: Skill) => void;
  startCombat: (
    newEnemy: Enemy,
    result: ApproachResult,
    playerAfterCosts: Player,
    terrain: any
  ) => void;
  resetCombat: () => void;
}

/**
 * Custom hook for managing combat state and logic
 * Extracts combat-related functionality from App.tsx
 *
 * Note: combatState/approachResult are now received via props from
 * useCombatExplorationState to break circular dependency with useExploration.
 */
export function useCombat({
  player,
  playerStats,
  addLog,
  setPlayer,
  setGameState,
  onVictory,
  // Shared state from useCombatExplorationState
  combatState,
  setCombatState,
  approachResult,
  setApproachResult,
}: UseCombatProps): UseCombatReturn {
  // Combat-only state (not shared with exploration)
  const [enemy, setEnemy] = useState<Enemy | null>(null);
  const [turnState, setTurnState] = useState<TurnState>('PLAYER');

  const combatRef = useRef<CombatRef>(null);

  // Compute enemy stats when enemy changes
  const enemyStats = useMemo(() => {
    if (!enemy) return null;
    return getEnemyFullStats(enemy);
  }, [enemy]);

  /**
   * Handle victory - called when enemy HP reaches 0
   */
  const handleVictory = useCallback(() => {
    if (enemy) {
      onVictory(enemy, combatState);
    }
  }, [enemy, combatState, onVictory]);

  /**
   * Use a skill during combat
   */
  const useSkill = useCallback(
    (skill: Skill) => {
      if (!player || !enemy || !playerStats || !enemyStats) return;

      // Handle toggle skills
      if (skill.isToggle) {
        const isActive = skill.isActive || false;

        // Check chakra cost for activation
        if (!isActive && player.currentChakra < skill.chakraCost) {
          addLog('Insufficient Chakra to activate!', 'danger');
          return;
        }

        setPlayer((prev) => {
          if (!prev) return null;
          let newBuffs = [...prev.activeBuffs];
          let newSkills = prev.skills.map((s) =>
            s.id === skill.id ? { ...s, isActive: !isActive } : s
          );
          let newChakra = prev.currentChakra;

          if (isActive) {
            // Deactivate: Remove all buffs from this skill
            newBuffs = newBuffs.filter((b) => b.source !== skill.name);
            addLog(`${skill.name} Deactivated.`, 'info');
          } else {
            // Activate: Apply effects and pay initial cost
            newChakra -= skill.chakraCost;
            if (skill.effects) {
              skill.effects.forEach((eff) => {
                const buff: Buff = {
                  id: Math.random().toString(36).substring(2, 9),
                  name: eff.type,
                  duration: eff.duration,
                  effect: eff,
                  source: skill.name,
                };
                newBuffs.push(buff);
              });
            }
            addLog(`${skill.name} Activated!`, 'gain');
          }

          return { ...prev, skills: newSkills, activeBuffs: newBuffs, currentChakra: newChakra };
        });
        setTurnState('ENEMY_TURN');
        return;
      }

      // Use CombatSystem for regular skills
      const result = useSkillCombat(
        player,
        playerStats,
        enemy,
        enemyStats,
        skill,
        combatState || undefined
      );

      if (!result) return;

      // Mark first turn as complete if applicable
      if (combatState?.isFirstTurn) {
        setCombatState((prev) => (prev ? { ...prev, isFirstTurn: false } : null));
      }

      // Apply result to game state
      addLog(result.logMessage, result.logType);

      // Spawn floating combat text
      if (result.damageDealt > 0) {
        const isCrit = result.logMessage.includes('CRITICAL');
        combatRef.current?.spawnFloatingText(
          'enemy',
          result.damageDealt.toString(),
          isCrit ? 'crit' : 'damage'
        );
      } else if (result.logMessage.includes('MISSED') || result.logMessage.includes('EVADED')) {
        combatRef.current?.spawnFloatingText('enemy', 'MISS', 'miss');
      }

      setPlayer((prev) =>
        prev
          ? {
              ...prev,
              currentHp: result.newPlayerHp,
              currentChakra: result.newPlayerChakra,
              activeBuffs: result.newPlayerBuffs,
              skills: result.skillsUpdate || prev.skills,
            }
          : null
      );

      setEnemy((prev) =>
        prev
          ? {
              ...prev,
              currentHp: result.newEnemyHp,
              activeBuffs: result.newEnemyBuffs,
            }
          : null
      );

      // Check for victory/defeat
      if (result.enemyDefeated) {
        handleVictory();
      } else if (result.playerDefeated) {
        setGameState(GameState.GAME_OVER);
      } else {
        setTurnState('ENEMY_TURN');
      }
    },
    [player, enemy, playerStats, enemyStats, combatState, addLog, setPlayer, handleVictory, setGameState]
  );

  /**
   * Start a new combat encounter
   */
  const startCombat = useCallback(
    (
      newEnemy: Enemy,
      result: ApproachResult,
      playerAfterCosts: Player,
      terrain: any
    ) => {
      const modifiers = getCombatModifiers(result);
      const { player: preparedPlayer, enemy: preparedEnemy, logs: effectLogs } = applyApproachEffects(
        playerAfterCosts,
        newEnemy,
        modifiers
      );
      effectLogs.forEach((log) => addLog(log, 'info'));

      // Create combat state with modifiers
      const newCombatState = createCombatState(modifiers, terrain);
      setCombatState(newCombatState);
      setApproachResult(result);

      // Set up combat
      setPlayer(preparedPlayer);
      setEnemy(preparedEnemy);
      setTurnState('PLAYER');
      setGameState(GameState.COMBAT);
      addLog(`Engaged: ${newEnemy.name}`, 'danger');
    },
    [addLog, setPlayer, setGameState]
  );

  /**
   * Reset combat state (after victory/defeat)
   */
  const resetCombat = useCallback(() => {
    setEnemy(null);
    setCombatState(null);
    setApproachResult(null);
    setTurnState('PLAYER');
  }, []);

  // Enemy turn effect
  useEffect(() => {
    if (turnState === 'ENEMY_TURN' && player && enemy && playerStats && enemyStats) {
      const timer = setTimeout(() => {
        const result = processEnemyTurn(
          player,
          playerStats,
          enemy,
          enemyStats,
          combatState || undefined
        );

        result.logMessages.forEach((msg) => {
          addLog(
            msg,
            msg.includes('GUTS') ? 'gain' : msg.includes('took') ? 'combat' : 'danger'
          );
        });

        // Calculate damage dealt to player for floating text
        const playerDamageTaken = player.currentHp - result.newPlayerHp;
        if (playerDamageTaken > 0) {
          const isCrit = result.logMessages.some((m) => m.includes('Crit'));
          combatRef.current?.spawnFloatingText(
            'player',
            playerDamageTaken.toString(),
            isCrit ? 'crit' : 'damage'
          );
        } else if (
          result.logMessages.some((m) => m.includes('MISSED') || m.includes('EVADED'))
        ) {
          combatRef.current?.spawnFloatingText('player', 'MISS', 'miss');
        }

        // Check if enemy took DoT damage for floating text
        const enemyDamageTaken = enemy.currentHp - result.newEnemyHp;
        if (enemyDamageTaken > 0) {
          combatRef.current?.spawnFloatingText('enemy', enemyDamageTaken.toString(), 'damage');
        }

        // Check for player healing (regen)
        if (result.logMessages.some((m) => m.includes('regenerated'))) {
          const healMatch = result.logMessages.find((m) => m.includes('You regenerated'));
          if (healMatch) {
            const healAmount = healMatch.match(/(\d+)/)?.[1];
            if (healAmount) {
              combatRef.current?.spawnFloatingText('player', healAmount, 'heal');
            }
          }
        }

        setPlayer((prev) =>
          prev
            ? {
                ...prev,
                currentHp: result.newPlayerHp,
                activeBuffs: result.newPlayerBuffs,
                skills: result.playerSkills,
              }
            : null
        );

        setEnemy((prev) =>
          prev
            ? {
                ...prev,
                currentHp: result.newEnemyHp,
                activeBuffs: result.newEnemyBuffs,
              }
            : null
        );

        if (result.enemyDefeated) {
          handleVictory();
        } else if (result.playerDefeated) {
          setGameState(GameState.GAME_OVER);
        } else {
          setTurnState('PLAYER');
        }
      }, TIMING.ENEMY_TURN_DELAY);

      return () => clearTimeout(timer);
    }
  }, [turnState, player, enemy, playerStats, enemyStats, combatState, addLog, setPlayer, handleVictory, setGameState]);

  return {
    enemy,
    enemyStats,
    turnState,
    combatRef,
    setEnemy,
    setTurnState,
    useSkill,
    startCombat,
    resetCombat,
  };
}
