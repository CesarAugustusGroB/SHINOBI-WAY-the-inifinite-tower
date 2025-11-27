import React from 'react';
import StatBar from './StatBar';

interface ProgressionPanelProps {
  floor: number;
  storyArcLabel: string;
  level: number;
  exp: number;
  maxExp: number;
  currentHp: number;
  maxHp: number;
  currentChakra: number;
  maxChakra: number;
}

const ProgressionPanel: React.FC<ProgressionPanelProps> = ({
  floor,
  storyArcLabel,
  level,
  exp,
  maxExp,
  currentHp,
  maxHp,
  currentChakra,
  maxChakra
}) => {
  return (
    <div className="flex flex-col gap-4">
      {/* Story Arc */}
      <div className="text-center border-b border-zinc-900 pb-3">
        <div className="text-[9px] text-zinc-500 uppercase tracking-[0.3em] font-bold mb-1">Current Arc</div>
        <div className="text-base font-serif text-zinc-200 font-bold">{storyArcLabel}</div>
      </div>

      {/* Floor & Level */}
      <div className="flex flex-col gap-2 border-b border-zinc-900 pb-4">
        <div className="flex items-baseline justify-between">
          <span className="text-xs text-zinc-600 uppercase tracking-widest font-bold">Floor</span>
          <span className="text-4xl font-black text-zinc-200 font-serif">{floor}</span>
        </div>
        <div className="mt-2">
          <div className="flex items-baseline justify-between mb-1">
            <span className="text-xs text-yellow-700 uppercase tracking-widest font-bold">Level</span>
            <span className="text-lg font-bold text-yellow-500 font-mono">{level}</span>
          </div>
          <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
            <div className="h-full bg-yellow-600" style={{ width: `${(exp / maxExp) * 100}%` }}></div>
          </div>
          <div className="flex justify-end text-[9px] text-zinc-600 font-mono mt-1">{exp} / {maxExp} XP</div>
        </div>
      </div>

      {/* HP & Chakra Bars */}
      <div className="space-y-2">
        <StatBar current={currentHp} max={maxHp} label="Health" color="green" />
        <StatBar current={currentChakra} max={maxChakra} label="Chakra" color="blue" />
      </div>
    </div>
  );
};

export default ProgressionPanel;
