import React, { useEffect, useCallback } from 'react';
import {
  Region,
  Player,
  CharacterStats,
  LocationCard,
} from '../../game/types';
import { getCardDisplayInfo } from '../../game/systems/RegionSystem';
import LocationCardDisplay from './LocationCardDisplay';

// ============================================================================
// MAIN REGION MAP COMPONENT
// ============================================================================

interface RegionMapProps {
  region: Region;
  player: Player;
  playerStats: CharacterStats;
  drawnCards: LocationCard[];
  selectedIndex: number | null;
  onCardSelect: (index: number) => void;
  onEnterLocation: () => void;
}

const RegionMap: React.FC<RegionMapProps> = ({
  region,
  // player and playerStats kept in interface for future use
  drawnCards,
  selectedIndex,
  onCardSelect,
  onEnterLocation,
}) => {
  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

    // Number keys 1-3 to select cards
    if (e.code === 'Digit1' || e.code === 'Numpad1') {
      e.preventDefault();
      if (drawnCards.length >= 1) onCardSelect(0);
    } else if (e.code === 'Digit2' || e.code === 'Numpad2') {
      e.preventDefault();
      if (drawnCards.length >= 2) onCardSelect(1);
    } else if (e.code === 'Digit3' || e.code === 'Numpad3') {
      e.preventDefault();
      if (drawnCards.length >= 3) onCardSelect(2);
    }

    // Space/Enter to enter selected location
    if ((e.code === 'Space' || e.code === 'Enter') && selectedIndex !== null) {
      e.preventDefault();
      onEnterLocation();
    }
  }, [drawnCards, selectedIndex, onCardSelect, onEnterLocation]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Get arc-based styling
  const getArcStyle = () => {
    switch (region.arc) {
      case 'WAVES_ARC':
        return {
          gradient: 'from-slate-950 via-blue-950/70 to-slate-950',
          accent: 'cyan',
          headerBg: 'bg-blue-950/50',
        };
      case 'EXAMS_ARC':
        return {
          gradient: 'from-slate-950 via-emerald-950/70 to-slate-950',
          accent: 'emerald',
          headerBg: 'bg-emerald-950/50',
        };
      case 'ROGUE_ARC':
        return {
          gradient: 'from-slate-950 via-orange-950/70 to-slate-950',
          accent: 'orange',
          headerBg: 'bg-orange-950/50',
        };
      case 'WAR_ARC':
        return {
          gradient: 'from-slate-950 via-red-950/70 to-slate-950',
          accent: 'red',
          headerBg: 'bg-red-950/50',
        };
      default:
        return {
          gradient: 'from-slate-950 via-zinc-900 to-slate-950',
          accent: 'zinc',
          headerBg: 'bg-zinc-900/50',
        };
    }
  };

  const arcStyle = getArcStyle();

  // Progress calculation
  const progressPercent = region.totalLocations > 0
    ? Math.round((region.locationsCompleted / region.totalLocations) * 100)
    : 0;

  const selectedCard = selectedIndex !== null ? drawnCards[selectedIndex] : null;

  return (
    <div
      className={`w-full max-w-5xl mx-auto h-full flex flex-col bg-gradient-to-br ${arcStyle.gradient} rounded-lg border border-zinc-800 overflow-hidden shadow-2xl`}
    >
      {/* Header */}
      <div className={`p-4 border-b border-zinc-800 ${arcStyle.headerBg} backdrop-blur-sm`}>
        <div className="flex justify-between items-center">
          {/* Region Title with decorative flourish */}
          <div className="text-center flex-1">
            <div className="flex items-center justify-center gap-2 mb-1">
              <span className="text-zinc-600">━━━━</span>
              <span className="text-zinc-500 text-xl">✦</span>
              <span className="text-zinc-600">━━━━</span>
            </div>
            <h2 className="text-2xl font-serif text-zinc-100 tracking-[0.2em] uppercase">
              {region.name}
            </h2>
            <p className="text-xs text-zinc-500 mt-1 italic">
              {region.theme}
            </p>
          </div>

        </div>
      </div>

      {/* Card Selection Area */}
      <div className="flex-1 p-6 flex flex-col justify-center">
        {/* Cards Container */}
        <div className="grid grid-cols-3 gap-4 max-w-4xl mx-auto w-full">
          {drawnCards.map((card, index) => (
            <LocationCardDisplay
              key={`${card.locationId}-${index}`}
              card={card}
              isSelected={selectedIndex === index}
              onClick={() => onCardSelect(index)}
              cardIndex={index}
            />
          ))}

          {/* Placeholder for missing cards */}
          {drawnCards.length < 3 && Array.from({ length: 3 - drawnCards.length }).map((_, i) => (
            <div
              key={`placeholder-${i}`}
              className="rounded-xl border-2 border-dashed border-zinc-800 bg-zinc-900/30 h-64 flex items-center justify-center"
            >
              <span className="text-zinc-700 text-lg">No card</span>
            </div>
          ))}
        </div>

        {/* Enter Location Button */}
        <div className="mt-8 flex justify-center">
          <button
            type="button"
            onClick={onEnterLocation}
            disabled={selectedIndex === null}
            className={`
              relative px-8 py-3 rounded-xl text-lg font-medium uppercase tracking-wider
              transition-all duration-200
              ${selectedIndex !== null
                ? 'bg-gradient-to-r from-cyan-600 to-cyan-500 text-white shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 hover:scale-105'
                : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
              }
            `}
          >
            {/* Glow effect */}
            {selectedIndex !== null && (
              <div className="absolute inset-0 rounded-xl bg-cyan-400/20 blur-md animate-pulse" />
            )}
            <span className="relative z-10">Enter Location</span>
          </button>
        </div>

        {/* Selected card preview info */}
        {selectedCard && (
          <div className="mt-4 text-center">
            <p className="text-sm text-zinc-400">
              {selectedCard.isRevisit
                ? 'Revisiting this location (reduced rewards)'
                : `Ready to explore ${getCardDisplayInfo(selectedCard).name}`
              }
            </p>
          </div>
        )}
      </div>

      {/* Footer - Progress & Instructions */}
      <div className="px-4 py-3 border-t border-zinc-800/50 bg-black/50 flex items-center justify-between">
        {/* Progress */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-zinc-500">Region Progress:</span>
          <div className="flex items-center gap-2">
            <div className="w-24 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-cyan-500 transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="text-xs font-mono text-zinc-400">{progressPercent}%</span>
          </div>
          <span className="text-xs text-zinc-600">
            ({region.locationsCompleted}/{region.totalLocations})
          </span>
        </div>

        {/* Instructions */}
        <div className="text-xs text-zinc-500">
          <span className="text-zinc-400">1-3</span> select card •
          <span className="text-zinc-400 ml-1">SPACE</span> or <span className="text-zinc-400">ENTER</span> to enter
        </div>
      </div>
    </div>
  );
};

export default RegionMap;
