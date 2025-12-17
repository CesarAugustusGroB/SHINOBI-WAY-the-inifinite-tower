import React from 'react';
import { Location } from '../../game/types';
import LocationIcon from '../shared/LocationIcon';
import {
  getDangerTextColor,
  getDangerBgColor,
  getDangerDotColor,
  getLocationTypeLabel,
  getLocationTypeColor,
} from '../../utils/colorHelpers';

interface LocationCardProps {
  location: Location;
  isSelected: boolean;
  isCurrent: boolean;
  onClick: () => void;
  compact?: boolean;
}

const LocationCard: React.FC<LocationCardProps> = ({
  location,
  isSelected,
  isCurrent,
  onClick,
  compact = false,
}) => {
  // Determine card state
  const isAccessible = location.isAccessible && !location.isCompleted;
  const isCompleted = location.isCompleted;
  const isLocked = !location.isAccessible && !location.isDiscovered;
  const isDiscoveredLocked = location.isDiscovered && !location.isAccessible;

  // Card border and background
  let cardClasses = 'relative rounded-lg border transition-all duration-200 cursor-pointer ';

  if (isCurrent) {
    cardClasses += 'border-cyan-500 bg-cyan-950/40 ring-2 ring-cyan-500/50 ';
  } else if (isSelected) {
    cardClasses += 'border-amber-500 bg-amber-950/30 ring-1 ring-amber-500/30 ';
  } else if (isCompleted) {
    cardClasses += 'border-zinc-700 bg-zinc-900/50 opacity-60 ';
  } else if (isAccessible) {
    cardClasses += 'border-zinc-600 bg-zinc-800/50 hover:border-zinc-500 hover:bg-zinc-800/70 ';
  } else if (isDiscoveredLocked) {
    cardClasses += 'border-zinc-700 bg-zinc-900/30 opacity-50 ';
  } else {
    cardClasses += 'border-zinc-800 bg-zinc-950/50 opacity-30 ';
  }

  if (compact) {
    return (
      <div
        className={cardClasses + 'p-2 min-w-[80px]'}
        onClick={onClick}
      >
        <div className="text-center">
          <LocationIcon icon={location.icon} size="md" />
          <p className="text-xs text-zinc-300 truncate mt-1">{location.name}</p>
          <span className={`text-[10px] ${getDangerTextColor(location.dangerLevel)}`}>
            ★{location.dangerLevel}
          </span>
        </div>
        {isCompleted && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-lg">
            <span className="text-green-500 text-lg">✓</span>
          </div>
        )}
        {isCurrent && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-cyan-500 rounded-full animate-pulse" />
        )}
      </div>
    );
  }

  return (
    <div
      className={cardClasses + 'p-3'}
      onClick={onClick}
    >
      {/* Icon and Name */}
      <div className="flex items-start gap-3">
        <div className={isCompleted ? 'grayscale' : ''}>
          <LocationIcon icon={location.icon} size="lg" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-zinc-200 truncate">
            {location.name}
          </h3>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={`text-xs ${getLocationTypeColor(location.type)}`}>
              {getLocationTypeLabel(location.type)}
            </span>
            <span className="text-zinc-600">•</span>
            <span className={`text-xs ${getDangerTextColor(location.dangerLevel)}`}>
              Danger {location.dangerLevel}
            </span>
          </div>
        </div>
      </div>

      {/* Danger indicator */}
      <div className={`mt-2 px-2 py-1 rounded ${getDangerBgColor(location.dangerLevel)}`}>
        <div className="flex items-center justify-between">
          <span className="text-xs text-zinc-400">Danger Level</span>
          <div className="flex gap-0.5">
            {Array.from({ length: 7 }).map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-sm ${
                  i < location.dangerLevel
                    ? getDangerDotColor(location.dangerLevel)
                    : 'bg-zinc-700'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Flags */}
      <div className="flex gap-1 mt-2">
        {location.flags.hasMerchant && (
          <span className="text-xs px-1.5 py-0.5 bg-amber-900/30 text-amber-400 rounded">🛒</span>
        )}
        {location.flags.hasRest && (
          <span className="text-xs px-1.5 py-0.5 bg-green-900/30 text-green-400 rounded">⛺</span>
        )}
        {location.flags.hasTraining && (
          <span className="text-xs px-1.5 py-0.5 bg-blue-900/30 text-blue-400 rounded">⚔️</span>
        )}
        {location.flags.isBoss && (
          <span className="text-xs px-1.5 py-0.5 bg-red-900/30 text-red-400 rounded">👹</span>
        )}
        {location.flags.isSecret && (
          <span className="text-xs px-1.5 py-0.5 bg-purple-900/30 text-purple-400 rounded">🔮</span>
        )}
      </div>

      {/* Status indicators */}
      {isCompleted && (
        <div className="absolute top-2 right-2">
          <span className="text-green-500 text-lg">✓</span>
        </div>
      )}
      {isCurrent && (
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-cyan-500 rounded-full animate-pulse flex items-center justify-center">
          <span className="text-[8px] text-white">●</span>
        </div>
      )}
      {isLocked && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-lg">
          <span className="text-zinc-500 text-xl">🔒</span>
        </div>
      )}
    </div>
  );
};

export default LocationCard;
