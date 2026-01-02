import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  GameState, Player, Clan, Skill, Enemy, Item, Rarity, DamageType,
  ApproachType, BranchingRoom, PrimaryStat, TrainingActivity, TrainingIntensity, LogEntry,
  EquipmentSlot, MAX_BAG_SLOTS, ScrollDiscoveryActivity,
  GameEvent, EventChoice, EventOutcome,
  TreasureQuality, DEFAULT_MERCHANT_SLOTS, MAX_MERCHANT_SLOTS,
  Region, Location, LocationPath,
  // Card-based location selection types
  IntelPool, LocationDeck, LocationCard, IntelRevealLevel,
  // Treasure system types
  TreasureActivity, TreasureHunt, TreasureType, DiceRollResult
} from './game/types';
import { CLAN_STATS, CLAN_START_SKILL, CLAN_GROWTH, SKILLS } from './game/constants';
import {
  calculateDerivedStats,
  getPlayerFullStats,
  canLearnSkill
} from './game/systems/StatSystem';
import { generateEnemy } from './game/systems/EnemySystem';
import {
  generateLoot,
  equipItem as equipItemFn,
  sellItem as sellItemFn,
  addToBag,
  synthesize,
  disassemble,
  upgradeComponent,
  upgradeArtifact
} from './game/systems/LootSystem';
import {
  CombatState,
  createCombatState,
  applyApproachEffects
} from './game/systems/CombatWorkflowSystem';
import {
  executeApproach,
  applyApproachCosts,
  applyEnemyHpReduction,
  getCombatModifiers
} from './game/systems/ApproachSystem';
import { TERRAIN_DEFINITIONS } from './game/constants/terrain';
import {
  moveToRoom,
  getCurrentActivity,
  completeActivity,
  getCurrentRoom,
  addMapPiece,
  getTreasureHuntReward,
} from './game/systems/LocationSystem';
import {
  generateRegion,
  enterLocation,
  enterLocationFromCard,
  getCurrentLocation,
  choosePath,
  getRandomPath,
  isRegionComplete,
  locationToBranchingFloor,
  markLocationComplete,
  exitLocation,
  calculateLocationXP,
  calculateLocationRyo,
  // Card-based location selection functions
  initializeLocationDeck,
  drawLocationCards,
  createInitialIntelPool,
  addIntel,
  updateDeckAfterCompletion,
  // Wealth and intel system functions
  INTEL_GAIN,
  evaluateIntel,
} from './game/systems/RegionSystem';
import {
  dangerToFloor,
  calculateMerchantRerollCost,
  applyWealthToRyo,
  getMerchantDiscount,
} from './game/systems/ScalingSystem';
import { LAND_OF_WAVES_CONFIG } from './game/constants/regions';
import { resolveEventChoice } from './game/systems/EventSystem';
import { useCombat } from './hooks/useCombat';
import { useCombatExplorationState } from './hooks/useCombatExplorationState';
import { useExploration, ActivitySceneSetters } from './hooks/useExploration';
import { useTreasureHandlers, TreasureHuntRewardData } from './hooks/useTreasureHandlers';
import { GameProvider, GameContextValue } from './contexts/GameContext';
import { LIMITS, MERCHANT } from './game/config';
import MainMenu from './scenes/MainMenu';
import CharacterSelect from './scenes/CharacterSelect';
import Combat from './scenes/Combat';
import Event from './scenes/Event';
import EliteChallenge from './scenes/EliteChallenge';
import Loot from './scenes/Loot';
import Merchant from './scenes/Merchant';
import Training from './scenes/Training';
import ScrollDiscovery from './scenes/ScrollDiscovery';
import TreasureChoice from './scenes/TreasureChoice';
import TreasureHuntRewardScene from './scenes/TreasureHuntReward';
import DiceRollResultModal from './components/modals/DiceRollResultModal';
import GameOver from './scenes/GameOver';
import GameGuide from './scenes/GameGuide';
import AssetCompanion from './scenes/AssetCompanion';
import { attemptEliteEscape } from './game/systems/EliteChallengeSystem';
// Shared components
import ErrorBoundary from './components/shared/ErrorBoundary';
// Layout components
import LeftSidebarPanel from './components/layout/LeftSidebarPanel';
import RightSidebarPanel from './components/layout/RightSidebarPanel';
// Combat components
import ApproachSelector from './components/combat/ApproachSelector';
// Exploration components
import LocationMap from './components/exploration/LocationMap';
import RegionMap from './components/exploration/RegionMap';
// PathChoiceModal removed - cards now replace path selection modal
// Character components
import PlayerHUD from './components/character/PlayerHUD';
// Modal components
import RewardModal from './components/modals/RewardModal';
import EventResultModal from './components/modals/EventResultModal';
import { logVictory, logRewardModal, logFlowCheckpoint } from './game/utils/combatDebug';
import {
  logRoomEnter, logRoomExit, logRoomSelect,
  logActivityStart, logActivityComplete,
  logModalOpen, logModalClose,
  logStateChange, logExplorationCheckpoint,
  // Region debug functions
  logLocationSelect, logLocationEnter, logLocationLeave,
  logIntelMissionStart, logIntelMissionVictory, logIntelMissionSkip,
  logPathChoice, logPathRandom, logInitialCardDraw,
  logIntelGain, logIntelReset
} from './game/utils/explorationDebug';
import { FeatureFlags, LaunchProperties } from './config/featureFlags';

// Import the parchment background styles
import './App.css';

