import { useState } from 'react';
import { BranchingFloor, BranchingRoom } from '../game/types';
import { CombatState } from '../game/systems/CombatWorkflowSystem';
import { ApproachResult } from '../game/systems/ApproachSystem';

/**
 * Shared state between combat and exploration hooks.
 * This hook owns the state that both useCombat and useExploration need,
 * breaking the circular dependency between them.
 */
export interface CombatExplorationState {
  // Combat-in-exploration state
  combatState: CombatState | null;
  setCombatState: React.Dispatch<React.SetStateAction<CombatState | null>>;
  approachResult: ApproachResult | null;
  setApproachResult: React.Dispatch<React.SetStateAction<ApproachResult | null>>;

  // Exploration state
  branchingFloor: BranchingFloor | null;
  setBranchingFloor: React.Dispatch<React.SetStateAction<BranchingFloor | null>>;
  selectedBranchingRoom: BranchingRoom | null;
  setSelectedBranchingRoom: React.Dispatch<React.SetStateAction<BranchingRoom | null>>;
  showApproachSelector: boolean;
  setShowApproachSelector: React.Dispatch<React.SetStateAction<boolean>>;
}

/**
 * Hook that manages shared state between combat and exploration.
 * Used in App.tsx, then passed to both useCombat and useExploration.
 *
 * Dependency structure:
 * ```
 * App.tsx
 *   └── useCombatExplorationState() ← owns shared state
 *         ├── useCombat(sharedState)
 *         └── useExploration(sharedState)
 * ```
 */
export function useCombatExplorationState(): CombatExplorationState {
  // Combat-in-exploration state (needed by both hooks)
  const [combatState, setCombatState] = useState<CombatState | null>(null);
  const [approachResult, setApproachResult] = useState<ApproachResult | null>(null);

  // Exploration state
  const [branchingFloor, setBranchingFloor] = useState<BranchingFloor | null>(null);
  const [selectedBranchingRoom, setSelectedBranchingRoom] = useState<BranchingRoom | null>(null);
  const [showApproachSelector, setShowApproachSelector] = useState(false);

  return {
    // Combat-exploration shared
    combatState,
    setCombatState,
    approachResult,
    setApproachResult,

    // Exploration
    branchingFloor,
    setBranchingFloor,
    selectedBranchingRoom,
    setSelectedBranchingRoom,
    showApproachSelector,
    setShowApproachSelector,
  };
}
