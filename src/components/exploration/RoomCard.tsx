import React from 'react';
import {
  BranchingRoom,
  BranchingRoomType,
} from '../../game/types';
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
import { getCurrentActivity } from '../../game/systems/LocationSystem';
import { getBranchingRoomColors } from '../../game/constants/roomTypeMapping';
import './exploration.css';

interface RoomCardProps {
  room: BranchingRoom;
  isSelected: boolean;
  onClick: () => void;
}

// Icon mapping for branching room types
const BRANCHING_ROOM_ICONS: Record<BranchingRoomType, React.ReactNode> = {
  [BranchingRoomType.START]: <Home className="room-card__icon" />,
  [BranchingRoomType.VILLAGE]: <Home className="room-card__icon" />,
  [BranchingRoomType.OUTPOST]: <Sword className="room-card__icon" />,
  [BranchingRoomType.SHRINE]: <Sparkles className="room-card__icon" />,
  [BranchingRoomType.CAMP]: <Flame className="room-card__icon" />,
  [BranchingRoomType.RUINS]: <Landmark className="room-card__icon" />,
  [BranchingRoomType.BRIDGE]: <Mountain className="room-card__icon" />,
  [BranchingRoomType.BOSS_GATE]: <Crown className="room-card__icon" />,
  [BranchingRoomType.FOREST]: <TreePine className="room-card__icon" />,
  [BranchingRoomType.CAVE]: <Mountain className="room-card__icon" />,
  [BranchingRoomType.BATTLEFIELD]: <Sword className="room-card__icon" />,
};

const RoomCard: React.FC<RoomCardProps> = ({
  room,
  isSelected,
  onClick,
}) => {
  // Get the appropriate icon for the room type
  const getRoomIcon = (): React.ReactNode => {
    return BRANCHING_ROOM_ICONS[room.type] || <Home className="room-card__icon" />;
  };

  // Get colors from shared utility (returns Tailwind classes)
  const colors = getBranchingRoomColors(room.type, room.isCleared);

  // Get activity icons for the room
  const getActivityIcons = (): React.ReactNode[] => {
    const icons: React.ReactNode[] = [];

    if (room.activities.combat && !room.activities.combat.completed) {
      icons.push(<Sword key="combat" className="room-card__activity text-orange-400" />);
    }
    if (room.activities.merchant && !room.activities.merchant.completed) {
      icons.push(<ShoppingBag key="merchant" className="room-card__activity text-yellow-400" />);
    }
    if (room.activities.event && !room.activities.event.completed) {
      icons.push(<Scroll key="event" className="room-card__activity text-blue-400" />);
    }
    if (room.activities.scrollDiscovery && !room.activities.scrollDiscovery.completed) {
      icons.push(<BookOpen key="scrollDiscovery" className="room-card__activity text-purple-400" />);
    }
    if (room.activities.rest && !room.activities.rest.completed) {
      icons.push(<Heart key="rest" className="room-card__activity text-green-400" />);
    }
    if (room.activities.training && !room.activities.training.completed) {
      icons.push(<Dumbbell key="training" className="room-card__activity text-teal-400" />);
    }
    if (room.activities.treasure && !room.activities.treasure.collected) {
      icons.push(<Gift key="treasure" className="room-card__activity text-amber-400" />);
    }

    return icons;
  };

  const currentActivity = getCurrentActivity(room);
  const activityIcons = getActivityIcons();

  // Determine card state
  const isLocked = !room.isAccessible && !room.isCleared;
  const canClick = room.isAccessible || room.isCurrent;

  // Build class list - combine BEM structure with Tailwind dynamic colors
  const cardClasses = [
    'room-card',
    colors.bg,
    colors.border,
    canClick && !room.isCurrent ? 'room-card--accessible' : '',
    room.isCurrent ? 'room-card--current' : '',
    isSelected ? 'room-card--selected' : '',
    isLocked ? 'room-card--locked' : '',
    room.isCleared ? 'room-card--cleared' : '',
  ].filter(Boolean).join(' ');

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isLocked}
      className={cardClasses}
    >
      {/* Background pattern */}
      <div className="room-card__bg">
        <div className="room-card__bg-gradient" />
      </div>

      {/* Content */}
      <div className="room-card__content">
        {/* Icon container */}
        <div className={`room-card__icon-container ${colors.iconBg} ${colors.text}`}>
          {getRoomIcon()}
        </div>

        {/* Room name */}
        <div className="room-card__name-container">
          <h3 className={`room-card__name ${colors.text}`}>
            {room.name}
          </h3>
        </div>

        {/* Activity indicators */}
        {activityIcons.length > 0 && (
          <div className="room-card__activities">
            {activityIcons}
          </div>
        )}

        {/* Current activity label */}
        {currentActivity && !room.isCleared && (
          <div className="room-card__current-activity">
            {currentActivity}
          </div>
        )}
      </div>

      {/* Exit badge */}
      {room.isExit && !room.isCleared && (
        <div className="room-card__exit-badge">EXIT</div>
      )}

      {/* Cleared overlay */}
      {room.isCleared && (
        <div className="room-card__overlay room-card__overlay--cleared">
          <CheckCircle className="room-card__overlay-icon room-card__overlay-icon--cleared" />
        </div>
      )}

      {/* Locked overlay */}
      {isLocked && (
        <div className="room-card__overlay room-card__overlay--locked">
          <Lock className="room-card__overlay-icon room-card__overlay-icon--locked" />
        </div>
      )}

      {/* Current room glow */}
      {room.isCurrent && !room.isCleared && (
        <div className="room-card__glow room-card__glow--current" />
      )}

      {/* Boss gate pulse */}
      {room.type === BranchingRoomType.BOSS_GATE && !room.isCleared && (
        <div className="room-card__glow room-card__glow--boss" />
      )}
    </button>
  );
};

export default RoomCard;
