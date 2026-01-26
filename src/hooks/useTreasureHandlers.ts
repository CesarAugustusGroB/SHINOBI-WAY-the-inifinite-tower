import { useCallback } from 'react';
import {
  GameState, Player, BranchingRoom, BranchingFloor, CharacterStats,
  Location, Region, Item, Skill, LogEntry,
  TreasureActivity, TreasureHunt, Enemy, DiceRollResult,
} from '../game/types';
import {
  completeActivity,
  initializeTreasureHunt,
  addMapPiece,
  calculateTrapDamage,
  getTreasureHuntReward,
} from '../game/systems/LocationSystem';
import { addToBag } from '../game/systems/LootSystem';
import { generateEnemy } from '../game/systems/EnemySystem';
import { TurnState } from './useCombat';
import { LaunchProperties, FeatureFlags } from '../config/featureFlags';
import { simulateGameCombat } from '../game/systems/CombatSimulationService';

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
  pendingBagFullItem: PendingBagFullItem | null;
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
  setDiceRollResult: React.Dispatch<React.SetStateAction<DiceRollResult | null>>;
  setPendingBagFullItem: React.Dispatch<React.SetStateAction<PendingBagFullItem | null>>;
}

/**
 * Dependencies for treasure handlers
 */
export interface TreasureHandlerDeps {
  addLog: (text: string, type?: LogEntry['type']) => void;
  returnToMap: () => void;
  returnToMapActivityComplete: (updatedFloor?: BranchingFloor) => void;
  // Auto-combat callback for treasure guardian when ENABLE_MANUAL_COMBAT is false
  onAutoTreasureGuardianVictory?: (guardian: Enemy) => void;
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
 * Pending item when bag is full during treasure selection
 */
export interface PendingBagFullItem {
  item: Item;
  index: number;
}

/**
 * Return type for useTreasureHandlers hook
 */
export interface UseTreasureHandlersReturn {
  handleTreasureReveal: () => void;
  handleTreasureSelectItem: (index: number) => void;
  handleTreasureFightGuardian: () => void;
  handleTreasureRollDice: () => void;
  handleTreasureStartHunt: () => void;
  handleTreasureDeclineHunt: () => void;
  handleTreasureHuntRewardClaim: () => void;
  handleDiceResultContinue: () => void;
  handleBagFullSell: () => void;
  handleBagFullLeave: () => void;
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
    pendingBagFullItem,
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
    setDiceRollResult,
    setPendingBagFullItem,
  } = setters;

  const { addLog, returnToMap, returnToMapActivityComplete, onAutoTreasureGuardianVictory } = deps;

  /**
   * Helper: Complete treasure activity and return to map.
   * Extracts common logic from handleTreasureSelectItem, handleBagFullSell, handleBagFullLeave.
   */
  const completeTreasureAndReturn = useCallback(() => {
    let finalFloor: BranchingFloor | undefined;
    if (locationFloor && selectedBranchingRoom) {
      finalFloor = completeActivity(locationFloor, selectedBranchingRoom.id, 'treasure');
      setLocationFloor(finalFloor);
    }
    if (branchingFloor && selectedBranchingRoom) {
      const updatedFloor = completeActivity(branchingFloor, selectedBranchingRoom.id, 'treasure');
      setBranchingFloor(updatedFloor);
    }
    setCurrentTreasure(null);
    setCurrentTreasureHunt(null);
    returnToMapActivityComplete(finalFloor);
  }, [locationFloor, branchingFloor, selectedBranchingRoom,
      setLocationFloor, setBranchingFloor, setCurrentTreasure,
      setCurrentTreasureHunt, returnToMapActivityComplete]);

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

    // Check bag space first
    const hasBagSpace = player.bag.some(slot => slot === null);

    if (!hasBagSpace) {
      // Bag is full - show options to user instead of losing item
      setPendingBagFullItem({ item: selectedItem, index });
      return;
    }

    // Add ryo bonus
    if (currentTreasure.ryoBonus > 0) {
      setPlayer(p => p ? { ...p, ryo: p.ryo + currentTreasure.ryoBonus } : null);
      addLog(`Found ${currentTreasure.ryoBonus} Ryo alongside the treasure!`, 'loot');
    }

