import React from 'react';
import { GameEventDefinition, Player } from '../game/types';
import { MapIcon } from 'lucide-react';
import EventChoicePanel from '../components/EventChoicePanel';

interface EventProps {
  activeEvent: GameEventDefinition;
  onChoice: (choice: any) => void;
  player?: Player | null;
  playerStats?: any;
}

const Event: React.FC<EventProps> = ({ activeEvent, onChoice, player, playerStats }) => {
  // Check if this is an enhanced event with new choice properties
  const isEnhancedEvent = activeEvent.choices.length > 0 && 'riskLevel' in activeEvent.choices[0];

  return (
    <div className="w-full max-w-3xl bg-black border border-zinc-800 p-10 shadow-2xl z-10 flex flex-col items-center text-center">
      <div className="mb-6 text-blue-900 opacity-50"><MapIcon size={56} /></div>
      <h2 className="text-2xl font-bold text-zinc-200 mb-4 font-serif">{activeEvent.title}</h2>
      <p className="text-base text-zinc-500 mb-10 leading-relaxed max-w-lg">{activeEvent.description}</p>

      {isEnhancedEvent ? (
        // Enhanced event choices with EventChoicePanel
        <div className="flex flex-col gap-3 w-full">
          {activeEvent.choices.map((choice: any, idx) => (
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
      ) : (
        // Legacy event choices for backward compatibility
        <div className="flex flex-col gap-3 w-full">
          {activeEvent.choices.map((choice, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onChoice(choice)}
              className="w-full py-4 px-6 bg-zinc-900 border border-zinc-800 hover:border-zinc-500 transition-colors flex justify-between items-center group"
            >
              <span className="font-bold text-zinc-300 group-hover:text-white tracking-widest uppercase text-sm">{choice.label}</span>
              {choice.description && <span className="text-xs text-zinc-600 font-mono">{choice.description}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default Event;
