import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  BranchingFloor,
  BranchingRoom,
  Player,
  CharacterStats,
} from '../../game/types';
import RoomCard from './RoomCard';
import { getCurrentRoom, getChildRooms } from '../../game/systems/LocationSystem';

interface LocationMapProps {
  branchingFloor: BranchingFloor;
  player: Player;
  playerStats: CharacterStats;
  currentIntel: number;
  onRoomSelect: (room: BranchingRoom) => void;
  onRoomEnter: (room: BranchingRoom) => void;
}

const LocationMap: React.FC<LocationMapProps> = ({
  branchingFloor,
  currentIntel,
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
  const handleEnterRoom = useCallback(() => {
    if (selectedRoom && selectedRoom.isAccessible && !selectedRoom.isCleared) {
      onRoomEnter(selectedRoom);
    }
  }, [selectedRoom, onRoomEnter]);

  // Keyboard shortcuts: SPACE/ENTER to enter room, 1/2 to select child nodes
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      // Number keys 1-2 to select child rooms
      if (e.code === 'Digit1' || e.code === 'Digit2') {
        e.preventDefault();
        const index = e.code === 'Digit1' ? 0 : 1;
        const childRoom = childRooms[index];
        if (childRoom) {
          setSelectedRoomId(childRoom.id);
          onRoomSelect(childRoom);
        }
        return;
      }

      // Only handle Space and Enter for entering rooms
      if (e.code !== 'Space' && e.code !== 'Enter') return;

      e.preventDefault();

      // If a room is already selected and accessible, enter it
      // This works for both child rooms AND the current/parent room
      if (selectedRoom && selectedRoom.isAccessible && !selectedRoom.isCleared) {
        handleEnterRoom();
        return;
      }

      // If current room is selected but not fully cleared, enter it
      // (currentRoom may be accessible but have remaining activities)
      if (selectedRoom && currentRoom && selectedRoom.id === currentRoom.id && !selectedRoom.isCleared) {
        onRoomEnter(selectedRoom);
        return;
      }

      // Otherwise, select the current/parent room if it has remaining activities
      if (currentRoom && !currentRoom.isCleared) {
        setSelectedRoomId(currentRoom.id);
        onRoomSelect(currentRoom);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedRoom, currentRoom, childRooms, handleEnterRoom, onRoomEnter, onRoomSelect]);

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
    <div
      className={`w-full max-w-5xl mx-auto h-full flex flex-col bg-gradient-to-b ${getArcBackground()} rounded-lg border border-zinc-800 overflow-hidden`}
      style={{
        backgroundImage: 'url(/assets/background_map_exploring.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Header */}
      <div className="p-4 border-b border-zinc-800 bg-black/60 backdrop-blur-sm">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-serif text-zinc-200 tracking-[0.2em] uppercase">
              {branchingFloor.biome}
            </h2>
          </div>
          <div className="text-right space-y-1">
            <p className="text-xs text-zinc-400">
              Rooms Explored: {branchingFloor.roomsVisited}
            </p>
            {/* Intel Bar */}
            <div className="flex items-center gap-2 justify-end">
              <span className="text-amber-400 text-sm">🔮</span>
              <div className="w-24 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-600 to-amber-400 transition-all duration-500"
                  style={{ width: `${currentIntel}%` }}
                />
              </div>
              <span className="text-xs font-mono text-amber-300 w-8">{currentIntel}%</span>
            </div>
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
        <div className="border-t border-zinc-800 p-4 bg-black/70 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-zinc-200">
                {selectedRoom.name}
              </h3>
              <p className="text-xs text-zinc-500 mt-1">
                {selectedRoom.description}
              </p>

              {/* Activity list */}
              <div className="flex gap-2 mt-2 flex-wrap">
                {selectedRoom.activities.combat && !selectedRoom.activities.combat.completed && (
                  <span className="text-[10px] bg-orange-900/50 text-orange-400 px-2 py-0.5 rounded">
                    Combat: {selectedRoom.activities.combat.enemy.name}
                  </span>
                )}
                {selectedRoom.activities.eliteChallenge && !selectedRoom.activities.eliteChallenge.completed && (
                  <span className="text-[10px] bg-red-900/50 text-red-400 px-2 py-0.5 rounded">
                    Elite: {selectedRoom.activities.eliteChallenge.enemy.name}
                  </span>
                )}
                {selectedRoom.activities.merchant && !selectedRoom.activities.merchant.completed && (
                  <span className="text-[10px] bg-yellow-900/50 text-yellow-400 px-2 py-0.5 rounded">
                    Merchant
                  </span>
                )}
                {selectedRoom.activities.event && !selectedRoom.activities.event.completed && (
                  <span className="text-[10px] bg-blue-900/50 text-blue-400 px-2 py-0.5 rounded">
                    Event
                  </span>
                )}
                {selectedRoom.activities.scrollDiscovery && !selectedRoom.activities.scrollDiscovery.completed && (
                  <span className="text-[10px] bg-purple-900/50 text-purple-400 px-2 py-0.5 rounded">
                    Scroll Discovery
                  </span>
                )}
                {selectedRoom.activities.rest && !selectedRoom.activities.rest.completed && (
                  <span className="text-[10px] bg-green-900/50 text-green-400 px-2 py-0.5 rounded">
                    Rest (+{selectedRoom.activities.rest.healPercent}% HP)
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

export default LocationMap;
