import React from 'react';
import { LocationActivities, ActivityStatus } from '../../game/types';
import './exploration.css';

interface ActivityIconsProps {
  activities: LocationActivities | null;
}

const ActivityIcons: React.FC<ActivityIconsProps> = ({ activities }) => {
  if (!activities) {
    // Show mystery placeholders
    return (
      <div className="activity-icons">
        <span className="activity-icons__label">📋</span>
        {[1, 2, 3, 4, 5].map((i) => (
          <span key={i} className="activity-icons__placeholder">?</span>
        ))}
      </div>
    );
  }

  // Activity icon mapping with color classes
  const activityIcons: { key: keyof LocationActivities; icon: string; specialIcon: string; colorClass: string }[] = [
    { key: 'combat', icon: '⚔️', specialIcon: '⚔️✨', colorClass: 'activity-icons__icon--combat' },
    { key: 'merchant', icon: '🛒', specialIcon: '🛒✨', colorClass: 'activity-icons__icon--merchant' },
    { key: 'rest', icon: '💤', specialIcon: '💤✨', colorClass: 'activity-icons__icon--rest' },
    { key: 'training', icon: '🎯', specialIcon: '🎯✨', colorClass: 'activity-icons__icon--training' },
    { key: 'event', icon: '🎪', specialIcon: '🎪✨', colorClass: 'activity-icons__icon--event' },
    { key: 'scrollDiscovery', icon: '📜', specialIcon: '📜✨', colorClass: 'activity-icons__icon--scroll' },
    { key: 'treasure', icon: '💎', specialIcon: '💎✨', colorClass: 'activity-icons__icon--treasure' },
    { key: 'eliteChallenge', icon: '👹', specialIcon: '👹✨', colorClass: 'activity-icons__icon--elite' },
    { key: 'infoGathering', icon: '🔍', specialIcon: '🔍✨', colorClass: 'activity-icons__icon--info' },
  ];

  const activeActivities = activityIcons.filter(({ key }) => activities[key] !== false);

  return (
    <div className="activity-icons">
      <span className="activity-icons__label">📋</span>
      {activeActivities.length === 0 ? (
        <span className="activity-icons__empty">No activities</span>
      ) : (
        activeActivities.map(({ key, icon, specialIcon, colorClass }) => {
          const status: ActivityStatus = activities[key];
          const isSpecial = status === 'special';
          const classes = [
            'activity-icons__icon',
            isSpecial ? colorClass : '',
            isSpecial ? 'activity-icons__icon--special' : ''
          ].filter(Boolean).join(' ');

          return (
            <span
              key={key}
              className={classes}
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
