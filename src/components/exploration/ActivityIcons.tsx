import React from 'react';
import { LocationActivities, ActivityStatus } from '../../game/types';

interface ActivityIconsProps {
  activities: LocationActivities | null;
}

const ActivityIcons: React.FC<ActivityIconsProps> = ({ activities }) => {
  if (!activities) {
    // Show mystery placeholders
    return (
      <div className="flex items-center gap-1">
        <span className="text-xs text-zinc-500">📋</span>
        {[1, 2, 3, 4, 5].map((i) => (
          <span key={i} className="text-sm opacity-40">?</span>
        ))}
      </div>
    );
  }

  // Activity icon mapping with colors
  const activityIcons: { key: keyof LocationActivities; icon: string; specialIcon: string; color: string }[] = [
    { key: 'combat', icon: '⚔️', specialIcon: '⚔️✨', color: 'text-orange-400' },
    { key: 'merchant', icon: '🛒', specialIcon: '🛒✨', color: 'text-yellow-400' },
    { key: 'rest', icon: '💤', specialIcon: '💤✨', color: 'text-green-400' },
    { key: 'training', icon: '🎯', specialIcon: '🎯✨', color: 'text-cyan-400' },
    { key: 'event', icon: '🎪', specialIcon: '🎪✨', color: 'text-purple-400' },
    { key: 'scrollDiscovery', icon: '📜', specialIcon: '📜✨', color: 'text-blue-400' },
    { key: 'treasure', icon: '💎', specialIcon: '💎✨', color: 'text-amber-400' },
    { key: 'eliteChallenge', icon: '👹', specialIcon: '👹✨', color: 'text-red-400' },
    { key: 'infoGathering', icon: '🔍', specialIcon: '🔍✨', color: 'text-teal-400' },
  ];

  const activeActivities = activityIcons.filter(({ key }) => activities[key] !== false);

  return (
    <div className="flex items-center gap-1">
      <span className="text-xs text-zinc-500">📋</span>
      {activeActivities.length === 0 ? (
        <span className="text-xs text-zinc-600 italic">No activities</span>
      ) : (
        activeActivities.map(({ key, icon, specialIcon, color }) => {
          const status: ActivityStatus = activities[key];
          const isSpecial = status === 'special';
          return (
            <span
              key={key}
              className={`text-sm ${isSpecial ? color : ''} ${isSpecial ? 'animate-pulse' : ''}`}
              title={`${key}${isSpecial ? ' (Special)' : ''}`}
            >
              {isSpecial ? specialIcon : icon}
            </span>
          );
        })
      )}
    </div>
  );
};

export default ActivityIcons;
