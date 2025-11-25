import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  GameState, Player, Clan, Skill, Enemy, Room, Item, Rarity, DamageType, EffectType, Buff
} from './game/types';
import { CLAN_STATS, CLAN_START_SKILL, CLAN_GROWTH, SKILLS } from './game/constants';
import {
  calculateDerivedStats,
  getPlayerFullStats,
  getEnemyFullStats,
  canLearnSkill,
  calculateDamage
} from './game/systems/StatSystem';
import { getStoryArc } from './game/systems/EnemySystem';
import { generateItem, generateSkillLoot, equipItem as equipItemFn, sellItem as sellItemFn } from './game/systems/LootSystem';
import { processEnemyTurn } from './game/systems/CombatSystem';
import { generateRooms } from './game/systems/RoomSystem';
import MainMenu from './scenes/MainMenu';
import CharacterSelect from './scenes/CharacterSelect';
import Exploration from './scenes/Exploration';
import Combat from './scenes/Combat';
import Event from './scenes/Event';
import Loot from './scenes/Loot';
import GameOver from './scenes/GameOver';
import StatBar from './components/StatBar';
import GameLog from './components/GameLog';
import CharacterSheet from './components/CharacterSheet';
import Tooltip from './components/Tooltip';

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

  const addLog = useCallback((text: string, type: any = 'info', details?: string) => {
    setLogs(prev => {
      const newEntry: any = { id: Date.now(), text, type, details };
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

  const getBuffDescription = (buff: Buff) => {
    const { type, value, targetStat } = buff.effect;
    switch (type) {
      case EffectType.STUN: return "Cannot perform any actions.";
      case EffectType.DOT: case EffectType.BLEED: case EffectType.BURN: case EffectType.POISON:
        return `Takes ${value} damage at the start of each turn.`;
      case EffectType.BUFF: return `${targetStat} increased by ${Math.round((value || 0) * 100)}%.`;
      case EffectType.DEBUFF: return `${targetStat} decreased by ${Math.round((value || 0) * 100)}%.`;
      case EffectType.CONFUSION: return "50% chance to hurt self in confusion.";
      case EffectType.SILENCE: return "Cannot use skills with chakra cost.";
      case EffectType.CHAKRA_DRAIN: return `Drains ${value} chakra per turn.`;
      default: return buff.name;
    }
  };

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
    const rooms = generateRooms(1, difficulty);
    setRoomChoices(rooms);
    setGameState(GameState.EXPLORE);
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
    }
    if (next) { addLog(text, type); nextFloor(); }
  };

  const nextFloor = () => {
    setFloor(f => f + 1);
    setPlayer(p => {
      if (!p) return null;
      const stats = getPlayerFullStats(p);
      return {
        ...p,
        currentChakra: Math.min(stats.derived.maxChakra, p.currentChakra + stats.derived.chakraRegen),
        currentHp: Math.min(stats.derived.maxHp, p.currentHp + stats.derived.hpRegen)
      };
    });
    const rooms = generateRooms(floor + 1, difficulty);
    setRoomChoices(rooms);
    setGameState(GameState.EXPLORE);
  };

  const useSkill = (skill: Skill) => {
    if (!player || !enemy || !playerStats || !enemyStats) return;

    if (skill.isToggle) {
      const isActive = skill.isActive || false;
      setPlayer(prev => {
        if (!prev) return null;
        let newBuffs = [...prev.activeBuffs];
        let newSkills = prev.skills.map(s => s.id === skill.id ? { ...s, isActive: !isActive } : s);
        if (isActive) {
          newBuffs = newBuffs.filter(b => b.source !== skill.id);
          addLog(`${skill.name} Deactivated.`, 'info');
        } else {
          addLog(`${skill.name} Activated.`, 'info');
        }
        return { ...prev, skills: newSkills, activeBuffs: newBuffs };
      });
      setTurnState('ENEMY_TURN');
      return;
    }

    // Check resources
    if (player.currentChakra < skill.chakraCost || player.currentHp <= skill.hpCost) {
      addLog("Insufficient Chakra or HP!", 'danger');
      return;
    }

    if (skill.currentCooldown > 0) return;

    const isStunned = player.activeBuffs.some(b => b.effect.type === EffectType.STUN);
    if (isStunned) {
      addLog("You are stunned!", 'danger');
      setTurnState('ENEMY_TURN');
      return;
    }

    // Calculate damage
    const damageResult = calculateDamage(
      playerStats.effectivePrimary,
      playerStats.derived,
      enemyStats.effectivePrimary,
      enemyStats.derived,
      skill,
      player.element,
      enemy.element
    );

    let logMsg = '';
    let damageDealt = 0;

    if (damageResult.isMiss) {
      logMsg = `You used ${skill.name} but MISSED!`;
    } else if (damageResult.isEvaded) {
      logMsg = `You used ${skill.name} but ${enemy.name} EVADED!`;
    } else {
      damageDealt = damageResult.finalDamage;
      logMsg = `Used ${skill.name} for ${damageDealt} dmg`;
      if (damageResult.flatReduction > 0) logMsg += ` (${damageResult.flatReduction} blocked)`;
      if (damageResult.elementMultiplier > 1) logMsg += " SUPER EFFECTIVE!";
      else if (damageResult.elementMultiplier < 1) logMsg += " Resisted.";
      if (damageResult.isCrit) logMsg += " CRITICAL!";
    }

    // Update player state
    const newPlayerHp = player.currentHp - skill.hpCost;
    const newPlayerChakra = player.currentChakra - skill.chakraCost;
    const newEnemyHp = enemy.currentHp - damageDealt;
    const newSkills = player.skills.map(s => s.id === skill.id ? { ...s, currentCooldown: s.cooldown + 1 } : s);

    setPlayer(prev => prev ? { ...prev, currentHp: newPlayerHp, currentChakra: newPlayerChakra, skills: newSkills } : null);
    setEnemy(prev => prev ? { ...prev, currentHp: newEnemyHp } : null);
    addLog(logMsg, damageResult.isMiss || damageResult.isEvaded ? 'info' : 'combat');

    // Check for victory
    if (newEnemyHp <= 0) {
      handleVictory();
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
      />
    );
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
      <div className="hidden lg:flex w-[320px] flex-col border-r border-zinc-900 bg-zinc-950 p-4 overflow-y-auto">
        <div className="mb-4 text-center border-b border-zinc-900 pb-3">
          <div className="text-[9px] text-zinc-500 uppercase tracking-[0.3em] font-bold mb-1">Current Arc</div>
          <div className="text-base font-serif text-zinc-200 font-bold">{getStoryArc(floor).label}</div>
        </div>

        <div className="mb-4 flex flex-col gap-2 border-b border-zinc-900 pb-4">
          <div className="flex items-baseline justify-between">
            <span className="text-xs text-zinc-600 uppercase tracking-widest font-bold">Floor</span>
            <span className="text-4xl font-black text-zinc-200 font-serif">{floor}</span>
          </div>
          {player && (
            <div className="mt-2">
              <div className="flex items-baseline justify-between mb-1">
                <span className="text-xs text-yellow-700 uppercase tracking-widest font-bold">Level</span>
                <span className="text-lg font-bold text-yellow-500 font-mono">{player.level}</span>
              </div>
              <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-yellow-600" style={{ width: `${(player.exp / player.maxExp) * 100}%` }}></div>
              </div>
              <div className="flex justify-end text-[9px] text-zinc-600 font-mono mt-1">{player.exp} / {player.maxExp} XP</div>
            </div>
          )}
        </div>

        {player && playerStats && (
          <div className="flex-1 flex flex-col gap-4">
            <div className="space-y-2">
              <StatBar current={player.currentHp} max={playerStats.derived.maxHp} label="Health" color="green" />
              <StatBar current={player.currentChakra} max={playerStats.derived.maxChakra} label="Chakra" color="blue" />
            </div>
            <CharacterSheet player={player} effectivePrimary={playerStats.effectivePrimary} derived={playerStats.derived} />
          </div>
        )}
      </div>

      {/* Center Panel */}
      <div className="flex-1 flex flex-col relative bg-zinc-950">
        <div className="flex-1 p-6 flex flex-col items-center justify-center relative overflow-y-auto">
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
            <Event activeEvent={activeEvent} onChoice={handleEventChoice} />
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
        <div className="h-56 bg-black border-t border-zinc-900">
          <GameLog logs={logs} />
        </div>
      </div>
    </div>
  );
};

export default App;
