import React from 'react';
import { useGame } from '../contexts/GameContext';
import LocationPanel from './LocationPanel';
import PrimaryStatsPanel from './PrimaryStatsPanel';
import DerivedStatsPanel from './DerivedStatsPanel';

interface LeftSidebarPanelProps {
  // Props are now optional - uses context if not provided
  storyArcLabel?: string;
}

const LeftSidebarPanel: React.FC<LeftSidebarPanelProps> = ({
  storyArcLabel,
}) => {
  const { player, playerStats, region, currentLocation, dangerLevel } = useGame();

  // Early return if no player data
  if (!player || !playerStats) return null;

  // Get region info for display
  const arcLabel = storyArcLabel ?? region?.arc ?? 'Exploring';
  const locationName = currentLocation?.name ?? 'Unknown Location';
  const regionName = region?.name ?? 'Unknown Region';

  return (
    <div className="flex flex-col gap-4 h-full text-[11px] rounded-lg p-3 overflow-y-auto">
      <LocationPanel
        locationName={locationName}
        dangerLevel={dangerLevel}
        regionName={regionName}
        storyArcLabel={arcLabel}
      />

      <PrimaryStatsPanel
        player={player}
        effectivePrimary={playerStats.effectivePrimary}
      />

      <DerivedStatsPanel
        derived={playerStats.derived}
      />
    </div>
  );
};

export default LeftSidebarPanel;
