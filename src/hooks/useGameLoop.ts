import { useEffect } from 'react';
import { Player, Enemy, CharacterStats } from '../game/types';
import { processEnemyTurn } from '../game/systems/CombatSystem';

interface UseGameLoopProps {
  turnState: 'PLAYER' | 'ENEMY_TURN';
  player: Player | null;
  enemy: Enemy | null;
  playerStats: CharacterStats | null;
  enemyStats: CharacterStats | null;
  onEnemyTurnProcessed: (result: any) => void;
  onPlayerDefeated: () => void;
  onEnemyDefeated: () => void;
}

/**
 * Handles the enemy turn delay and processing
 * Encapsulates the game loop logic for better code organization
 */
export const useGameLoop = ({
  turnState,
  player,
  enemy,
  playerStats,
  enemyStats,
  onEnemyTurnProcessed,
  onPlayerDefeated,
  onEnemyDefeated
}: UseGameLoopProps) => {
  useEffect(() => {
    if (turnState === 'ENEMY_TURN' && player && enemy && playerStats && enemyStats) {
      const timer = setTimeout(() => {
        const result = processEnemyTurn(player, playerStats, enemy, enemyStats);
        onEnemyTurnProcessed(result);

        if (result.enemyDefeated) {
          onEnemyDefeated();
        } else if (result.playerDefeated) {
          onPlayerDefeated();
        }
      }, 800);

      return () => clearTimeout(timer);
    }
  }, [turnState, player, enemy, playerStats, enemyStats, onEnemyTurnProcessed, onPlayerDefeated, onEnemyDefeated]);
};