const App: React.FC = () => {
  // --- Core State ---
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [player, setPlayer] = useState<Player | null>(null);
  const [droppedItems, setDroppedItems] = useState<Item[]>([]);
  const [droppedSkill, setDroppedSkill] = useState<Skill | null>(null);
  const [activeEvent, setActiveEvent] = useState<GameEvent | null>(null);
  const [eventOutcome, setEventOutcome] = useState<{
    message: string;
    outcome: EventOutcome;
    logType: 'gain' | 'danger' | 'info' | 'loot';
  } | null>(null);
  const [difficulty, setDifficulty] = useState<number>(40);
  const [isProcessingLoot, setIsProcessingLoot] = useState(false);
  const [merchantItems, setMerchantItems] = useState<Item[]>([]);
  const [merchantDiscount, setMerchantDiscount] = useState<number>(0);
  const [trainingData, setTrainingData] = useState<TrainingActivity | null>(null);
  const [scrollDiscoveryData, setScrollDiscoveryData] = useState<ScrollDiscoveryActivity | null>(null);
  const [pendingArtifact, setPendingArtifact] = useState<Item | null>(null);
  const [selectedComponent, setSelectedComponent] = useState<Item | null>(null);
  const [eliteChallengeData, setEliteChallengeData] = useState<{
    enemy: Enemy;
    artifact: Item;
    room: BranchingRoom;
  } | null>(null);
  // Treasure system state
  const [currentTreasure, setCurrentTreasure] = useState<TreasureActivity | null>(null);
  const [currentTreasureHunt, setCurrentTreasureHunt] = useState<TreasureHunt | null>(null);
  const [treasureHuntReward, setTreasureHuntReward] = useState<TreasureHuntRewardData | null>(null);
  const [diceRollResult, setDiceRollResult] = useState<DiceRollResult | null>(null);
  const [combatReward, setCombatReward] = useState<{
    expGain: number;
    ryoGain: number;
    levelUp?: { oldLevel: number; newLevel: number; statGains: Record<string, number> };
  } | null>(null);
  const logIdCounter = useRef<number>(0);

  // --- Shared Combat/Exploration State ---
  // This hook owns state needed by both useCombat and useExploration
  // Including: combat state, branching floor, region exploration, and card-based location selection
  const sharedExplorationState = useCombatExplorationState();

  // Destructure for local use in App.tsx (read-only access mostly)
  const {
    combatState, setCombatState,
    approachResult, setApproachResult,
    branchingFloor, setBranchingFloor,
    selectedBranchingRoom, setSelectedBranchingRoom,
    showApproachSelector, setShowApproachSelector,
    region, setRegion,
    selectedLocation, setSelectedLocation,
    locationFloor, setLocationFloor,
    locationDeck, setLocationDeck,
    intelPool, setIntelPool,
    drawnCards, setDrawnCards,
    selectedCardIndex, setSelectedCardIndex,
    currentIntel, setCurrentIntel,
  } = sharedExplorationState;

  const addLog = useCallback((text: string, type: LogEntry['type'] = 'info', details?: string) => {
    setLogs(prev => {
      logIdCounter.current += 1;
      const newEntry: LogEntry = { id: logIdCounter.current, text, type, details };
      const newLogs = [...prev, newEntry];
      if (newLogs.length > LIMITS.MAX_LOG_ENTRIES) newLogs.shift();
      return newLogs;
    });
  }, []);

  const playerStats = useMemo(() => {
    if (!player) return null;
    return getPlayerFullStats(player);
  }, [player]);

  // Compute current location and danger level from region state
  const currentLocation = useMemo(() => {
    if (!region) return null;
    return getCurrentLocation(region) ?? null;
  }, [region]);

  const currentDangerLevel = useMemo(() => {
    return currentLocation?.dangerLevel ?? 1;
  }, [currentLocation]);

  const currentBaseDifficulty = useMemo(() => {
    return region?.baseDifficulty ?? difficulty;
  }, [region, difficulty]);

  // Create game context value for child components
  const gameContextValue = useMemo((): GameContextValue => ({
    player,
    playerStats,
    region,
    currentLocation,
    dangerLevel: currentDangerLevel,
    difficulty,
    logs,
    addLog,
  }), [player, playerStats, region, currentLocation, currentDangerLevel, difficulty, logs, addLog]);

  // Victory handler for combat hook
  const handleCombatVictory = useCallback((defeatedEnemy: Enemy, combatStateAtVictory: CombatState | null) => {
    logFlowCheckpoint('handleCombatVictory START', {
      enemy: defeatedEnemy.name,
      tier: defeatedEnemy.tier,
      dangerLevel: currentDangerLevel
    });

    addLog("Enemy Defeated!", 'gain');

    // Check if this was a Treasure Guardian fight
    const wasTreasureGuardian = defeatedEnemy.name === 'Treasure Guardian' && currentTreasureHunt;

    // Determine if this was an elite challenge (check pendingArtifact)
    const wasEliteChallenge = pendingArtifact !== null;

    // Complete the appropriate activity in branching floor
    if (branchingFloor) {
      setBranchingFloor(prevFloor => {
        if (!prevFloor) return prevFloor;
        const combatRoom = getCurrentRoom(prevFloor);  // Uses currentRoomId set by moveToRoom
        if (!combatRoom) return prevFloor;

        // Mark the correct activity as completed
        const activityType = wasEliteChallenge ? 'eliteChallenge' : 'combat';
        let updatedFloor = completeActivity(prevFloor, combatRoom.id, activityType);
        if (updatedFloor.currentRoomId !== combatRoom.id) {
          updatedFloor = {
            ...updatedFloor,
            currentRoomId: combatRoom.id,
            rooms: updatedFloor.rooms.map(room => ({
              ...room,
              isCurrent: room.id === combatRoom.id,
            })),
          };
        }

        const updatedRoom = updatedFloor.rooms.find(r => r.id === combatRoom.id);
        if (updatedRoom?.isCleared && updatedRoom.isExit) {
          addLog('You cleared the exit! Proceed to the next floor?', 'gain');
        }

        return updatedFloor;
      });
    }

    // Complete the appropriate activity in location mode (using locationFloor)
    if (locationFloor && region) {
      setLocationFloor(prevFloor => {
        if (!prevFloor) return prevFloor;
        const combatRoom = getCurrentRoom(prevFloor);
        if (!combatRoom) return prevFloor;

        // Mark the correct activity as completed
        const activityType = wasEliteChallenge ? 'eliteChallenge' : 'combat';
        let updatedFloor = completeActivity(prevFloor, combatRoom.id, activityType);
        if (updatedFloor.currentRoomId !== combatRoom.id) {
          updatedFloor = {
            ...updatedFloor,
            currentRoomId: combatRoom.id,
            rooms: updatedFloor.rooms.map(room => ({
              ...room,
              isCurrent: room.id === combatRoom.id,
            })),
          };
        }

        const updatedRoom = updatedFloor.rooms.find(r => r.id === combatRoom.id);
        if (updatedRoom?.isCleared && updatedRoom.isExit) {
          addLog('Location cleared! Intel mission awaits...', 'gain');
          // Mark location as complete in region
          setRegion(markLocationComplete(region));
        }

        return updatedFloor;
      });
    }

    // Apply XP multiplier from approach
    const xpMultiplier = combatStateAtVictory?.xpMultiplier || 1.0;

    // Calculate rewards outside setPlayer so we can use them for the modal
    const isAmbush = defeatedEnemy?.tier.includes('S-Rank');
    const isGuardian = defeatedEnemy?.tier === 'Guardian';
    const enemyTier = defeatedEnemy?.tier || 'Chunin';

    const baseExp = calculateLocationXP(currentDangerLevel, currentBaseDifficulty);
    const tierBonus = isGuardian ? 300 : enemyTier === 'Jonin' ? 20 : enemyTier === 'Kage Level' ? 200 : isAmbush ? 100 : 0;
    const expGain = Math.floor((baseExp + tierBonus) * xpMultiplier);

    // Apply wealth multiplier to ryo based on current location's wealth level
    const baseRyo = calculateLocationRyo(currentDangerLevel, currentBaseDifficulty);
    const locationWealthLevel = currentLocation?.wealthLevel ?? 4;
    const ryoGain = applyWealthToRyo(baseRyo, locationWealthLevel);

    // Add intel from combat victory (+5%)
    if (region) {
      const intelGain = INTEL_GAIN.COMBAT_VICTORY;
      setCurrentIntel(prev => Math.min(100, prev + intelGain));
      logIntelGain('Combat', intelGain, Math.min(100, currentIntel + intelGain));
    }

    let levelUpInfo: { oldLevel: number; newLevel: number; statGains: Record<string, number> } | undefined;

    setPlayer(prev => {
      if (!prev) return null;

      let updatedPlayer = { ...prev, exp: prev.exp + expGain };
      addLog(`Gained ${expGain} Experience${xpMultiplier > 1 ? ` (${Math.round((xpMultiplier - 1) * 100)}% bonus!)` : ''}.`, 'info');

      const levelUpResult = checkLevelUp(updatedPlayer);
      updatedPlayer = levelUpResult.player;
      levelUpInfo = levelUpResult.levelUpInfo;

      updatedPlayer.ryo += ryoGain;
      addLog(`Gained ${ryoGain} Ryō${locationWealthLevel !== 4 ? ` (${locationWealthLevel > 4 ? 'wealthy' : 'poor'} area)` : ''}.`, 'loot');

      // Combat no longer drops items/skills - find loot in treasures, events, and scroll discoveries
      return updatedPlayer;
    });

    // Log victory rewards
    logVictory(defeatedEnemy.name, {
      xpGain: expGain,
      ryoGain: ryoGain,
      levelUp: !!levelUpInfo
    });

    // Handle Treasure Guardian victory - award guaranteed map piece
    if (wasTreasureGuardian && locationFloor) {
      const { floor: updatedFloorWithPiece, isComplete } = addMapPiece(locationFloor);
      const newHunt = updatedFloorWithPiece.treasureHunt;

      // Complete the treasure activity
      const combatRoom = selectedBranchingRoom || getCurrentRoom(updatedFloorWithPiece);
      let finalFloor = updatedFloorWithPiece;
      if (combatRoom) {
        finalFloor = completeActivity(updatedFloorWithPiece, combatRoom.id, 'treasure');
      }

      if (newHunt) {
        setDiceRollResult({
          type: 'piece',
          piecesCollected: newHunt.collectedPieces,
          piecesRequired: newHunt.requiredPieces,
        });
        addLog(`Guardian defeated! Found a map piece! (${newHunt.collectedPieces}/${newHunt.requiredPieces})`, 'loot');
      }

      // Check if map is complete
      if (isComplete && newHunt) {
        const wealthLevel = currentLocation?.wealthLevel ?? 4;
        const reward = getTreasureHuntReward(newHunt.collectedPieces, wealthLevel, currentDangerLevel, difficulty);
        setTreasureHuntReward({
          items: reward.items,
          skills: reward.skills,
          ryo: reward.ryo,
          piecesCollected: newHunt.collectedPieces,
          wealthLevel,
        });
        setLocationFloor({ ...finalFloor, treasureHunt: null, treasureProbabilityBoost: 0 });
      } else {
        setLocationFloor(finalFloor);
      }

      setCurrentTreasureHunt(newHunt);
      setCurrentTreasure(null);

      // Show combat reward modal first, then dice result modal will show after
      setCombatReward({
        expGain,
        ryoGain,
        levelUp: levelUpInfo
      });

      setTimeout(() => {
        if (region && region.currentLocationId) {
          setGameState(GameState.LOCATION_EXPLORE);
        } else {
          setGameState(GameState.EXPLORE);
        }
      }, 100);
      return;
    }

    // Show reward modal instead of returning to map immediately
    logRewardModal('show', { xpGain: expGain, ryoGain: ryoGain, levelUp: !!levelUpInfo });
    setCombatReward({
      expGain,
      ryoGain,
      levelUp: levelUpInfo
    });

    // Set game state to appropriate explore view so the modal shows on the map
    logFlowCheckpoint('Transitioning to explore with reward modal');
    setTimeout(() => {
      // Return to correct explore state based on mode
      if (region && region.currentLocationId) {
        setGameState(GameState.LOCATION_EXPLORE);
      } else {
        setGameState(GameState.EXPLORE);
      }
    }, 100);
  }, [branchingFloor, region, currentDangerLevel, currentBaseDifficulty, addLog, pendingArtifact,
      currentTreasureHunt, locationFloor, selectedBranchingRoom, currentLocation, difficulty,
      setDiceRollResult, setTreasureHuntReward, setCurrentTreasureHunt, setCurrentTreasure]);

  // Combat hook - manages enemy, turns, and combat logic
  const {
    enemy,
    enemyStats,
    turnState,
    turnPhase,
    combatRef,
    setEnemy,
    setTurnState,
    useSkill,
    autoCombatEnabled,
    setAutoCombatEnabled,
    autoPassTimeRemaining,
  } = useCombat({
    player,
    playerStats,
    addLog,
    setPlayer,
    setGameState,
    onVictory: handleCombatVictory,
    // Pass shared state from useCombatExplorationState
    combatState,
    setCombatState,
    approachResult,
    setApproachResult,
  });

  // Activity scene setters for useExploration hook
  const activitySetters: ActivitySceneSetters = {
    setMerchantItems,
    setMerchantDiscount,
    setTrainingData,
    setScrollDiscoveryData,
    setEliteChallengeData,
    setDroppedItems,
    setDroppedSkill,
    setActiveEvent,
    // Treasure system
    setCurrentTreasure,
    setCurrentTreasureHunt,
  };

  // Exploration hook - manages navigation and activity handling
  // Uses sharedExplorationState directly (no duplication)
  const {
    handleCardSelect,
    handleEnterSelectedLocation,
    handleLocationRoomSelect,
    handleLocationRoomEnter,
    handleBranchingRoomSelect,
    handleBranchingRoomEnter,
    handlePathChoice,
    handleLeaveLocation,
    returnToMap,
  } = useExploration(sharedExplorationState, {
    player,
    playerStats,
    setPlayer,
    setGameState,
    gameState,
    addLog,
    currentLocation,
    activitySetters,
    setEnemy,
  });

  // Treasure system handlers
  const {
    handleTreasureReveal,
    handleTreasureSelectItem,
    handleTreasureFightGuardian,
    handleTreasureRollDice,
    handleTreasureStartHunt,
    handleTreasureDeclineHunt,
    handleTreasureHuntRewardClaim,
    handleDiceResultContinue,
  } = useTreasureHandlers(
    {
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
    },
    {
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
    },
    {
      addLog,
      returnToMap,
    }
  );

  interface LevelUpResult {
    player: Player;
    levelUpInfo?: {
      oldLevel: number;
      newLevel: number;
      statGains: Record<string, number>;
    };
  }

  const checkLevelUp = (p: Player): LevelUpResult => {
    let currentPlayer = { ...p };
    const oldLevel = currentPlayer.level;
    const totalStatGains: Record<string, number> = {};

    while (currentPlayer.exp >= currentPlayer.maxExp) {
      currentPlayer.exp -= currentPlayer.maxExp;
      currentPlayer.level += 1;
      currentPlayer.maxExp = currentPlayer.level * 100;
      const growth = CLAN_GROWTH[currentPlayer.clan];
      const s = currentPlayer.primaryStats;

      // Accumulate stat gains
      Object.entries(growth).forEach(([stat, gain]) => {
        if (gain) {
          totalStatGains[stat] = (totalStatGains[stat] || 0) + gain;
        }
      });

      currentPlayer.primaryStats = {
        willpower: s.willpower + (growth.willpower || 0),
        chakra: s.chakra + (growth.chakra || 0),
        strength: s.strength + (growth.strength || 0),
        spirit: s.spirit + (growth.spirit || 0),
        intelligence: s.intelligence + (growth.intelligence || 0),
        calmness: s.calmness + (growth.calmness || 0),
        speed: s.speed + (growth.speed || 0),
        accuracy: s.accuracy + (growth.accuracy || 0),
        dexterity: s.dexterity + (growth.dexterity || 0)
      };
    }

    if (currentPlayer.level > oldLevel) {
      const newStats = getPlayerFullStats(currentPlayer);
      currentPlayer.currentHp = newStats.derived.maxHp;
      currentPlayer.currentChakra = newStats.derived.maxChakra;
      addLog(`LEVEL UP! You reached Level ${currentPlayer.level}. Stats increased & Fully Healed!`, 'gain');

      return {
        player: currentPlayer,
        levelUpInfo: {
          oldLevel,
          newLevel: currentPlayer.level,
          statGains: totalStatGains
        }
      };
    }

    return { player: currentPlayer };
  };

  const startGame = (clan: Clan) => {
    const baseStats = CLAN_STATS[clan];
    const startSkill = CLAN_START_SKILL[clan];
    const derived = calculateDerivedStats(baseStats, {});

    const newPlayer: Player = {
      clan,
      level: 1,
      exp: 0,
      maxExp: 100,
      primaryStats: { ...baseStats },
      currentHp: derived.maxHp,
      currentChakra: derived.maxChakra,
      element: clan === Clan.UCHIHA ? 'Fire' : clan === Clan.UZUMAKI ? 'Wind' : 'Physical' as any,
      ryo: LaunchProperties.STARTING_RYO,
      equipment: {
        [EquipmentSlot.SLOT_1]: null,
        [EquipmentSlot.SLOT_2]: null,
        [EquipmentSlot.SLOT_3]: null,
        [EquipmentSlot.SLOT_4]: null,
      },
      skills: [SKILLS.BASIC_ATTACK, SKILLS.SHURIKEN, { ...startSkill, level: 1 }],
      activeBuffs: [],
      bag: Array(MAX_BAG_SLOTS).fill(null),
      treasureQuality: TreasureQuality.BROKEN,
      merchantSlots: DEFAULT_MERCHANT_SLOTS,
      locationsCleared: 0,
    };

    setPlayer(newPlayer);
    setLogs([]);
    setEnemy(null);
    setDroppedItems([]);
    setDroppedSkill(null);
    setActiveEvent(null);
    setTurnState('PLAYER');
    setShowApproachSelector(false);
    setCombatState(null);
    setApproachResult(null);
    addLog(`Lineage chosen: ${clan}. Your journey begins in the Land of Waves...`, 'info');

    // Initialize region exploration (Land of Waves)
    const wavesRegion = generateRegion(LAND_OF_WAVES_CONFIG, difficulty, newPlayer);
    setRegion(wavesRegion);
    setBranchingFloor(null);
    setLocationFloor(null);
    setSelectedBranchingRoom(null);

    // Initialize card-based location selection
    const initialDeck = initializeLocationDeck(wavesRegion);
    const initialIntelPool = createInitialIntelPool();

    // First location starts at 50% intel - use evaluateIntel to determine card count/reveal
    const INITIAL_INTEL = 50;
    const { cardCount, revealedCount } = evaluateIntel(INITIAL_INTEL);
    logInitialCardDraw(INITIAL_INTEL, cardCount, revealedCount);

    const initialCards = drawLocationCards(wavesRegion, initialDeck, initialIntelPool, cardCount, revealedCount);
    setLocationDeck(initialDeck);
    setIntelPool(initialIntelPool);
    setDrawnCards(initialCards);
    setSelectedCardIndex(null);

    setGameState(GameState.REGION_MAP);
  };

  // Auto-skip character selection if feature flag is enabled
  useEffect(() => {
    if (FeatureFlags.SKIP_CHAR_SELECT && gameState === GameState.CHAR_SELECT) {
      startGame(LaunchProperties.DEFAULT_CLAN as Clan);
    }
  }, [gameState]);

  // Cancel approach selection
  const handleApproachCancel = () => {
    logModalClose('ApproachSelector', 'cancelled');
    setShowApproachSelector(false);
    setSelectedBranchingRoom(null);
  };

  // Handle approach selection for BRANCHING exploration combat (also works for region mode)
  const handleBranchingApproachSelect = (approach: ApproachType) => {
    // Allow either branchingFloor OR region mode
    if (!player || !playerStats || !selectedBranchingRoom || (!branchingFloor && !region)) return;
    logModalClose('ApproachSelector', `selected: ${approach}`);

    // Check for elite challenge first, then regular combat
    const eliteChallenge = selectedBranchingRoom.activities.eliteChallenge;
    const combat = selectedBranchingRoom.activities.combat;
    const isEliteChallenge = eliteChallenge && !eliteChallenge.completed;
    const targetEnemy = isEliteChallenge ? eliteChallenge.enemy : combat?.enemy;

    if (!targetEnemy) return;

    const terrain = TERRAIN_DEFINITIONS[selectedBranchingRoom.terrain];
    const result = executeApproach(
      approach,
      player,
      playerStats,
      targetEnemy,
      terrain
    );

    setApproachResult(result);
    logExplorationCheckpoint('Approach result', { approach, success: result.success, skipCombat: result.skipCombat });
    addLog(result.description, result.success ? 'gain' : 'info');

    // Apply costs
    const playerAfterCosts = applyApproachCosts(player, result);
    setPlayer(playerAfterCosts);

    if (result.skipCombat) {
      // Successfully bypassed combat - mark as completed
      logExplorationCheckpoint('Combat bypassed via approach');
      addLog('You slip past undetected!', 'gain');
      setShowApproachSelector(false);

      // Mark the appropriate activity as completed
      setBranchingFloor(prevFloor => {
        if (!prevFloor || !selectedBranchingRoom) return prevFloor;
        const activityType = isEliteChallenge ? 'eliteChallenge' : 'combat';
        return completeActivity(prevFloor, selectedBranchingRoom.id, activityType);
      });

      // Clear pending artifact if bypassing elite challenge
      if (isEliteChallenge) {
        setPendingArtifact(null);
        addLog('You bypassed the guardian but left the artifact behind...', 'info');
      }

      // Return to map
      returnToMap();
      return;
    }

    // Set up enemy with any HP reduction from approach
    let combatEnemy = targetEnemy;
    if (result.enemyHpReduction > 0) {
      combatEnemy = applyEnemyHpReduction(combatEnemy, result);
      addLog(`Your approach dealt ${Math.floor(targetEnemy.currentHp * result.enemyHpReduction)} damage!`, 'combat');
    }

    // Apply approach effects to both combatants
    const modifiers = getCombatModifiers(result);
    const { player: preparedPlayer, enemy: preparedEnemy, logs: effectLogs } = applyApproachEffects(
      playerAfterCosts,
      combatEnemy,
      modifiers
    );
    effectLogs.forEach(log => addLog(log, 'info'));

    // Create combat state with modifiers
    const newCombatState = createCombatState(modifiers, terrain);
    setCombatState(newCombatState);

    // Set up combat
    logStateChange('EXPLORE', 'COMBAT', 'approach selected - entering combat');
    setPlayer(preparedPlayer);
    setEnemy(preparedEnemy);
    setTurnState('PLAYER');
    setShowApproachSelector(false);
    setGameState(GameState.COMBAT);
    addLog(`Engaged: ${combatEnemy.name}`, 'danger');
  };

  // Branching exploration handlers moved to useExploration hook

  const handleEventChoice = (choice: EventChoice) => {
    if (!player || !playerStats) return;

    // Use the EventSystem to resolve the choice
    const result = resolveEventChoice(player, choice, playerStats);

    if (!result.success) {
      // Choice requirements not met or can't afford - show error
      addLog(result.message, 'danger');
      return;
    }

    // Apply the updated player state
    if (result.player) {
      // Check for level up after applying effects
      const leveledPlayer = checkLevelUp(result.player);
      setPlayer(leveledPlayer.player);
    }

    // Determine log type based on effects
    const logType = result.outcome?.effects.logType || (
      result.outcome?.effects.hpChange &&
      (typeof result.outcome.effects.hpChange === 'number' ? result.outcome.effects.hpChange < 0 : result.outcome.effects.hpChange.percent < 0)
        ? 'danger' : 'gain'
    );

    // Log the outcome message
    addLog(result.message || 'Choice resolved.', logType);

    // Check if combat should trigger
    if (result.triggerCombat && result.outcome?.effects.triggerCombat) {
      const combatConfig = result.outcome.effects.triggerCombat;
      // Convert floor to danger level (floors 1-3→D1, 4-6→D2, etc.) or use current danger
      const combatDangerLevel = combatConfig.floor
        ? Math.min(7, Math.max(1, Math.ceil(combatConfig.floor / 3)))
        : currentDangerLevel;
      const combatEnemy = generateEnemy(
        combatDangerLevel,
        player?.locationsCleared ?? 0,
        combatConfig.archetype as 'NORMAL' | 'ELITE' | 'BOSS' || 'NORMAL',
        combatConfig.difficulty || difficulty,
        region?.arc ?? 'WAVES_ARC'
      );
      if (combatConfig.name) {
        combatEnemy.name = combatConfig.name;
      }

      // Mark event as complete before transitioning to combat
      // (The event choice was made - combat is just a consequence)
      if (locationFloor && region) {
        const currentRoom = getCurrentRoom(locationFloor);
        if (currentRoom) {
          logActivityComplete(currentRoom.id, 'event');
          const updatedFloor = completeActivity(locationFloor, currentRoom.id, 'event');
          setLocationFloor(updatedFloor);
        }
      } else if (branchingFloor) {
        const currentRoom = getCurrentRoom(branchingFloor);
        if (currentRoom) {
          logActivityComplete(currentRoom.id, 'event');
          const updatedFloor = completeActivity(branchingFloor, currentRoom.id, 'event');
          setBranchingFloor(updatedFloor);
        }
      }

      setEnemy(combatEnemy);
      setTurnState('PLAYER');
      setActiveEvent(null);
      setGameState(GameState.COMBAT);
      return;
    }

    // Show the outcome modal instead of immediately returning to map
    if (result.outcome) {
      setEventOutcome({
        message: result.message || 'Choice resolved.',
        outcome: result.outcome,
        logType: logType as 'gain' | 'danger' | 'info' | 'loot'
      });
    }

    // Return to map (modal will show as overlay)
    setActiveEvent(null);
    // Return to correct explore state based on mode
    if (locationFloor && region && region.currentLocationId) {
      setGameState(GameState.LOCATION_EXPLORE);
    } else {
      setGameState(GameState.EXPLORE);
    }
  };

  // Handle closing the event outcome modal
  const handleEventOutcomeClose = () => {
    logModalClose('EventOutcomeModal');
    // Mark event as completed
    if (branchingFloor) {
      const currentRoom = getCurrentRoom(branchingFloor);
      if (currentRoom) {
        logActivityComplete(currentRoom.id, 'event');
        const updatedFloor = completeActivity(branchingFloor, currentRoom.id, 'event');
        setBranchingFloor(updatedFloor);
      }
    }

    // Location mode: complete event activity using locationFloor
    if (locationFloor && region) {
      const currentRoom = getCurrentRoom(locationFloor);
      if (currentRoom) {
        logActivityComplete(currentRoom.id, 'event');
        const updatedFloor = completeActivity(locationFloor, currentRoom.id, 'event');
        setLocationFloor(updatedFloor);

        // Add intel from event completion (variable based on outcome, fallback to default)
        const eventIntelGain = eventOutcome?.outcome?.effects?.intelGain ?? INTEL_GAIN.EVENT_DEFAULT;
        setCurrentIntel(prev => Math.min(100, prev + eventIntelGain));
        logIntelGain('Event', eventIntelGain, Math.min(100, currentIntel + eventIntelGain));
      }
    }

    setEventOutcome(null);
  };

  // Exploration handlers (returnToMap, handleCardSelect, handleEnterSelectedLocation,
  // handleLocationRoomSelect, handleLocationRoomEnter, handlePathChoice, handleLeaveLocation)
  // are now provided by useExploration hook

  // Close reward modal - check for pending artifact from elite challenge
  const handleRewardClose = () => {
    logRewardModal('close');
    logModalClose('RewardModal', pendingArtifact ? 'showing loot' : 'staying on map');
    setCombatReward(null);

    // If there's a pending artifact from elite challenge, show loot screen
    if (pendingArtifact) {
      logFlowCheckpoint('Pending artifact found - showing LOOT screen', { artifact: pendingArtifact.name });
      logStateChange('EXPLORE', 'LOOT', 'elite challenge artifact');
      setDroppedItems([pendingArtifact]);
      setDroppedSkill(null);
      setPendingArtifact(null);
      addLog('The artifact guardian has fallen! Claim your prize.', 'loot');
      setGameState(GameState.LOOT);
    } else {
      logFlowCheckpoint('No pending artifact - staying on BRANCHING_EXPLORE');
    }
  };

  const equipItem = (item: Item) => {
    if (!player || isProcessingLoot) return;
    setIsProcessingLoot(true);

    const result = equipItemFn(player, item);
    if (!result.success) {
      addLog(result.reason || 'Cannot equip item.', 'danger');
      setIsProcessingLoot(false);
      return;
    }

    setPlayer(result.player);
    if (result.replacedItem) {
      addLog(`Equipped ${item.name}. ${result.replacedItem.name} moved to bag.`, 'loot');
    } else {
      addLog(`Equipped ${item.name}.`, 'loot');
    }
    setTimeout(() => {
      setIsProcessingLoot(false);
      returnToMap();
    }, 100);
  };

  const learnSkill = (skill: Skill, slotIndex?: number) => {
    if (!player || !playerStats) return;

    const checkResult = canLearnSkill(skill, playerStats.effectivePrimary.intelligence, player.level, player.clan);
    if (!checkResult.canLearn) {
      addLog(`Cannot learn ${skill.name}: ${checkResult.reason}`, 'danger');
      return;
    }

    let newSkills = [...player.skills];
    const existingIndex = newSkills.findIndex(s => s.id === skill.id);

    if (existingIndex !== -1) {
      const existing = newSkills[existingIndex];
      const currentLevel = existing.level || 1;
      const growth = skill.damageMult * 0.2;
      newSkills[existingIndex] = { ...existing, level: currentLevel + 1, damageMult: existing.damageMult + growth };
      addLog(`Upgraded ${existing.name} to Level ${currentLevel + 1}!`, 'gain');
    } else {
      if (slotIndex !== undefined) {
        addLog(`Forgot ${newSkills[slotIndex].name} to learn ${skill.name}.`, 'loot');
        newSkills[slotIndex] = { ...skill, level: 1 };
      } else if (newSkills.length < 4) {
        newSkills.push({ ...skill, level: 1 });
        addLog(`Learned ${skill.name}.`, 'loot');
      } else {
        return;
      }
    }
    setPlayer({ ...player, skills: newSkills });
    setDroppedSkill(null);
    returnToMap();
  };

  const sellItem = (item: Item) => {
    if (!player || isProcessingLoot) return;
    setIsProcessingLoot(true);
    setPlayer(prev => {
      if (!prev) return null;
      return sellItemFn(prev, item);
    });
    addLog(`Sold ${item.name} for ${Math.floor(item.value * 0.6)} Ryō.`, 'loot');
    setTimeout(() => {
      setIsProcessingLoot(false);
      returnToMap();
    }, 100);
  };

  // Store item in bag instead of equipping
  const storeToBag = (item: Item) => {
    if (!player || isProcessingLoot) return;

    const result = addToBag(player, item);
    if (!result) {
      addLog('Bag is full!', 'danger');
      return;
    }

    setIsProcessingLoot(true);
    setPlayer(result);
    addLog(`Stored ${item.name} in bag.`, 'loot');
    setTimeout(() => {
      setIsProcessingLoot(false);
      returnToMap();
    }, 100);
  };

  // Sell component from bag
  const sellComponent = (item: Item) => {
    if (!player) return;
    const value = Math.floor(item.value * 0.6);
    setPlayer(prev => prev ? {
      ...prev,
      ryo: prev.ryo + value,
      bag: prev.bag.map(c => c?.id === item.id ? null : c)
    } : null);
    addLog(`Sold ${item.name} for ${value} Ryō.`, 'loot');
    setSelectedComponent(null);
  };

  // Equip item from bag
  const equipFromBag = (item: Item) => {
    if (!player) return;
    // Remove from bag first (set to null), then try to equip
    const playerWithoutItem = {
      ...player,
      bag: player.bag.map(c => c?.id === item.id ? null : c)
    };
    const result = equipItemFn(playerWithoutItem, item);
    if (!result.success) {
      addLog(result.reason || 'Cannot equip item.', 'danger');
      return;
    }
    setPlayer(result.player);
    if (result.replacedItem) {
      addLog(`Equipped ${item.name}. ${result.replacedItem.name} moved to bag.`, 'loot');
    } else {
      addLog(`Equipped ${item.name} from bag.`, 'loot');
    }
    setSelectedComponent(null);
  };

  // Smart craft handler - determines which operation based on item rarities
  // 1. Both BROKEN + same componentId → upgradeComponent (→ COMMON)
  // 2. Both COMMON components → synthesize (→ RARE artifact)
  // 3. Both RARE artifacts + same recipe → upgradeArtifact (→ EPIC artifact)
  const handleSynthesize = (compA: Item, compB: Item) => {
    if (!player) return;

    // Determine which crafting operation to use based on item rarities
    const bothBroken = compA.rarity === Rarity.BROKEN && compB.rarity === Rarity.BROKEN;
    const bothCommon = compA.rarity === Rarity.COMMON && compB.rarity === Rarity.COMMON;
    const bothRareArtifacts = compA.rarity === Rarity.RARE && compB.rarity === Rarity.RARE
                              && !compA.isComponent && !compB.isComponent;

    let result;
    let actionName = '';
    const effectiveFloor = dangerToFloor(currentDangerLevel, currentBaseDifficulty);

    if (bothBroken && compA.isComponent && compB.isComponent) {
      // Upgrade two BROKEN components into a COMMON component
      result = upgradeComponent(compA, compB, effectiveFloor);
      actionName = 'Upgraded';
    } else if (bothRareArtifacts) {
      // Upgrade two RARE artifacts into an EPIC artifact
      result = upgradeArtifact(compA, compB, effectiveFloor);
      actionName = 'Forged';
    } else if (bothCommon && compA.isComponent && compB.isComponent) {
      // Synthesize two COMMON components into a RARE artifact
      result = synthesize(compA, compB, effectiveFloor);
      actionName = 'Synthesized';
    } else {
      // Try synthesize as fallback for any other combination
      result = synthesize(compA, compB, effectiveFloor);
      actionName = 'Synthesized';
    }

    if (!result.success || !result.item) {
      addLog(result.reason || 'These items cannot be combined.', 'danger');
      return;
    }

    // Check if player can afford the cost
    if (player.ryo < result.cost) {
      addLog(`Not enough Ryō! Need ${result.cost} Ryō.`, 'danger');
      return;
    }

    // Remove both items from bag (set to null), deduct cost, and add the new item to first empty slot
    const newBag = player.bag.map(c =>
      c?.id === compA.id || c?.id === compB.id ? null : c
    );
    const emptyIndex = newBag.findIndex(slot => slot === null);
    if (emptyIndex !== -1) {
      newBag[emptyIndex] = result.item;
    }

    setPlayer({ ...player, bag: newBag, ryo: player.ryo - result.cost });
    addLog(`${actionName} ${result.item.name} for ${result.cost} Ryō!`, 'gain');
    setSelectedComponent(null);
  };

  // Upgrade two BROKEN components (same type) into a COMMON component
  const handleUpgradeComponent = (compA: Item, compB: Item) => {
    if (!player) return;

    const effectiveFloor = dangerToFloor(currentDangerLevel, currentBaseDifficulty);
    const result = upgradeComponent(compA, compB, effectiveFloor);
    if (!result.success || !result.item) {
      addLog(result.reason || 'These components cannot be upgraded.', 'danger');
      return;
    }

    // Check if player can afford the cost
    if (player.ryo < result.cost) {
      addLog(`Not enough Ryō! Need ${result.cost} Ryō.`, 'danger');
      return;
    }

    // Remove both components from bag (set to null), deduct cost, and add the upgraded component
    const newBag = player.bag.map(c =>
      c?.id === compA.id || c?.id === compB.id ? null : c
    );
    const emptyIndex = newBag.findIndex(slot => slot === null);
    if (emptyIndex !== -1) {
      newBag[emptyIndex] = result.item;
    }

    setPlayer({ ...player, bag: newBag, ryo: player.ryo - result.cost });
    addLog(`Upgraded to ${result.item.name} for ${result.cost} Ryō!`, 'gain');
    setSelectedComponent(null);
  };

  // Upgrade two RARE artifacts (same type) into an EPIC artifact
  const handleUpgradeArtifact = (artifactA: Item, artifactB: Item) => {
    if (!player) return;

    const effectiveFloor = dangerToFloor(currentDangerLevel, currentBaseDifficulty);
    const result = upgradeArtifact(artifactA, artifactB, effectiveFloor);
    if (!result.success || !result.item) {
      addLog(result.reason || 'These artifacts cannot be upgraded.', 'danger');
      return;
    }

    // Check if player can afford the cost
    if (player.ryo < result.cost) {
      addLog(`Not enough Ryō! Need ${result.cost} Ryō.`, 'danger');
      return;
    }

    // Remove both artifacts from bag (set to null), deduct cost, and add the upgraded artifact
    const newBag = player.bag.map(c =>
      c?.id === artifactA.id || c?.id === artifactB.id ? null : c
    );
    const emptyIndex = newBag.findIndex(slot => slot === null);
    if (emptyIndex !== -1) {
      newBag[emptyIndex] = result.item;
    }

    setPlayer({ ...player, bag: newBag, ryo: player.ryo - result.cost });
    addLog(`Forged ${result.item.name} for ${result.cost} Ryō!`, 'gain');
    setSelectedComponent(null);
  };

  // Sell equipped item directly from equipment panel
  const sellEquipped = (slot: EquipmentSlot, item: Item) => {
    if (!player) return;
    const value = Math.floor(item.value * 0.6);
    setPlayer(prev => prev ? {
      ...prev,
      ryo: prev.ryo + value,
      equipment: { ...prev.equipment, [slot]: null }
    } : null);
    addLog(`Sold ${item.name} for ${value} Ryō.`, 'loot');
  };

  // Unequip item to bag (both components and artifacts)
  const unequipToBag = (slot: EquipmentSlot, item: Item) => {
    if (!player) return;
    const emptyIndex = player.bag.findIndex(s => s === null);
    if (emptyIndex === -1) {
      addLog('Bag is full!', 'danger');
      return;
    }
    const newBag = [...player.bag];
    newBag[emptyIndex] = item;
    setPlayer(prev => prev ? {
      ...prev,
      equipment: { ...prev.equipment, [slot]: null },
      bag: newBag
    } : null);
    addLog(`Moved ${item.name} to bag.`, 'info');
  };

  // Unequip component and start synthesis mode
  const startSynthesisEquipped = (slot: EquipmentSlot, item: Item) => {
    if (!player || !item.isComponent) return;
    const emptyIndex = player.bag.findIndex(s => s === null);
    if (emptyIndex === -1) {
      addLog('Bag is full!', 'danger');
      return;
    }
    // Move to bag and select for synthesis
    const newBag = [...player.bag];
    newBag[emptyIndex] = item;
    setPlayer(prev => prev ? {
      ...prev,
      equipment: { ...prev.equipment, [slot]: null },
      bag: newBag
    } : null);
    setSelectedComponent(item);
    addLog(`Select another component to synthesize with ${item.name}.`, 'info');
  };

  // Disassemble artifact into a component
  const handleDisassembleEquipped = (slot: EquipmentSlot, item: Item) => {
    if (!player || item.isComponent || !item.recipe) return;

    const component = disassemble(item);
    if (!component) {
      addLog('Cannot disassemble this item.', 'danger');
      return;
    }

    // Check bag space for 1 component
    const emptyIndex = player.bag.findIndex(s => s === null);
    if (emptyIndex === -1) {
      addLog('Not enough bag space for component!', 'danger');
      return;
    }

    const newBag = [...player.bag];
    newBag[emptyIndex] = component;
    setPlayer(prev => prev ? {
      ...prev,
      equipment: { ...prev.equipment, [slot]: null },
      bag: newBag
    } : null);
    addLog(`Disassembled ${item.name} into ${component.name}!`, 'loot');
  };

  // ============================================================================
  // DRAG-AND-DROP HANDLERS
  // ============================================================================

  // Swap items within the bag (position-based, supports empty slots)
  const reorderBag = (fromIndex: number, toIndex: number) => {
    if (!player) return;
    if (fromIndex === toIndex) return;

    const newBag = [...player.bag];
    // Swap positions (handles null slots too)
    [newBag[fromIndex], newBag[toIndex]] = [newBag[toIndex], newBag[fromIndex]];

    setPlayer({ ...player, bag: newBag });
  };

  // Equip item from bag to a specific slot via drag
  const dragBagToEquip = (item: Item, bagIndex: number, targetSlot: EquipmentSlot) => {
    if (!player) return;

    const existingItem = player.equipment[targetSlot];
    const newBag = [...player.bag];

    // Clear source bag slot
    newBag[bagIndex] = null;

    // If target slot has an item, put it in the vacated bag slot
    if (existingItem) {
      newBag[bagIndex] = existingItem;
      addLog(`Swapped ${item.name} with ${existingItem.name}.`, 'info');
    } else {
      addLog(`Equipped ${item.name}.`, 'loot');
    }

    setPlayer({
      ...player,
      bag: newBag,
      equipment: { ...player.equipment, [targetSlot]: item }
    });
    setSelectedComponent(null);
  };

  // Unequip item from equipment to bag via drag (both components and artifacts)
  const dragEquipToBag = (item: Item, slot: EquipmentSlot, targetBagIndex?: number) => {
    if (!player) return;

    const newBag = [...player.bag];

    if (targetBagIndex !== undefined && targetBagIndex >= 0 && targetBagIndex < MAX_BAG_SLOTS) {
      // Swap with existing item at target position (or place in empty slot)
      const existingItem = newBag[targetBagIndex];
      newBag[targetBagIndex] = item;

      // Put existing bag item in equipment slot (if any)
      setPlayer({
        ...player,
        equipment: { ...player.equipment, [slot]: existingItem },
        bag: newBag
      });

      if (existingItem) {
        addLog(`Swapped ${item.name} with ${existingItem.name}.`, 'info');
      } else {
        addLog(`Moved ${item.name} to bag.`, 'info');
      }
    } else {
      // Find first empty slot
      const emptySlot = newBag.findIndex(s => s === null);
      if (emptySlot === -1) {
        addLog('Bag is full!', 'danger');
        return;
      }
      newBag[emptySlot] = item;
      setPlayer({
        ...player,
        equipment: { ...player.equipment, [slot]: null },
        bag: newBag
      });
      addLog(`Moved ${item.name} to bag.`, 'info');
    }
  };

  // Swap items between two equipment slots
  const swapEquipment = (fromSlot: EquipmentSlot, toSlot: EquipmentSlot) => {
    if (!player) return;
    if (fromSlot === toSlot) return;

    const fromItem = player.equipment[fromSlot];
    const toItem = player.equipment[toSlot];

    // At least one slot must have an item
    if (!fromItem && !toItem) return;

    setPlayer({
      ...player,
      equipment: {
        ...player.equipment,
        [fromSlot]: toItem,
        [toSlot]: fromItem
      }
    });

    if (fromItem && toItem) {
      addLog(`Swapped ${fromItem.name} and ${toItem.name}.`, 'info');
    } else if (fromItem) {
      addLog(`Moved ${fromItem.name} to another slot.`, 'info');
    }
  };

  const buyItem = (item: Item) => {
    if (!player || isProcessingLoot) return;

    const price = Math.floor(item.value * (1 - merchantDiscount / 100));
    if (player.ryo < price) {
      addLog(`Not enough Ryō! Need ${price}.`, 'danger');
      return;
    }

    // Check if equip will succeed before deducting money
    const afterBuy = { ...player, ryo: player.ryo - price };
    const result = equipItemFn(afterBuy, item);
    if (!result.success) {
      addLog(result.reason || 'Cannot equip item.', 'danger');
      return;
    }

    setIsProcessingLoot(true);
    setPlayer(result.player);
    if (result.replacedItem) {
      addLog(`Bought ${item.name} for ${price} Ryō. ${result.replacedItem.name} moved to bag.`, 'loot');
    } else {
      addLog(`Bought and equipped ${item.name} for ${price} Ryō.`, 'loot');
    }
    setMerchantItems(prev => prev.filter(i => i.id !== item.id));
    setTimeout(() => setIsProcessingLoot(false), 100);
  };

  const leaveMerchant = () => {
    if (branchingFloor && selectedBranchingRoom) {
      logActivityComplete(selectedBranchingRoom.id, 'merchant');
      const updatedFloor = completeActivity(branchingFloor, selectedBranchingRoom.id, 'merchant');
      setBranchingFloor(updatedFloor);
    }

    // Location mode: complete merchant activity using locationFloor
    if (locationFloor && region && selectedBranchingRoom) {
      logActivityComplete(selectedBranchingRoom.id, 'merchant');
      const updatedFloor = completeActivity(locationFloor, selectedBranchingRoom.id, 'merchant');
      setLocationFloor(updatedFloor);
    }

    logStateChange('MERCHANT', 'EXPLORE', 'left merchant');
    setMerchantItems([]);
    setMerchantDiscount(0);
    setSelectedBranchingRoom(null);

    // Return to correct explore state based on mode
    if (locationFloor && region && region.currentLocationId) {
      setGameState(GameState.LOCATION_EXPLORE);
    } else {
      setGameState(GameState.EXPLORE);
    }
    addLog('The merchant waves goodbye.', 'info');
  };

  const handleMerchantReroll = () => {
    if (!player) return;
    const cost = calculateMerchantRerollCost(currentDangerLevel, currentBaseDifficulty, MERCHANT.REROLL_BASE_COST, MERCHANT.REROLL_FLOOR_SCALING);
    if (player.ryo < cost) {
      addLog(`Not enough Ryō to reroll! Need ${cost}.`, 'danger');
      return;
    }
    // Deduct cost and regenerate items
    setPlayer(p => p ? { ...p, ryo: p.ryo - cost } : null);
    const newItems: Item[] = [];
    const itemCount = player.merchantSlots;
    const effectiveFloor = dangerToFloor(currentDangerLevel, currentBaseDifficulty);
    for (let i = 0; i < itemCount; i++) {
      newItems.push(generateLoot(effectiveFloor, difficulty));
    }
    setMerchantItems(newItems);
    addLog(`Paid ${cost} Ryō to refresh the merchant's inventory.`, 'info');
  };

  const handleBuyMerchantSlot = () => {
    if (!player || player.merchantSlots >= MAX_MERCHANT_SLOTS) return;
    const cost = MERCHANT.SLOT_COSTS[player.merchantSlots];
    if (player.ryo < cost) {
      addLog(`Not enough Ryō! Need ${cost} to unlock another slot.`, 'danger');
      return;
    }
    setPlayer(p => {
      if (!p) return null;
      return { ...p, ryo: p.ryo - cost, merchantSlots: p.merchantSlots + 1 };
    });
    addLog(`Paid ${cost} Ryō. Merchants will now show ${player.merchantSlots + 1} items!`, 'gain');
  };

  const handleUpgradeTreasureQuality = () => {
    if (!player || player.treasureQuality === TreasureQuality.RARE) return;
    const cost = player.treasureQuality === TreasureQuality.BROKEN
      ? MERCHANT.QUALITY_UPGRADE_COSTS.COMMON
      : MERCHANT.QUALITY_UPGRADE_COSTS.RARE;
    if (player.ryo < cost) {
      addLog(`Not enough Ryō! Need ${cost} to upgrade treasure quality.`, 'danger');
      return;
    }
    const newQuality = player.treasureQuality === TreasureQuality.BROKEN
      ? TreasureQuality.COMMON
      : TreasureQuality.RARE;
    setPlayer(p => {
      if (!p) return null;
      return { ...p, ryo: p.ryo - cost, treasureQuality: newQuality };
    });
    addLog(`Paid ${cost} Ryō. Treasure quality upgraded to ${newQuality}!`, 'gain');
  };

  const handleTrainingComplete = (stat: PrimaryStat, intensity: TrainingIntensity) => {
    if (!trainingData || !player || !selectedBranchingRoom) return;
    // Require either branchingFloor or region
    if (!branchingFloor && !region) return;

    const option = trainingData.options.find(o => o.stat === stat);
    if (!option) return;

    const { cost, gain } = option.intensities[intensity];

    // Get stat key for primaryStats object
    const statKey = stat.toLowerCase() as keyof typeof player.primaryStats;

    // Deduct costs and apply stat gain
    setPlayer(p => {
      if (!p) return null;
      return {
        ...p,
        currentHp: p.currentHp - cost.hp,
        currentChakra: p.currentChakra - cost.chakra,
        primaryStats: {
          ...p.primaryStats,
          [statKey]: p.primaryStats[statKey] + gain
        }
      };
    });

    const intensityLabel = intensity.charAt(0).toUpperCase() + intensity.slice(1);
    addLog(`${intensityLabel} training complete! ${stat} +${gain}`, 'gain');

    // Mark training as complete and return to map
    logActivityComplete(selectedBranchingRoom.id, 'training');
    logStateChange('TRAINING', 'EXPLORE', 'training complete');

    if (branchingFloor) {
      const updatedFloor = completeActivity(branchingFloor, selectedBranchingRoom.id, 'training');
      setBranchingFloor(updatedFloor);
    }

    // Location mode: complete training activity using locationFloor
    if (locationFloor && region) {
      const updatedFloor = completeActivity(locationFloor, selectedBranchingRoom.id, 'training');
      setLocationFloor(updatedFloor);
    }

    setTrainingData(null);
    setSelectedBranchingRoom(null);

    // Return to correct explore state based on mode
    if (locationFloor && region && region.currentLocationId) {
      setGameState(GameState.LOCATION_EXPLORE);
    } else {
      setGameState(GameState.EXPLORE);
    }
  };

  const handleTrainingSkip = () => {
    // Mark training as complete without training
    if (branchingFloor && selectedBranchingRoom) {
      logActivityComplete(selectedBranchingRoom.id, 'training');
      const updatedFloor = completeActivity(branchingFloor, selectedBranchingRoom.id, 'training');
      setBranchingFloor(updatedFloor);
    }

    // Location mode: complete training activity using locationFloor
    if (locationFloor && region && selectedBranchingRoom) {
      logActivityComplete(selectedBranchingRoom.id, 'training');
      const updatedFloor = completeActivity(locationFloor, selectedBranchingRoom.id, 'training');
      setLocationFloor(updatedFloor);
    }

    logStateChange('TRAINING', 'EXPLORE', 'training skipped');
    setTrainingData(null);
    setSelectedBranchingRoom(null);

    // Return to correct explore state based on mode
    if (locationFloor && region && region.currentLocationId) {
      setGameState(GameState.LOCATION_EXPLORE);
    } else {
      setGameState(GameState.EXPLORE);
    }
    addLog('You decide to skip training for now.', 'info');
  };

  // Scroll Discovery handlers
  const handleLearnScroll = (skill: Skill, slotIndex?: number) => {
    if (!scrollDiscoveryData || !player || !selectedBranchingRoom || !playerStats) return;
    // Require either branchingFloor or region
    if (!branchingFloor && !region) return;

    const chakraCost = scrollDiscoveryData.cost?.chakra || 0;

    // Check chakra cost
    if (player.currentChakra < chakraCost) {
      addLog('Not enough chakra to study the scroll!', 'danger');
      return;
    }

    // Check skill requirements
    const checkResult = canLearnSkill(
      skill,
      playerStats.effectivePrimary.intelligence,
      player.level,
      player.clan
    );

    if (!checkResult.canLearn) {
      addLog(`Cannot learn ${skill.name}: ${checkResult.reason}`, 'danger');
      return;
    }

    // Deduct chakra
    let updatedPlayer = { ...player, currentChakra: player.currentChakra - chakraCost };

    // Check if player already knows this skill
    const existingIndex = updatedPlayer.skills.findIndex(s => s.id === skill.id);

    if (existingIndex !== -1) {
      // Upgrade existing skill
      const existing = updatedPlayer.skills[existingIndex];
      const currentLevel = existing.level || 1;
      const growth = skill.damageMult * 0.2;
      updatedPlayer.skills = [...updatedPlayer.skills];
      updatedPlayer.skills[existingIndex] = {
        ...existing,
        level: currentLevel + 1,
        damageMult: existing.damageMult + growth
      };
      addLog(`Upgraded ${skill.name} to Level ${currentLevel + 1}!`, 'gain');
    } else if (slotIndex !== undefined) {
      // Replace specific skill at slotIndex
      const forgotten = updatedPlayer.skills[slotIndex];
      updatedPlayer.skills = [...updatedPlayer.skills];
      updatedPlayer.skills[slotIndex] = { ...skill, level: 1 };
      addLog(`Forgot ${forgotten.name} to learn ${skill.name}!`, 'loot');
    } else if (updatedPlayer.skills.length < 4) {
      // Learn new skill
      updatedPlayer.skills = [...updatedPlayer.skills, { ...skill, level: 1 }];
      addLog(`Learned ${skill.name}!`, 'gain');
    } else {
      // Fallback: shouldn't reach here with UI changes
      return;
    }

    setPlayer(updatedPlayer);

    // Mark scroll discovery as complete
    logActivityComplete(selectedBranchingRoom.id, 'scrollDiscovery');
    logStateChange('SCROLL_DISCOVERY', 'EXPLORE', 'scroll learned');

    if (branchingFloor) {
      const updatedFloor = completeActivity(branchingFloor, selectedBranchingRoom.id, 'scrollDiscovery');
      setBranchingFloor(updatedFloor);
    }

    // Location mode: complete scroll discovery activity using locationFloor
    if (locationFloor && region) {
      const updatedFloor = completeActivity(locationFloor, selectedBranchingRoom.id, 'scrollDiscovery');
      setLocationFloor(updatedFloor);
    }

    setScrollDiscoveryData(null);
    setSelectedBranchingRoom(null);

    // Return to correct explore state based on mode
    if (locationFloor && region && region.currentLocationId) {
      setGameState(GameState.LOCATION_EXPLORE);
    } else {
      setGameState(GameState.EXPLORE);
    }
  };

  const handleScrollDiscoverySkip = () => {
    if (branchingFloor && selectedBranchingRoom) {
      logActivityComplete(selectedBranchingRoom.id, 'scrollDiscovery');
      const updatedFloor = completeActivity(branchingFloor, selectedBranchingRoom.id, 'scrollDiscovery');
      setBranchingFloor(updatedFloor);
    }

    // Location mode: complete scroll discovery activity using locationFloor
    if (locationFloor && region && selectedBranchingRoom) {
      logActivityComplete(selectedBranchingRoom.id, 'scrollDiscovery');
      const updatedFloor = completeActivity(locationFloor, selectedBranchingRoom.id, 'scrollDiscovery');
      setLocationFloor(updatedFloor);
    }

    logStateChange('SCROLL_DISCOVERY', 'EXPLORE', 'scroll skipped');
    setScrollDiscoveryData(null);
    setSelectedBranchingRoom(null);

    // Return to correct explore state based on mode
    if (locationFloor && region && region.currentLocationId) {
      setGameState(GameState.LOCATION_EXPLORE);
    } else {
      setGameState(GameState.EXPLORE);
    }
    addLog('You leave the scrolls behind.', 'info');
  };

  // Elite Challenge handlers
  const handleEliteFight = () => {
    if (!eliteChallengeData) return;
    logExplorationCheckpoint('Elite Fight chosen', { enemy: eliteChallengeData.enemy.name, artifact: eliteChallengeData.artifact.name });
    logModalOpen('ApproachSelector', { source: 'eliteChallenge', enemy: eliteChallengeData.enemy.name });
    // Store the artifact for victory reward and proceed to approach selector
    setPendingArtifact(eliteChallengeData.artifact);
    setSelectedBranchingRoom(eliteChallengeData.room);
    setShowApproachSelector(true);
    setEliteChallengeData(null);
    setGameState(GameState.EXPLORE);
  };

  const handleEliteEscape = () => {
    if (!eliteChallengeData || !player || !playerStats) return;
    // Require either branchingFloor or locationFloor
    if (!branchingFloor && !locationFloor) return;

    const result = attemptEliteEscape(player, playerStats, eliteChallengeData.enemy);
    logExplorationCheckpoint('Elite Escape attempt', { success: result.success, roll: result.roll, chance: result.chance });

    if (result.success) {
      // Mark activity as completed (skipped)
      logActivityComplete(eliteChallengeData.room.id, 'eliteChallenge');

      if (branchingFloor) {
        const updatedFloor = completeActivity(branchingFloor, eliteChallengeData.room.id, 'eliteChallenge');
        setBranchingFloor(updatedFloor);
        addLog(result.message, 'info');
        setEliteChallengeData(null);
        setGameState(GameState.EXPLORE);
        return;
      }

      // Location mode: complete elite challenge activity using locationFloor
      if (locationFloor && region) {
        const updatedFloor = completeActivity(locationFloor, eliteChallengeData.room.id, 'eliteChallenge');
        setLocationFloor(updatedFloor);
        addLog(result.message, 'info');
        setEliteChallengeData(null);
        setGameState(GameState.LOCATION_EXPLORE);
        return;
      }

      addLog(result.message, 'info');
      setEliteChallengeData(null);
      // Return to correct explore state based on mode
      if (locationFloor && region && region.currentLocationId) {
        setGameState(GameState.LOCATION_EXPLORE);
      } else {
        setGameState(GameState.EXPLORE);
      }
    } else {
      // Failed escape - must fight
      logExplorationCheckpoint('Elite Escape failed - must fight');
      logModalOpen('ApproachSelector', { source: 'eliteEscapeFailed', enemy: eliteChallengeData.enemy.name });
      addLog(result.message, 'danger');
      setPendingArtifact(eliteChallengeData.artifact);
      setSelectedBranchingRoom(eliteChallengeData.room);
      setShowApproachSelector(true);
      setEliteChallengeData(null);
      // Return to correct explore state based on mode
      if (locationFloor && region && region.currentLocationId) {
        setGameState(GameState.LOCATION_EXPLORE);
      } else {
        setGameState(GameState.EXPLORE);
      }
    }
  };

  const getRarityColor = (r: Rarity) => {
    switch (r) {
      case Rarity.LEGENDARY: return 'text-orange-400';
      case Rarity.EPIC: return 'text-purple-400';
      case Rarity.RARE: return 'text-blue-400';
      case Rarity.CURSED: return 'text-red-600 animate-pulse';
      case Rarity.BROKEN: return 'text-stone-500';
      default: return 'text-zinc-400';
    }
  };

  const getDamageTypeColor = (dt: DamageType) => {
    switch (dt) {
      case DamageType.PHYSICAL: return 'text-orange-500';
      case DamageType.ELEMENTAL: return 'text-purple-500';
      case DamageType.MENTAL: return 'text-indigo-500';
      case DamageType.TRUE: return 'text-red-500';
    }
  };

  if (gameState === GameState.MENU) {
    return (
      <MainMenu
        difficulty={difficulty}
        onDifficultyChange={setDifficulty}
        onEnter={() => setGameState(GameState.CHAR_SELECT)}
        onGuide={() => setGameState(GameState.GUIDE)}
        onAssetCompanion={FeatureFlags.ENABLE_ASSET_COMPANION ? () => setGameState(GameState.ASSET_COMPANION) : undefined}
      />
    );
  }

  if (gameState === GameState.GUIDE) {
    return <GameGuide onBack={() => setGameState(GameState.MENU)} />;
  }

  if (gameState === GameState.ASSET_COMPANION && FeatureFlags.ENABLE_ASSET_COMPANION) {
    return <AssetCompanion onBack={() => setGameState(GameState.MENU)} />;
  }

  if (gameState === GameState.CHAR_SELECT) {
    return <CharacterSelect onSelectClan={startGame} />;
  }

  if (gameState === GameState.GAME_OVER) {
    return (
      <GameOver
        locationName={currentLocation?.name ?? 'Unknown Location'}
        dangerLevel={currentDangerLevel}
        regionName={region?.name ?? 'Unknown Region'}
        playerLevel={player?.level}
        onRetry={() => {
          setGameState(GameState.MENU);
          setPlayer(null);
          setEnemy(null);
        }}
      />
    );
  }

  // Hide sidebar during combat for full-width immersive experience
  const isCombat = gameState === GameState.COMBAT;

  return (
    <GameProvider value={gameContextValue}>
    <div className="h-screen bg-black text-gray-300 flex overflow-hidden font-sans">
      {/* Left Panel - Hidden during combat */}
      {!isCombat && (
        <div className="hidden lg:flex w-[280px] flex-col border-r border-zinc-900 bg-zinc-950 p-4">
          <LeftSidebarPanel />
        </div>
      )}

      {/* Center Panel */}
      <div className="flex-1 flex flex-col relative bg-zinc-950">
        <div className="flex-1 p-6 flex flex-col items-center justify-center relative overflow-y-auto parchment-panel">
          {gameState === GameState.COMBAT && player && enemy && playerStats && enemyStats && (
            <ErrorBoundary sceneName="Combat">
              <Combat
                ref={combatRef}
                player={player}
                playerStats={playerStats}
                enemy={enemy}
                enemyStats={enemyStats}
                turnState={turnState}
                turnPhase={turnPhase}
                onUseSkill={useSkill}
                onPassTurn={() => {
                  addLog("You focus on defense and wait.", 'info');
                  setTurnState('ENEMY_TURN');
                }}
                getDamageTypeColor={getDamageTypeColor}
                getRarityColor={getRarityColor}
                autoCombatEnabled={autoCombatEnabled}
                onToggleAutoCombat={() => setAutoCombatEnabled(prev => !prev)}
                autoPassTimeRemaining={autoPassTimeRemaining}
              />
            </ErrorBoundary>
          )}

          {gameState === GameState.EVENT && activeEvent && (
            <Event activeEvent={activeEvent} onChoice={handleEventChoice} player={player} playerStats={playerStats} />
          )}

          {gameState === GameState.ELITE_CHALLENGE && eliteChallengeData && player && playerStats && (
            <EliteChallenge
              enemy={eliteChallengeData.enemy}
              artifact={eliteChallengeData.artifact}
              player={player}
              playerStats={playerStats}
              onFight={handleEliteFight}
              onEscape={handleEliteEscape}
            />
          )}

          {gameState === GameState.LOOT && (
            <ErrorBoundary sceneName="Loot">
              <Loot
                droppedItems={droppedItems}
                droppedSkill={droppedSkill}
                player={player}
                playerStats={playerStats}
                onEquipItem={equipItem}
                onSellItem={sellItem}
                onStoreToBag={storeToBag}
                onLearnSkill={learnSkill}
                onLeaveAll={returnToMap}
                getRarityColor={getRarityColor}
                getDamageTypeColor={getDamageTypeColor}
                isProcessing={isProcessingLoot}
              />
            </ErrorBoundary>
          )}

          {gameState === GameState.MERCHANT && (
            <ErrorBoundary sceneName="Merchant">
              <Merchant
                merchantItems={merchantItems}
                discountPercent={merchantDiscount}
                player={player}
                playerStats={playerStats}
                dangerLevel={currentDangerLevel}
                baseDifficulty={currentBaseDifficulty}
                onBuyItem={buyItem}
                onLeave={leaveMerchant}
                onReroll={handleMerchantReroll}
                onBuySlot={handleBuyMerchantSlot}
                onUpgradeQuality={handleUpgradeTreasureQuality}
                getRarityColor={getRarityColor}
                getDamageTypeColor={getDamageTypeColor}
                isProcessing={isProcessingLoot}
              />
            </ErrorBoundary>
          )}

          {gameState === GameState.TRAINING && trainingData && player && playerStats && (
            <Training
              training={trainingData}
              player={player}
              playerStats={playerStats}
              onTrain={handleTrainingComplete}
              onSkip={handleTrainingSkip}
            />
          )}

          {gameState === GameState.SCROLL_DISCOVERY && scrollDiscoveryData && player && playerStats && (
            <ScrollDiscovery
              scrollDiscovery={scrollDiscoveryData}
              player={player}
              playerStats={playerStats}
              onLearnScroll={handleLearnScroll}
              onSkip={handleScrollDiscoverySkip}
            />
          )}

          {/* Treasure Choice Scene */}
          {gameState === GameState.TREASURE && currentTreasure && player && (
            <ErrorBoundary sceneName="TreasureChoice">
              <TreasureChoice
                treasure={currentTreasure}
                treasureHunt={currentTreasureHunt}
                player={player}
                huntDeclined={locationFloor?.huntDeclined ?? branchingFloor?.huntDeclined ?? false}
                onReveal={handleTreasureReveal}
                onSelectItem={handleTreasureSelectItem}
                onFightGuardian={handleTreasureFightGuardian}
                onRollDice={handleTreasureRollDice}
                onStartHunt={handleTreasureStartHunt}
                onDeclineHunt={handleTreasureDeclineHunt}
                getRarityColor={getRarityColor}
              />
            </ErrorBoundary>
          )}

          {/* Treasure Hunt Reward Scene */}
          {gameState === GameState.TREASURE_HUNT_REWARD && treasureHuntReward && (
            <ErrorBoundary sceneName="TreasureHuntReward">
              <TreasureHuntRewardScene
                reward={treasureHuntReward}
                onClaim={handleTreasureHuntRewardClaim}
                getRarityColor={getRarityColor}
                getDamageTypeColor={getDamageTypeColor}
              />
            </ErrorBoundary>
          )}

          {/* Region Map - Card-based location selection */}
          {gameState === GameState.REGION_MAP && region && player && playerStats && (
            <div className="w-full h-full flex flex-col">
              <RegionMap
                region={region}
                player={player}
                playerStats={playerStats}
                drawnCards={drawnCards}
                selectedIndex={selectedCardIndex}
                onCardSelect={handleCardSelect}
                onEnterLocation={handleEnterSelectedLocation}
              />
              <PlayerHUD
                player={player}
                playerStats={playerStats}
                biome={region.biome || 'Misty Shores'}
              />
            </div>
          )}

          {/* Location Explorer - Uses LocationMap for location rooms */}
          {gameState === GameState.LOCATION_EXPLORE && region && locationFloor && player && playerStats && (() => {
            const currentLocation = getCurrentLocation(region);
            if (!currentLocation) return null;
            return (
              <div className="w-full h-full flex flex-col">
                <LocationMap
                  branchingFloor={locationFloor}
                  player={player}
                  playerStats={playerStats}
                  currentIntel={currentIntel}
                  onRoomSelect={handleLocationRoomSelect}
                  onRoomEnter={handleLocationRoomEnter}
                />
                <PlayerHUD
                  player={player}
                  playerStats={playerStats}
                  biome={currentLocation.name}
                />
                {/* Combat Victory Reward Modal */}
                {combatReward && (
                  <RewardModal
                    expGain={combatReward.expGain}
                    ryoGain={combatReward.ryoGain}
                    levelUp={combatReward.levelUp}
                    onClose={handleRewardClose}
                  />
                )}

                {/* Event Outcome Modal */}
                {eventOutcome && (
                  <EventResultModal
                    outcome={eventOutcome}
                    onClose={handleEventOutcomeClose}
                  />
                )}
              </div>
            );
          })()}

          {/* Path Choice - DEPRECATED: Cards now replace path selection modal
              The card-based location selection system in RegionMap replaces the
              need for a separate path choice modal. Cards are drawn after completing
              a location and intel is accumulated to reveal more info about destinations.
          */}
        </div>
      </div>

      {/* Right Panel - Hidden during combat */}
      {!isCombat && (
        <div className="hidden lg:flex w-[280px] flex-col border-l border-zinc-900 bg-zinc-950 p-4">
          <RightSidebarPanel
            selectedComponent={selectedComponent}
            onSelectComponent={setSelectedComponent}
            onSellComponent={sellComponent}
            onSynthesize={handleSynthesize}
            onEquipFromBag={equipFromBag}
            onSellEquipped={sellEquipped}
            onUnequipToBag={unequipToBag}
            onDisassembleEquipped={handleDisassembleEquipped}
            onStartSynthesisEquipped={startSynthesisEquipped}
            onReorderBag={reorderBag}
            onDragBagToEquip={dragBagToEquip}
            onDragEquipToBag={dragEquipToBag}
            onSwapEquipment={swapEquipment}
            treasureHunt={locationFloor?.treasureHunt || currentTreasureHunt}
          />
        </div>
      )}

      {/* Approach Selector Modal */}
      {showApproachSelector && selectedBranchingRoom && (selectedBranchingRoom.activities.combat || selectedBranchingRoom.activities.eliteChallenge) && player && playerStats && (() => {
        // Get enemy from elite challenge or combat
        const eliteChallenge = selectedBranchingRoom.activities.eliteChallenge;
        const combat = selectedBranchingRoom.activities.combat;
        const targetEnemy = (eliteChallenge && !eliteChallenge.completed) ? eliteChallenge.enemy : combat?.enemy;
        if (!targetEnemy) return null;

        return (
          <ApproachSelector
            node={{
              id: selectedBranchingRoom.id,
              type: targetEnemy.tier === 'Guardian' ? 'BOSS' :
                    targetEnemy.tier === 'Jonin' ? 'ELITE' : 'COMBAT',
              terrain: selectedBranchingRoom.terrain,
              enemy: targetEnemy,
            }}
            terrain={TERRAIN_DEFINITIONS[selectedBranchingRoom.terrain]}
            player={player}
            playerStats={playerStats}
            onSelectApproach={handleBranchingApproachSelect}
            onCancel={handleApproachCancel}
          />
        );
      })()}

      {/* Dice Roll Result Modal */}
      {diceRollResult && (
        <DiceRollResultModal
          result={diceRollResult}
          onContinue={handleDiceResultContinue}
        />
      )}
    </div>
    </GameProvider>
  );
};

export default App;
