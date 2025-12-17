import { useState } from 'react';
import {
  BranchingFloor,
  BranchingRoom,
  Region,
  Location,
  LocationDeck,
  IntelPool,
  LocationCard
} from '../game/types';
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

  // Legacy branching exploration state
  branchingFloor: BranchingFloor | null;
  setBranchingFloor: React.Dispatch<React.SetStateAction<BranchingFloor | null>>;
  selectedBranchingRoom: BranchingRoom | null;
  setSelectedBranchingRoom: React.Dispatch<React.SetStateAction<BranchingRoom | null>>;
  showApproachSelector: boolean;
  setShowApproachSelector: React.Dispatch<React.SetStateAction<boolean>>;

  // Region exploration state
  region: Region | null;
  setRegion: React.Dispatch<React.SetStateAction<Region | null>>;
  selectedLocation: Location | null;
  setSelectedLocation: React.Dispatch<React.SetStateAction<Location | null>>;
  locationFloor: BranchingFloor | null;
  setLocationFloor: React.Dispatch<React.SetStateAction<BranchingFloor | null>>;

  // Card-based location selection state
  locationDeck: LocationDeck | null;
  setLocationDeck: React.Dispatch<React.SetStateAction<LocationDeck | null>>;
  intelPool: IntelPool;
  setIntelPool: React.Dispatch<React.SetStateAction<IntelPool>>;
  drawnCards: LocationCard[];
  setDrawnCards: React.Dispatch<React.SetStateAction<LocationCard[]>>;
  selectedCardIndex: number | null;
  setSelectedCardIndex: React.Dispatch<React.SetStateAction<number | null>>;

  // Location intel system state
  currentIntel: number;
  setCurrentIntel: React.Dispatch<React.SetStateAction<number>>;
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

  // Legacy branching exploration state
  const [branchingFloor, setBranchingFloor] = useState<BranchingFloor | null>(null);
  const [selectedBranchingRoom, setSelectedBranchingRoom] = useState<BranchingRoom | null>(null);
  const [showApproachSelector, setShowApproachSelector] = useState(false);

  // Region exploration state
  const [region, setRegion] = useState<Region | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [locationFloor, setLocationFloor] = useState<BranchingFloor | null>(null);

  // Card-based location selection state
  const [locationDeck, setLocationDeck] = useState<LocationDeck | null>(null);
  const [intelPool, setIntelPool] = useState<IntelPool>({ totalIntel: 0, maxIntel: 10 });
  const [drawnCards, setDrawnCards] = useState<LocationCard[]>([]);
  const [selectedCardIndex, setSelectedCardIndex] = useState<number | null>(null);

  // Location intel system state (first location starts at 50%)
  const [currentIntel, setCurrentIntel] = useState<number>(50);

  return {
    // Combat-exploration shared
    combatState,
    setCombatState,
    approachResult,
    setApproachResult,

    // Legacy branching exploration
    branchingFloor,
    setBranchingFloor,
    selectedBranchingRoom,
    setSelectedBranchingRoom,
    showApproachSelector,
    setShowApproachSelector,

    // Region exploration
    region,
    setRegion,
    selectedLocation,
    setSelectedLocation,
    locationFloor,
    setLocationFloor,

    // Card-based location selection
    locationDeck,
    setLocationDeck,
    intelPool,
    setIntelPool,
    drawnCards,
    setDrawnCards,
    selectedCardIndex,
    setSelectedCardIndex,

    // Location intel
    currentIntel,
    setCurrentIntel,
  };
}
