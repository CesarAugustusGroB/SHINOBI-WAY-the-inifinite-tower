import React from 'react';
import { Player, PrimaryAttributes, DerivedStats } from '../game/types';
import ProgressionPanel from './ProgressionPanel';
import PrimaryStatsPanel from './PrimaryStatsPanel';
import DerivedStatsPanel from './DerivedStatsPanel';
import EquipmentPanel from './EquipmentPanel';
import WalletPanel from './WalletPanel';

interface LeftSidebarPanelProps {
  floor: number;
  player: Player;
  playerStats: {
    effectivePrimary: PrimaryAttributes;
    derived: DerivedStats;
  };
  storyArcLabel: string;
}

const LeftSidebarPanel: React.FC<LeftSidebarPanelProps> = ({
  floor,
  player,
  playerStats,
  storyArcLabel
}) => {
  return (
    <div className="flex flex-col gap-4 h-full text-[11px] rounded-lg p-3 overflow-y-auto">
      <ProgressionPanel
        floor={floor}
        storyArcLabel={storyArcLabel}
        level={player.level}
        exp={player.exp}
        maxExp={player.maxExp}
        currentHp={player.currentHp}
        maxHp={playerStats.derived.maxHp}
        currentChakra={player.currentChakra}
        maxChakra={playerStats.derived.maxChakra}
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

      <WalletPanel
        ryo={player.ryo}
      />
    </div>
  );
};

export default LeftSidebarPanel;
