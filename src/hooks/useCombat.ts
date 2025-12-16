import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import {
  Player,
  Enemy,
  Skill,
  Buff,
  EffectType,
  GameState,
  ActionType,
  TurnPhaseState,
  createInitialTurnPhaseState,
} from '../game/types';
import { getEnemyFullStats } from '../game/systems/StatSystem';
import {
  processEnemyTurn,
  useSkill as useSkillCombat,
  CombatState,
  createCombatState,
  applyApproachEffects,
  processUpkeep,
} from '../game/systems/CombatWorkflowSystem';
import { ApproachResult, getCombatModifiers } from '../game/systems/ApproachSystem';
import { CombatRef } from '../scenes/Combat';
import { TIMING } from '../game/config';
import {
  logSceneEnter,
  logSceneExit,
  logTurnChange,
  logPlayerAction,
  logFlowCheckpoint,
  logCombatStart,
} from '../game/utils/combatDebug';
import { processPassivesOnCombatStart, processPassivesOnKill } from '../game/systems/EquipmentPassiveSystem';

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
  turnPhase: TurnPhaseState;
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
  autoCombatEnabled: boolean;
  setAutoCombatEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  autoPassTimeRemaining: number | null;
  endSidePhase: () => void;  // Manually end SIDE phase and go to MAIN
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
  const [turnPhase, setTurnPhase] = useState<TurnPhaseState>(createInitialTurnPhaseState());
  const [autoCombatEnabled, setAutoCombatEnabled] = useState(false);
  const [autoPassTimeRemaining, setAutoPassTimeRemaining] = useState<number | null>(null);
  const [upkeepProcessedThisTurn, setUpkeepProcessedThisTurn] = useState(false);

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
      logSceneExit('COMBAT', `Victory over ${enemy.name}`);
      logFlowCheckpoint('handleVictory called', { enemy: enemy.name, tier: enemy.tier });
      // Store enemy reference before clearing state
      const defeatedEnemy = enemy;
      // Clear enemy state immediately to prevent re-triggering
      setEnemy(null);
      setTurnState('PLAYER');
      onVictory(defeatedEnemy, combatState);
    }
  }, [enemy, combatState, onVictory]);

  /**
   * Use a skill during combat
   * Handles action type logic:
   * - SIDE: Free action, max 2 per turn, doesn't end turn
   * - MAIN: Primary action, ends turn
   * - TOGGLE: Activate/deactivate, ends turn
   * - PASSIVE: Cannot be "used" (always active)
   */
  const useSkill = useCallback(
    (skill: Skill) => {
      if (!player || !enemy || !playerStats || !enemyStats) return;

      logPlayerAction(skill.name, {
        enemyHpBefore: enemy.currentHp
      });

      // STUN blocks ALL actions (except PASSIVE which returns early anyway)
      const isStunned = player.activeBuffs.some(b => b?.effect?.type === EffectType.STUN);
      if (isStunned) {
        addLog('You are stunned and cannot act!', 'danger');
        return;
      }

      // PASSIVE skills cannot be used directly
      if (skill.actionType === ActionType.PASSIVE) {
        addLog('Passive abilities are always active!', 'info');
        return;
      }

      // SIDE action check - max 2 per turn
      if (skill.actionType === ActionType.SIDE) {
        if (turnPhase.sideActionsUsed >= turnPhase.maxSideActions) {
          addLog('You have used all your SIDE actions this turn!', 'danger');
          return;
        }
      }

      // Handle toggle skills
      if (skill.isToggle || skill.actionType === ActionType.TOGGLE) {
        const isActive = skill.isActive || false;

        // Silence blocks toggle activation (but not deactivation)
        const isSilenced = player.activeBuffs.some(b => b?.effect?.type === EffectType.SILENCE);
        if (!isActive && isSilenced) {
          addLog('Cannot activate - you are Silenced!', 'danger');
          return;
        }

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
        // Toggle activation ends turn
        setTurnState('ENEMY_TURN');
        return;
      }

      // Use CombatSystem for regular skills (MAIN and SIDE with damage)
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
        // Process on-kill passives (cooldown reset)
        if (player && enemy) {
          const onKillResult = processPassivesOnKill(player, enemy);
          if (onKillResult.logs.length > 0) {
            onKillResult.logs.forEach(log => addLog(log, 'gain'));
            // Update player skills with reset cooldowns
            setPlayer(prev => prev ? { ...prev, skills: onKillResult.player.skills } : null);
          }
        }
        handleVictory();
        setTurnState('PLAYER'); // Stop enemy turn effect from re-running
        return;
      } else if (result.playerDefeated) {
        setGameState(GameState.GAME_OVER);
      } else {
        // SIDE actions don't end turn - increment counter and stay in player turn
        if (skill.actionType === ActionType.SIDE) {
          setTurnPhase((prev) => ({
            ...prev,
            sideActionsUsed: prev.sideActionsUsed + 1,
          }));
          addLog(`SIDE action used (${turnPhase.sideActionsUsed + 1}/${turnPhase.maxSideActions})`, 'info');
          // Stay in player turn
        } else {
          // MAIN action ends turn
          setTurnState('ENEMY_TURN');
        }
      }
    },
    [player, enemy, playerStats, enemyStats, combatState, turnPhase, addLog, setPlayer, handleVictory, setGameState, setTurnState]
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
      logSceneEnter('COMBAT', {
        enemy: newEnemy.name,
        enemyTier: newEnemy.tier,
        enemyHp: newEnemy.currentHp,
        approach: result.approach
      });

      const modifiers = getCombatModifiers(result);
      let { player: preparedPlayer, enemy: preparedEnemy, logs: effectLogs } = applyApproachEffects(
        playerAfterCosts,
        newEnemy,
        modifiers
      );
      effectLogs.forEach((log) => addLog(log, 'info'));

      // Process artifact passives at combat start (shields, invuln, reflect, free skill)
      const passiveResult = processPassivesOnCombatStart(preparedPlayer, preparedEnemy);
      passiveResult.logs.forEach(log => addLog(log, 'gain'));

      // Apply passive buffs to player
      preparedPlayer = {
        ...preparedPlayer,
        activeBuffs: passiveResult.player.activeBuffs
      };

      // Create combat state with modifiers
      const newCombatState = createCombatState(modifiers, terrain);
      // Store skipFirstSkillCost from artifact passive
      newCombatState.skipFirstSkillCost = passiveResult.skipFirstSkillCost;
      setCombatState(newCombatState);
      setApproachResult(result);

      // Set up combat
      setPlayer(preparedPlayer);
      setEnemy(preparedEnemy);
      setTurnState('PLAYER');
      setGameState(GameState.COMBAT);
      addLog(`Engaged: ${newEnemy.name}`, 'danger');

      logCombatStart(
        {
          name: preparedPlayer.clan || 'Player',
          hp: preparedPlayer.currentHp,
          maxHp: preparedPlayer.currentHp, // Will be recalculated with stats
          chakra: preparedPlayer.currentChakra
        },
        {
          name: preparedEnemy.name,
          hp: preparedEnemy.currentHp,
          tier: preparedEnemy.tier
        }
      );
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

  // Auto-pass effect: When enabled and it's player's turn, count down and auto-pass
  useEffect(() => {
    if (!autoCombatEnabled || turnState !== 'PLAYER' || !enemy) {
      setAutoPassTimeRemaining(null);
      return;
    }

    // Start countdown
    setAutoPassTimeRemaining(TIMING.AUTO_PASS_DELAY);
    const startTime = Date.now();

    // Update countdown every 100ms for smooth display
    const countdownInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, TIMING.AUTO_PASS_DELAY - elapsed);
      setAutoPassTimeRemaining(remaining);
    }, 100);

    // Auto-pass after delay
    const autoPassTimer = setTimeout(() => {
      addLog('Auto-pass: Focusing on defense...', 'info');
      setTurnState('ENEMY_TURN');
    }, TIMING.AUTO_PASS_DELAY);

    return () => {
      clearTimeout(autoPassTimer);
      clearInterval(countdownInterval);
      setAutoPassTimeRemaining(null);
    };
  }, [autoCombatEnabled, turnState, enemy, addLog, setTurnState]);

  // Enemy turn effect
  useEffect(() => {
    // Safety guard: don't process if enemy is null or already defeated
    if (turnState === 'ENEMY_TURN' && player && enemy && enemy.currentHp > 0 && playerStats && enemyStats) {
      logTurnChange('PLAYER', 'ENEMY_TURN', 'Player action completed');

      const timer = setTimeout(() => {
        // Double-check enemy is still valid (may have been cleared)
        if (!enemy || enemy.currentHp <= 0) {
          logFlowCheckpoint('Enemy turn cancelled - enemy already defeated or cleared');
          setTurnState('PLAYER');
          return;
        }
        logFlowCheckpoint('Processing enemy turn', { enemy: enemy.name });
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

        // Update combatState if artifact guts was triggered (one-time per combat)
        if (result.artifactGutsTriggered) {
          setCombatState((prev) => prev ? { ...prev, artifactGutsUsed: true } : null);
        }

        if (result.enemyDefeated) {
          logFlowCheckpoint('Enemy defeated - calling handleVictory', { enemy: enemy.name });
          handleVictory();
          setTurnState('PLAYER'); // Stop the effect from re-running
          return;
        } else if (result.playerDefeated) {
          logFlowCheckpoint('Player defeated - GAME OVER');
          setGameState(GameState.GAME_OVER);
        } else {
          logTurnChange('ENEMY_TURN', 'PLAYER', 'Enemy turn completed');
          setTurnState('PLAYER');
        }
      }, TIMING.ENEMY_TURN_DELAY);

      return () => clearTimeout(timer);
    }
  }, [turnState, player, enemy, playerStats, enemyStats, combatState, addLog, setPlayer, handleVictory, setGameState, setTurnState]);

  // Process upkeep when turn changes to PLAYER (after enemy turn)
  useEffect(() => {
    if (turnState === 'PLAYER' && player && playerStats && enemy && !upkeepProcessedThisTurn) {
      // Process toggle upkeep costs and artifact turn-start passives
      const upkeepResult = processUpkeep(player, playerStats, enemy);

      // Log upkeep messages
      upkeepResult.logs.forEach((msg) => {
        const isDeactivation = msg.includes('deactivated');
        addLog(msg, isDeactivation ? 'danger' : 'info');
      });

      // Update player with upkeep results
      if (upkeepResult.player !== player) {
        setPlayer(upkeepResult.player);
      }

      // Reset turn phase for new turn
      setTurnPhase({
        phase: 'SIDE',
        sideActionsUsed: 0,
        maxSideActions: 2,
        upkeepProcessed: true,
      });
      setUpkeepProcessedThisTurn(true);
    }
  }, [turnState, player, playerStats, enemy, upkeepProcessedThisTurn, addLog, setPlayer]);

  // Reset upkeep flag when turn changes to enemy
  useEffect(() => {
    if (turnState === 'ENEMY_TURN') {
      setUpkeepProcessedThisTurn(false);
    }
  }, [turnState]);

  /**
   * Manually end SIDE phase and commit to MAIN phase
   */
  const endSidePhase = useCallback(() => {
    setTurnPhase((prev) => ({ ...prev, phase: 'MAIN' }));
  }, []);

  return {
    enemy,
    enemyStats,
    turnState,
    turnPhase,
    combatRef,
    setEnemy,
    setTurnState,
    useSkill,
    startCombat,
    resetCombat,
    autoCombatEnabled,
    setAutoCombatEnabled,
    autoPassTimeRemaining,
    endSidePhase,
  };
}
