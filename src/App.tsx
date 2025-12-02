import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
  GameState, Player, Clan, Skill, Enemy, Room, Item, Rarity, DamageType, EffectType, Buff,
  FloorLayout, ExplorationNode, NodeType, ApproachType, TerrainDefinition,
  BranchingFloor, BranchingRoom, BranchingRoomType, CombatModifierType
} from './game/types';
import { CLAN_STATS, CLAN_START_SKILL, CLAN_GROWTH, SKILLS, getElementEffectiveness } from './game/constants';
import {
  calculateDerivedStats,
  getPlayerFullStats,
  getEnemyFullStats,
  canLearnSkill,
  calculateDamage
} from './game/systems/StatSystem';
import { getStoryArc, generateEnemy } from './game/systems/EnemySystem';
import { generateItem, generateSkillLoot, equipItem as equipItemFn, sellItem as sellItemFn } from './game/systems/LootSystem';
import {
  processEnemyTurn,
  useSkill as useSkillCombat,
  CombatState,
  createCombatState,
  applyApproachEffects
} from './game/systems/CombatSystem';
import { generateRooms } from './game/systems/RoomSystem';
import { generateFloorLayout, clearNode, moveToNode } from './game/systems/FloorSystem';
import {
  executeApproach,
  applyApproachCosts,
  applyEnemyHpReduction,
  getCombatModifiers,
  ApproachResult
} from './game/systems/ApproachSystem';
import {
  attemptDiscovery,
  applyDiscoveryResults,
  attemptMysteryReveal,
  applyMysteryReveal,
  updateNodeVisibility
} from './game/systems/DiscoverySystem';
import { TERRAIN_DEFINITIONS } from './game/constants/terrain';
import {
  generateBranchingFloor,
  moveToRoom,
  getCurrentActivity,
  completeActivity,
  isFloorComplete,
  getCurrentRoom,
  getCombatSetup
} from './game/systems/BranchingFloorSystem';
import MainMenu from './scenes/MainMenu';
import CharacterSelect from './scenes/CharacterSelect';
import Exploration from './scenes/Exploration';
import Combat, { CombatRef } from './scenes/Combat';
import Event from './scenes/Event';
import Loot from './scenes/Loot';
import GameOver from './scenes/GameOver';
import GameGuide from './scenes/GameGuide';
import LeftSidebarPanel from './components/LeftSidebarPanel';
import ExplorationMap from './components/ExplorationMap';
import ApproachSelector from './components/ApproachSelector';
import BranchingExplorationMap from './components/BranchingExplorationMap';
import PlayerHUD from './components/PlayerHUD';

// Import the parchment background styles
import './App.css';

const generateId = () => Math.random().toString(36).substring(2, 9);

