import React from 'react';
import { Room } from '../game/types';
import Card from '../components/Card';

interface ExplorationProps {
  roomChoices: Room[];
  onSelectRoom: (room: Room) => void;
}

const Exploration: React.FC<ExplorationProps> = ({ roomChoices, onSelectRoom }) => {
  return (
    <div className="w-full max-w-6xl z-10 animate-fade-in">
      <h2 className="text-2xl text-center font-serif text-zinc-500 mb-12 tracking-[0.3em]">NEXT CHAMBER</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {roomChoices.map((room, idx) => (
          <Card key={idx} room={room} index={idx} onSelect={onSelectRoom} />
        ))}
      </div>
    </div>
  );
};

export default Exploration;
