import React, { useState, useMemo } from 'react';
import {
  BranchingFloor,
  BranchingRoom,
  Player,
  CharacterStats,
} from '../game/types';
import RoomCard from './RoomCard';
import { getCurrentRoom, getChildRooms } from '../game/systems/BranchingFloorSystem';

interface BranchingExplorationMapProps {
  branchingFloor: BranchingFloor;
  player: Player;
  playerStats: CharacterStats;
  onRoomSelect: (room: BranchingRoom) => void;
  onRoomEnter: (room: BranchingRoom) => void;
}

const BranchingExplorationMap: React.FC<BranchingExplorationMapProps> = ({
  branchingFloor,
  player,
  playerStats,
  onRoomSelect,
  onRoomEnter,
}) => {
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);

  // RELATIVE VIEW: Get rooms relative to current position
  // Current room at bottom, children in middle, grandchildren at top
  const currentRoom = useMemo(() => getCurrentRoom(branchingFloor), [branchingFloor]);
  const childRooms = useMemo(
    () => currentRoom ? getChildRooms(branchingFloor, currentRoom.id) : [],
    [branchingFloor, currentRoom]
  );
  const grandchildRooms = useMemo(
    () => childRooms.flatMap(child => getChildRooms(branchingFloor, child.id)),
    [branchingFloor, childRooms]
  );

  // Get selected room
  const selectedRoom = useMemo(
    () => selectedRoomId ? branchingFloor.rooms.find(r => r.id === selectedRoomId) : null,
    [branchingFloor.rooms, selectedRoomId]
  );

  // Handle room click
  const handleRoomClick = (room: BranchingRoom) => {
    setSelectedRoomId(room.id);
    onRoomSelect(room);
  };

  // Handle enter button
  const handleEnterRoom = () => {
    if (selectedRoom && selectedRoom.isAccessible) {
      onRoomEnter(selectedRoom);
    }
  };

  // Get arc-based background
  const getArcBackground = (): string => {
    switch (branchingFloor.arc) {
      case 'ACADEMY_ARC':
        return 'from-slate-950 via-zinc-900 to-slate-950';
      case 'WAVES_ARC':
        return 'from-slate-950 via-blue-950 to-slate-950';
      case 'EXAMS_ARC':
        return 'from-emerald-950 via-zinc-900 to-slate-950';
      case 'ROGUE_ARC':
        return 'from-slate-950 via-orange-950 to-slate-950';
      case 'WAR_ARC':
        return 'from-red-950 via-zinc-900 to-slate-950';
      default:
        return 'from-slate-950 via-zinc-900 to-slate-950';
    }
  };

  return (
    <div className={`w-full max-w-5xl h-full flex flex-col bg-gradient-to-b ${getArcBackground()} rounded-lg border border-zinc-800 overflow-hidden`}>
      {/* Header */}
      <div className="p-4 border-b border-zinc-800">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-serif text-zinc-200 tracking-[0.2em] uppercase">
              Floor {branchingFloor.floor}
            </h2>
            <p className="text-xs text-zinc-500 font-mono">
              {branchingFloor.biome}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-zinc-400">
              Rooms Explored: {branchingFloor.roomsVisited}
            </p>
            <p className="text-[10px] text-zinc-500">
              {branchingFloor.exitRoomId
                ? '🚪 Exit discovered - Find and defeat the Guardian'
                : 'Keep exploring to find the Exit'}
            </p>
          </div>
        </div>
      </div>

      {/* Map Area - RELATIVE VIEW: Current at bottom, children middle, grandchildren top */}
      <div className="flex-1 relative p-4 min-h-[400px]">
        {/* Room Cards Container */}
        <div className="relative z-10 h-full flex flex-col items-center justify-between py-4">
          {/* Grandchildren grouped by parent - Top row */}
          <div className="flex justify-center gap-16">
            {childRooms.map((child) => {
              const childGrandchildren = getChildRooms(branchingFloor, child.id);
              return (
                <div key={`gc-group-${child.id}`} className="flex gap-4">
                  {childGrandchildren.map((room) => (
                    <RoomCard
                      key={room.id}
                      room={room}
                      isSelected={selectedRoomId === room.id}
                      onClick={() => handleRoomClick(room)}
                    />
                  ))}
                  {childGrandchildren.length === 0 && (
                    <div className="text-zinc-600 text-xs italic w-[120px] text-center">
                      ...
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Children - Middle (2 rooms) - Immediate choices */}
          <div className="flex justify-center gap-32">
            {childRooms.map((room) => (
              <RoomCard
                key={room.id}
                room={room}
                isSelected={selectedRoomId === room.id}
                onClick={() => handleRoomClick(room)}
              />
            ))}
            {childRooms.length === 0 && currentRoom?.isExit && (
              <div className="text-amber-500 text-sm font-bold uppercase tracking-wider">
                ⚔️ Floor Exit - Defeat the Guardian ⚔️
              </div>
            )}
          </div>

          {/* Current Room - Bottom (1 room) - You are here */}
          <div className="flex justify-center gap-4">
            {currentRoom && (
              <RoomCard
                key={currentRoom.id}
                room={currentRoom}
                isSelected={selectedRoomId === currentRoom.id}
                onClick={() => handleRoomClick(currentRoom)}
              />
            )}
          </div>
        </div>
      </div>

      {/* Selected Room Panel */}
      {selectedRoom && (
        <div className="border-t border-zinc-800 p-4 bg-black/50">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-zinc-200">
                {selectedRoom.name}
              </h3>
              <p className="text-xs text-zinc-500 mt-1">
                {selectedRoom.description}
              </p>

              {/* Activity list */}
              <div className="flex gap-2 mt-2">
                {selectedRoom.activities.combat && !selectedRoom.activities.combat.completed && (
                  <span className="text-[10px] bg-orange-900/50 text-orange-400 px-2 py-0.5 rounded">
                    Combat: {selectedRoom.activities.combat.enemy.name}
                  </span>
                )}
                {selectedRoom.activities.merchant && !selectedRoom.activities.merchant.completed && (
                  <span className="text-[10px] bg-yellow-900/50 text-yellow-400 px-2 py-0.5 rounded">
                    Merchant
                  </span>
                )}
                {selectedRoom.activities.rest && !selectedRoom.activities.rest.completed && (
                  <span className="text-[10px] bg-green-900/50 text-green-400 px-2 py-0.5 rounded">
                    Rest (+{selectedRoom.activities.rest.healPercent}% HP)
                  </span>
                )}
                {selectedRoom.activities.event && !selectedRoom.activities.event.completed && (
                  <span className="text-[10px] bg-blue-900/50 text-blue-400 px-2 py-0.5 rounded">
                    Event
                  </span>
                )}
                {selectedRoom.activities.training && !selectedRoom.activities.training.completed && (
                  <span className="text-[10px] bg-teal-900/50 text-teal-400 px-2 py-0.5 rounded">
                    Training
                  </span>
                )}
                {selectedRoom.activities.treasure && !selectedRoom.activities.treasure.collected && (
                  <span className="text-[10px] bg-amber-900/50 text-amber-400 px-2 py-0.5 rounded">
                    Treasure
                  </span>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2">
              {selectedRoom.isAccessible && !selectedRoom.isCleared && (
                <button
                  onClick={handleEnterRoom}
                  className="px-6 py-2 bg-cyan-900 hover:bg-cyan-800 border border-cyan-700 text-cyan-200 text-sm font-bold uppercase tracking-wider transition-colors"
                >
                  Enter
                </button>
              )}
              {selectedRoom.isCleared && (
                <span className="px-4 py-2 bg-green-900/50 border border-green-700 text-green-400 text-sm uppercase">
                  Cleared
                </span>
              )}
              {!selectedRoom.isAccessible && !selectedRoom.isCleared && (
                <span className="px-4 py-2 bg-zinc-900/50 border border-zinc-700 text-zinc-500 text-sm uppercase">
                  Locked
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BranchingExplorationMap;
