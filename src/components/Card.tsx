import React from 'react';
import { Room } from '../game/types';
import {
  HelpCircle, Skull, Flame, Heart, Ghost, Sword, MapIcon, Target
} from 'lucide-react';

interface CardProps {
  room: Room;
  index: number;
  onSelect: (room: Room) => void;
}

const Card: React.FC<CardProps> = ({ room, onSelect }) => {
  let borderColor = 'border-zinc-800';
  let bgColor = 'bg-black/60';
  let bgClass = '';
  let icon = <HelpCircle size={32} className="text-gray-600" />;
  let titleColor = 'text-gray-400';
  let hideContent = false;

  switch (room.type) {
    case 'COMBAT':
      borderColor = 'border-zinc-700';
      bgColor = '';
      bgClass = 'exploration-combat-card';
      hideContent = true; // Background image already has text
      break;
    case 'BOSS':
      borderColor = 'border-red-900';
      bgColor = 'bg-red-950/20';
      icon = <Skull size={48} className="text-red-600 animate-pulse" />;
      titleColor = 'text-red-500';
      break;
    case 'AMBUSH':
      borderColor = 'border-purple-900';
      bgColor = 'bg-purple-950/20';
      icon = <Flame size={48} className="text-purple-600" />;
      titleColor = 'text-purple-500';
      break;
    case 'ELITE':
      borderColor = 'border-yellow-800';
      icon = <Sword size={40} className="text-yellow-600" />;
      titleColor = 'text-yellow-600';
      break;
    case 'REST':
      borderColor = 'border-green-900';
      icon = <Heart size={40} className="text-green-600" />;
      titleColor = 'text-green-600';
      break;
    case 'EVENT':
      borderColor = 'border-blue-900';
      icon = <MapIcon size={40} className="text-blue-600" />;
      titleColor = 'text-blue-500';
      if (room.eventDefinition?.id === 'training_tree') icon = <Target size={40} className="text-emerald-500" />;
      if (room.eventDefinition?.id === 'ramen_shop') icon = <div className="text-3xl">🍜</div>;
      break;
    default:
      icon = <Ghost size={32} className="text-zinc-600" />;
  }

  return (
    <button
      onClick={() => onSelect(room)}
      className={`relative h-72 p-6 rounded border-2 flex flex-col items-center justify-center transition-all duration-500 hover:scale-[1.02] ${borderColor} ${bgColor} ${bgClass} hover:bg-zinc-900/80 group overflow-hidden`}
    >
      {!hideContent && (
        <>
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/80 z-0"></div>
          <div className="relative z-10 flex flex-col items-center gap-4">
            <div className="p-4 rounded-full bg-black/50 border border-zinc-800">{icon}</div>
            <div className="text-center">
              <div className={`font-serif text-xl font-bold tracking-widest mb-2 ${titleColor}`}>
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
