import React from 'react';
import { Skull } from 'lucide-react';

interface GameOverProps {
  locationName: string;
  dangerLevel: number;
  regionName: string;
  playerLevel?: number;
  onRetry: () => void;
}

const GameOver: React.FC<GameOverProps> = ({ locationName, dangerLevel, regionName, playerLevel, onRetry }) => {
  const getDangerColor = (level: number): string => {
    if (level <= 2) return 'text-green-500';
    if (level <= 4) return 'text-yellow-500';
    if (level <= 6) return 'text-orange-500';
    return 'text-red-500';
  };

  return (
    <div className="min-h-screen bg-black text-red-700 flex flex-col items-center justify-center font-mono relative">
      <Skull size={64} className="mb-6 text-zinc-800" />
      <h1 className="text-6xl font-bold mb-4">DEATH</h1>
      <p className="text-zinc-500 mb-6 text-xl">
        You fell at {locationName} <span className={getDangerColor(dangerLevel)}>(Danger {dangerLevel})</span>
        {playerLevel ? ` at Level ${playerLevel}` : ''}
      </p>
      <p className="text-zinc-600 mb-12 text-sm">{regionName}</p>
      <button
        onClick={onRetry}
        className="px-12 py-4 border border-zinc-800 text-zinc-400 hover:bg-zinc-900 hover:text-white uppercase tracking-widest text-sm"
      >
        Try Again
      </button>
    </div>
  );
};

export default GameOver;
