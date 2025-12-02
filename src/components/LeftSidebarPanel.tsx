import React from 'react';
import { useGame } from '../contexts/GameContext';
import { getStoryArc } from '../game/systems/EnemySystem';
import FloorPanel from './FloorPanel';
import PrimaryStatsPanel from './PrimaryStatsPanel';
import DerivedStatsPanel from './DerivedStatsPanel';
import EquipmentPanel from './EquipmentPanel';

interface LeftSidebarPanelProps {
  // Props are now optional - uses context if not provided
  storyArcLabel?: string;
}

const LeftSidebarPanel: React.FC<LeftSidebarPanelProps> = ({
  storyArcLabel
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

      <EquipmentPanel
        equipment={player.equipment}
      />

      {/* Wallet Display */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-3">
        <div className="text-zinc-400 text-xs mb-1">Wallet</div>
        <div className="text-amber-400 font-bold">{player.ryo} Ryō</div>
      </div>
    </div>
  );
};

export default LeftSidebarPanel;
