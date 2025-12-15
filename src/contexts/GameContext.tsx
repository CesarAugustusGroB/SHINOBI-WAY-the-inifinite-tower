import React, { createContext, useContext, ReactNode } from 'react';
import { Player, LogEntry, Region, Location } from '../game/types';

// Type for character stats (matches getPlayerFullStats return type)
export interface PlayerStats {
  primary: import('../game/types').PrimaryAttributes;
  effectivePrimary: import('../game/types').PrimaryAttributes;
  derived: import('../game/types').DerivedStats;
  equipmentBonuses?: import('../game/types').ItemStatBonus;
}

/**
 * Game context value interface
 * Provides cross-cutting game state to all components
 */
export interface GameContextValue {
  // Player state
  player: Player | null;
  playerStats: PlayerStats | null;

  // Region-based exploration state (replaces floor)
  region: Region | null;
  currentLocation: Location | null;
  dangerLevel: number;  // 1-7 scale from current location
  difficulty: number;

  // Logging
  logs: LogEntry[];
  addLog: (text: string, type?: LogEntry['type'], details?: string) => void;
}

const GameContext = createContext<GameContextValue | null>(null);

/**
 * Custom hook to access game context
 * Throws if used outside GameProvider
 */
export function useGame(): GameContextValue {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}

/**
 * Optional hook that returns null if outside provider
 * Useful for components that may render outside the game
 */
export function useGameOptional(): GameContextValue | null {
  return useContext(GameContext);
}

/**
 * Props for GameProvider - receives values from parent (App.tsx)
 */
interface GameProviderProps {
  children: ReactNode;
  value: GameContextValue;
}

/**
 * Game provider component
 * Wraps children and provides game state from parent
 */
export function GameProvider({ children, value }: GameProviderProps): React.ReactElement {
  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export default GameContext;
