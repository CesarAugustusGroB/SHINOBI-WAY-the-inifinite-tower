import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
  GameState, Player, Clan, Skill, Enemy, Room, Item, Rarity, DamageType, EffectType, Buff, SupplyType
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
import { processEnemyTurn, useSkill as useSkillCombat } from './game/systems/CombatSystem';
import { generateRooms } from './game/systems/RoomSystem';
import { getStartingResources, applyResourceDrain, applyVictoryMorale, applyNearDeathPenalty } from './game/systems/ResourceSystem';
import { useSupply } from './game/systems/SupplySystem';
import MainMenu from './scenes/MainMenu';
import CharacterSelect from './scenes/CharacterSelect';
import Exploration from './scenes/Exploration';
import Combat from './scenes/Combat';
import Event from './scenes/Event';
import Loot from './scenes/Loot';
import GameOver from './scenes/GameOver';
import GameGuide from './scenes/GameGuide';
import GameLog from './components/GameLog';
import LeftSidebarPanel from './components/LeftSidebarPanel';

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
  const [lastRoomType, setLastRoomType] = useState<string | null>(null);
  const logIdCounter = useRef<number>(0);

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
      activeBuffs: [],
      resources: getStartingResources()
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
    const rooms = generateRooms(1, difficulty, newPlayer);
    setRoomChoices(rooms);
    setGameState(GameState.EXPLORE);
  };

  const selectRoom = (room: Room) => {
    setLastRoomType(room.type);

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
        const ghostEnemy = generateEnemy(floor, difficulty, 'Vengeful Spirit', 'ASSASSIN', false);
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
        const guardian = generateEnemy(floor + 2, difficulty, 'Guardian', 'TANK', false);
        setEnemy(guardian);
        setTurnState('PLAYER');
        setGameState(GameState.COMBAT);
        text = "The guardian accepts your challenge!"; type = 'danger'; next = false;
        break;
    }
    if (next) { addLog(text, type); nextFloor(); }
  };

  const nextFloor = () => {
    const nextFloorNum = floor + 1;
    setFloor(nextFloorNum);
    setPlayer(p => {
      if (!p) return null;
      const stats = getPlayerFullStats(p);

      // Apply natural regeneration
      let updatedPlayer = {
        ...p,
        currentChakra: Math.min(stats.derived.maxChakra, p.currentChakra + stats.derived.chakraRegen),
        currentHp: Math.min(stats.derived.maxHp, p.currentHp + stats.derived.hpRegen)
      };

      // Apply resource drain based on room type
      if (lastRoomType && lastRoomType !== 'REST') {
        updatedPlayer = applyResourceDrain(updatedPlayer, lastRoomType);
      }

      // Generate rooms with updated player
      const rooms = generateRooms(nextFloorNum, difficulty, updatedPlayer);
      setRoomChoices(rooms);

      return updatedPlayer;
    });
    setGameState(GameState.EXPLORE);
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

    // Use CombatSystem for regular skills
    const result = useSkillCombat(player, playerStats, enemy, enemyStats, skill);

    if (!result) return;

    // Apply result to game state
    addLog(result.logMessage, result.logType);

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
        const result = processEnemyTurn(player, playerStats, enemy, enemyStats);
        result.logMessages.forEach(msg => {
          addLog(msg, msg.includes('GUTS') ? 'gain' : msg.includes('took') ? 'combat' : 'danger');
        });
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
    setPlayer(prev => {
      if (!prev) return null;
      const isBoss = enemy?.isBoss;
      const isAmbush = enemy?.tier.includes('S-Rank');
      const isGuardian = enemy?.tier === 'Guardian';
      const enemyTier = enemy?.tier || 'Chunin';

      const baseExp = 25 + (floor * 5);
      const tierBonus = isGuardian ? 300 : enemyTier === 'Jonin' ? 20 : enemyTier === 'Kage Level' ? 200 : isAmbush ? 100 : 0;
      const expGain = baseExp + tierBonus;

      let updatedPlayer = { ...prev, exp: prev.exp + expGain };
      addLog(`Gained ${expGain} Experience.`, 'info');
      updatedPlayer = checkLevelUp(updatedPlayer);

      const ryoGain = (floor * 15) + Math.floor(Math.random() * 25);
      updatedPlayer.ryo += ryoGain;

      // Apply morale gains from victory
      updatedPlayer = applyVictoryMorale(updatedPlayer, enemyTier);

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
  };

  const handleUseSupply = (supplyType: SupplyType) => {
    if (!player) return;
    setPlayer(prev => {
      if (!prev) return null;
      const result = useSupply(prev, supplyType);
      if (result.logMessage) {
        addLog(result.logMessage, result.logType || 'gain');
      }
      return result.player;
    });
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

  return (
    <div className="h-screen bg-black text-gray-300 flex overflow-hidden font-sans">
      {/* Left Panel */}
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

      {/* Center Panel */}
      <div className="flex-1 flex flex-col relative bg-zinc-950">
        <div className="flex-1 p-6 flex flex-col items-center justify-center relative overflow-y-auto parchment-panel">
          {gameState === GameState.EXPLORE && (
            <Exploration roomChoices={roomChoices} onSelectRoom={selectRoom} />
          )}

          {gameState === GameState.COMBAT && player && enemy && playerStats && enemyStats && (
            <Combat
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
              onLeaveAll={nextFloor}
              getRarityColor={getRarityColor}
              getDamageTypeColor={getDamageTypeColor}
            />
          )}
        </div>

        {/* Logs Footer */}
        <div className="h-56 bg-black border-t border-zinc-900 relative z-10">
          <GameLog logs={logs} />
        </div>
      </div>
    </div>
  );
};

export default App;
