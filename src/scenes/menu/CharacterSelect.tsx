import React from 'react';
import { Clan, PrimaryAttributes } from '../../game/types';
import { CLAN_STATS, CLAN_START_SKILL } from '../../game/constants';
import Tooltip from '../../components/shared/Tooltip';
import './CharacterSelect.css';

interface CharacterSelectProps {
  onSelectClan: (clan: Clan) => void;
}

// Calculate average stat for a category and return letter rank (D-S)
const getStatRank = (stats: PrimaryAttributes, keys: (keyof PrimaryAttributes)[]): string => {
  const average = keys.reduce((sum, key) => sum + stats[key], 0) / keys.length;
  if (average >= 22) return 'S';
  if (average >= 19) return 'A';
  if (average >= 16) return 'B';
  if (average >= 13) return 'C';
  return 'D';
};

// Get color for rank
const getRankColor = (rank: string): string => {
  switch (rank) {
    case 'S': return 'text-red-500';
    case 'A': return 'text-orange-500';
    case 'B': return 'text-yellow-500';
    case 'C': return 'text-cyan-500';
    case 'D': return 'text-blue-500';
    default: return 'text-zinc-500';
  }
};

const CharacterSelect: React.FC<CharacterSelectProps> = ({ onSelectClan }) => {
  return (
    <div className="character-select-container min-h-screen bg-zinc-950 text-gray-200 p-8 flex flex-col items-center justify-center">
      <h2 className="text-2xl font-serif text-zinc-500 mb-12 tracking-[0.2em]">SELECT LINEAGE</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 w-full max-w-7xl">
        {Object.values(Clan).map(clan => {
          const stats = CLAN_STATS[clan];
          const startSkill = CLAN_START_SKILL[clan];

          // Calculate ranks for each category
          const spiritRank = getStatRank(stats, ['willpower', 'chakra', 'spirit']);
          const mindRank = getStatRank(stats, ['intelligence', 'calmness', 'accuracy']);
          const bodyRank = getStatRank(stats, ['strength', 'speed', 'dexterity']);

          return (
            <div
              key={clan}
              className="h-96 bg-black border-2 border-zinc-800 p-8 flex flex-col items-start justify-between relative overflow-hidden"
            >
              <div className="absolute -right-8 -top-8 text-8xl font-black text-zinc-900 opacity-20">{clan.charAt(0)}</div>
              <div className="z-10 w-full">
                <h3 className="text-2xl font-black text-zinc-200 mb-2">{clan}</h3>
                <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-4 border-b border-zinc-800 pb-2">{startSkill.name}</div>

                {/* Stat Category Ranks with Tooltip */}
                <Tooltip
                  content={
                    <div className="space-y-3">
                      <div className="text-xs font-bold text-zinc-200 mb-2">{startSkill.name}</div>
                      <div>
                        <div className="text-[10px] font-bold text-purple-400 mb-1">THE SPIRIT</div>
                        <div className="text-[10px] font-mono text-zinc-300 space-y-0.5">
                          <div className="flex justify-between"><span className="text-red-600">WIL</span><span>{stats.willpower}</span></div>
                          <div className="flex justify-between"><span className="text-blue-600">CHA</span><span>{stats.chakra}</span></div>
                          <div className="flex justify-between"><span className="text-purple-600">SPI</span><span>{stats.spirit}</span></div>
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] font-bold text-cyan-400 mb-1">THE MIND</div>
                        <div className="text-[10px] font-mono text-zinc-300 space-y-0.5">
                          <div className="flex justify-between"><span className="text-cyan-600">INT</span><span>{stats.intelligence}</span></div>
                          <div className="flex justify-between"><span className="text-indigo-600">CAL</span><span>{stats.calmness}</span></div>
                          <div className="flex justify-between"><span className="text-yellow-600">ACC</span><span>{stats.accuracy}</span></div>
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] font-bold text-orange-400 mb-1">THE BODY</div>
                        <div className="text-[10px] font-mono text-zinc-300 space-y-0.5">
                          <div className="flex justify-between"><span className="text-orange-600">STR</span><span>{stats.strength}</span></div>
                          <div className="flex justify-between"><span className="text-green-600">SPD</span><span>{stats.speed}</span></div>
                          <div className="flex justify-between"><span className="text-pink-600">DEX</span><span>{stats.dexterity}</span></div>
                        </div>
                      </div>
                    </div>
                  }
                >
                  <div className="space-y-2 mb-4 cursor-help">
                    <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider">
                      <span className="text-purple-500">Spirit</span>
                      <span className={`text-xl font-black ${getRankColor(spiritRank)}`}>{spiritRank}</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider">
                      <span className="text-cyan-500">Mind</span>
                      <span className={`text-xl font-black ${getRankColor(mindRank)}`}>{mindRank}</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider">
                      <span className="text-orange-500">Body</span>
                      <span className={`text-xl font-black ${getRankColor(bodyRank)}`}>{bodyRank}</span>
                    </div>
                  </div>
                </Tooltip>
              </div>
              <button 
                onClick={() => onSelectClan(clan)}
                className="w-full pt-4 z-10 group"
              >
                <img src="/assets/translucent_begin_journey.png" alt="Begin Journey" className="w-full h-auto object-cover transition-transform group-hover:scale-105" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CharacterSelect;
