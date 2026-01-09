import React from 'react';
import './exploration.css';

interface WealthLevelBarProps {
  level: number | null;
  showLabel?: boolean;
}

const WealthLevelBar: React.FC<WealthLevelBarProps> = ({ level, showLabel = true }) => {
  const segments = [1, 2, 3, 4, 5, 6, 7];

  // Get segment class based on level
  const getSegmentClass = (seg: number): string => {
    if (level === null || seg > level) {
      return 'level-bar__segment level-bar__segment--wealth-empty';
    }
    return `level-bar__segment level-bar__segment--wealth-${seg}`;
  };

  // Get value class for text color
  const getValueClass = (): string => {
    if (level === null) return 'level-bar__value';
    return `level-bar__value level-bar__value--wealth-${level}`;
  };

  return (
    <div className="level-bar">
      {showLabel && (
        <span className="level-bar__label">
          {level !== null ? 'Wealth' : '???'}
        </span>
      )}
      <div className="level-bar__segments">
        {segments.map((seg) => (
          <div key={seg} className={getSegmentClass(seg)} />
        ))}
      </div>
      {level !== null && (
        <span className={getValueClass()}>{level}</span>
      )}
    </div>
  );
};

export default WealthLevelBar;
