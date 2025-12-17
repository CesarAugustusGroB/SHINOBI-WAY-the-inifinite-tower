import React from 'react';
import { getDangerSegmentColor, getDangerTextColor } from '../../utils/colorHelpers';

interface DangerLevelBarProps {
  level: number | null;
  showLabel?: boolean;
}

const DangerLevelBar: React.FC<DangerLevelBarProps> = ({ level, showLabel = true }) => {
  const segments = [1, 2, 3, 4, 5, 6, 7];

  return (
    <div className="flex items-center gap-2">
      {showLabel && (
        <span className="text-xs text-zinc-400 uppercase tracking-wider w-14">
          {level !== null ? 'Danger' : '???'}
        </span>
      )}
      <div className="flex gap-0.5 flex-1">
        {segments.map((seg) => (
          <div
            key={seg}
            className={`h-2 flex-1 rounded-sm transition-colors ${getDangerSegmentColor(seg, level)}`}
          />
        ))}
      </div>
      {level !== null && (
        <span className={`text-xs font-mono w-6 text-right ${getDangerTextColor(level)}`}>
          {level}
        </span>
      )}
    </div>
  );
};

export default DangerLevelBar;
