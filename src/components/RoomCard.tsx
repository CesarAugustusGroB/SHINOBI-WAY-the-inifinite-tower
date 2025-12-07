import React from 'react';
import {
  BranchingRoom,
  BranchingRoomType,
  ACTIVITY_ORDER,
} from '../game/types';
import {
  Sword,
  Heart,
  ShoppingBag,
  Scroll,
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

interface RoomCardProps {
  room: BranchingRoom;
  isSelected: boolean;
  onClick: () => void;
}

const RoomCard: React.FC<RoomCardProps> = ({
  room,
  isSelected,
  onClick,
}) => {
  // Get the appropriate icon for the room type
  const getRoomIcon = (): React.ReactNode => {
    switch (room.type) {
      case BranchingRoomType.START:
        return <Home className="w-8 h-8" />;
      case BranchingRoomType.VILLAGE:
        return <Home className="w-8 h-8" />;
      case BranchingRoomType.OUTPOST:
        return <Sword className="w-8 h-8" />;
      case BranchingRoomType.SHRINE:
        return <Sparkles className="w-8 h-8" />;
      case BranchingRoomType.CAMP:
        return <Flame className="w-8 h-8" />;
      case BranchingRoomType.RUINS:
        return <Landmark className="w-8 h-8" />;
      case BranchingRoomType.BRIDGE:
        return <Mountain className="w-8 h-8" />;
      case BranchingRoomType.BOSS_GATE:
        return <Crown className="w-8 h-8" />;
      case BranchingRoomType.FOREST:
        return <TreePine className="w-8 h-8" />;
      case BranchingRoomType.CAVE:
        return <Mountain className="w-8 h-8" />;
      case BranchingRoomType.BATTLEFIELD:
        return <Sword className="w-8 h-8" />;
      default:
        return <Home className="w-8 h-8" />;
    }
  };

  // Get colors based on room type and state
  const getRoomColors = (): { bg: string; border: string; text: string; iconBg: string } => {
    if (room.isCleared) {
      return {
        bg: 'bg-zinc-900/80',
        border: 'border-zinc-700',
        text: 'text-zinc-500',
        iconBg: 'bg-zinc-800',
      };
    }

    switch (room.type) {
      case BranchingRoomType.START:
        return {
          bg: 'bg-gradient-to-b from-cyan-950 to-zinc-950',
          border: 'border-cyan-700',
          text: 'text-cyan-400',
          iconBg: 'bg-cyan-900/50',
        };
      case BranchingRoomType.VILLAGE:
        return {
          bg: 'bg-gradient-to-b from-emerald-950 to-zinc-950',
          border: 'border-emerald-700',
          text: 'text-emerald-400',
          iconBg: 'bg-emerald-900/50',
        };
      case BranchingRoomType.OUTPOST:
        return {
          bg: 'bg-gradient-to-b from-orange-950 to-zinc-950',
          border: 'border-orange-700',
          text: 'text-orange-400',
          iconBg: 'bg-orange-900/50',
        };
      case BranchingRoomType.SHRINE:
        return {
          bg: 'bg-gradient-to-b from-indigo-950 to-zinc-950',
          border: 'border-indigo-700',
          text: 'text-indigo-400',
          iconBg: 'bg-indigo-900/50',
        };
      case BranchingRoomType.CAMP:
        return {
          bg: 'bg-gradient-to-b from-amber-950 to-zinc-950',
          border: 'border-amber-700',
          text: 'text-amber-400',
          iconBg: 'bg-amber-900/50',
        };
      case BranchingRoomType.RUINS:
        return {
          bg: 'bg-gradient-to-b from-stone-900 to-zinc-950',
          border: 'border-stone-600',
          text: 'text-stone-400',
          iconBg: 'bg-stone-800/50',
        };
      case BranchingRoomType.BRIDGE:
        return {
          bg: 'bg-gradient-to-b from-slate-900 to-zinc-950',
          border: 'border-slate-600',
          text: 'text-slate-400',
          iconBg: 'bg-slate-800/50',
        };
      case BranchingRoomType.BOSS_GATE:
        return {
          bg: 'bg-gradient-to-b from-red-950 to-zinc-950',
          border: 'border-red-700',
          text: 'text-red-400',
          iconBg: 'bg-red-900/50',
        };
      case BranchingRoomType.FOREST:
        return {
          bg: 'bg-gradient-to-b from-green-950 to-zinc-950',
          border: 'border-green-700',
          text: 'text-green-400',
          iconBg: 'bg-green-900/50',
        };
      case BranchingRoomType.CAVE:
        return {
          bg: 'bg-gradient-to-b from-violet-950 to-zinc-950',
          border: 'border-violet-700',
          text: 'text-violet-400',
          iconBg: 'bg-violet-900/50',
        };
      case BranchingRoomType.BATTLEFIELD:
        return {
          bg: 'bg-gradient-to-b from-rose-950 to-zinc-950',
          border: 'border-rose-700',
          text: 'text-rose-400',
          iconBg: 'bg-rose-900/50',
        };
      default:
        return {
          bg: 'bg-zinc-900',
          border: 'border-zinc-700',
          text: 'text-zinc-400',
          iconBg: 'bg-zinc-800',
        };
    }
  };

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

  const colors = getRoomColors();
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