const App: React.FC = () => {
  // --- Core State ---
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [floor, setFloor] = useState(1);
  const [logs, setLogs] = useState<any[]>([]);
  const [player, setPlayer] = useState<Player | null>(null);
  const [enemy, setEnemy] = useState<Enemy | null>(null);
  const [roomChoices, setRoomChoices] = useState<Room[]>([]);
  const [droppedItems, setDroppedItems] = useState<Item[]>([]);
  const [droppedSkill, setDroppedSkill] = useState<Skill | null>(null);
  const [activeEvent, setActiveEvent] = useState<any>(null);
  const [difficulty, setDifficulty] = useState<number>(20);
  const [turnState, setTurnState] = useState<'PLAYER' | 'ENEMY_TURN'>('PLAYER');
  const logIdCounter = useRef<number>(0);

  // --- New Exploration Map State ---
  const [floorLayout, setFloorLayout] = useState<FloorLayout | null>(null);
  const [selectedNode, setSelectedNode] = useState<ExplorationNode | null>(null);
  const [currentNodeId, setCurrentNodeId] = useState<string | null>(null);
  const [combatState, setCombatState] = useState<CombatState | null>(null);
  const [approachResult, setApproachResult] = useState<ApproachResult | null>(null);
  const [showApproachSelector, setShowApproachSelector] = useState(false);

  // --- Branching Exploration State ---
  const [branchingFloor, setBranchingFloor] = useState<BranchingFloor | null>(null);
  const [selectedBranchingRoom, setSelectedBranchingRoom] = useState<BranchingRoom | null>(null);
  const [useBranchingExploration, setUseBranchingExploration] = useState(true); // Toggle between systems

  // Combat ref for floating text
  const combatRef = useRef<CombatRef>(null);

  const addLog = useCallback((text: string, type: any = 'info', details?: string) => {
    setLogs(prev => {
      logIdCounter.current += 1;
      const newEntry: any = { id: logIdCounter.current, text, type, details };
      const newLogs = [...prev, newEntry];
      if (newLogs.length > 50) newLogs.shift();
      return newLogs;
    });
  }, []);

  const playerStats = useMemo(() => {
    if (!player) return null;
    return getPlayerFullStats(player);
  }, [player]);

  const enemyStats = useMemo(() => {
    if (!enemy) return null;
    return getEnemyFullStats(enemy);
  }, [enemy]);

  const checkLevelUp = (p: Player): Player => {
    let currentPlayer = { ...p };
    let leveledUp = false;
    while (currentPlayer.exp >= currentPlayer.maxExp) {
      leveledUp = true;
      currentPlayer.exp -= currentPlayer.maxExp;
      currentPlayer.level += 1;
      currentPlayer.maxExp = currentPlayer.level * 100;
      const growth = CLAN_GROWTH[currentPlayer.clan];
      const s = currentPlayer.primaryStats;
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
    if (leveledUp) {
      const newStats = getPlayerFullStats(currentPlayer);
      currentPlayer.currentHp = newStats.derived.maxHp;
      currentPlayer.currentChakra = newStats.derived.maxChakra;
      addLog(`LEVEL UP! You reached Level ${currentPlayer.level}. Stats increased & Fully Healed!`, 'gain');
    }
    return currentPlayer;
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
      equipment: { WEAPON: null, HEAD: null, BODY: null, ACCESSORY: null } as any,
      skills: [SKILLS.BASIC_ATTACK, SKILLS.SHURIKEN, { ...startSkill, level: 1 }],
      activeBuffs: []
    };

    setPlayer(newPlayer);
    setFloor(1);
    setLogs([]);
    setEnemy(null);
    setDroppedItems([]);
    setDroppedSkill(null);
    setActiveEvent(null);
    setTurnState('PLAYER');
    addLog(`Lineage chosen: ${clan}. The Tower awaits.`, 'info');

    // Initialize floor layout for new exploration system
    const layout = generateFloorLayout(1, difficulty, newPlayer, derived.maxHp);
    // Mark entry node as visited so it's visible, then clear it so player can move
    const visitedLayout = moveToNode(layout, layout.entryNodeId);
    const initializedLayout = clearNode(visitedLayout, layout.entryNodeId);
    setFloorLayout(initializedLayout);
    setCurrentNodeId(layout.entryNodeId);
    setSelectedNode(null);
    setShowApproachSelector(false);
    setCombatState(null);
    setApproachResult(null);

    // Also keep legacy room choices for backward compatibility
    const rooms = generateRooms(1, difficulty, newPlayer);
    setRoomChoices(rooms);

    // Initialize branching floor for new exploration system
    if (useBranchingExploration) {
      const newBranchingFloor = generateBranchingFloor(1, difficulty, newPlayer);
      setBranchingFloor(newBranchingFloor);
      setSelectedBranchingRoom(null);
      setGameState(GameState.BRANCHING_EXPLORE);
    } else {
      setGameState(GameState.EXPLORE_MAP);
    }
  };

  const selectRoom = (room: Room) => {
    if (room.type === 'REST') {
      if (!player || !playerStats) return;
      setPlayer({ ...player, currentHp: playerStats.derived.maxHp, currentChakra: playerStats.derived.maxChakra });
      addLog('You rested. HP & Chakra fully restored.', 'gain');
      nextFloor();
    } else if (room.type === 'EVENT' && room.eventDefinition) {
      setActiveEvent(room.eventDefinition);
      setGameState(GameState.EVENT);
    } else if (['COMBAT', 'ELITE', 'BOSS', 'AMBUSH'].includes(room.type) && room.enemy) {
      setEnemy(room.enemy);
      setTurnState('PLAYER');
      setGameState(GameState.COMBAT);
      addLog(`Engaged: ${room.enemy.name}`, 'danger');
      if (room.type === 'AMBUSH') addLog("DANGER! An S-Rank Rogue blocks your path!", 'danger');
    }
  };

  // ============================================================================
  // NEW EXPLORATION MAP HANDLERS
  // ============================================================================

  // Handle selecting a node on the map (just shows details)
  const handleNodeSelect = (nodeId: string) => {
    if (!floorLayout) return;
    const node = floorLayout.nodes.find(n => n.id === nodeId);
    setSelectedNode(node || null);
  };

  // Helper to handle revealed mystery nodes without recursion
  // This uses the passed layout to avoid stale closure state
  const handleRevealedMysteryNode = (revealedNode: ExplorationNode, currentLayout: FloorLayout, nodeId: string) => {
    if (!player || !playerStats) return;

    const revealedType = revealedNode.revealedType;

    switch (revealedType) {
      case NodeType.COMBAT:
      case NodeType.ELITE:
      case NodeType.BOSS:
      case NodeType.AMBUSH_POINT:
        if (revealedNode.enemy) {
          setSelectedNode(revealedNode);
          setShowApproachSelector(true);
        }
        break;

      case NodeType.REST:
        setPlayer({
          ...player,
          currentHp: playerStats.derived.maxHp,
          currentChakra: playerStats.derived.maxChakra
        });
        addLog('The mystery reveals a safe haven. HP & Chakra fully restored.', 'gain');
        setFloorLayout(clearNode(currentLayout, nodeId));
        break;

      case NodeType.EVENT:
        if (revealedNode.event) {
          setActiveEvent(revealedNode.event);
          setGameState(GameState.EVENT);
        }
        break;

      case NodeType.CACHE:
        const item = generateItem(floor, difficulty);
        setDroppedItems([item]);
        setDroppedSkill(null);
        addLog('The mystery reveals a hidden cache!', 'loot');
        setFloorLayout(clearNode(currentLayout, nodeId));
        setGameState(GameState.LOOT);
        break;

      case NodeType.TRAP:
        const trapDamage = Math.floor(playerStats.derived.maxHp * 0.15);
        setPlayer(p => p ? { ...p, currentHp: Math.max(1, p.currentHp - trapDamage) } : null);
        addLog(`The mystery reveals a trap! Lost ${trapDamage} HP.`, 'danger');
        setFloorLayout(clearNode(currentLayout, nodeId));
        break;

      case NodeType.SHRINE:
        if (revealedNode.blessings && revealedNode.blessings.length > 0) {
          const blessing = revealedNode.blessings[0];
          addLog(`The mystery reveals a shrine! ${blessing.name} blessing granted.`, 'gain');
          setFloorLayout(clearNode(currentLayout, nodeId));
        }
        break;

      default:
        addLog('The chamber reveals its secrets...', 'info');
        setFloorLayout(clearNode(currentLayout, nodeId));
    }
  };

  // Handle entering a node
  const handleNodeEnter = (nodeId: string) => {
    if (!floorLayout || !player || !playerStats) return;

    const node = floorLayout.nodes.find(n => n.id === nodeId);
    if (!node) return;

    // Check if accessible (adjacent to current node OR is current node for boss floors)
    const currentNode = floorLayout.nodes.find(n => n.id === currentNodeId);
    const isCurrentNode = nodeId === currentNodeId;
    const isAdjacent = currentNode?.connections.includes(nodeId);

    if (!currentNode || (!isCurrentNode && !isAdjacent)) {
      addLog('You cannot reach that chamber from here.', 'danger');
      return;
    }

    // Must clear current node before moving to adjacent nodes (unless it's the same node)
    if (!isCurrentNode && !currentNode.isCleared) {
      addLog('You must complete this chamber before moving on.', 'danger');
      return;
    }

    // Move to the node
    const updatedLayout = moveToNode(floorLayout, nodeId);
    setFloorLayout(updatedLayout);
    setCurrentNodeId(nodeId);

    // Attempt discoveries when entering a new node
    const discoveries = attemptDiscovery(nodeId, updatedLayout, playerStats);
    if (discoveries.length > 0) {
      const layoutWithDiscoveries = applyDiscoveryResults(updatedLayout, discoveries);
      setFloorLayout(layoutWithDiscoveries);
      discoveries.forEach(d => {
        if (d.discovered) {
          addLog(d.description, 'gain');
        }
      });
    }

    // Update visibility
    const layoutWithVisibility = updateNodeVisibility(
      discoveries.length > 0 ? applyDiscoveryResults(updatedLayout, discoveries) : updatedLayout,
      nodeId,
      playerStats
    );
    setFloorLayout(layoutWithVisibility);

    // Handle node type
    const displayType = node.revealedType || node.type;

    switch (displayType) {
      case NodeType.START:
        addLog('You stand at the entrance.', 'info');
        // Auto-clear START node so player can move
        if (!node.isCleared) {
          const clearedStart = clearNode(layoutWithVisibility, nodeId);
          setFloorLayout(clearedStart);
        }
        break;

      case NodeType.EXIT:
        addLog('You ascend to the next floor!', 'gain');
        nextFloor();
        break;

      case NodeType.COMBAT:
      case NodeType.ELITE:
      case NodeType.BOSS:
      case NodeType.AMBUSH_POINT:
        if (node.enemy) {
          setSelectedNode(node);
          setShowApproachSelector(true);
        }
        break;

      case NodeType.REST:
        // Guard against double-healing if already cleared
        if (!node.isCleared) {
          setPlayer({
            ...player,
            currentHp: playerStats.derived.maxHp,
            currentChakra: playerStats.derived.maxChakra
          });
          addLog('You found a safe haven. HP & Chakra fully restored.', 'gain');
          // Mark node as cleared
          const clearedLayout = clearNode(layoutWithVisibility, nodeId);
          setFloorLayout(clearedLayout);
        } else {
          addLog('You have already rested here.', 'info');
        }
        break;

      case NodeType.EVENT:
        if (node.event) {
          setActiveEvent(node.event);
          setGameState(GameState.EVENT);
        }
        break;

      case NodeType.SHRINE:
        if (node.blessings && node.blessings.length > 0) {
          // For now, apply first blessing
          const blessing = node.blessings[0];
          addLog(`The shrine grants you a blessing: ${blessing.name}`, 'gain');
          // Mark as cleared
          const clearedShrine = clearNode(layoutWithVisibility, nodeId);
          setFloorLayout(clearedShrine);
        }
        break;

      case NodeType.CACHE:
        // Generate loot and clear node
        const item = generateItem(floor, difficulty);
        setDroppedItems([item]);
        setDroppedSkill(null);
        addLog('You found a hidden cache!', 'loot');
        // Clear node before going to loot
        const clearedCache = clearNode(layoutWithVisibility, nodeId);
        setFloorLayout(clearedCache);
        setGameState(GameState.LOOT);
        break;

      case NodeType.TRAP:
        // Apply trap damage (reduced if detected earlier)
        const trapDamage = Math.floor(playerStats.derived.maxHp * 0.15);
        setPlayer(p => p ? { ...p, currentHp: Math.max(1, p.currentHp - trapDamage) } : null);
        addLog(`You triggered a trap! Lost ${trapDamage} HP.`, 'danger');
        const clearedTrap = clearNode(layoutWithVisibility, nodeId);
        setFloorLayout(clearedTrap);
        break;

      case NodeType.MYSTERY:
        // Try to reveal what it actually is
        const revealResult = attemptMysteryReveal(node, playerStats);
        if (revealResult.revealed) {
          const revealedLayout = applyMysteryReveal(layoutWithVisibility, revealResult);
          setFloorLayout(revealedLayout);
          addLog(revealResult.description, 'info');
          // Handle the revealed type directly (avoid stale state from recursive call)
          const revealedNode = { ...node, revealedType: revealResult.actualType };
          handleRevealedMysteryNode(revealedNode, revealedLayout, nodeId);
        } else {
          addLog('The chamber remains mysterious. Proceed with caution...', 'info');
          // Clear mystery node so player can move on
          const clearedMystery = clearNode(layoutWithVisibility, nodeId);
          setFloorLayout(clearedMystery);
        }
        break;

      default:
        addLog('You enter the chamber...', 'info');
    }
  };

  // Handle approach selection for combat
  const handleApproachSelect = (approach: ApproachType) => {
    if (!player || !playerStats || !selectedNode || !selectedNode.enemy) return;

    const terrain = TERRAIN_DEFINITIONS[selectedNode.terrain];
    const result = executeApproach(
      approach,
      player,
      playerStats,
      selectedNode.enemy,
      terrain
    );

    setApproachResult(result);
    addLog(result.description, result.success ? 'gain' : 'info');

    // Apply costs
    const playerAfterCosts = applyApproachCosts(player, result);
    setPlayer(playerAfterCosts);

    if (result.skipCombat) {
      // Successfully bypassed combat
      addLog('You slip past undetected!', 'gain');
      setShowApproachSelector(false);
      if (floorLayout && currentNodeId) {
        const clearedLayout = clearNode(floorLayout, currentNodeId);
        setFloorLayout(clearedLayout);
      }
      return;
    }

    // Set up enemy with any HP reduction from approach
    let combatEnemy = selectedNode.enemy;
    if (result.enemyHpReduction > 0) {
      combatEnemy = applyEnemyHpReduction(combatEnemy, result);
      addLog(`Your approach dealt ${Math.floor(selectedNode.enemy.currentHp * result.enemyHpReduction)} damage!`, 'combat');
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

  // Cancel approach selection
  const handleApproachCancel = () => {
    setShowApproachSelector(false);
    setSelectedNode(null);
    setSelectedBranchingRoom(null);
  };

  // Handle approach selection for BRANCHING exploration combat
  const handleBranchingApproachSelect = (approach: ApproachType) => {
    if (!player || !playerStats || !selectedBranchingRoom || !branchingFloor) return;

    const combat = selectedBranchingRoom.activities.combat;
    if (!combat || !combat.enemy) return;

    const terrain = TERRAIN_DEFINITIONS[selectedBranchingRoom.terrain];
    const result = executeApproach(
      approach,
      player,
      playerStats,
      combat.enemy,
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
      completeBranchingCombat();
      setSelectedBranchingRoom(null);
      return;
    }

    // Set up enemy with any HP reduction from approach
    let combatEnemy = combat.enemy;
    if (result.enemyHpReduction > 0) {
      combatEnemy = applyEnemyHpReduction(combatEnemy, result);
      addLog(`Your approach dealt ${Math.floor(combat.enemy.currentHp * result.enemyHpReduction)} damage!`, 'combat');
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
          addLog(`A merchant greets you. ${currentRoom.activities.merchant.items.length} items available.`, 'info');
          // For now, just mark as completed (merchant UI to be added later)
          const updatedFloorAfterMerchant = completeActivity(updatedFloor, room.id, 'merchant');
          setBranchingFloor(updatedFloorAfterMerchant);
          // Return to map - user can re-enter to continue with other activities
          addLog('The merchant waves goodbye.', 'info');
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
        if (currentRoom.activities.training) {
          const training = currentRoom.activities.training;
          // For now just give the stat gain
          addLog(`You train ${training.stat}. +${training.gain} permanently!`, 'gain');
          const updatedFloorAfterTraining = completeActivity(updatedFloor, room.id, 'training');
          setBranchingFloor(updatedFloorAfterTraining);
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

  // Complete combat activity in branching room
  const completeBranchingCombat = () => {
    setBranchingFloor(prevFloor => {
      if (!prevFloor) return prevFloor;

      const currentRoom = getCurrentRoom(prevFloor);
      if (!currentRoom) return prevFloor;

      // Mark combat as completed
      const updatedFloor = completeActivity(prevFloor, currentRoom.id, 'combat');

      // Check if room is cleared and it's the exit
      const updatedRoom = updatedFloor.rooms.find(r => r.id === currentRoom.id);
      if (updatedRoom?.isCleared && updatedRoom.isExit) {
        addLog('You cleared the exit! Proceed to the next floor?', 'gain');
      }

      return updatedFloor;
    });
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
        const xpGain = choice.value || 20;
        setPlayer(prev => prev ? checkLevelUp({ ...prev, exp: prev.exp + xpGain }) : null);
        text = `Gained ${xpGain} Experience.`; type = 'gain'; break;
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
          const item = generateItem(floor, difficulty, Rarity.RARE);
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

      // Handle event completion based on exploration mode
      if (useBranchingExploration && branchingFloor) {
        // Mark event as completed in branching floor
        const currentRoom = getCurrentRoom(branchingFloor);
        if (currentRoom) {
          const updatedFloor = completeActivity(branchingFloor, currentRoom.id, 'event');
          setBranchingFloor(updatedFloor);
        }
        setActiveEvent(null);
        setGameState(GameState.BRANCHING_EXPLORE);
      } else {
        // Legacy exploration system
        if (floorLayout && currentNodeId) {
          const clearedEvent = clearNode(floorLayout, currentNodeId);
          setFloorLayout(clearedEvent);
        }
        setActiveEvent(null);
        setGameState(GameState.EXPLORE_MAP);
      }
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

      // Generate new floor layout (legacy system)
      const layout = generateFloorLayout(nextFloorNum, difficulty, updatedPlayer, stats.derived.maxHp);
      const visitedLayout = moveToNode(layout, layout.entryNodeId);
      const initializedLayout = clearNode(visitedLayout, layout.entryNodeId);
      setFloorLayout(initializedLayout);
      setCurrentNodeId(layout.entryNodeId);
      setSelectedNode(null);
      setShowApproachSelector(false);
      setCombatState(null);
      setApproachResult(null);

      // Also keep legacy room choices for backward compatibility
      const rooms = generateRooms(nextFloorNum, difficulty, updatedPlayer, stats.derived.maxHp);
      setRoomChoices(rooms);

      // Generate new branching floor
      if (useBranchingExploration) {
        const newBranchingFloor = generateBranchingFloor(nextFloorNum, difficulty, updatedPlayer);
        setBranchingFloor(newBranchingFloor);
        setSelectedBranchingRoom(null);
      }

      return updatedPlayer;
    });

    if (useBranchingExploration) {
      setGameState(GameState.BRANCHING_EXPLORE);
    } else {
      setGameState(GameState.EXPLORE_MAP);
    }
  };

  // Return to exploration map after loot/events (without advancing floor)
  const returnToMap = () => {
    setDroppedItems([]);
    setDroppedSkill(null);
    setEnemy(null);
    if (useBranchingExploration) {
      setGameState(GameState.BRANCHING_EXPLORE);
    } else {
      setGameState(GameState.EXPLORE_MAP);
    }
  };

  const useSkill = (skill: Skill) => {
    if (!player || !enemy || !playerStats || !enemyStats) return;

    // Handle toggle skills
    if (skill.isToggle) {
      const isActive = skill.isActive || false;

      // Check chakra cost for activation
      if (!isActive && player.currentChakra < skill.chakraCost) {
        addLog("Insufficient Chakra to activate!", 'danger');
        return;
      }

      setPlayer(prev => {
        if (!prev) return null;
        let newBuffs = [...prev.activeBuffs];
        let newSkills = prev.skills.map(s => s.id === skill.id ? { ...s, isActive: !isActive } : s);
        let newChakra = prev.currentChakra;

        if (isActive) {
          // Deactivate: Remove all buffs from this skill
          newBuffs = newBuffs.filter(b => b.source !== skill.name);
          addLog(`${skill.name} Deactivated.`, 'info');
        } else {
          // Activate: Apply effects and pay initial cost
          newChakra -= skill.chakraCost;
          if (skill.effects) {
            skill.effects.forEach(eff => {
              const buff: Buff = {
                id: Math.random().toString(36).substring(2, 9),
                name: eff.type,
                duration: eff.duration,
                effect: eff,
                source: skill.name
              };
              newBuffs.push(buff);
            });
          }
          addLog(`${skill.name} Activated!`, 'gain');
        }

        return { ...prev, skills: newSkills, activeBuffs: newBuffs, currentChakra: newChakra };
      });
      setTurnState('ENEMY_TURN');
      return;
    }

    // Use CombatSystem for regular skills, passing combat state for first hit multiplier
    const result = useSkillCombat(player, playerStats, enemy, enemyStats, skill, combatState || undefined);

    if (!result) return;

    // Mark first turn as complete if applicable
    if (combatState?.isFirstTurn) {
      setCombatState(prev => prev ? { ...prev, isFirstTurn: false } : null);
    }

    // Apply result to game state
    addLog(result.logMessage, result.logType);

    // Spawn floating combat text
    if (result.damageDealt > 0) {
      const isCrit = result.logMessage.includes('CRITICAL');
      combatRef.current?.spawnFloatingText('enemy', result.damageDealt.toString(), isCrit ? 'crit' : 'damage');
    } else if (result.logMessage.includes('MISSED') || result.logMessage.includes('EVADED')) {
      combatRef.current?.spawnFloatingText('enemy', 'MISS', 'miss');
    }

    setPlayer(prev => prev ? {
      ...prev,
      currentHp: result.newPlayerHp,
      currentChakra: result.newPlayerChakra,
      activeBuffs: result.newPlayerBuffs,
      skills: result.skillsUpdate || prev.skills
    } : null);

    setEnemy(prev => prev ? {
      ...prev,
      currentHp: result.newEnemyHp,
      activeBuffs: result.newEnemyBuffs
    } : null);

    // Check for victory/defeat
    if (result.enemyDefeated) {
      handleVictory();
    } else if (result.playerDefeated) {
      setGameState(GameState.GAME_OVER);
    } else {
      setTurnState('ENEMY_TURN');
    }
  };

  useEffect(() => {
    if (turnState === 'ENEMY_TURN' && player && enemy && playerStats && enemyStats) {
      const timer = setTimeout(() => {
        const result = processEnemyTurn(player, playerStats, enemy, enemyStats, combatState || undefined);
        result.logMessages.forEach(msg => {
          addLog(msg, msg.includes('GUTS') ? 'gain' : msg.includes('took') ? 'combat' : 'danger');
        });

        // Calculate damage dealt to player for floating text
        const playerDamageTaken = player.currentHp - result.newPlayerHp;
        if (playerDamageTaken > 0) {
          // Check if it was a crit from log messages
          const isCrit = result.logMessages.some(m => m.includes('Crit'));
          combatRef.current?.spawnFloatingText('player', playerDamageTaken.toString(), isCrit ? 'crit' : 'damage');
        } else if (result.logMessages.some(m => m.includes('MISSED') || m.includes('EVADED'))) {
          combatRef.current?.spawnFloatingText('player', 'MISS', 'miss');
        }

        // Check if enemy took DoT damage for floating text
        const enemyDamageTaken = enemy.currentHp - result.newEnemyHp;
        if (enemyDamageTaken > 0) {
          combatRef.current?.spawnFloatingText('enemy', enemyDamageTaken.toString(), 'damage');
        }

        // Check for player healing (regen)
        if (result.logMessages.some(m => m.includes('regenerated'))) {
          const healMatch = result.logMessages.find(m => m.includes('You regenerated'));
          if (healMatch) {
            const healAmount = healMatch.match(/(\d+)/)?.[1];
            if (healAmount) {
              combatRef.current?.spawnFloatingText('player', healAmount, 'heal');
            }
          }
        }

        setPlayer(prev => prev ? { ...prev, currentHp: result.newPlayerHp, activeBuffs: result.newPlayerBuffs, skills: result.playerSkills } : null);
        setEnemy(prev => prev ? { ...prev, currentHp: result.newEnemyHp, activeBuffs: result.newEnemyBuffs } : null);

        if (result.enemyDefeated) {
          handleVictory();
        } else if (result.playerDefeated) {
          setGameState(GameState.GAME_OVER);
        } else {
          setTurnState('PLAYER');
        }
      }, 800);

      return () => clearTimeout(timer);
    }
  }, [turnState, player, enemy, playerStats, enemyStats]);

  const handleVictory = () => {
    addLog("Enemy Defeated!", 'gain');
    setEnemy(null);

    // Clear the current node on the floor layout (legacy system)
    if (floorLayout && currentNodeId && !useBranchingExploration) {
      const clearedLayout = clearNode(floorLayout, currentNodeId);
      setFloorLayout(clearedLayout);
    }

    // Complete combat activity in branching floor
    if (useBranchingExploration && branchingFloor) {
      completeBranchingCombat();
    }

    // Apply XP multiplier from approach
    const xpMultiplier = combatState?.xpMultiplier || 1.0;

    setPlayer(prev => {
      if (!prev) return null;
      const isBoss = enemy?.isBoss;
      const isAmbush = enemy?.tier.includes('S-Rank');
      const isGuardian = enemy?.tier === 'Guardian';
      const enemyTier = enemy?.tier || 'Chunin';

      const baseExp = 25 + (floor * 5);
      const tierBonus = isGuardian ? 300 : enemyTier === 'Jonin' ? 20 : enemyTier === 'Kage Level' ? 200 : isAmbush ? 100 : 0;
      const expGain = Math.floor((baseExp + tierBonus) * xpMultiplier);

      let updatedPlayer = { ...prev, exp: prev.exp + expGain };
      addLog(`Gained ${expGain} Experience${xpMultiplier > 1 ? ` (${Math.round((xpMultiplier - 1) * 100)}% bonus!)` : ''}.`, 'info');
      updatedPlayer = checkLevelUp(updatedPlayer);

      const ryoGain = (floor * 15) + Math.floor(Math.random() * 25);
      updatedPlayer.ryo += ryoGain;

      let rarityBonus = undefined;
      if (isBoss) rarityBonus = Rarity.EPIC;
      if (isAmbush || isGuardian) rarityBonus = Rarity.LEGENDARY;

      const item1 = generateItem(floor, difficulty, rarityBonus);
      const item2 = generateItem(floor, difficulty);
      const skill = generateSkillLoot(enemyTier, floor);

      setDroppedItems([item1, item2]);
      setDroppedSkill(skill);
      setGameState(GameState.LOOT);

      return updatedPlayer;
    });

    // Reset combat state
    setCombatState(null);
    setApproachResult(null);
  };

  const equipItem = (item: Item) => {
    if (!player) return;
    setPlayer(prev => {
      if (!prev) return null;
      return equipItemFn(prev, item);
    });
    addLog(`Equipped ${item.name}.`, 'loot');
    nextFloor();
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
    nextFloor();
  };

  const sellItem = (item: Item) => {
    if (!player) return;
    setPlayer(prev => {
      if (!prev) return null;
      return sellItemFn(prev, item);
    });
    addLog(`Sold ${item.name} for ${Math.floor(item.value * 0.6)} Ryō.`, 'loot');
    nextFloor();
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
    <div className="h-screen bg-black text-gray-300 flex overflow-hidden font-sans">
      {/* Left Panel - Hidden during combat */}
      {!isCombat && (
        <div className="hidden lg:flex w-[320px] flex-col border-r border-zinc-900 bg-zinc-950 p-4">
          {player && playerStats && (
            <LeftSidebarPanel
              floor={floor}
              player={player}
              playerStats={playerStats}
              storyArcLabel={getStoryArc(floor).label}
            />
          )}
        </div>
      )}

      {/* Center Panel */}
      <div className="flex-1 flex flex-col relative bg-zinc-950">
        <div className="flex-1 p-6 flex flex-col items-center justify-center relative overflow-y-auto parchment-panel">
          {gameState === GameState.EXPLORE && player && playerStats && (
            <Exploration
              roomChoices={roomChoices}
              onSelectRoom={selectRoom}
              player={player}
              playerStats={playerStats}
            />
          )}

          {gameState === GameState.EXPLORE_MAP && player && playerStats && floorLayout && currentNodeId && (
            <ExplorationMap
              layout={floorLayout}
              currentNodeId={currentNodeId}
              player={player}
              playerStats={playerStats}
              onNodeSelect={handleNodeSelect}
              onNodeEnter={handleNodeEnter}
            />
          )}

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
              onLearnSkill={learnSkill}
              onLeaveAll={returnToMap}
              getRarityColor={getRarityColor}
              getDamageTypeColor={getDamageTypeColor}
            />
          )}
        </div>
      </div>

      {/* Approach Selector Modal */}
      {/* Approach Selector for old exploration system */}
      {showApproachSelector && selectedNode && player && playerStats && !selectedBranchingRoom && (
        <ApproachSelector
          node={selectedNode}
          terrain={TERRAIN_DEFINITIONS[selectedNode.terrain]}
          player={player}
          playerStats={playerStats}
          onSelectApproach={handleApproachSelect}
          onCancel={handleApproachCancel}
        />
      )}

      {/* Approach Selector for branching exploration system */}
      {showApproachSelector && selectedBranchingRoom && selectedBranchingRoom.activities.combat && player && playerStats && (
        <ApproachSelector
          node={{
            id: selectedBranchingRoom.id,
            type: selectedBranchingRoom.activities.combat.enemy.tier === 'Guardian' ? 'BOSS' as any :
                  selectedBranchingRoom.activities.combat.enemy.tier === 'Jonin' ? 'ELITE' as any : 'COMBAT' as any,
            terrain: selectedBranchingRoom.terrain,
            visibility: 'VISIBLE' as any,
            position: { x: 0, y: 0 },
            connections: [],
            enemy: selectedBranchingRoom.activities.combat.enemy,
          }}
          terrain={TERRAIN_DEFINITIONS[selectedBranchingRoom.terrain]}
          player={player}
          playerStats={playerStats}
          onSelectApproach={handleBranchingApproachSelect}
          onCancel={handleApproachCancel}
        />
      )}
    </div>
  );
};

export default App;
