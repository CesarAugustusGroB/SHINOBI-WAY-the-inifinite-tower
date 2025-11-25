import React, { useEffect, useRef } from 'react';
import { LogEntry } from '../game/types';

interface GameLogProps {
  logs: LogEntry[];
}

const GameLog: React.FC<GameLogProps> = ({ logs }) => {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const getTypeClass = (type: string) => {
    switch (type) {
      case 'combat': return 'text-yellow-400';
      case 'danger': return 'text-red-400 font-bold';
      case 'gain': return 'text-green-400';
      case 'loot': return 'text-purple-400';
      default: return 'text-gray-300';
    }
  };

  return (
    <div className="h-48 md:h-64 bg-black/80 border border-gray-700 rounded-md p-4 overflow-y-auto font-mono text-sm shadow-inner">
      {logs.length === 0 && <span className="text-gray-600 italic">Adventure awaits...</span>}
      {logs.map((log) => (
        <div key={log.id} className={`mb-1 border-b border-white/5 pb-1 last:border-0 ${getTypeClass(log.type)}`}>
          <span className="opacity-50 text-xs mr-2">[{log.id}]</span>
          {log.text}
        </div>
      ))}
      <div ref={endRef} />
    </div>
  );
};

export default GameLog;
