import React, { useEffect, useState } from 'react';
import { Dices, AlertTriangle, Package, Map, Heart } from 'lucide-react';
import { DiceRollResult } from '../../game/types';

interface DiceRollResultModalProps {
  result: DiceRollResult;
  onContinue: () => void;
}

const DiceRollResultModal: React.FC<DiceRollResultModalProps> = ({ result, onContinue }) => {
  const [isRolling, setIsRolling] = useState(true);
  const [showResult, setShowResult] = useState(false);

  // Dice roll animation
  useEffect(() => {
    const rollTimer = setTimeout(() => {
      setIsRolling(false);
      setTimeout(() => setShowResult(true), 200);
    }, 1200);

    return () => clearTimeout(rollTimer);
  }, []);

  // Keyboard shortcut: SPACE/ENTER to continue (only after result shown)
  useEffect(() => {
    if (!showResult) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        onContinue();
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [onContinue, showResult]);

  const getResultStyle = () => {
    switch (result.type) {
      case 'trap':
        return {
          bg: 'from-red-900/80 to-zinc-900',
          border: 'border-red-700',
          icon: AlertTriangle,
          iconColor: 'text-red-400',
          title: 'TRAP!',
          glowColor: 'shadow-red-500/30',
        };
      case 'nothing':
        return {
          bg: 'from-zinc-700/80 to-zinc-900',
          border: 'border-zinc-600',
          icon: Package,
          iconColor: 'text-zinc-400',
          title: 'EMPTY',
          glowColor: 'shadow-zinc-500/20',
        };
      case 'piece':
        return {
          bg: 'from-amber-900/80 to-zinc-900',
          border: 'border-amber-600',
          icon: Map,
          iconColor: 'text-amber-400',
          title: 'MAP PIECE!',
          glowColor: 'shadow-amber-500/40',
        };
    }
  };

  const style = getResultStyle();
  const ResultIcon = style.icon;

  // Progress bar for map pieces
  const renderMapProgress = () => {
    if (result.type !== 'piece' || !result.piecesCollected || !result.piecesRequired) return null;

    const segments = [];
    for (let i = 0; i < result.piecesRequired; i++) {
      segments.push(
        <div
          key={i}
          className={`h-3 flex-1 rounded-sm ${
            i < result.piecesCollected
              ? 'bg-amber-500'
              : 'bg-zinc-700'
          }`}
        />
      );
    }

    return (
      <div className="mt-4">
        <div className="flex gap-1">{segments}</div>
        <p className="text-amber-400 text-sm text-center mt-2">
          {result.piecesCollected}/{result.piecesRequired} pieces collected
        </p>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/85 flex items-center justify-center z-50 p-4 animate-fade-in">
      <div
        className={`bg-zinc-900 ${style.border} border-2 rounded-xl max-w-sm w-full overflow-hidden shadow-2xl ${style.glowColor} transition-all duration-500`}
      >
        {/* Header */}
        <div className={`p-4 border-b border-zinc-700/50 text-center bg-gradient-to-b ${style.bg}`}>
          <div className="flex items-center justify-center gap-3">
            <Dices className={`w-6 h-6 ${isRolling ? 'animate-spin text-amber-400' : 'text-zinc-500'}`} />
            <h2 className="text-xl font-serif text-zinc-100 tracking-widest uppercase">
              Dice Roll
            </h2>
            <Dices className={`w-6 h-6 ${isRolling ? 'animate-spin text-amber-400' : 'text-zinc-500'}`} />
          </div>
        </div>

        {/* Content */}
        <div className="p-6 min-h-[200px] flex flex-col items-center justify-center">
          {isRolling ? (
            // Rolling animation
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <div className="w-20 h-20 bg-gradient-to-br from-amber-600 to-amber-800 rounded-xl flex items-center justify-center shadow-lg animate-bounce">
                  <Dices className="w-10 h-10 text-amber-100 animate-pulse" />
                </div>
                <div className="absolute -inset-2 bg-amber-500/20 rounded-xl blur-md animate-pulse" />
              </div>
              <p className="text-zinc-400 text-sm animate-pulse tracking-wider">Rolling...</p>
            </div>
          ) : (
            // Result display
            <div
              className={`flex flex-col items-center gap-4 transition-all duration-500 ${
                showResult ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
              }`}
            >
              {/* Result icon */}
              <div className={`w-20 h-20 rounded-full ${style.border} border-2 flex items-center justify-center bg-zinc-800/50`}>
                <ResultIcon className={`w-10 h-10 ${style.iconColor}`} />
              </div>

              {/* Result title */}
              <h3 className={`text-2xl font-bold tracking-wider ${style.iconColor}`}>
                {style.title}
              </h3>

              {/* Result message */}
              <div className="text-center">
                {result.type === 'trap' && (
                  <div className="flex flex-col items-center gap-2">
                    <p className="text-zinc-300">You triggered a trap!</p>
                    <div className="flex items-center gap-2 bg-red-900/30 border border-red-800/50 rounded-lg px-4 py-2">
                      <Heart className="w-5 h-5 text-red-400" />
                      <span className="text-red-300 font-bold text-lg">-{result.damage} HP</span>
                    </div>
                  </div>
                )}

                {result.type === 'nothing' && (
                  <p className="text-zinc-400">
                    The chest was empty...<br />
                    <span className="text-zinc-500 text-sm">No map piece found.</span>
                  </p>
                )}

                {result.type === 'piece' && (
                  <div>
                    <p className="text-amber-300">You found a map piece!</p>
                    {renderMapProgress()}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Continue Button */}
        {showResult && (
          <div className="p-4 border-t border-zinc-800/50 animate-fade-in">
            <button
              type="button"
              onClick={onContinue}
              className={`w-full py-3 px-4 rounded-lg font-bold uppercase tracking-wider transition-all duration-200 ${
                result.type === 'trap'
                  ? 'bg-red-900/40 border border-red-700/50 text-red-200 hover:bg-red-900/60'
                  : result.type === 'piece'
                  ? 'bg-amber-900/40 border border-amber-700/50 text-amber-200 hover:bg-amber-900/60'
                  : 'bg-zinc-800/50 border border-zinc-700/50 text-zinc-200 hover:bg-zinc-700/50'
              }`}
            >
              Continue
            </button>
            <p className="text-xs text-zinc-600 text-center mt-2">Press SPACE or ENTER</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DiceRollResultModal;
