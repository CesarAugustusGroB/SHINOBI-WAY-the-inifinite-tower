import React from 'react';
import { Swords, Sparkles, Coins, TrendingUp } from 'lucide-react';

interface RewardModalProps {
  expGain: number;
  ryoGain: number;
  levelUp?: {
    oldLevel: number;
    newLevel: number;
    statGains: Record<string, number>;
  };
  onClose: () => void;
}

const STAT_DISPLAY_NAMES: Record<string, string> = {
  willpower: 'Willpower',
  chakra: 'Chakra',
  strength: 'Strength',
  spirit: 'Spirit',
  intelligence: 'Intelligence',
  calmness: 'Calmness',
  speed: 'Speed',
  accuracy: 'Accuracy',
  dexterity: 'Dexterity',
};

const RewardModal: React.FC<RewardModalProps> = ({
  expGain,
  ryoGain,
  levelUp,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-zinc-900 border-2 border-zinc-700 rounded-lg max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-zinc-700 text-center bg-gradient-to-b from-zinc-800 to-zinc-900">
          <div className="flex items-center justify-center gap-3 mb-1">
            <Swords className="w-6 h-6 text-amber-500" />
            <h2 className="text-2xl font-serif text-zinc-100 tracking-wider uppercase">
              Victory
            </h2>
            <Swords className="w-6 h-6 text-amber-500" />
          </div>
          <p className="text-xs text-zinc-500 font-mono">Enemy Defeated</p>
        </div>

        {/* Rewards Section */}
        <div className="p-6 space-y-4">
          {/* XP and Ryo */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-cyan-900/20 border border-cyan-800/50 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-cyan-400" />
                <span className="text-xs text-cyan-400 uppercase tracking-wider">Experience</span>
              </div>
              <p className="text-2xl font-bold text-cyan-300">+{expGain}</p>
            </div>
            <div className="bg-yellow-900/20 border border-yellow-800/50 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Coins className="w-4 h-4 text-yellow-400" />
                <span className="text-xs text-yellow-400 uppercase tracking-wider">Gold</span>
              </div>
              <p className="text-2xl font-bold text-yellow-300">+{ryoGain}</p>
            </div>
          </div>

          {/* Level Up Section */}
          {levelUp && (
            <div className="bg-green-900/20 border border-green-700/50 rounded-lg p-4">
              <div className="flex items-center justify-center gap-2 mb-3">
                <Sparkles className="w-5 h-5 text-green-400" />
                <span className="text-lg font-bold text-green-400 uppercase tracking-wider">
                  Level Up!
                </span>
                <Sparkles className="w-5 h-5 text-green-400" />
              </div>

              <div className="text-center mb-4">
                <span className="text-zinc-500">Level </span>
                <span className="text-zinc-300 font-bold">{levelUp.oldLevel}</span>
                <span className="text-zinc-500 mx-2">→</span>
                <span className="text-green-400 font-bold text-lg">{levelUp.newLevel}</span>
              </div>

              <div className="space-y-2">
                <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2 text-center">
                  Stats Gained
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(levelUp.statGains)
                    .filter(([, gain]) => gain > 0)
                    .map(([stat, gain]) => (
                      <div
                        key={stat}
                        className="bg-zinc-800/50 rounded px-2 py-1 text-center"
                      >
                        <span className="text-[10px] text-zinc-500 uppercase block">
                          {STAT_DISPLAY_NAMES[stat] || stat}
                        </span>
                        <span className="text-sm font-bold text-orange-400">+{gain}</span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Continue Button */}
        <div className="p-4 border-t border-zinc-800">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 px-4 bg-amber-900/30 border border-amber-700 rounded-lg text-amber-200 font-bold uppercase tracking-wider hover:bg-amber-900/50 transition-colors"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
};

export default RewardModal;
