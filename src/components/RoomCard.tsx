import React from 'react';
import {
  BranchingRoom,
  BranchingRoomType,
} from '../game/types';
import {
  Sword,
  Heart,
  ShoppingBag,
  Scroll,
  BookOpen,
  Dumbbell,
  Gift,
  Crown,
  Home,
  TreePine,
  Mountain,
  Flame,
  Landmark,
  CheckCircle,
  Lock,
  Sparkles,
} from 'lucide-react';
import { getCurrentActivity } from '../game/systems/BranchingFloorSystem';
import { getBranchingRoomColors } from '../game/constants/roomTypeMapping';

interface RoomCardProps {
  room: BranchingRoom;
  isSelected: boolean;
  onClick: () => void;
}

// Icon mapping for branching room types
const BRANCHING_ROOM_ICONS: Record<BranchingRoomType, React.ReactNode> = {
  [BranchingRoomType.START]: <Home className="w-8 h-8" />,
  [BranchingRoomType.VILLAGE]: <Home className="w-8 h-8" />,
  [BranchingRoomType.OUTPOST]: <Sword className="w-8 h-8" />,
  [BranchingRoomType.SHRINE]: <Sparkles className="w-8 h-8" />,
  [BranchingRoomType.CAMP]: <Flame className="w-8 h-8" />,
  [BranchingRoomType.RUINS]: <Landmark className="w-8 h-8" />,
  [BranchingRoomType.BRIDGE]: <Mountain className="w-8 h-8" />,
  [BranchingRoomType.BOSS_GATE]: <Crown className="w-8 h-8" />,
  [BranchingRoomType.FOREST]: <TreePine className="w-8 h-8" />,
  [BranchingRoomType.CAVE]: <Mountain className="w-8 h-8" />,
  [BranchingRoomType.BATTLEFIELD]: <Sword className="w-8 h-8" />,
};

const RoomCard: React.FC<RoomCardProps> = ({
  room,
  isSelected,
  onClick,
}) => {
  // Get the appropriate icon for the room type
  const getRoomIcon = (): React.ReactNode => {
    return BRANCHING_ROOM_ICONS[room.type] || <Home className="w-8 h-8" />;
  };

  // Get colors from shared utility
  const colors = getBranchingRoomColors(room.type, room.isCleared);

  // Get activity icons for the room
  const getActivityIcons = (): React.ReactNode[] => {
    const icons: React.ReactNode[] = [];
    const iconClass = 'w-3 h-3';

    if (room.activities.combat && !room.activities.combat.completed) {
      icons.push(<Sword key="combat" className={`${iconClass} text-orange-400`} />);
    }
    if (room.activities.merchant && !room.activities.merchant.completed) {
      icons.push(<ShoppingBag key="merchant" className={`${iconClass} text-yellow-400`} />);
    }
    if (room.activities.event && !room.activities.event.completed) {
      icons.push(<Scroll key="event" className={`${iconClass} text-blue-400`} />);
    }
    if (room.activities.scrollDiscovery && !room.activities.scrollDiscovery.completed) {
      icons.push(<BookOpen key="scrollDiscovery" className={`${iconClass} text-purple-400`} />);
    }
    if (room.activities.rest && !room.activities.rest.completed) {
      icons.push(<Heart key="rest" className={`${iconClass} text-green-400`} />);
    }
    if (room.activities.training && !room.activities.training.completed) {
      icons.push(<Dumbbell key="training" className={`${iconClass} text-teal-400`} />);
    }
    if (room.activities.treasure && !room.activities.treasure.collected) {
      icons.push(<Gift key="treasure" className={`${iconClass} text-amber-400`} />);
    }

    return icons;
  };

  const currentActivity = getCurrentActivity(room);
  const activityIcons = getActivityIcons();

  // Determine card state
  const isLocked = !room.isAccessible && !room.isCleared;
  const canClick = room.isAccessible || room.isCurrent;

  return (
    <button
      onClick={onClick}
      disabled={isLocked}
      className={`
        relative w-28 h-36 rounded-lg border-2 overflow-hidden
        transition-all duration-300 ease-out
        ${colors.bg} ${colors.border}
        ${isSelected ? 'ring-2 ring-white ring-offset-2 ring-offset-black scale-105' : ''}
        ${room.isCurrent ? 'ring-2 ring-cyan-400 scale-105' : ''}
        ${canClick && !room.isCurrent ? 'hover:scale-105 hover:brightness-110 cursor-pointer' : ''}
        ${isLocked ? 'opacity-50 cursor-not-allowed grayscale' : ''}
        ${room.isCleared ? 'opacity-70' : ''}
        group
      `}
    >
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_70%)]" />
      </div>

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col items-center justify-between p-2">
        {/* Icon container */}
        <div className={`
          w-12 h-12 rounded-full flex items-center justify-center mt-1
          ${colors.iconBg} ${colors.text}
          border border-current/30
        `}>
          {getRoomIcon()}
        </div>

        {/* Room name */}
        <div className="text-center flex-1 flex flex-col justify-center">
          <h3 className={`text-[10px] font-bold uppercase tracking-wider ${colors.text} leading-tight`}>
            {room.name}
          </h3>
        </div>

        {/* Activity indicators */}
        {activityIcons.length > 0 && (
          <div className="flex gap-1 mb-1">
            {activityIcons}
          </div>
        )}

        {/* Current activity label */}
        {currentActivity && !room.isCleared && (
          <div className="text-[8px] text-zinc-400 uppercase tracking-wider">
            {currentActivity}
          </div>
        )}
      </div>

      {/* Exit badge */}
      {room.isExit && !room.isCleared && (
        <div className="absolute top-1 right-1 bg-red-600 text-white text-[8px] px-1 rounded font-bold">
          EXIT
        </div>
      )}

      {/* Cleared overlay */}
      {room.isCleared && (
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
          <CheckCircle className="w-8 h-8 text-green-500" />
        </div>
      )}

      {/* Locked overlay */}
      {isLocked && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
          <Lock className="w-6 h-6 text-zinc-500" />
        </div>
      )}

      {/* Current room glow */}
      {room.isCurrent && !room.isCleared && (
        <div className="absolute inset-0 rounded-lg animate-pulse bg-cyan-500/10 pointer-events-none" />
      )}

      {/* Boss gate pulse */}
      {room.type === BranchingRoomType.BOSS_GATE && !room.isCleared && (
        <div className="absolute inset-0 rounded-lg animate-pulse bg-red-500/10 pointer-events-none" />
      )}
    </button>
  );
};

export default RoomCard;
