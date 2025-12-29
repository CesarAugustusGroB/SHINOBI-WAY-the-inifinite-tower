import { useCallback } from 'react';
import {
  GameState, Player, BranchingRoom, BranchingFloor, CharacterStats,
  Location, Region, Item, Skill, LogEntry,
  TreasureActivity, TreasureHunt, Enemy,
} from '../game/types';
import {
  completeActivity,
  initializeTreasureHunt,
  addMapPiece,
  calculateTrapDamage,
  getTreasureHuntReward,
} from '../game/systems/LocationSystem';
import { generateEnemy } from '../game/systems/EnemySystem';
import { TurnState } from './useCombat';
import { LaunchProperties } from '../config/featureFlags';

/**
 * State dependencies for treasure handlers
 */
export interface TreasureHandlerState {
  currentTreasure: TreasureActivity | null;
  currentTreasureHunt: TreasureHunt | null;
  player: Player | null;
  playerStats: CharacterStats | null;
  selectedBranchingRoom: BranchingRoom | null;
  locationFloor: BranchingFloor | null;
  branchingFloor: BranchingFloor | null;
  currentDangerLevel: number;
  difficulty: number;
  region: Region | null;
  currentLocation: Location | null;
  treasureHuntReward: TreasureHuntRewardData | null;
}

/**
 * Setters for treasure handler operations
 */
export interface TreasureHandlerSetters {
  setPlayer: React.Dispatch<React.SetStateAction<Player | null>>;
  setCurrentTreasure: React.Dispatch<React.SetStateAction<TreasureActivity | null>>;
  setCurrentTreasureHunt: React.Dispatch<React.SetStateAction<TreasureHunt | null>>;
  setLocationFloor: React.Dispatch<React.SetStateAction<BranchingFloor | null>>;
  setBranchingFloor: React.Dispatch<React.SetStateAction<BranchingFloor | null>>;
  setDroppedItems: React.Dispatch<React.SetStateAction<Item[]>>;
  setDroppedSkill: React.Dispatch<React.SetStateAction<Skill | null>>;
  setTreasureHuntReward: React.Dispatch<React.SetStateAction<TreasureHuntRewardData | null>>;
  setSelectedBranchingRoom: React.Dispatch<React.SetStateAction<BranchingRoom | null>>;
  setGameState: (state: GameState) => void;
  setEnemy: (enemy: Enemy | null) => void;
  setTurnState: React.Dispatch<React.SetStateAction<TurnState>>;
  setShowApproachSelector: React.Dispatch<React.SetStateAction<boolean>>;
  setPendingArtifact: React.Dispatch<React.SetStateAction<Item | null>>;
}

/**
 * Dependencies for treasure handlers
 */
export interface TreasureHandlerDeps {
  addLog: (text: string, type?: LogEntry['type']) => void;
  returnToMap: () => void;
}

/**
 * Treasure hunt reward data structure
 */
export interface TreasureHuntRewardData {
  items: Item[];
  skills: Skill[];
  ryo: number;
  piecesCollected: number;
  wealthLevel: number;
}

/**
 * Return type for useTreasureHandlers hook
 */
export interface UseTreasureHandlersReturn {
  handleTreasureReveal: () => void;
  handleTreasureSelectItem: (index: number) => void;
  handleTreasureSelectRyo: () => void;
  handleTreasureFightGuardian: () => void;
  handleTreasureRollDice: () => void;
  handleTreasureStartHunt: () => void;
  handleTreasureDeclineHunt: () => void;
  handleTreasureHuntRewardClaim: () => void;
}

/**
 * Hook that manages all treasure system handlers.
 * Extracts treasure-related logic from App.tsx for better separation of concerns.
 */
