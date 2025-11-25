import React from 'react';
import { GameState, Clan } from '../game/types';

interface MainMenuProps {
  difficulty: number;
  onDifficultyChange: (value: number) => void;
  onEnter: () => void;
}

const MainMenu: React.FC<MainMenuProps> = ({ difficulty, onDifficultyChange, onEnter }) => {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center relative font-sans">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-900 via-black to-black opacity-80"></div>
      <div className="z-10 flex flex-col items-center w-full max-w-md px-6">
        <div className="mb-8 p-6 border-4 border-double border-red-900 bg-black/80 transform rotate-1">
          <h1 className="text-6xl md:text-8xl font-black text-red-800 tracking-tighter" style={{ textShadow: '4px 4px 0px #000' }}>SHINOBI WAY</h1>
        </div>
        <p className="text-sm text-zinc-500 tracking-[0.8em] mb-12 uppercase text-center">The Infinite Tower Awaits</p>

        <div className="w-full mb-12 p-6 bg-zinc-900/50 border border-zinc-800 rounded">
          <div className="flex justify-between items-end mb-4">
            <label htmlFor="difficulty-slider" className="text-xs font-bold uppercase tracking-widest text-zinc-400">Mission Difficulty</label>
            <span className={`text-2xl font-black ${difficulty < 30 ? 'text-green-500' : difficulty < 60 ? 'text-yellow-500' : difficulty < 85 ? 'text-orange-500' : 'text-red-600'}`}>
              Rank {difficulty < 30 ? 'D' : difficulty < 60 ? 'C' : difficulty < 85 ? 'B' : 'S'}
            </span>
          </div>
          <input
            id="difficulty-slider"
            type="range"
            min="0"
            max="100"
            value={difficulty}
            onChange={(e) => onDifficultyChange(parseInt(e.target.value))}
            className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-red-700"
          />
        </div>
        <button onClick={onEnter} className="w-full group relative px-16 py-4 bg-black border border-zinc-800 hover:border-red-800 transition-all overflow-hidden">
          <div className="absolute inset-0 w-0 bg-red-900/20 transition-all duration-300 ease-out group-hover:w-full"></div>
          <span className="relative font-bold text-lg tracking-widest text-zinc-300 group-hover:text-red-500">ENTER TOWER</span>
        </button>
      </div>
    </div>
  );
};

export default MainMenu;
