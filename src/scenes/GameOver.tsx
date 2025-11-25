import React from 'react';
import { Skull } from 'lucide-react';

interface GameOverProps {
  floor: number;
  playerLevel?: number;
  onRetry: () => void;
}

const GameOver: React.FC<GameOverProps> = ({ floor, playerLevel, onRetry }) => {
  return (
    <div className="min-h-screen bg-black text-red-700 flex flex-col items-center justify-center font-mono relative">
      <Skull size={64} className="mb-6 text-zinc-800" />
      <h1 className="text-6xl font-bold mb-4">DEATH</h1>
      <p className="text-zinc-500 mb-12 text-xl">You fell on Floor {floor} {playerLevel ? `(Level ${playerLevel})` : ''}</p>
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
