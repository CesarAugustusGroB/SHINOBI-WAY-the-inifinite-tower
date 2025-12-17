import React from 'react';

interface WealthLevelBarProps {
  level: number | null;
  showLabel?: boolean;
}

const WealthLevelBar: React.FC<WealthLevelBarProps> = ({ level, showLabel = true }) => {
  const segments = [1, 2, 3, 4, 5, 6, 7];

  const getSegmentColor = (segmentLevel: number, currentLevel: number | null) => {
    if (currentLevel === null) return 'bg-zinc-800';
    if (segmentLevel > currentLevel) return 'bg-zinc-800';

    // Gold/yellow color scheme for wealth
    if (segmentLevel <= 2) return 'bg-amber-800';
    if (segmentLevel <= 4) return 'bg-amber-600';
    if (segmentLevel <= 5) return 'bg-yellow-500';
    return 'bg-yellow-400';
  };

  return (
    <div className="flex items-center gap-2">
      {showLabel && (
        <span className="text-xs text-zinc-400 uppercase tracking-wider w-14">
          {level !== null ? 'Wealth' : '???'}
        </span>
      )}
      <div className="flex gap-0.5 flex-1">
        {segments.map((seg) => (
          <div
            key={seg}
            className={`h-2 flex-1 rounded-sm transition-colors ${getSegmentColor(seg, level)}`}
          />
        ))}
      </div>
      {level !== null && (
        <span className={`text-xs font-mono w-6 text-right ${
          level <= 2 ? 'text-amber-700' :
          level <= 4 ? 'text-amber-500' :
          level <= 5 ? 'text-yellow-400' :
          'text-yellow-300'
        }`}>
          {level}
        </span>
      )}
    </div>
  );
};

export default WealthLevelBar;
