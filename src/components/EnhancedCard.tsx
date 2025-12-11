import React from 'react';
import { Room } from '../game/types';
import { MapPin, Sword, Heart, Flame, Crown, AlertTriangle, Zap } from 'lucide-react';
import { getLegacyRoomColors, getLegacyRoomIconColor, LegacyRoomType } from '../game/constants/roomTypeMapping';

interface EnhancedCardProps {
  room: Room;
  onClick: () => void;
  disabled?: boolean;
  disabledReason?: string;
}

// Icon mapping for legacy room types
const ROOM_ICONS: Record<LegacyRoomType | 'default', React.ReactNode> = {
  BOSS: <Crown className="w-10 h-10" />,
  ELITE: <Sword className="w-10 h-10" />,
  COMBAT: <Zap className="w-10 h-10" />,
  REST: <Heart className="w-10 h-10" />,
  EVENT: <MapPin className="w-10 h-10" />,
  AMBUSH: <Flame className="w-10 h-10" />,
  default: <AlertTriangle className="w-10 h-10" />,
};

const EnhancedCard: React.FC<EnhancedCardProps> = ({ room, onClick, disabled = false, disabledReason }) => {
  const colors = getLegacyRoomColors(room.type as LegacyRoomType);
  const iconColor = getLegacyRoomIconColor(room.type as LegacyRoomType);

  const getRoomColor = (): string => {
    return `${colors.border} ${colors.borderHover}`;
  };

  const getRoomIcon = (): React.ReactNode => {
    const icon = ROOM_ICONS[room.type as LegacyRoomType] || ROOM_ICONS.default;
    return <span className={iconColor}>{icon}</span>;
  };

  const getRoomTitle = (): string => {
    if (room.eventDefinition) {
      return room.eventDefinition.title || room.type;
    }
    return room.type;
  };

  const getPulseAnimation = (): string => {
    if (room.type === 'BOSS') {
      return 'animate-pulse';
    }
    return '';
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        relative h-72 w-full p-4 rounded-lg border-2 transition-all duration-300
        ${getRoomColor()}
        ${disabled ? 'opacity-50 cursor-not-allowed bg-zinc-950' : 'bg-zinc-900 hover:bg-zinc-800 hover:scale-105 cursor-pointer'}
        ${getPulseAnimation()}
        flex flex-col justify-between
        group
      `}
    >
      {/* Icon */}
      <div className='flex justify-center items-center mb-2'>{getRoomIcon()}</div>

      {/* Title */}
      <div className='text-center mb-3'>
        <h3 className='text-lg font-serif font-bold text-white tracking-widest uppercase'>{getRoomTitle()}</h3>
        <p className='text-xs font-mono text-zinc-400 mt-1'>{room.type}</p>
      </div>

      {/* Description */}
      <p className='text-sm text-zinc-300 leading-relaxed flex-grow text-center mb-3 text-balance'>
        {room.description}
      </p>

      {/* Disabled Reason */}
      {disabled && disabledReason && (
        <div className='text-xs text-red-400 border-t border-red-900 pt-2 mt-2'>
          <p className='font-bold mb-1'>Cannot Access:</p>
          <p>{disabledReason}</p>
        </div>
      )}

      {/* Risk Indicator (for events) */}
      {room.eventDefinition && !disabled && (
        <div className='text-xs text-zinc-400 italic mt-2 pt-2 border-t border-zinc-700'>
          Event room - outcomes vary
        </div>
      )}

      {/* Hover Glow */}
      {!disabled && (
        <div className='absolute inset-0 rounded-lg opacity-0 group-hover:opacity-20 bg-current transition-opacity duration-300 pointer-events-none' />
      )}
    </button>
  );
};

export default EnhancedCard;
