import { useState, useCallback } from 'react';
import {
  GameState,
  Player,
  Enemy,
  Room,
  Item,
  Skill,
  LogEntry,
  GameEventDefinition,
  Clan
} from '../types';
import { CLAN_STATS, CLAN_START_SKILL, MAX_LOGS, SKILLS } from '../constants';
import { calculateDerivedStats } from '../systems/StatSystem';
import { generateRooms as generateRoomsImpl } from '../systems/RoomSystem';

export interface GameStore {
  gameState: GameState;
  setGameState: (state: GameState) => void;
  floor: number;
  setFloor: (floor: number | ((f: number) => number)) => void;
  logs: LogEntry[];
  addLog: (text: string, type: LogEntry['type'], details?: string) => void;
  clearLogs: () => void;
  player: Player | null;
  setPlayer: (player: Player | null | ((p: Player | null) => Player | null)) => void;
  enemy: Enemy | null;
  setEnemy: (enemy: Enemy | null) => void;
  roomChoices: Room[];
  setRoomChoices: (rooms: Room[]) => void;
  droppedItems: Item[];
  setDroppedItems: (items: Item[]) => void;
  droppedSkill: Skill | null;
  setDroppedSkill: (skill: Skill | null) => void;
  activeEvent: GameEventDefinition | null;
  setActiveEvent: (event: GameEventDefinition | null) => void;
  difficulty: number;
  setDifficulty: (diff: number) => void;
  turnState: 'PLAYER' | 'ENEMY_TURN';
  setTurnState: (state: 'PLAYER' | 'ENEMY_TURN') => void;
  genImageSize: '1K' | '2K' | '4K';
  setGenImageSize: (size: '1K' | '2K' | '4K') => void;
  isGeneratingImage: boolean;
  setIsGeneratingImage: (generating: boolean) => void;
  startGame: (clan: Clan) => void;
  generateRooms: (floor: number, difficulty: number) => void;
}

export const useGameStore = (): GameStore => {
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [floor, setFloor] = useState(1);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [player, setPlayer] = useState<Player | null>(null);
  const [enemy, setEnemy] = useState<Enemy | null>(null);
  const [roomChoices, setRoomChoices] = useState<Room[]>([]);
  const [droppedItems, setDroppedItems] = useState<Item[]>([]);
  const [droppedSkill, setDroppedSkill] = useState<Skill | null>(null);
  const [activeEvent, setActiveEvent] = useState<GameEventDefinition | null>(null);
  const [difficulty, setDifficulty] = useState<number>(20);
  const [turnState, setTurnState] = useState<'PLAYER' | 'ENEMY_TURN'>('PLAYER');
  const [genImageSize, setGenImageSize] = useState<'1K' | '2K' | '4K'>('1K');
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  const addLog = useCallback((text: string, type: LogEntry['type'] = 'info', details?: string) => {
    setLogs(prev => {
      const newEntry: LogEntry = { id: Date.now(), text, type, details };
      const newLogs = [...prev, newEntry];
      if (newLogs.length > MAX_LOGS) newLogs.shift();
      return newLogs;
    });
  }, []);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  const startGame = useCallback((clan: Clan) => {
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
      element: clan === 'UCHIHA' ? 'Fire' : clan === 'UZUMAKI' ? 'Wind' : 'Physical' as any,
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
    generateRooms(1, difficulty);
    setGameState(GameState.EXPLORE);
  }, [difficulty, addLog]);

  const generateRooms = useCallback((currentFloor: number, diff: number) => {
    const rooms = generateRoomsImpl(currentFloor, diff);
    setRoomChoices(rooms);
  }, []);

  return {
    gameState,
    setGameState,
    floor,
    setFloor,
    logs,
    addLog,
    clearLogs,
    player,
    setPlayer,
    enemy,
    setEnemy,
    roomChoices,
    setRoomChoices,
    droppedItems,
    setDroppedItems,
    droppedSkill,
    setDroppedSkill,
    activeEvent,
    setActiveEvent,
    difficulty,
    setDifficulty,
    turnState,
    setTurnState,
    genImageSize,
    setGenImageSize,
    isGeneratingImage,
    setIsGeneratingImage,
    startGame,
    generateRooms
  };
};
