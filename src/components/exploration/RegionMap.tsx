import React, { useEffect, useCallback } from 'react';
import {
  Region,
  Player,
  CharacterStats,
  LocationCard,
  IntelPool,
  LocationType,
} from '../../game/types';
import { getCardDisplayInfo } from '../../game/systems/RegionSystem';

// ============================================================================
// DANGER LEVEL BAR COMPONENT
// ============================================================================

interface DangerLevelBarProps {
  level: number | null;
  showLabel?: boolean;
}

const DangerLevelBar: React.FC<DangerLevelBarProps> = ({ level, showLabel = true }) => {
  const segments = [1, 2, 3, 4, 5, 6, 7];

  const getSegmentColor = (segmentLevel: number, currentLevel: number | null) => {
    if (currentLevel === null) return 'bg-zinc-800';
    if (segmentLevel > currentLevel) return 'bg-zinc-800';

    if (segmentLevel <= 2) return 'bg-emerald-500';
    if (segmentLevel <= 4) return 'bg-yellow-500';
    if (segmentLevel === 5) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className="flex items-center gap-2">
      {showLabel && (
        <span className="text-xs text-zinc-400 uppercase tracking-wider w-14">
          {level !== null ? 'Danger' : '???'}
        </span>
      )}
      <div className="flex gap-0.5 flex-1">
        {segments.map((seg) => (
          <div
            key={seg}
            className={`h-2 flex-1 rounded-sm transition-colors ${getSegmentColor(seg, level)}`}
          />
        ))}
      </div>
      {level !== null && (
        <span className={`text-xs font-mono w-6 text-right ${
          level <= 2 ? 'text-emerald-400' :
          level <= 4 ? 'text-yellow-400' :
          level === 5 ? 'text-orange-400' :
          'text-red-400'
        }`}>
          {level}
        </span>
      )}
    </div>
  );
};

// ============================================================================
// LOCATION CARD COMPONENT (New card-based design)
// ============================================================================

interface LocationCardDisplayProps {
  card: LocationCard;
  isSelected: boolean;
  onClick: () => void;
  cardIndex: number;
}

