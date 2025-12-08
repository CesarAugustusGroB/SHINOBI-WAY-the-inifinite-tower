import React, { useState, useCallback, useMemo, useRef } from 'react';
import {
  GameState, Player, Clan, Skill, Enemy, Item, Rarity, DamageType,
  ApproachType, BranchingRoom, PrimaryStat, TrainingActivity, TrainingIntensity,
  EquipmentSlot, MAX_BAG_SLOTS, ScrollDiscoveryActivity
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
import { useCombat } from './hooks/useCombat';
import { useCombatExplorationState } from './hooks/useCombatExplorationState';
import { GameProvider, GameContextValue } from './contexts/GameContext';
import { LIMITS } from './game/config';
import MainMenu from './scenes/MainMenu';
import CharacterSelect from './scenes/CharacterSelect';
import Combat from './scenes/Combat';
import Event from './scenes/Event';
import Loot from './scenes/Loot';
import Merchant from './scenes/Merchant';
import Training from './scenes/Training';
import ScrollDiscovery from './scenes/ScrollDiscovery';
import GameOver from './scenes/GameOver';
import GameGuide from './scenes/GameGuide';
import LeftSidebarPanel from './components/LeftSidebarPanel';
import ApproachSelector from './components/ApproachSelector';
import BranchingExplorationMap from './components/BranchingExplorationMap';
import PlayerHUD from './components/PlayerHUD';
import RewardModal from './components/RewardModal';

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
  const [activeEvent, setActiveEvent] = useState<any>(null);
  const [difficulty, setDifficulty] = useState<number>(20);
  const [isProcessingLoot, setIsProcessingLoot] = useState(false);
  const [merchantItems, setMerchantItems] = useState<Item[]>([]);
  const [merchantDiscount, setMerchantDiscount] = useState<number>(0);
  const [trainingData, setTrainingData] = useState<TrainingActivity | null>(null);
  const [scrollDiscoveryData, setScrollDiscoveryData] = useState<ScrollDiscoveryActivity | null>(null);
  const [pendingArtifact, setPendingArtifact] = useState<Item | null>(null);
  const [selectedComponent, setSelectedComponent] = useState<Item | null>(null);
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

    // Show reward modal instead of returning to map immediately
    setCombatReward({
      expGain,
      ryoGain,
      levelUp: levelUpInfo
    });

    // Set game state to branching explore so the modal shows on the map
    setTimeout(() => {
      setGameState(GameState.BRANCHING_EXPLORE);
    }, 100);
  }, [branchingFloor, floor, addLog, pendingArtifact]);

  // Combat hook - manages enemy, turns, and combat logic
  const {
    enemy,
    enemyStats,
    turnState,
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
    setGameState(GameState.BRANCHING_EXPLORE);
  };

  // Cancel approach selection
  const handleApproachCancel = () => {
    setShowApproachSelector(false);
    setSelectedBranchingRoom(null);
  };

  // Handle approach selection for BRANCHING exploration combat
  const handleBranchingApproachSelect = (approach: ApproachType) => {
    if (!player || !playerStats || !selectedBranchingRoom || !branchingFloor) return;

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
    addLog(result.description, result.success ? 'gain' : 'info');

    // Apply costs
    const playerAfterCosts = applyApproachCosts(player, result);
    setPlayer(playerAfterCosts);

    if (result.skipCombat) {
      // Successfully bypassed combat - mark as completed
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

    if (!activity) {
      // Room is already cleared or has no activities
      addLog(`You enter ${currentRoom.name}. Nothing remains here.`, 'info');
      return;
    }

    // Handle the current activity
    switch (activity) {
      case 'combat':
        if (currentRoom.activities.combat) {
          // Show approach selector for combat
          setSelectedBranchingRoom(currentRoom);
          setShowApproachSelector(true);
          addLog(`Enemy spotted: ${currentRoom.activities.combat.enemy.name}. Choose your approach!`, 'info');
        }
        break;

      case 'merchant':
        if (currentRoom.activities.merchant) {
          setMerchantItems(currentRoom.activities.merchant.items);
          setMerchantDiscount(currentRoom.activities.merchant.discountPercent || 0);
          setSelectedBranchingRoom(currentRoom);
          setGameState(GameState.MERCHANT);
          addLog(`A merchant greets you. ${currentRoom.activities.merchant.items.length} items available.`, 'info');
        }
        break;

      case 'event':
        if (currentRoom.activities.event) {
          setActiveEvent(currentRoom.activities.event.definition);
          setGameState(GameState.EVENT);
        }
        break;

      case 'rest':
        if (currentRoom.activities.rest) {
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
        }
        break;

      case 'training':
        if (currentRoom.activities.training && !currentRoom.activities.training.completed) {
          setTrainingData(currentRoom.activities.training);
          setSelectedBranchingRoom(currentRoom);
          setGameState(GameState.TRAINING);
          addLog('You arrive at a training area. Choose your training regimen.', 'info');
        }
        break;

      case 'scrollDiscovery':
        if (currentRoom.activities.scrollDiscovery && !currentRoom.activities.scrollDiscovery.completed) {
          setScrollDiscoveryData(currentRoom.activities.scrollDiscovery);
          setSelectedBranchingRoom(currentRoom);
          setGameState(GameState.SCROLL_DISCOVERY);
          addLog('You discovered ancient jutsu scrolls!', 'gain');
        }
        break;

      case 'eliteChallenge':
        if (currentRoom.activities.eliteChallenge && !currentRoom.activities.eliteChallenge.completed) {
          const challenge = currentRoom.activities.eliteChallenge;
          // Store the artifact for victory reward
          setPendingArtifact(challenge.artifact);
          setSelectedBranchingRoom(currentRoom);
          setShowApproachSelector(true);
          addLog(`A ${challenge.enemy.name} guards a sealed artifact! Defeat it to claim the prize.`, 'danger');
        }
        break;

      case 'treasure':
        if (currentRoom.activities.treasure) {
          const treasure = currentRoom.activities.treasure;
          setDroppedItems(treasure.items);
          setDroppedSkill(null);
          if (treasure.ryo > 0) {
            setPlayer(p => p ? { ...p, ryo: p.ryo + treasure.ryo } : null);
            addLog(`Found treasure! +${treasure.ryo} Ryo.`, 'loot');
          }
          const updatedFloorAfterTreasure = completeActivity(updatedFloor, room.id, 'treasure');
          setBranchingFloor(updatedFloorAfterTreasure);
          setGameState(GameState.LOOT);
        }
        break;
    }
  };

  const handleEventChoice = (choice: any) => {
    if (!player || !playerStats) return;
    let text = "";
    let type: any = 'info';
    let next = true;

    switch (choice.type) {
      case 'LEAVE': text = "You chose to leave."; break;
      case 'HEAL_CHAKRA':
        setPlayer(p => p ? ({ ...p, currentChakra: playerStats.derived.maxChakra }) : null);
        text = "You prayed and restored your Chakra."; type = 'gain'; break;
      case 'HEAL_HP':
        const healAmt = Math.floor(playerStats.derived.maxHp * 0.3);
        setPlayer(p => p ? ({ ...p, currentHp: Math.min(playerStats.derived.maxHp, p.currentHp + healAmt) }) : null);
        text = `You tended to your wounds. +${healAmt} HP.`; type = 'gain'; break;
      case 'HEAL_ALL':
        setPlayer(p => p ? ({ ...p, currentHp: playerStats.derived.maxHp, currentChakra: playerStats.derived.maxChakra }) : null);
        text = "HP & Chakra fully restored."; type = 'gain'; break;
      case 'GAIN_XP':
        const xpGainEvent = choice.value || 20;
        setPlayer(prev => prev ? checkLevelUp({ ...prev, exp: prev.exp + xpGainEvent }).player : null);
        text = `Gained ${xpGainEvent} Experience.`; type = 'gain'; break;
      case 'GAMBLE_HP':
        if (Math.random() < (choice.chance || 0.5)) {
          setPlayer(p => p ? ({ ...p, primaryStats: { ...p.primaryStats, willpower: p.primaryStats.willpower + 5 } }) : null);
          text = "Success! Willpower increased by 5."; type = 'gain';
        } else {
          const loss = Math.floor(player.currentHp * 0.5);
          setPlayer(p => p ? ({ ...p, currentHp: Math.max(1, p.currentHp - loss) }) : null);
          text = `Failure. You lost ${loss} HP.`; type = 'danger';
        }
        break;
      case 'TRADE':
        if (player.ryo >= (choice.value || 150)) {
          // Trade for component only - artifacts from Elite Challenges
          const item = generateLoot(floor, difficulty + 10);
          setPlayer(p => p ? ({ ...p, ryo: p.ryo - (choice.value || 150) }) : null);
          setDroppedItems([item]);
          setDroppedSkill(null);
          setGameState(GameState.LOOT);
          text = `You bought: ${item.name}`; type = 'loot'; next = false;
        } else {
          text = "Not enough Ryō."; type = 'danger';
        }
        break;
      case 'FIGHT_GHOST':
        // Generate a ghost enemy and start combat
        const ghostEnemy = generateEnemy(floor, 'ELITE', difficulty);
        ghostEnemy.name = 'Vengeful Spirit';
        setEnemy(ghostEnemy);
        setTurnState('PLAYER');
        setGameState(GameState.COMBAT);
        text = "The spirit rises to defend its grave!"; type = 'danger'; next = false;
        break;
      case 'TRAP_DMG':
        const trapDamage = choice.value || Math.floor(player.currentHp * 0.3);
        setPlayer(p => p ? ({ ...p, currentHp: Math.max(1, p.currentHp - trapDamage) }) : null);
        text = `You triggered a trap! Lost ${trapDamage} HP.`; type = 'danger';
        break;
      case 'CHALLENGE_GUARDIAN':
        // Generate a guardian enemy (stronger than normal)
        const guardian = generateEnemy(floor + 2, 'ELITE', difficulty + 10);
        guardian.name = 'Guardian';
        guardian.tier = 'Guardian';
        setEnemy(guardian);
        setTurnState('PLAYER');
        setGameState(GameState.COMBAT);
        text = "The guardian accepts your challenge!"; type = 'danger'; next = false;
        break;
    }
    if (next) {
      addLog(text, type);

      // Mark event as completed in branching floor
      if (branchingFloor) {
        const currentRoom = getCurrentRoom(branchingFloor);
        if (currentRoom) {
          const updatedFloor = completeActivity(branchingFloor, currentRoom.id, 'event');
          setBranchingFloor(updatedFloor);
        }
      }
      setActiveEvent(null);
      setGameState(GameState.BRANCHING_EXPLORE);
    }
  };

  const nextFloor = () => {
    const nextFloorNum = floor + 1;
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

    setGameState(GameState.BRANCHING_EXPLORE);
  };

  // Return to exploration map after loot/events (without advancing floor)
  const returnToMap = () => {
    setDroppedItems([]);
    setDroppedSkill(null);
    setEnemy(null);
    setSelectedBranchingRoom(null);
    setGameState(GameState.BRANCHING_EXPLORE);
  };

  // Close reward modal - check for pending artifact from elite challenge
  const handleRewardClose = () => {
    setCombatReward(null);

    // If there's a pending artifact from elite challenge, show loot screen
    if (pendingArtifact) {
      setDroppedItems([pendingArtifact]);
      setDroppedSkill(null);
      setPendingArtifact(null);
      addLog('The artifact guardian has fallen! Claim your prize.', 'loot');
      setGameState(GameState.LOOT);
    }
  };

  const equipItem = (item: Item) => {
    if (!player || isProcessingLoot) return;
    setIsProcessingLoot(true);
    setPlayer(prev => {
      if (!prev) return null;
      return equipItemFn(prev, item);
    });
    addLog(`Equipped ${item.name}.`, 'loot');
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

  const buyItem = (item: Item) => {
    if (!player || isProcessingLoot) return;

    const price = Math.floor(item.value * (1 - merchantDiscount / 100));
    if (player.ryo < price) {
      addLog(`Not enough Ryo! Need ${price}.`, 'danger');
      return;
    }

    setIsProcessingLoot(true);
    setPlayer(prev => {
      if (!prev) return null;
      const afterBuy = { ...prev, ryo: prev.ryo - price };
      return equipItemFn(afterBuy, item);
    });
    addLog(`Bought and equipped ${item.name} for ${price} Ryō.`, 'loot');
    setMerchantItems(prev => prev.filter(i => i.id !== item.id));
    setTimeout(() => setIsProcessingLoot(false), 100);
  };

  const leaveMerchant = () => {
    if (branchingFloor && selectedBranchingRoom) {
      const updatedFloor = completeActivity(branchingFloor, selectedBranchingRoom.id, 'merchant');
      setBranchingFloor(updatedFloor);
    }
    setMerchantItems([]);
    setMerchantDiscount(0);
    setSelectedBranchingRoom(null);
    setGameState(GameState.BRANCHING_EXPLORE);
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
    const updatedFloor = completeActivity(branchingFloor, selectedBranchingRoom.id, 'training');
    setBranchingFloor(updatedFloor);
    setTrainingData(null);
    setSelectedBranchingRoom(null);
    setGameState(GameState.BRANCHING_EXPLORE);
  };

  const handleTrainingSkip = () => {
    // Mark training as complete without training
    if (branchingFloor && selectedBranchingRoom) {
      const updatedFloor = completeActivity(branchingFloor, selectedBranchingRoom.id, 'training');
      setBranchingFloor(updatedFloor);
    }
    setTrainingData(null);
    setSelectedBranchingRoom(null);
    setGameState(GameState.BRANCHING_EXPLORE);
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
    const updatedFloor = completeActivity(branchingFloor, selectedBranchingRoom.id, 'scrollDiscovery');
    setBranchingFloor(updatedFloor);
    setScrollDiscoveryData(null);
    setSelectedBranchingRoom(null);
    setGameState(GameState.BRANCHING_EXPLORE);
  };

  const handleScrollDiscoverySkip = () => {
    if (branchingFloor && selectedBranchingRoom) {
      const updatedFloor = completeActivity(branchingFloor, selectedBranchingRoom.id, 'scrollDiscovery');
      setBranchingFloor(updatedFloor);
    }
    setScrollDiscoveryData(null);
    setSelectedBranchingRoom(null);
    setGameState(GameState.BRANCHING_EXPLORE);
    addLog('You leave the scrolls behind.', 'info');
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
            onSellEquipped={sellEquipped}
            onUnequipToBag={unequipToBag}
            onDisassembleEquipped={handleDisassembleEquipped}
          />
        </div>
      )}

      {/* Center Panel */}
      <div className="flex-1 flex flex-col relative bg-zinc-950">
        <div className="flex-1 p-6 flex flex-col items-center justify-center relative overflow-y-auto parchment-panel">
          {gameState === GameState.BRANCHING_EXPLORE && player && playerStats && branchingFloor && (
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
              type: targetEnemy.tier === 'Guardian' ? 'BOSS' as any :
                    targetEnemy.tier === 'Jonin' ? 'ELITE' as any : 'COMBAT' as any,
              terrain: selectedBranchingRoom.terrain,
              visibility: 'VISIBLE' as any,
              position: { x: 0, y: 0 },
              connections: [],
              enemy: targetEnemy,
              isVisited: true,
              isCleared: false,
              isRevealed: true,
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
