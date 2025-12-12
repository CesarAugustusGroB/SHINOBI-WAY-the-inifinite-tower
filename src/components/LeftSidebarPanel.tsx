import React from 'react';
import { useGame } from '../contexts/GameContext';
import { getStoryArc } from '../game/systems/EnemySystem';
import FloorPanel from './FloorPanel';
import PrimaryStatsPanel from './PrimaryStatsPanel';
import DerivedStatsPanel from './DerivedStatsPanel';

interface LeftSidebarPanelProps {
  // Props are now optional - uses context if not provided
  storyArcLabel?: string;
}

const LeftSidebarPanel: React.FC<LeftSidebarPanelProps> = ({
  storyArcLabel,
}) => {
  const { player, playerStats, floor } = useGame();

  // Early return if no player data
  if (!player || !playerStats) return null;

  // Derive story arc label from floor if not provided
  const arcLabel = storyArcLabel ?? getStoryArc(floor).label;

  return (
    <div className="flex flex-col gap-4 h-full text-[11px] rounded-lg p-3 overflow-y-auto">
      <FloorPanel
        floor={floor}
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
