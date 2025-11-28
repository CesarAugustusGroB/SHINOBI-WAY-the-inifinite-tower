import React from 'react';
import { Room } from '../game/types';
import EnhancedCard from '../components/EnhancedCard';
import { CinematicViewscreen } from '../components/CinematicViewscreen';

interface ExplorationProps {
  roomChoices: Room[];
  onSelectRoom: (room: Room) => void;
}

const Exploration: React.FC<ExplorationProps> = ({ roomChoices, onSelectRoom }) => {
  return (
    <div className="w-full max-w-6xl z-10 flex flex-col h-full animate-fade-in">

      {/* Exploration Header */}
      <CinematicViewscreen
        image="/assets/background_next_chamber.png"
        overlayContent={
          <div className="flex flex-col items-center justify-center h-full text-center">
            <h2 className="text-4xl font-serif text-zinc-200 mb-2 tracking-[0.3em] drop-shadow-lg">
              NEXT CHAMBER
            </h2>
            <p className="text-zinc-400 text-sm font-mono bg-black/50 px-3 py-1 rounded">
              Choose your path wisely, shinobi.
            </p>
          </div>
        }
      />

      {/* Room Cards */}
      <div className="flex-1 p-6 grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
        {roomChoices.map((room, idx) => (
          <EnhancedCard key={idx} room={room} onClick={() => onSelectRoom(room)} />
        ))}
      </div>
    </div>
  );
};

export default Exploration;
