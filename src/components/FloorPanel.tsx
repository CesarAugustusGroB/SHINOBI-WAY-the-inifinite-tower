import React from 'react';

interface FloorPanelProps {
  floor: number;
  storyArcLabel: string;
}

const FloorPanel: React.FC<FloorPanelProps> = ({ floor, storyArcLabel }) => {
  return (
    <div className="bg-zinc-900/80 border border-zinc-800 rounded-lg p-3">
      <div className="flex items-center justify-between">
        <div className="text-zinc-500 text-[10px] uppercase tracking-wider">
          {storyArcLabel}
        </div>
        <div className="text-right">
          <span className="text-zinc-500 text-[10px] uppercase tracking-wider">Floor</span>
          <span className="text-2xl font-black text-amber-500 ml-2">{floor}</span>
        </div>
      </div>
    </div>
  );
};

export default FloorPanel;