const LocationCardDisplay: React.FC<LocationCardDisplayProps> = ({
  card,
  isSelected,
  onClick,
  cardIndex,
}) => {
  const displayInfo = getCardDisplayInfo(card);

  // Get location type icon
  const getTypeIcon = (type: LocationType | null): string => {
    if (!type) return '❓';
    switch (type) {
      case LocationType.SETTLEMENT: return '🏘️';
      case LocationType.WILDERNESS: return '🌲';
      case LocationType.STRONGHOLD: return '🏰';
      case LocationType.LANDMARK: return '🗿';
      case LocationType.SECRET: return '🔮';
      case LocationType.BOSS: return '👹';
      default: return '📍';
    }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        relative flex flex-col w-full rounded-xl border-2 transition-all duration-200
        overflow-hidden bg-zinc-900/80 backdrop-blur-sm
        ${isSelected
          ? 'border-cyan-400 ring-2 ring-cyan-500/50 shadow-lg shadow-cyan-500/20 scale-[1.02]'
          : 'border-cyan-600/40 hover:border-cyan-500/60 hover:shadow-md hover:shadow-cyan-500/10'
        }
      `}
    >
      {/* Keyboard shortcut badge */}
      <div className="absolute top-2 left-2 z-10 w-6 h-6 rounded bg-black/70 flex items-center justify-center">
        <span className="text-xs font-mono text-zinc-400">{cardIndex + 1}</span>
      </div>

      {/* Revisit badge */}
      {displayInfo.revisitBadge && (
        <div className="absolute top-2 right-2 z-10 px-2 py-0.5 rounded bg-amber-900/80 border border-amber-600/50">
          <span className="text-[10px] font-medium text-amber-300 uppercase tracking-wider">Revisit</span>
        </div>
      )}

      {/* Title Bar */}
      <div className={`
        px-4 py-3 border-b border-zinc-800/50
        ${displayInfo.showMystery
          ? 'bg-gradient-to-r from-zinc-800/80 to-zinc-900/80'
          : 'bg-gradient-to-r from-cyan-900/30 to-blue-900/30'
        }
      `}>
        <div className="flex items-center gap-2">
          <span className="text-2xl filter drop-shadow-md">
            {displayInfo.showMystery ? '❓' : card.location.icon}
          </span>
          <div className="flex-1 text-left">
            <h3 className={`font-medium ${displayInfo.showMystery ? 'text-zinc-400' : 'text-zinc-100'}`}>
              {displayInfo.name}
            </h3>
            <p className="text-xs text-zinc-500 flex items-center gap-1">
              <span>{getTypeIcon(displayInfo.locationType)}</span>
              <span>{displayInfo.subtitle}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Image Area (Placeholder) */}
      <div className={`
        relative h-32 flex items-center justify-center
        ${displayInfo.showMystery
          ? 'bg-gradient-to-b from-zinc-800/50 to-zinc-900/50'
          : 'bg-gradient-to-b from-blue-950/30 to-cyan-950/30'
        }
      `}>
        {displayInfo.showMystery ? (
          <div className="text-center">
            <span className="text-5xl opacity-30">❓</span>
            <p className="text-xs text-zinc-600 mt-2">Unknown Territory</p>
          </div>
        ) : (
          <div className="text-center">
            <span className="text-6xl filter drop-shadow-lg">{card.location.icon}</span>
            <p className="text-xs text-zinc-500 mt-2 italic">"{card.location.biome}"</p>
          </div>
        )}

        {/* Mystery overlay effect */}
        {displayInfo.showMystery && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        )}
      </div>

      {/* Danger Level Bar */}
      <div className="px-4 py-3 bg-zinc-900/50 border-t border-zinc-800/50">
        <DangerLevelBar level={displayInfo.dangerLevel} />
      </div>

      {/* Special Feature (only at FULL intel) */}
      {displayInfo.specialFeature && (
        <div className="px-4 py-2 bg-gradient-to-r from-amber-900/20 to-orange-900/20 border-t border-amber-800/30">
          <div className="flex items-center gap-2">
            <span className="text-amber-400 text-sm">★</span>
            <span className="text-xs text-amber-300 font-medium">{displayInfo.specialFeature}</span>
          </div>
        </div>
      )}

      {/* Selected indicator glow */}
      {isSelected && (
        <div className="absolute inset-0 pointer-events-none border-2 border-cyan-400/50 rounded-xl animate-pulse" />
      )}
    </button>
  );
};

// ============================================================================
// INTEL POOL DISPLAY COMPONENT
// ============================================================================

interface IntelPoolDisplayProps {
  intelPool: IntelPool;
}

const IntelPoolDisplay: React.FC<IntelPoolDisplayProps> = ({ intelPool }) => {
  const fillPercent = (intelPool.totalIntel / intelPool.maxIntel) * 100;

  return (
    <div className="flex items-center gap-2">
      <span className="text-amber-400">🔮</span>
      <div className="flex-1">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-zinc-400">Intel</span>
          <span className="font-mono text-zinc-300">{intelPool.totalIntel}/{intelPool.maxIntel}</span>
        </div>
        <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-600 to-amber-400 transition-all duration-500"
            style={{ width: `${fillPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// MAIN REGION MAP COMPONENT
// ============================================================================

interface RegionMapProps {
  region: Region;
  player: Player;
  playerStats: CharacterStats;
  intelPool: IntelPool;
  drawnCards: LocationCard[];
  selectedIndex: number | null;
  onCardSelect: (index: number) => void;
  onEnterLocation: () => void;
}

const RegionMap: React.FC<RegionMapProps> = ({
  region,
  // player and playerStats kept in interface for future use
  intelPool,
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

          {/* Intel Pool */}
          <div className="w-32">
            <IntelPoolDisplay intelPool={intelPool} />
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
