import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  BranchingFloor,
  BranchingRoom,
  Player,
  CharacterStats,
} from '../../game/types';
import RoomCard from './RoomCard';
import { getCurrentRoom, getChildRooms } from '../../game/systems/LocationSystem';
import './exploration.css';

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

      // Number keys 1-2 to select child rooms (fixed 2 children per room)
      if (['Digit1', 'Digit2', 'Digit3', 'Digit4'].includes(e.code)) {
        e.preventDefault();
        const indexMap: Record<string, number> = { Digit1: 0, Digit2: 1, Digit3: 2, Digit4: 3 };
        const index = indexMap[e.code];
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

  // Get arc-based modifier
  const getArcModifier = (): string => {
    switch (branchingFloor.arc) {
      case 'ACADEMY_ARC': return 'location-map--academy';
      case 'WAVES_ARC': return 'location-map--waves';
      case 'EXAMS_ARC': return 'location-map--exams';
      case 'ROGUE_ARC': return 'location-map--rogue';
      case 'WAR_ARC': return 'location-map--war';
      default: return 'location-map--academy';
    }
  };

  // Get action button class
  const getActionButtonClass = (): string => {
    if (selectedRoom?.isCleared) return 'location-map__action-btn location-map__action-btn--cleared';
    if (selectedRoom?.isAccessible) return 'location-map__action-btn location-map__action-btn--enter';
    return 'location-map__action-btn location-map__action-btn--locked';
  };

  return (
    <div
      className={`location-map ${getArcModifier()}`}
      style={{
        backgroundImage: 'url(/assets/background_map_exploring.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Header */}
      <div className="location-map__header">
        <div className="location-map__header-content">
          <div>
            <h2 className="location-map__title">
              {branchingFloor.biome}
            </h2>
          </div>
          <div className="location-map__stats">
            <p className="location-map__stat">
              Rooms Explored: {branchingFloor.roomsVisited}
            </p>
            {/* Intel Bar */}
            <div className="location-map__intel">
              <span className="location-map__intel-icon">🔮</span>
              <div className="location-map__intel-bar">
                <div
                  className="location-map__intel-fill"
                  style={{ width: `${currentIntel}%` }}
                />
              </div>
              <span className="location-map__intel-value">{currentIntel}%</span>
            </div>
            <p className="location-map__hint">
              {branchingFloor.exitRoomId
                ? '🚪 Exit discovered - Find and defeat the Guardian'
                : 'Keep exploring to find the Exit'}
            </p>
          </div>
        </div>
      </div>

      {/* Map Area - RELATIVE VIEW: Current at bottom, children middle, grandchildren top */}
      <div className="location-map__area">
        {/* Room Cards Container */}
        <div className="location-map__rooms">
          {/* Grandchildren grouped by parent - Top row (2 per group) */}
          <div className="location-map__row">
            {childRooms.map((child) => {
              const childGrandchildren = getChildRooms(branchingFloor, child.id);
              return (
                <div key={`gc-group-${child.id}`} className="location-map__row-group">
                  {childGrandchildren.map((room) => (
                    <RoomCard
                      key={room.id}
                      room={room}
                      isSelected={selectedRoomId === room.id}
                      onClick={() => handleRoomClick(room)}
                    />
                  ))}
                  {childGrandchildren.length === 0 && (
                    <div className="location-map__placeholder">...</div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Children - Middle (2 rooms) - Immediate choices */}
          <div className="location-map__row">
            {childRooms.map((room) => (
              <RoomCard
                key={room.id}
                room={room}
                isSelected={selectedRoomId === room.id}
                onClick={() => handleRoomClick(room)}
              />
            ))}
            {childRooms.length === 0 && currentRoom?.isExit && (
              <div className="location-map__exit-message">
                ⚔️ Floor Exit - Defeat the Guardian ⚔️
              </div>
            )}
          </div>

          {/* Current Room - Bottom (1 room) - You are here */}
          <div className="location-map__row">
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
        <div className="location-map__selected">
          <div className="location-map__selected-content">
            <div className="location-map__selected-info">
              <h3 className="location-map__selected-name">
                {selectedRoom.name}
              </h3>
              <p className="location-map__selected-desc">
                {selectedRoom.description}
              </p>

              {/* Activity list */}
              <div className="location-map__selected-activities">
                {selectedRoom.activities.combat && !selectedRoom.activities.combat.completed && (
                  <span className="location-map__activity-tag location-map__activity-tag--combat">
                    Combat: {selectedRoom.activities.combat.enemy.name}
                  </span>
                )}
                {selectedRoom.activities.eliteChallenge && !selectedRoom.activities.eliteChallenge.completed && (
                  <span className="location-map__activity-tag location-map__activity-tag--elite">
                    Elite: {selectedRoom.activities.eliteChallenge.enemy.name}
                  </span>
                )}
                {selectedRoom.activities.merchant && !selectedRoom.activities.merchant.completed && (
                  <span className="location-map__activity-tag location-map__activity-tag--merchant">
                    Merchant
                  </span>
                )}
                {selectedRoom.activities.event && !selectedRoom.activities.event.completed && (
                  <span className="location-map__activity-tag location-map__activity-tag--event">
                    Event
                  </span>
                )}
                {selectedRoom.activities.scrollDiscovery && !selectedRoom.activities.scrollDiscovery.completed && (
                  <span className="location-map__activity-tag location-map__activity-tag--scroll">
                    Scroll Discovery
                  </span>
                )}
                {selectedRoom.activities.rest && !selectedRoom.activities.rest.completed && (
                  <span className="location-map__activity-tag location-map__activity-tag--rest">
                    Rest (+{selectedRoom.activities.rest.healPercent}% HP)
                  </span>
                )}
                {selectedRoom.activities.training && !selectedRoom.activities.training.completed && (
                  <span className="location-map__activity-tag location-map__activity-tag--training">
                    Training
                  </span>
                )}
                {selectedRoom.activities.treasure && !selectedRoom.activities.treasure.collected && (
                  <span className="location-map__activity-tag location-map__activity-tag--treasure">
                    Treasure
                  </span>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="location-map__selected-actions">
              {selectedRoom.isAccessible && !selectedRoom.isCleared && (
                <button
                  type="button"
                  onClick={handleEnterRoom}
                  className={getActionButtonClass()}
                >
                  Enter
                </button>
              )}
              {selectedRoom.isCleared && (
                <span className={getActionButtonClass()}>
                  Cleared
                </span>
              )}
              {!selectedRoom.isAccessible && !selectedRoom.isCleared && (
                <span className={getActionButtonClass()}>
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
