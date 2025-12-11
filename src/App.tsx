import React, { useState, useCallback, useMemo, useRef } from 'react';
import {
  GameState, Player, Clan, Skill, Enemy, Item, Rarity, DamageType,
  ApproachType, BranchingRoom, PrimaryStat, TrainingActivity, TrainingIntensity,
  EquipmentSlot, MAX_BAG_SLOTS, ScrollDiscoveryActivity,
  GameEvent, EventChoice, EventOutcome
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
  disassemble
} from './game/systems/LootSystem';
import {
  CombatState,
  createCombatState,
  applyApproachEffects
} from './game/systems/CombatSystem';
import {
  executeApproach,
  applyApproachCosts,
  applyEnemyHpReduction,
  getCombatModifiers
} from './game/systems/ApproachSystem';
import { TERRAIN_DEFINITIONS } from './game/constants/terrain';
import {
  generateBranchingFloor,
  moveToRoom,
  getCurrentActivity,
  completeActivity,
  getCurrentRoom
} from './game/systems/BranchingFloorSystem';
import { resolveEventChoice } from './game/systems/EventSystem';
import { useCombat } from './hooks/useCombat';
import { useCombatExplorationState } from './hooks/useCombatExplorationState';
import { GameProvider, GameContextValue } from './contexts/GameContext';
import { LIMITS } from './game/config';
import MainMenu from './scenes/MainMenu';
import CharacterSelect from './scenes/CharacterSelect';
import Combat from './scenes/Combat';
import Event from './scenes/Event';
import EliteChallenge from './scenes/EliteChallenge';
import Loot from './scenes/Loot';
import Merchant from './scenes/Merchant';
import Training from './scenes/Training';
import ScrollDiscovery from './scenes/ScrollDiscovery';
import GameOver from './scenes/GameOver';
import GameGuide from './scenes/GameGuide';
import { attemptEliteEscape } from './game/systems/EliteChallengeSystem';
import LeftSidebarPanel from './components/LeftSidebarPanel';
import ApproachSelector from './components/ApproachSelector';
import BranchingExplorationMap from './components/BranchingExplorationMap';
import PlayerHUD from './components/PlayerHUD';
import RewardModal from './components/RewardModal';
import EventResultModal from './components/EventResultModal';
import { logVictory, logRewardModal, logFlowCheckpoint } from './game/utils/combatDebug';
import {
  logRoomEnter, logRoomExit, logRoomSelect,
  logActivityStart, logActivityComplete,
  logModalOpen, logModalClose,
  logStateChange, logExplorationCheckpoint, logFloorChange
} from './game/utils/explorationDebug';

// Import the parchment background styles
import './App.css';