export function useTreasureHandlers(
  state: TreasureHandlerState,
  setters: TreasureHandlerSetters,
  deps: TreasureHandlerDeps
): UseTreasureHandlersReturn {
  const {
    currentTreasure,
    currentTreasureHunt,
    player,
    playerStats,
    selectedBranchingRoom,
    locationFloor,
    branchingFloor,
    currentDangerLevel,
    difficulty,
    region,
    currentLocation,
    treasureHuntReward,
  } = state;

  const {
    setPlayer,
    setCurrentTreasure,
    setCurrentTreasureHunt,
    setLocationFloor,
    setBranchingFloor,
    setDroppedItems,
    setDroppedSkill,
    setTreasureHuntReward,
    setSelectedBranchingRoom,
    setGameState,
    setEnemy,
    setTurnState,
    setShowApproachSelector,
    setPendingArtifact,
  } = setters;

  const { addLog, returnToMap } = deps;

  // Reveal treasure choices (pay chakra)
  const handleTreasureReveal = useCallback(() => {
    if (!currentTreasure || !player) return;
    if (player.currentChakra < currentTreasure.revealCost) {
      addLog('Not enough chakra to reveal the treasure!', 'danger');
      return;
    }

    // Deduct chakra
    setPlayer(p => p ? { ...p, currentChakra: p.currentChakra - currentTreasure.revealCost } : null);

    // Update treasure to revealed state
    setCurrentTreasure(prev => prev ? { ...prev, isRevealed: true } : null);
    addLog(`Spent ${currentTreasure.revealCost} chakra to reveal the treasure contents.`, 'info');
  }, [currentTreasure, player, addLog, setPlayer, setCurrentTreasure]);

  // Select an item from treasure choices
  const handleTreasureSelectItem = useCallback((index: number) => {
    if (!currentTreasure || !player || !selectedBranchingRoom) return;
    if (index < 0 || index >= currentTreasure.choices.length) return;

    const selectedItem = currentTreasure.choices[index].item;

    // Add ryo bonus
    if (currentTreasure.ryoBonus > 0) {
      setPlayer(p => p ? { ...p, ryo: p.ryo + currentTreasure.ryoBonus } : null);
      addLog(`Found ${currentTreasure.ryoBonus} Ryo alongside the treasure!`, 'loot');
    }

    // Complete treasure activity
    if (locationFloor) {
      const updatedFloor = completeActivity(locationFloor, selectedBranchingRoom.id, 'treasure');
      setLocationFloor(updatedFloor);
    }
    if (branchingFloor) {
      const updatedFloor = completeActivity(branchingFloor, selectedBranchingRoom.id, 'treasure');
      setBranchingFloor(updatedFloor);
    }

    // Go to loot screen with selected item
    setDroppedItems([selectedItem]);
    setDroppedSkill(null);
    setCurrentTreasure(null);
    setCurrentTreasureHunt(null);
    setSelectedBranchingRoom(null);
    setGameState(GameState.LOOT);
    addLog(`Selected ${selectedItem.name} from the treasure!`, 'loot');
  }, [currentTreasure, player, selectedBranchingRoom, locationFloor, branchingFloor, addLog,
      setPlayer, setLocationFloor, setBranchingFloor, setDroppedItems, setDroppedSkill,
      setCurrentTreasure, setCurrentTreasureHunt, setSelectedBranchingRoom, setGameState]);

  // Select ryo option instead of item
  const handleTreasureSelectRyo = useCallback(() => {
    if (!currentTreasure || !player || !selectedBranchingRoom) return;

    // Add the ryo bonus (the ryoBonus is the "take ryo instead" value)
    setPlayer(p => p ? { ...p, ryo: p.ryo + currentTreasure.ryoBonus } : null);
    addLog(`Took ${currentTreasure.ryoBonus} Ryo from the treasure.`, 'loot');

    // Complete treasure activity
    if (locationFloor) {
      const updatedFloor = completeActivity(locationFloor, selectedBranchingRoom.id, 'treasure');
      setLocationFloor(updatedFloor);
    }
    if (branchingFloor) {
      const updatedFloor = completeActivity(branchingFloor, selectedBranchingRoom.id, 'treasure');
      setBranchingFloor(updatedFloor);
    }

    // Clean up and return to map
    setCurrentTreasure(null);
    setCurrentTreasureHunt(null);
    setSelectedBranchingRoom(null);
    returnToMap();
  }, [currentTreasure, player, selectedBranchingRoom, locationFloor, branchingFloor, addLog,
      returnToMap, setPlayer, setLocationFloor, setBranchingFloor, setCurrentTreasure,
      setCurrentTreasureHunt, setSelectedBranchingRoom]);

  // Fight guardian for guaranteed map piece (treasure hunter)
  const handleTreasureFightGuardian = useCallback(() => {
    if (!currentTreasure || !currentTreasureHunt || !player || !selectedBranchingRoom || !locationFloor) return;

    // Generate a guardian enemy based on danger level
    const guardian = generateEnemy(
      currentDangerLevel,
      player.locationsCleared,
      'ELITE',
      difficulty,
      region?.arc ?? 'WAVES_ARC'
    );
    guardian.name = 'Treasure Guardian';

    // Clear any pending artifact - this is a map piece fight
    setPendingArtifact(null);

    setEnemy(guardian);
    setTurnState('PLAYER');
    setShowApproachSelector(true);
    setCurrentTreasure(null);
    // Keep currentTreasureHunt for after combat

    addLog('A guardian appears to protect the treasure map piece!', 'danger');
  }, [currentTreasure, currentTreasureHunt, player, selectedBranchingRoom, locationFloor,
      currentDangerLevel, difficulty, region, addLog, setPendingArtifact, setEnemy,
      setTurnState, setShowApproachSelector, setCurrentTreasure]);

  // Roll dice for map piece (treasure hunter)
  const handleTreasureRollDice = useCallback(() => {
    if (!currentTreasure || !currentTreasureHunt || !player || !playerStats || !selectedBranchingRoom || !locationFloor) return;

    const { trap, nothing } = LaunchProperties.TREASURE_DICE_ODDS;
    const roll = Math.random() * 100;

    if (roll < trap) {
      // Trap!
      const trapDamage = calculateTrapDamage(currentDangerLevel, playerStats.derived.maxHp);
      setPlayer(p => p ? { ...p, currentHp: Math.max(1, p.currentHp - trapDamage) } : null);
      addLog(`Trap triggered! You take ${trapDamage} damage.`, 'danger');
    } else if (roll < trap + nothing) {
      // Nothing
      addLog('The chest was empty... no map piece found.', 'info');
    } else {
      // Map piece!
      const { floor: updatedFloorWithPiece, isComplete } = addMapPiece(locationFloor);
      const newHunt = updatedFloorWithPiece.treasureHunt;

      setLocationFloor(updatedFloorWithPiece);
      setCurrentTreasureHunt(newHunt);

      if (newHunt) {
        addLog(`Found a map piece! (${newHunt.collectedPieces}/${newHunt.requiredPieces})`, 'loot');
      }

      // Check if map is complete
      if (isComplete && newHunt) {
        // Generate reward based on pieces and wealth
        const wealthLevel = currentLocation?.wealthLevel ?? 4;
        const reward = getTreasureHuntReward(newHunt.collectedPieces, wealthLevel, currentDangerLevel, difficulty);
        setTreasureHuntReward({
          items: reward.items,
          skills: reward.skills,
          ryo: reward.ryo,
          piecesCollected: newHunt.collectedPieces,
          wealthLevel,
        });

        // Complete treasure activity and show reward
        const updatedFloor = completeActivity(updatedFloorWithPiece, selectedBranchingRoom.id, 'treasure');
        setLocationFloor({ ...updatedFloor, treasureHunt: null, treasureProbabilityBoost: 0 });
        setCurrentTreasure(null);
        setCurrentTreasureHunt(null);
        setSelectedBranchingRoom(null);
        setGameState(GameState.TREASURE_HUNT_REWARD);
        return;
      }
    }

    // Complete treasure activity and return to map
    const updatedFloor = completeActivity(locationFloor, selectedBranchingRoom.id, 'treasure');
    setLocationFloor(updatedFloor);
    setCurrentTreasure(null);
    setCurrentTreasureHunt(null);
    setSelectedBranchingRoom(null);
    returnToMap();
  }, [currentTreasure, currentTreasureHunt, player, playerStats, selectedBranchingRoom,
      locationFloor, currentDangerLevel, difficulty, currentLocation, addLog, returnToMap,
      setPlayer, setLocationFloor, setCurrentTreasureHunt, setTreasureHuntReward,
      setCurrentTreasure, setSelectedBranchingRoom, setGameState]);

  // Start treasure hunt (called when first treasure room is encountered)
  const handleTreasureStartHunt = useCallback(() => {
    if (!locationFloor || !currentLocation) return;

    const updatedFloor = initializeTreasureHunt(locationFloor);
    setLocationFloor(updatedFloor);
    setCurrentTreasureHunt(updatedFloor.treasureHunt);

    if (updatedFloor.treasureHunt) {
      addLog(`Treasure hunt initiated! Collect ${updatedFloor.treasureHunt.requiredPieces} map pieces to unlock the grand treasure.`, 'gain');
    }
  }, [locationFloor, currentLocation, addLog, setLocationFloor, setCurrentTreasureHunt]);

  // Decline treasure hunt (all treasures become locked chests)
  const handleTreasureDeclineHunt = useCallback(() => {
    if (!locationFloor) return;

    // Set huntDeclined flag on floor
    const updatedFloor = { ...locationFloor, huntDeclined: true };
    setLocationFloor(updatedFloor);

    // Also update branchingFloor if it exists
    if (branchingFloor) {
      setBranchingFloor({ ...branchingFloor, huntDeclined: true });
    }

    addLog('You declined the treasure hunt. All treasure rooms will now be regular chests.', 'info');
  }, [locationFloor, branchingFloor, addLog, setLocationFloor, setBranchingFloor]);

  // Claim treasure hunt reward
  const handleTreasureHuntRewardClaim = useCallback(() => {
    if (!treasureHuntReward || !player) return;

    // Add ryo
    if (treasureHuntReward.ryo > 0) {
      setPlayer(p => p ? { ...p, ryo: p.ryo + treasureHuntReward.ryo } : null);
      addLog(`Gained ${treasureHuntReward.ryo} Ryo from the treasure map!`, 'loot');
    }

    // If there are items/skills, go to loot screen
    if (treasureHuntReward.items.length > 0 || treasureHuntReward.skills.length > 0) {
      setDroppedItems(treasureHuntReward.items);
      setDroppedSkill(treasureHuntReward.skills[0] ?? null);
      setTreasureHuntReward(null);
      setGameState(GameState.LOOT);
    } else {
      // No items, return to map
      setTreasureHuntReward(null);
      returnToMap();
    }
  }, [treasureHuntReward, player, addLog, returnToMap, setPlayer, setDroppedItems,
      setDroppedSkill, setTreasureHuntReward, setGameState]);

  return {
    handleTreasureReveal,
    handleTreasureSelectItem,
    handleTreasureSelectRyo,
    handleTreasureFightGuardian,
    handleTreasureRollDice,
    handleTreasureStartHunt,
    handleTreasureDeclineHunt,
    handleTreasureHuntRewardClaim,
  };
}
