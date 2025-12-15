import React, { useEffect } from 'react';
import { Scroll, Heart, Zap, TrendingUp, Coins, Shield, AlertTriangle, Sparkles, CheckCircle } from 'lucide-react';
import { EventOutcome } from '../../game/types';

interface EventResultModalProps {
  outcome: {
    message: string;
    outcome: EventOutcome;
    logType: 'gain' | 'danger' | 'info' | 'loot';
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

const EventResultModal: React.FC<EventResultModalProps> = ({ outcome, onClose }) => {
  const { message, outcome: eventOutcome, logType } = outcome;
  const effects = eventOutcome.effects;

  // Keyboard shortcut: SPACE/ENTER to continue
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [onClose]);

  const getHeaderStyle = () => {
    switch (logType) {
      case 'gain':
        return { bg: 'from-green-900 to-zinc-900', icon: CheckCircle, iconColor: 'text-green-400', title: 'Success' };
      case 'danger':
        return { bg: 'from-red-900 to-zinc-900', icon: AlertTriangle, iconColor: 'text-red-400', title: 'Consequence' };
      case 'loot':
        return { bg: 'from-purple-900 to-zinc-900', icon: Sparkles, iconColor: 'text-purple-400', title: 'Discovery' };
      default:
        return { bg: 'from-zinc-800 to-zinc-900', icon: Scroll, iconColor: 'text-zinc-400', title: 'Outcome' };
    }
  };

  const headerStyle = getHeaderStyle();
  const HeaderIcon = headerStyle.icon;

  // Calculate HP/Chakra change display
  const getHpChangeDisplay = () => {
    if (!effects.hpChange) return null;
    if (typeof effects.hpChange === 'number') {
      return effects.hpChange > 0 ? `+${effects.hpChange}` : `${effects.hpChange}`;
    }
    return effects.hpChange.percent > 0 ? `+${effects.hpChange.percent}%` : `${effects.hpChange.percent}%`;
  };

  const getChakraChangeDisplay = () => {
    if (!effects.chakraChange) return null;
    if (typeof effects.chakraChange === 'number') {
      return effects.chakraChange > 0 ? `+${effects.chakraChange}` : `${effects.chakraChange}`;
    }
    return effects.chakraChange.percent > 0 ? `+${effects.chakraChange.percent}%` : `${effects.chakraChange.percent}%`;
  };

  const hpChange = getHpChangeDisplay();
  const chakraChange = getChakraChangeDisplay();
  const isHpPositive = effects.hpChange && (typeof effects.hpChange === 'number' ? effects.hpChange > 0 : effects.hpChange.percent > 0);
  const isChakraPositive = effects.chakraChange && (typeof effects.chakraChange === 'number' ? effects.chakraChange > 0 : effects.chakraChange.percent > 0);

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-zinc-900 border-2 border-zinc-700 rounded-lg max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className={`p-4 border-b border-zinc-700 text-center bg-gradient-to-b ${headerStyle.bg}`}>
          <div className="flex items-center justify-center gap-3 mb-1">
            <HeaderIcon className={`w-6 h-6 ${headerStyle.iconColor}`} />
            <h2 className="text-2xl font-serif text-zinc-100 tracking-wider uppercase">
              {headerStyle.title}
            </h2>
            <HeaderIcon className={`w-6 h-6 ${headerStyle.iconColor}`} />
          </div>
        </div>

        {/* Main Message */}
        <div className="p-6">
          <p className="text-zinc-200 text-center text-lg leading-relaxed mb-6">
            {message}
          </p>

          {/* Effects Grid */}
          <div className="space-y-4">
            {/* HP and Chakra Changes */}
            {(hpChange || chakraChange) && (
              <div className="grid grid-cols-2 gap-3">
                {hpChange && (
                  <div className={`${isHpPositive ? 'bg-green-900/20 border-green-800/50' : 'bg-red-900/20 border-red-800/50'} border rounded-lg p-3 text-center`}>
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <Heart className={`w-4 h-4 ${isHpPositive ? 'text-green-400' : 'text-red-400'}`} />
                      <span className={`text-xs uppercase tracking-wider ${isHpPositive ? 'text-green-400' : 'text-red-400'}`}>HP</span>
                    </div>
                    <p className={`text-xl font-bold ${isHpPositive ? 'text-green-300' : 'text-red-300'}`}>{hpChange}</p>
                  </div>
                )}
                {chakraChange && (
                  <div className={`${isChakraPositive ? 'bg-cyan-900/20 border-cyan-800/50' : 'bg-orange-900/20 border-orange-800/50'} border rounded-lg p-3 text-center`}>
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <Zap className={`w-4 h-4 ${isChakraPositive ? 'text-cyan-400' : 'text-orange-400'}`} />
                      <span className={`text-xs uppercase tracking-wider ${isChakraPositive ? 'text-cyan-400' : 'text-orange-400'}`}>Chakra</span>
                    </div>
                    <p className={`text-xl font-bold ${isChakraPositive ? 'text-cyan-300' : 'text-orange-300'}`}>{chakraChange}</p>
                  </div>
                )}
              </div>
            )}

            {/* Experience and Ryo */}
            {(effects.exp || effects.ryo) && (
              <div className="grid grid-cols-2 gap-3">
                {effects.exp && (
                  <div className="bg-cyan-900/20 border border-cyan-800/50 rounded-lg p-3 text-center">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <TrendingUp className="w-4 h-4 text-cyan-400" />
                      <span className="text-xs text-cyan-400 uppercase tracking-wider">Experience</span>
                    </div>
                    <p className="text-xl font-bold text-cyan-300">+{effects.exp}</p>
                  </div>
                )}
                {effects.ryo && (
                  <div className={`${effects.ryo > 0 ? 'bg-yellow-900/20 border-yellow-800/50' : 'bg-red-900/20 border-red-800/50'} border rounded-lg p-3 text-center`}>
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <Coins className={`w-4 h-4 ${effects.ryo > 0 ? 'text-yellow-400' : 'text-red-400'}`} />
                      <span className={`text-xs uppercase tracking-wider ${effects.ryo > 0 ? 'text-yellow-400' : 'text-red-400'}`}>Ryo</span>
                    </div>
                    <p className={`text-xl font-bold ${effects.ryo > 0 ? 'text-yellow-300' : 'text-red-300'}`}>
                      {effects.ryo > 0 ? `+${effects.ryo}` : effects.ryo}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Stat Changes */}
            {effects.statChanges && Object.keys(effects.statChanges).length > 0 && (
              <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4">
                <p className="text-xs text-zinc-500 uppercase tracking-wider mb-3 text-center">
                  Stat Changes
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(effects.statChanges)
                    .filter(([, value]) => value !== 0 && value !== undefined)
                    .map(([stat, value]) => (
                      <div key={stat} className="bg-zinc-900/50 rounded px-2 py-1 text-center">
                        <span className="text-[10px] text-zinc-500 uppercase block">
                          {STAT_DISPLAY_NAMES[stat] || stat}
                        </span>
                        <span className={`text-sm font-bold ${(value as number) > 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {(value as number) > 0 ? `+${value}` : value}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Buffs Applied */}
            {effects.buffs && effects.buffs.length > 0 && (
              <div className="bg-purple-900/20 border border-purple-800/50 rounded-lg p-4">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Shield className="w-4 h-4 text-purple-400" />
                  <span className="text-xs text-purple-400 uppercase tracking-wider">Effects Applied</span>
                </div>
                <div className="space-y-1">
                  {effects.buffs.map((buff, idx) => (
                    <div key={idx} className="text-center text-sm text-purple-200">
                      {buff.name || 'Buff'} ({buff.duration} turns)
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Continue Button */}
        <div className="p-4 border-t border-zinc-800">
          <button
            type="button"
            onClick={onClose}
            className={`w-full py-3 px-4 rounded-lg font-bold uppercase tracking-wider transition-colors ${
              logType === 'gain'
                ? 'bg-green-900/30 border border-green-700 text-green-200 hover:bg-green-900/50'
                : logType === 'danger'
                ? 'bg-red-900/30 border border-red-700 text-red-200 hover:bg-red-900/50'
                : 'bg-amber-900/30 border border-amber-700 text-amber-200 hover:bg-amber-900/50'
            }`}
          >
            Continue
          </button>
          <p className="text-xs text-zinc-600 text-center mt-2">Press SPACE or ENTER</p>
        </div>
      </div>
    </div>
  );
};

export default EventResultModal;
