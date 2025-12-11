import React from 'react';
import { Room } from '../game/types';
import {
  HelpCircle, Skull, Flame, Heart, Ghost, Sword, MapIcon, Target
} from 'lucide-react';
import { getLegacyRoomColors, LegacyRoomType } from '../game/constants/roomTypeMapping';

interface CardProps {
  room: Room;
  index: number;
  onSelect: (room: Room) => void;
}

// Get icon for legacy room types with special event handling
const getRoomIcon = (room: Room): React.ReactNode => {
  switch (room.type) {
    case 'BOSS':
      return <Skull size={48} className="text-red-600 animate-pulse" />;
    case 'AMBUSH':
      return <Flame size={48} className="text-purple-600" />;
    case 'ELITE':
      return <Sword size={40} className="text-yellow-600" />;
    case 'REST':
      return <Heart size={40} className="text-green-600" />;
    case 'EVENT':
      if (room.eventDefinition?.id === 'training_tree') return <Target size={40} className="text-emerald-500" />;
      if (room.eventDefinition?.id === 'ramen_shop') return <div className="text-3xl">🍜</div>;
      return <MapIcon size={40} className="text-blue-600" />;
    case 'COMBAT':
      return <HelpCircle size={32} className="text-gray-600" />; // Hidden anyway
    default:
      return <Ghost size={32} className="text-zinc-600" />;
  }
};

const Card: React.FC<CardProps> = ({ room, onSelect }) => {
  const colors = getLegacyRoomColors(room.type as LegacyRoomType);
  const icon = getRoomIcon(room);

  return (
    <button
      onClick={() => onSelect(room)}
      className={`relative h-72 p-6 rounded border-2 flex flex-col items-center justify-center transition-all duration-500 hover:scale-[1.02] ${colors.border} ${colors.bg} ${colors.bgClass} hover:bg-zinc-900/80 group overflow-hidden`}
    >
      {!colors.hideContent && (
        <>
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/80 z-0"></div>
          <div className="relative z-10 flex flex-col items-center gap-4">
            <div className="p-4 rounded-full bg-black/50 border border-zinc-800">{icon}</div>
            <div className="text-center">
              <div className={`font-serif text-xl font-bold tracking-widest mb-2 ${colors.title}`}>
                {room.eventDefinition?.title || room.type}
              </div>
              <div className="text-xs font-mono text-zinc-500 max-w-[150px] leading-tight">{room.description}</div>
            </div>
          </div>
        </>
      )}
    </button>
  );
};

export default Card;