const App: React.FC = () => {
  // --- Core State ---
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [floor, setFloor] = useState(1);
  const [logs, setLogs] = useState<any[]>([]);
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
  const [combatReward, setCombatReward] = useState<{
    expGain: number;
    ryoGain: number;
    levelUp?: { oldLevel: number; newLevel: number; statGains: Record<string, number> };
  } | null>(null);
  const logIdCounter = useRef<number>(0);

  // --- Shared Combat/Exploration State ---
  // This hook owns state needed by both useCombat and useExploration
  const {
    combatState,
    setCombatState,
    approachResult,
    setApproachResult,
    branchingFloor,
    setBranchingFloor,
    selectedBranchingRoom,
    setSelectedBranchingRoom,
    showApproachSelector,
    setShowApproachSelector,
  } = useCombatExplorationState();

  const addLog = useCallback((text: string, type: any = 'info', details?: string) => {
    setLogs(prev => {
      logIdCounter.current += 1;
      const newEntry: any = { id: logIdCounter.current, text, type, details };
      const newLogs = [...prev, newEntry];
      if (newLogs.length > LIMITS.MAX_LOG_ENTRIES) newLogs.shift();
      return newLogs;
    });
  }, []);

  const playerStats = useMemo(() => {
    if (!player) return null;
    return getPlayerFullStats(player);
  }, [player]);

  // Create game context value for child components
  const gameContextValue = useMemo((): GameContextValue => ({
    player,
    playerStats,
    floor,
    difficulty,
    logs,
    addLog,
  }), [player, playerStats, floor, difficulty, logs, addLog]);

  // Victory handler for combat hook
  const handleCombatVictory = useCallback((defeatedEnemy: Enemy, combatStateAtVictory: CombatState | null) => {
    logFlowCheckpoint('handleCombatVictory START', {
      enemy: defeatedEnemy.name,
      tier: defeatedEnemy.tier,
      floor
    });

    addLog("Enemy Defeated!", 'gain');

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

    // Apply XP multiplier from approach
    const xpMultiplier = combatStateAtVictory?.xpMultiplier || 1.0;

    // Calculate rewards outside setPlayer so we can use them for the modal
    const isAmbush = defeatedEnemy?.tier.includes('S-Rank');
    const isGuardian = defeatedEnemy?.tier === 'Guardian';
    const enemyTier = defeatedEnemy?.tier || 'Chunin';

    const baseExp = 25 + (floor * 5);
    const tierBonus = isGuardian ? 300 : enemyTier === 'Jonin' ? 20 : enemyTier === 'Kage Level' ? 200 : isAmbush ? 100 : 0;
    const expGain = Math.floor((baseExp + tierBonus) * xpMultiplier);
    const ryoGain = (floor * 15) + Math.floor(Math.random() * 25);

    let levelUpInfo: { oldLevel: number; newLevel: number; statGains: Record<string, number> } | undefined;

    setPlayer(prev => {
      if (!prev) return null;

      let updatedPlayer = { ...prev, exp: prev.exp + expGain };
      addLog(`Gained ${expGain} Experience${xpMultiplier > 1 ? ` (${Math.round((xpMultiplier - 1) * 100)}% bonus!)` : ''}.`, 'info');

      const levelUpResult = checkLevelUp(updatedPlayer);
      updatedPlayer = levelUpResult.player;
      levelUpInfo = levelUpResult.levelUpInfo;

      updatedPlayer.ryo += ryoGain;
      addLog(`Gained ${ryoGain} Ryō.`, 'loot');

      // Combat no longer drops items/skills - find loot in treasures, events, and scroll discoveries
      return updatedPlayer;
    });

    // Log victory rewards
    logVictory(defeatedEnemy.name, {
      xpGain: expGain,
      ryoGain: ryoGain,
      levelUp: !!levelUpInfo
    });

    // Show reward modal instead of returning to map immediately
    logRewardModal('show', { xpGain: expGain, ryoGain: ryoGain, levelUp: !!levelUpInfo });
    setCombatReward({
      expGain,
      ryoGain,
      levelUp: levelUpInfo
    });

    // Set game state to branching explore so the modal shows on the map
    logFlowCheckpoint('Transitioning to BRANCHING_EXPLORE with reward modal');
    setTimeout(() => {
      setGameState(GameState.EXPLORE);
    }, 100);
  }, [branchingFloor, floor, addLog, pendingArtifact]);

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
      ryo: 100,
      equipment: {
        [EquipmentSlot.SLOT_1]: null,
        [EquipmentSlot.SLOT_2]: null,
        [EquipmentSlot.SLOT_3]: null,
        [EquipmentSlot.SLOT_4]: null,
      },
      skills: [SKILLS.BASIC_ATTACK, SKILLS.SHURIKEN, { ...startSkill, level: 1 }],
      activeBuffs: [],
      componentBag: [],
    };

    setPlayer(newPlayer);
    setFloor(1);
    setLogs([]);
    setEnemy(null);
    setDroppedItems([]);
    setDroppedSkill(null);
    setActiveEvent(null);
    setTurnState('PLAYER');
    setShowApproachSelector(false);
    setCombatState(null);
    setApproachResult(null);
    addLog(`Lineage chosen: ${clan}. The Tower awaits.`, 'info');

    // Initialize branching floor exploration
    const newBranchingFloor = generateBranchingFloor(1, difficulty, newPlayer);
    setBranchingFloor(newBranchingFloor);
    setSelectedBranchingRoom(null);
    setGameState(GameState.EXPLORE);
  };

  // Cancel approach selection
  const handleApproachCancel = () => {
    logModalClose('ApproachSelector', 'cancelled');
    setShowApproachSelector(false);
    setSelectedBranchingRoom(null);
  };

  // Handle approach selection for BRANCHING exploration combat
  const handleBranchingApproachSelect = (approach: ApproachType) => {
    if (!player || !playerStats || !selectedBranchingRoom || !branchingFloor) return;
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

  // ============================================================================
  // BRANCHING EXPLORATION HANDLERS
  // ============================================================================

  // Handle selecting a room in branching exploration
  const handleBranchingRoomSelect = (room: BranchingRoom) => {
    logRoomSelect(room.id, room.name);
    setSelectedBranchingRoom(room);
  };

  // Handle entering a room in branching exploration
  const handleBranchingRoomEnter = (room: BranchingRoom) => {
    if (!branchingFloor || !player || !playerStats) return;

    // Move to the room
    const updatedFloor = moveToRoom(branchingFloor, room.id);
    setBranchingFloor(updatedFloor);

    // Get the current activity for the room
    const currentRoom = updatedFloor.rooms.find(r => r.id === room.id);
    if (!currentRoom) return;

    const activity = getCurrentActivity(currentRoom);
    logRoomEnter(room.id, room.name, activity);

    if (!activity) {
      // Room is already cleared or has no activities
      logExplorationCheckpoint('Room already cleared', { roomId: room.id });
      addLog(`You enter ${currentRoom.name}. Nothing remains here.`, 'info');
      return;
    }

    // Handle the current activity
    switch (activity) {
      case 'combat':
        if (currentRoom.activities.combat) {
          logActivityStart(currentRoom.id, 'combat', { enemy: currentRoom.activities.combat.enemy.name });
          logModalOpen('ApproachSelector', { roomId: currentRoom.id, enemy: currentRoom.activities.combat.enemy.name });
          // Show approach selector for combat
          setSelectedBranchingRoom(currentRoom);
          setShowApproachSelector(true);
          addLog(`Enemy spotted: ${currentRoom.activities.combat.enemy.name}. Choose your approach!`, 'info');
        }
        break;

      case 'merchant':
        if (currentRoom.activities.merchant) {
          logActivityStart(currentRoom.id, 'merchant', { itemCount: currentRoom.activities.merchant.items.length });
          logStateChange('EXPLORE', 'MERCHANT', 'merchant activity');
          setMerchantItems(currentRoom.activities.merchant.items);
          setMerchantDiscount(currentRoom.activities.merchant.discountPercent || 0);
          setSelectedBranchingRoom(currentRoom);
          setGameState(GameState.MERCHANT);
          addLog(`A merchant greets you. ${currentRoom.activities.merchant.items.length} items available.`, 'info');
        }
        break;

      case 'event':
        if (currentRoom.activities.event) {
          logActivityStart(currentRoom.id, 'event', { eventId: currentRoom.activities.event.definition.id });
          logStateChange('EXPLORE', 'EVENT', 'event activity');
          setActiveEvent(currentRoom.activities.event.definition);
          setGameState(GameState.EVENT);
        }
        break;

      case 'rest':
        if (currentRoom.activities.rest) {
          logActivityStart(currentRoom.id, 'rest', { healPercent: currentRoom.activities.rest.healPercent });
          const restData = currentRoom.activities.rest;
          const hpHeal = Math.floor(playerStats.derived.maxHp * (restData.healPercent / 100));
          const chakraHeal = Math.floor(playerStats.derived.maxChakra * (restData.chakraRestorePercent / 100));

          setPlayer(p => p ? {
            ...p,
            currentHp: Math.min(playerStats.derived.maxHp, p.currentHp + hpHeal),
            currentChakra: Math.min(playerStats.derived.maxChakra, p.currentChakra + chakraHeal)
          } : null);

          addLog(`You rest and recover. +${hpHeal} HP, +${chakraHeal} Chakra.`, 'gain');

          const updatedFloorAfterRest = completeActivity(updatedFloor, room.id, 'rest');
          setBranchingFloor(updatedFloorAfterRest);
          logActivityComplete(currentRoom.id, 'rest');
        }
        break;

      case 'training':
        if (currentRoom.activities.training && !currentRoom.activities.training.completed) {
          logActivityStart(currentRoom.id, 'training', { options: currentRoom.activities.training.options.map(o => o.stat) });
          logStateChange('EXPLORE', 'TRAINING', 'training activity');
          setTrainingData(currentRoom.activities.training);
          setSelectedBranchingRoom(currentRoom);
          setGameState(GameState.TRAINING);
          addLog('You arrive at a training area. Choose your training regimen.', 'info');
        }
        break;

      case 'scrollDiscovery':
        if (currentRoom.activities.scrollDiscovery && !currentRoom.activities.scrollDiscovery.completed) {
          logActivityStart(currentRoom.id, 'scrollDiscovery', { scrollCount: currentRoom.activities.scrollDiscovery.availableScrolls.length });
          logStateChange('EXPLORE', 'SCROLL_DISCOVERY', 'scroll discovery activity');
          setScrollDiscoveryData(currentRoom.activities.scrollDiscovery);
          setSelectedBranchingRoom(currentRoom);
          setGameState(GameState.SCROLL_DISCOVERY);
          addLog('You discovered ancient jutsu scrolls!', 'gain');
        }
        break;

      case 'eliteChallenge':
        if (currentRoom.activities.eliteChallenge && !currentRoom.activities.eliteChallenge.completed) {
          const challenge = currentRoom.activities.eliteChallenge;
          logActivityStart(currentRoom.id, 'eliteChallenge', { enemy: challenge.enemy.name, artifact: challenge.artifact.name });
          logStateChange('EXPLORE', 'ELITE_CHALLENGE', 'elite challenge activity');
          // Show elite challenge choice screen
          setEliteChallengeData({
            enemy: challenge.enemy,
            artifact: challenge.artifact,
            room: currentRoom,
          });
          setGameState(GameState.ELITE_CHALLENGE);
          addLog(`An artifact guardian bars your path...`, 'danger');
        }
        break;

      case 'treasure':
        if (currentRoom.activities.treasure) {
          const treasure = currentRoom.activities.treasure;
          logActivityStart(currentRoom.id, 'treasure', { itemCount: treasure.items.length, ryo: treasure.ryo });
          logStateChange('EXPLORE', 'LOOT', 'treasure activity');
          setDroppedItems(treasure.items);
          setDroppedSkill(null);
          if (treasure.ryo > 0) {
            setPlayer(p => p ? { ...p, ryo: p.ryo + treasure.ryo } : null);
            addLog(`Found treasure! +${treasure.ryo} Ryo.`, 'loot');
          }
          const updatedFloorAfterTreasure = completeActivity(updatedFloor, room.id, 'treasure');
          setBranchingFloor(updatedFloorAfterTreasure);
          logActivityComplete(currentRoom.id, 'treasure');
          setGameState(GameState.LOOT);
        }
        break;
    }
  };

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
      const combatEnemy = generateEnemy(
        combatConfig.floor || floor,
        combatConfig.archetype as 'NORMAL' | 'ELITE' | 'BOSS' || 'NORMAL',
        combatConfig.difficulty || difficulty
      );
      if (combatConfig.name) {
        combatEnemy.name = combatConfig.name;
      }
      setEnemy(combatEnemy);
      setTurnState('PLAYER');
      setGameState(GameState.COMBAT);
      // Don't complete event yet - will complete after combat
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
    setGameState(GameState.EXPLORE);
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
    setEventOutcome(null);
  };

  const nextFloor = () => {
    const nextFloorNum = floor + 1;
    logFloorChange(floor, nextFloorNum);
    setFloor(nextFloorNum);
    setPlayer(p => {
      if (!p) return null;
      const stats = getPlayerFullStats(p);

      // Apply natural regeneration
      const updatedPlayer = {
        ...p,
        currentChakra: Math.min(stats.derived.maxChakra, p.currentChakra + stats.derived.chakraRegen),
        currentHp: Math.min(stats.derived.maxHp, p.currentHp + stats.derived.hpRegen)
      };

      // Reset combat state
      setShowApproachSelector(false);
      setCombatState(null);
      setApproachResult(null);

      // Generate new branching floor
      const newBranchingFloor = generateBranchingFloor(nextFloorNum, difficulty, updatedPlayer);
      setBranchingFloor(newBranchingFloor);
      setSelectedBranchingRoom(null);

      return updatedPlayer;
    });

    setGameState(GameState.EXPLORE);
  };

  // Return to exploration map after loot/events (without advancing floor)
  const returnToMap = () => {
    logRoomExit(selectedBranchingRoom?.id || 'unknown', 'returnToMap');
    logStateChange(gameState.toString(), 'EXPLORE', 'returnToMap');
    setDroppedItems([]);
    setDroppedSkill(null);
    setEnemy(null);
    setSelectedBranchingRoom(null);
    setGameState(GameState.EXPLORE);
  };

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
      componentBag: prev.componentBag.filter(c => c.id !== item.id)
    } : null);
    addLog(`Sold ${item.name} for ${value} Ryō.`, 'loot');
    setSelectedComponent(null);
  };

  // Equip item from component bag
  const equipFromBag = (item: Item) => {
    if (!player) return;
    // Remove from bag first, then try to equip
    const playerWithoutItem = {
      ...player,
      componentBag: player.componentBag.filter(c => c.id !== item.id)
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

  // Synthesize two components into an artifact
  const handleSynthesize = (compA: Item, compB: Item) => {
    if (!player) return;

    const artifact = synthesize(compA, compB);
    if (!artifact) {
      addLog('These components cannot be combined.', 'danger');
      return;
    }

    // Remove both components from bag and add the artifact
    const updatedBag = player.componentBag
      .filter(c => c.id !== compA.id && c.id !== compB.id)
      .concat(artifact);

    setPlayer({ ...player, componentBag: updatedBag });
    addLog(`Synthesized ${artifact.name}!`, 'gain');
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

  // Unequip component to bag
  const unequipToBag = (slot: EquipmentSlot, item: Item) => {
    if (!player || !item.isComponent) return;
    if (player.componentBag.length >= MAX_BAG_SLOTS) {
      addLog('Component bag is full!', 'danger');
      return;
    }
    setPlayer(prev => prev ? {
      ...prev,
      equipment: { ...prev.equipment, [slot]: null },
      componentBag: [...prev.componentBag, item]
    } : null);
    addLog(`Moved ${item.name} to bag.`, 'info');
  };

  // Unequip component and start synthesis mode
  const startSynthesisEquipped = (slot: EquipmentSlot, item: Item) => {
    if (!player || !item.isComponent) return;
    if (player.componentBag.length >= MAX_BAG_SLOTS) {
      addLog('Component bag is full!', 'danger');
      return;
    }
    // Move to bag and select for synthesis
    setPlayer(prev => prev ? {
      ...prev,
      equipment: { ...prev.equipment, [slot]: null },
      componentBag: [...prev.componentBag, item]
    } : null);
    setSelectedComponent(item);
    addLog(`Select another component to synthesize with ${item.name}.`, 'info');
  };

  // Disassemble artifact into components
  const handleDisassembleEquipped = (slot: EquipmentSlot, item: Item) => {
    if (!player || item.isComponent || !item.recipe) return;

    const components = disassemble(item);
    if (!components) {
      addLog('Cannot disassemble this item.', 'danger');
      return;
    }

    // Check bag space for 2 components
    if (player.componentBag.length + 2 > MAX_BAG_SLOTS) {
      addLog('Not enough bag space for components!', 'danger');
      return;
    }

    setPlayer(prev => prev ? {
      ...prev,
      equipment: { ...prev.equipment, [slot]: null },
      componentBag: [...prev.componentBag, ...components]
    } : null);
    addLog(`Disassembled ${item.name} into ${components[0].name} + ${components[1].name}!`, 'loot');
  };

  // ============================================================================
  // DRAG-AND-DROP HANDLERS
  // ============================================================================

  // Reorder items within the component bag
  const reorderBag = (fromIndex: number, toIndex: number) => {
    if (!player) return;
    if (fromIndex === toIndex) return;

    const newBag = [...player.componentBag];
    const [movedItem] = newBag.splice(fromIndex, 1);
    newBag.splice(toIndex, 0, movedItem);

    setPlayer({ ...player, componentBag: newBag });
  };

  // Equip item from bag to a specific slot via drag
  const dragBagToEquip = (item: Item, bagIndex: number, targetSlot: EquipmentSlot) => {
    if (!player) return;

    const existingItem = player.equipment[targetSlot];

    // Remove dragged item from bag
    const newBag = player.componentBag.filter((_, i) => i !== bagIndex);

    // If target slot has an item, move it to the bag position we just freed
    if (existingItem) {
      // Check if existing item is a component (can go to bag)
      if (existingItem.isComponent) {
        newBag.splice(bagIndex, 0, existingItem);
        addLog(`Swapped ${item.name} with ${existingItem.name}.`, 'info');
      } else {
        // Artifact in slot - can't swap, just equip if bag not full
        addLog(`Equipped ${item.name}. ${existingItem.name} remains equipped.`, 'info');
        return; // Don't allow swap with artifact
      }
    } else {
      addLog(`Equipped ${item.name}.`, 'loot');
    }

    setPlayer({
      ...player,
      componentBag: newBag,
      equipment: { ...player.equipment, [targetSlot]: item }
    });
    setSelectedComponent(null);
  };

  // Unequip item from equipment to bag via drag
  const dragEquipToBag = (item: Item, slot: EquipmentSlot, targetBagIndex?: number) => {
    if (!player) return;

    // Only components can be unequipped to bag
    if (!item.isComponent) {
      addLog('Only components can be moved to bag.', 'danger');
      return;
    }

    // Check bag space
    if (player.componentBag.length >= MAX_BAG_SLOTS) {
      addLog('Component bag is full!', 'danger');
      return;
    }

    const newBag = [...player.componentBag];
    if (targetBagIndex !== undefined && targetBagIndex >= 0 && targetBagIndex <= newBag.length) {
      // Insert at specific position
      newBag.splice(targetBagIndex, 0, item);
    } else {
      // Append to end
      newBag.push(item);
    }

    setPlayer({
      ...player,
      equipment: { ...player.equipment, [slot]: null },
      componentBag: newBag
    });
    addLog(`Moved ${item.name} to bag.`, 'info');
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
      addLog(`Not enough Ryo! Need ${price}.`, 'danger');
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
    logStateChange('MERCHANT', 'EXPLORE', 'left merchant');
    setMerchantItems([]);
    setMerchantDiscount(0);
    setSelectedBranchingRoom(null);
    setGameState(GameState.EXPLORE);
    addLog('The merchant waves goodbye.', 'info');
  };

  const handleTrainingComplete = (stat: PrimaryStat, intensity: TrainingIntensity) => {
    if (!trainingData || !player || !selectedBranchingRoom || !branchingFloor) return;

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
    const updatedFloor = completeActivity(branchingFloor, selectedBranchingRoom.id, 'training');
    setBranchingFloor(updatedFloor);
    setTrainingData(null);
    setSelectedBranchingRoom(null);
    setGameState(GameState.EXPLORE);
  };

  const handleTrainingSkip = () => {
    // Mark training as complete without training
    if (branchingFloor && selectedBranchingRoom) {
      logActivityComplete(selectedBranchingRoom.id, 'training');
      const updatedFloor = completeActivity(branchingFloor, selectedBranchingRoom.id, 'training');
      setBranchingFloor(updatedFloor);
    }
    logStateChange('TRAINING', 'EXPLORE', 'training skipped');
    setTrainingData(null);
    setSelectedBranchingRoom(null);
    setGameState(GameState.EXPLORE);
    addLog('You decide to skip training for now.', 'info');
  };

  // Scroll Discovery handlers
  const handleLearnScroll = (skill: Skill, slotIndex?: number) => {
    if (!scrollDiscoveryData || !player || !selectedBranchingRoom || !branchingFloor || !playerStats) return;

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
    const updatedFloor = completeActivity(branchingFloor, selectedBranchingRoom.id, 'scrollDiscovery');
    setBranchingFloor(updatedFloor);
    setScrollDiscoveryData(null);
    setSelectedBranchingRoom(null);
    setGameState(GameState.EXPLORE);
  };

  const handleScrollDiscoverySkip = () => {
    if (branchingFloor && selectedBranchingRoom) {
      logActivityComplete(selectedBranchingRoom.id, 'scrollDiscovery');
      const updatedFloor = completeActivity(branchingFloor, selectedBranchingRoom.id, 'scrollDiscovery');
      setBranchingFloor(updatedFloor);
    }
    logStateChange('SCROLL_DISCOVERY', 'EXPLORE', 'scroll skipped');
    setScrollDiscoveryData(null);
    setSelectedBranchingRoom(null);
    setGameState(GameState.EXPLORE);
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
    if (!eliteChallengeData || !player || !playerStats || !branchingFloor) return;

    const result = attemptEliteEscape(player, playerStats, eliteChallengeData.enemy);
    logExplorationCheckpoint('Elite Escape attempt', { success: result.success, roll: result.roll, chance: result.chance });

    if (result.success) {
      // Mark activity as completed (skipped)
      logActivityComplete(eliteChallengeData.room.id, 'eliteChallenge');
      const updatedFloor = completeActivity(branchingFloor, eliteChallengeData.room.id, 'eliteChallenge');
      setBranchingFloor(updatedFloor);
      addLog(result.message, 'info');
      setEliteChallengeData(null);
      setGameState(GameState.EXPLORE);

      // Continue to next activity in the room
      const currentRoom = getCurrentRoom(updatedFloor);
      if (currentRoom) {
        // Small delay then check for more activities
        setTimeout(() => handleBranchingRoomEnter(currentRoom), 100);
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
      setGameState(GameState.EXPLORE);
    }
  };

  const getRarityColor = (r: Rarity) => {
    switch (r) {
      case Rarity.LEGENDARY: return 'text-orange-400';
      case Rarity.EPIC: return 'text-purple-400';
      case Rarity.RARE: return 'text-blue-400';
      case Rarity.CURSED: return 'text-red-600 animate-pulse';
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
      />
    );
  }

  if (gameState === GameState.GUIDE) {
    return <GameGuide onBack={() => setGameState(GameState.MENU)} />;
  }

  if (gameState === GameState.CHAR_SELECT) {
    return <CharacterSelect onSelectClan={startGame} />;
  }

  if (gameState === GameState.GAME_OVER) {
    return (
      <GameOver
        floor={floor}
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
        <div className="hidden lg:flex w-[320px] flex-col border-r border-zinc-900 bg-zinc-950 p-4">
          <LeftSidebarPanel
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
          />
        </div>
      )}

      {/* Center Panel */}
      <div className="flex-1 flex flex-col relative bg-zinc-950">
        <div className="flex-1 p-6 flex flex-col items-center justify-center relative overflow-y-auto parchment-panel">
          {gameState === GameState.EXPLORE && player && playerStats && branchingFloor && (
            <div className="w-full h-full flex flex-col">
              <BranchingExplorationMap
                branchingFloor={branchingFloor}
                player={player}
                playerStats={playerStats}
                onRoomSelect={handleBranchingRoomSelect}
                onRoomEnter={handleBranchingRoomEnter}
              />
              <PlayerHUD
                player={player}
                playerStats={playerStats}
                floor={floor}
                biome={branchingFloor.biome}
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
          )}

          {gameState === GameState.COMBAT && player && enemy && playerStats && enemyStats && (
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
          )}

          {gameState === GameState.MERCHANT && (
            <Merchant
              merchantItems={merchantItems}
              discountPercent={merchantDiscount}
              player={player}
              playerStats={playerStats}
              onBuyItem={buyItem}
              onLeave={leaveMerchant}
              getRarityColor={getRarityColor}
              getDamageTypeColor={getDamageTypeColor}
              isProcessing={isProcessingLoot}
            />
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
        </div>
      </div>

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
    </div>
    </GameProvider>
  );
};

export default App;
