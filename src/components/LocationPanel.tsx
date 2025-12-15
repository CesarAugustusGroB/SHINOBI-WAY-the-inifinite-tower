import React from 'react';

interface LocationPanelProps {
  locationName: string;
  dangerLevel: number;
  regionName: string;
  storyArcLabel: string;
}

const LocationPanel: React.FC<LocationPanelProps> = ({
  locationName,
  dangerLevel,
  regionName,
  storyArcLabel,
}) => {
  // Consistent danger color thresholds: 1-2 green, 3-4 yellow, 5 orange, 6-7 red
  const getDangerColor = (level: number): string => {
    if (level <= 2) return 'text-green-500';
    if (level <= 4) return 'text-yellow-500';
    if (level <= 5) return 'text-orange-500';
    return 'text-red-500';
  };

  const getDangerBgColor = (level: number): string => {
    if (level <= 2) return 'bg-green-500/10';
    if (level <= 4) return 'bg-yellow-500/10';
    if (level <= 5) return 'bg-orange-500/10';
    return 'bg-red-500/10';
  };

  return (
    <div className="bg-zinc-900/80 border border-zinc-800 rounded-lg p-3">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="text-zinc-500 text-[10px] uppercase tracking-wider">
            {storyArcLabel}
          </div>
          <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded ${getDangerBgColor(dangerLevel)}`}>
            <span className="text-zinc-500 text-[9px] uppercase">Danger</span>
            <span className={`text-lg font-black ${getDangerColor(dangerLevel)}`}>
              {dangerLevel}
            </span>
          </div>
        </div>
        <div className="text-zinc-300 font-bold text-sm truncate">
          {locationName}
        </div>
        <div className="text-zinc-600 text-[9px] uppercase tracking-wider">
          {regionName}
        </div>
      </div>
    </div>
  );
};

export default LocationPanel;