    // Add item directly to bag (skip loot screen)
    const updatedPlayer = addToBag(player, selectedItem);
    if (updatedPlayer) {
      setPlayer(updatedPlayer);
      addLog(`${selectedItem.name} added to your bag!`, 'loot');
    }

    // Complete activity and return to map
    completeTreasureAndReturn();
  }, [currentTreasure, player, selectedBranchingRoom, addLog,
      setPlayer, setPendingBagFullItem, completeTreasureAndReturn]);

  // Fight guardian for guaranteed map piece (treasure hunter)
  const handleTreasureFightGuardian = useCallback(() => {
    if (!currentTreasure || !currentTreasureHunt || !player || !playerStats || !selectedBranchingRoom || !locationFloor) return;

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

    // Check if manual combat is enabled
    if (FeatureFlags.ENABLE_MANUAL_COMBAT) {
      setEnemy(guardian);
      setTurnState('PLAYER');
      setShowApproachSelector(true);
      setCurrentTreasure(null);
      // Keep currentTreasureHunt for after combat

      addLog('A guardian appears to protect the treasure map piece!', 'danger');
    } else {
      // Auto-simulate treasure guardian combat
      addLog(`Engaging Treasure Guardian...`, 'danger');
      const simResult = simulateGameCombat(player, playerStats, guardian);

      // Update player HP and chakra
      setPlayer(prev => {
        if (!prev) return null;
        return {
          ...prev,
          currentHp: Math.max(1, simResult.playerHpRemaining),
          currentChakra: simResult.playerChakraRemaining,
        };
      });

      setCurrentTreasure(null);

      if (simResult.won) {
        addLog(`Victory! Defeated Treasure Guardian in ${simResult.turnsElapsed} turns.`, 'gain');
        // Set enemy for victory handler to process
        setEnemy(guardian);
        // Call victory callback if provided
        if (onAutoTreasureGuardianVictory) {
          onAutoTreasureGuardianVictory(guardian);
        }
      } else {
        addLog(`Defeated by Treasure Guardian...`, 'danger');
        setGameState(GameState.GAME_OVER);
      }
    }
  }, [currentTreasure, currentTreasureHunt, player, playerStats, selectedBranchingRoom, locationFloor,
      currentDangerLevel, difficulty, region, addLog, setPendingArtifact, setEnemy,
      setTurnState, setShowApproachSelector, setCurrentTreasure, setPlayer, setGameState,
      onAutoTreasureGuardianVictory]);

  // Roll dice for map piece (treasure hunter)
  const handleTreasureRollDice = useCallback(() => {
    if (!currentTreasure || !currentTreasureHunt || !player || !playerStats || !selectedBranchingRoom || !locationFloor) return;

    const { trap, nothing } = LaunchProperties.TREASURE_DICE_ODDS;
    const roll = Math.random() * 100;

    // Track which floor to use for completing the activity
    let floorForCompletion = locationFloor;

    if (roll < trap) {
      // Trap!
      const trapDamage = calculateTrapDamage(currentDangerLevel, playerStats.derived.maxHp);
      setPlayer(p => p ? { ...p, currentHp: Math.max(1, p.currentHp - trapDamage) } : null);
      setDiceRollResult({ type: 'trap', damage: trapDamage });
      addLog(`Trap triggered! You take ${trapDamage} damage.`, 'danger');
    } else if (roll < trap + nothing) {
      // Nothing
      setDiceRollResult({ type: 'nothing' });
      addLog('The chest was empty... no map piece found.', 'info');
    } else {
      // Map piece!
      const { floor: updatedFloorWithPiece, isComplete } = addMapPiece(locationFloor);
      const newHunt = updatedFloorWithPiece.treasureHunt;

      // Use the updated floor for completion
      floorForCompletion = updatedFloorWithPiece;
      setCurrentTreasureHunt(newHunt);

      if (newHunt) {
        setDiceRollResult({
          type: 'piece',
          piecesCollected: newHunt.collectedPieces,
          piecesRequired: newHunt.requiredPieces,
        });
        addLog(`Found a map piece! (${newHunt.collectedPieces}/${newHunt.requiredPieces})`, 'loot');
      }

      // Check if map is complete - will transition to reward after modal dismissed
      if (isComplete && newHunt) {
        // Generate reward and store it, but don't transition yet
        const wealthLevel = currentLocation?.wealthLevel ?? 4;
        const reward = getTreasureHuntReward(newHunt.collectedPieces, wealthLevel, currentDangerLevel, difficulty);
        setTreasureHuntReward({
          items: reward.items,
          skills: reward.skills,
          ryo: reward.ryo,
          piecesCollected: newHunt.collectedPieces,
          wealthLevel,
        });
        // Complete treasure activity and clear hunt
        const updatedFloor = completeActivity(updatedFloorWithPiece, selectedBranchingRoom.id, 'treasure');
        setLocationFloor({ ...updatedFloor, treasureHunt: null, treasureProbabilityBoost: 0 });
        return;
      }
    }

    // Complete treasure activity (modal will handle return to map)
    const updatedFloor = completeActivity(floorForCompletion, selectedBranchingRoom.id, 'treasure');
    setLocationFloor(updatedFloor);
  }, [currentTreasure, currentTreasureHunt, player, playerStats, selectedBranchingRoom,
      locationFloor, currentDangerLevel, difficulty, currentLocation, addLog,
      setPlayer, setLocationFloor, setCurrentTreasureHunt, setTreasureHuntReward,
      setDiceRollResult]);

  // Continue after dice roll result modal
  const handleDiceResultContinue = useCallback(() => {
    // Check if we have a pending treasure hunt reward (map complete)
    if (treasureHuntReward) {
      setDiceRollResult(null);
      setCurrentTreasure(null);
      setCurrentTreasureHunt(null);
      setSelectedBranchingRoom(null);
      setGameState(GameState.TREASURE_HUNT_REWARD);
    } else {
      // Normal flow - return to map
      setDiceRollResult(null);
      setCurrentTreasure(null);
      setCurrentTreasureHunt(null);
      setSelectedBranchingRoom(null);
      returnToMap();
    }
  }, [treasureHuntReward, returnToMap, setDiceRollResult, setCurrentTreasure,
      setCurrentTreasureHunt, setSelectedBranchingRoom, setGameState]);

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

  // Sell pending item when bag is full
  const handleBagFullSell = useCallback(() => {
    if (!pendingBagFullItem || !currentTreasure || !player || !selectedBranchingRoom) return;

    const sellValue = Math.floor(pendingBagFullItem.item.value * 0.6);

    // Add ryo bonus from treasure + sell value
    let totalRyo = sellValue;
    if (currentTreasure.ryoBonus > 0) {
      totalRyo += currentTreasure.ryoBonus;
    }
    setPlayer(p => p ? { ...p, ryo: p.ryo + totalRyo } : null);
    addLog(`Sold ${pendingBagFullItem.item.name} for ${sellValue} Ryo.`, 'loot');
    if (currentTreasure.ryoBonus > 0) {
      addLog(`Found ${currentTreasure.ryoBonus} Ryo alongside the treasure!`, 'loot');
    }

    // Clear pending state and complete activity
    setPendingBagFullItem(null);
    completeTreasureAndReturn();
  }, [pendingBagFullItem, currentTreasure, player, selectedBranchingRoom,
      addLog, setPlayer, setPendingBagFullItem, completeTreasureAndReturn]);

  // Leave pending item behind when bag is full
  const handleBagFullLeave = useCallback(() => {
    if (!pendingBagFullItem || !currentTreasure || !player || !selectedBranchingRoom) return;

    addLog(`Left ${pendingBagFullItem.item.name} behind.`, 'info');

    // Add ryo bonus if any
    if (currentTreasure.ryoBonus > 0) {
      setPlayer(p => p ? { ...p, ryo: p.ryo + currentTreasure.ryoBonus } : null);
      addLog(`Found ${currentTreasure.ryoBonus} Ryo alongside the treasure!`, 'loot');
    }

    // Clear pending state and complete activity
    setPendingBagFullItem(null);
    completeTreasureAndReturn();
  }, [pendingBagFullItem, currentTreasure, player, selectedBranchingRoom,
      addLog, setPlayer, setPendingBagFullItem, completeTreasureAndReturn]);

  return {
    handleTreasureReveal,
    handleTreasureSelectItem,
    handleTreasureFightGuardian,
    handleTreasureRollDice,
    handleTreasureStartHunt,
    handleTreasureDeclineHunt,
    handleTreasureHuntRewardClaim,
    handleDiceResultContinue,
    handleBagFullSell,
    handleBagFullLeave,
  };
}
