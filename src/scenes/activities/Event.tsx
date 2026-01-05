import React from 'react';
import { GameEvent, Player, EventChoice, CharacterStats } from '../../game/types';
import { MapIcon } from 'lucide-react';
import EventChoicePanel from '../../components/events/EventChoicePanel';

interface EventProps {
  activeEvent: GameEvent;
  onChoice: (choice: EventChoice) => void;
  player?: Player | null;
  playerStats?: CharacterStats | null;
}

const Event: React.FC<EventProps> = ({ activeEvent, onChoice, player, playerStats }) => {
  return (
    <div className="w-full max-w-3xl bg-black border border-zinc-800 p-10 shadow-2xl z-10 flex flex-col items-center text-center">
      <div className="mb-6 text-blue-900 opacity-50"><MapIcon size={56} /></div>
      <h2 className="text-2xl font-bold text-zinc-200 mb-4 font-serif">{activeEvent.title}</h2>
      <p className="text-base text-zinc-500 mb-10 leading-relaxed max-w-lg">{activeEvent.description}</p>

      <div className="flex flex-col gap-3 w-full">
        {activeEvent.choices.map((choice, idx) => (
          <EventChoicePanel
            key={idx}
            choice={choice}
            player={player!}
            playerStats={playerStats}
            onSelect={() => onChoice(choice)}
            disabled={!player}
          />
        ))}
      </div>
    </div>
  );
};

export default Event;
