import React from 'react';
import { LocationCard, LocationType } from '../../game/types';
import { getCardDisplayInfo } from '../../game/systems/RegionSystem';
import LocationIcon from '../shared/LocationIcon';
import DangerLevelBar from './DangerLevelBar';
import WealthLevelBar from './WealthLevelBar';
import ActivityIcons from './ActivityIcons';

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
          <LocationIcon
            icon={card.location.icon}
            size="md"
            showMystery={displayInfo.showMystery}
          />
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
            <LocationIcon icon={card.location.icon} size="xl" />
            <p className="text-xs text-zinc-500 mt-2 italic">"{card.location.biome}"</p>
          </div>
        )}

        {/* Mystery overlay effect */}
        {displayInfo.showMystery && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        )}
      </div>

      {/* Stats Bars Section */}
      <div className="px-4 py-3 bg-zinc-900/50 border-t border-zinc-800/50 space-y-2">
        {/* Danger Level Bar */}
        <DangerLevelBar level={displayInfo.dangerLevel} />
        {/* Wealth Level Bar */}
        <WealthLevelBar level={displayInfo.wealthLevel} />
        {/* Min Rooms Display */}
        {displayInfo.minRooms !== null && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-500 flex items-center gap-1">
              <span>🚪</span>
              <span>Rooms</span>
            </span>
            <span className="text-zinc-300 font-medium">{displayInfo.minRooms}+</span>
          </div>
        )}
      </div>

      {/* Activity Icons */}
      <div className="px-4 py-2 bg-zinc-900/30 border-t border-zinc-800/30">
        <ActivityIcons activities={displayInfo.activities} />
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

      {/* Boss/Secret badges */}
      {(displayInfo.isBoss || displayInfo.isSecret) && (
        <div className="px-4 py-1 bg-gradient-to-r from-red-900/30 to-purple-900/30 border-t border-red-800/30">
          <div className="flex items-center gap-2">
            {displayInfo.isBoss && (
              <span className="text-xs text-red-400 font-medium flex items-center gap-1">
                💀 Boss Location
              </span>
            )}
            {displayInfo.isSecret && (
              <span className="text-xs text-purple-400 font-medium flex items-center gap-1">
                🔮 Secret
              </span>
            )}
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

export default LocationCardDisplay;
