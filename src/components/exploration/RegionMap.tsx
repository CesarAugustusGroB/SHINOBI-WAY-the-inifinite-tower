import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Region,
  Location,
  LocationPath,
  PathType,
  Player,
  CharacterStats,
  LocationType,
} from '../../game/types';
import LocationCard from './LocationCard';
import { getAccessibleLocations, getDiscoveredLocations } from '../../game/systems/RegionSystem';

interface RegionMapProps {
  region: Region;
  player: Player;
  playerStats: CharacterStats;
  onLocationSelect: (location: Location) => void;
  onEnterLocation: (location: Location) => void;
}

const RegionMap: React.FC<RegionMapProps> = ({
  region,
  player,
  playerStats,
  onLocationSelect,
  onEnterLocation,
}) => {
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);

  // Get locations by state
  const discoveredLocations = useMemo(() => getDiscoveredLocations(region), [region]);
  const accessibleLocations = useMemo(() => getAccessibleLocations(region), [region]);

  // Get selected location
  const selectedLocation = useMemo(
    () => selectedLocationId ? region.locations.find(l => l.id === selectedLocationId) : null,
    [region.locations, selectedLocationId]
  );

  // Handle location click
  const handleLocationClick = (location: Location) => {
    setSelectedLocationId(location.id);
    onLocationSelect(location);
  };

  // Handle enter button
  const handleEnterLocation = useCallback(() => {
    if (selectedLocation && selectedLocation.isAccessible && !selectedLocation.isCompleted) {
      onEnterLocation(selectedLocation);
    }
  }, [selectedLocation, onEnterLocation]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      // Number keys to select accessible locations
      if (e.code.startsWith('Digit')) {
        const index = parseInt(e.code.replace('Digit', '')) - 1;
        if (index >= 0 && index < accessibleLocations.length) {
          e.preventDefault();
          const loc = accessibleLocations[index];
          setSelectedLocationId(loc.id);
          onLocationSelect(loc);
        }
        return;
      }

      // Space/Enter to enter selected location
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        handleEnterLocation();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [accessibleLocations, selectedLocation, handleEnterLocation, onLocationSelect]);

  // Group locations by column (danger level progression)
  const locationsByColumn = useMemo(() => {
    const columns: Record<string, Location[]> = {
      entry: [],
      early: [],
      mid: [],
      late: [],
      boss: [],
    };

    region.locations.forEach(loc => {
      // Boss flag or danger 7 goes to boss column
      if (loc.flags.isBoss || loc.dangerLevel === 7) columns.boss.push(loc);
      // Danger 5-6 goes to late column
      else if (loc.dangerLevel >= 5) columns.late.push(loc);
      // Danger 4 goes to mid column
      else if (loc.dangerLevel === 4) columns.mid.push(loc);
      // Danger 3 goes to early column
      else if (loc.dangerLevel === 3) columns.early.push(loc);
      // Danger 1-2 goes to entry column
      else columns.entry.push(loc);
    });

    return columns;
  }, [region.locations]);

  // Get path connections for visualization
  const getPathsFromLocation = (locationId: string): LocationPath[] => {
    const location = region.locations.find(l => l.id === locationId);
    if (!location) return [];

    const allPathIds = [
      ...location.forwardPaths,
      ...(location.loopPaths || []),
      ...(location.secretPaths || []),
    ];

    return region.paths.filter(p => allPathIds.includes(p.id) && p.isRevealed);
  };

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

  // Get location type icon
  const getTypeIcon = (type: LocationType): string => {
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

  // Progress calculation
  const progressPercent = Math.round((region.locationsCompleted / region.totalLocations) * 100);

  // Column headers config
  const columnConfig = [
    { key: 'entry', label: 'Entry', dangerRange: '1-2', color: 'text-green-400', borderColor: 'border-green-800/50' },
    { key: 'early', label: 'Early', dangerRange: '3', color: 'text-lime-400', borderColor: 'border-lime-800/50' },
    { key: 'mid', label: 'Mid', dangerRange: '4', color: 'text-yellow-400', borderColor: 'border-yellow-800/50' },
    { key: 'late', label: 'Late', dangerRange: '5-6', color: 'text-orange-400', borderColor: 'border-orange-800/50' },
    { key: 'boss', label: 'Boss', dangerRange: '7', color: 'text-red-500', borderColor: 'border-red-800/50' },
  ];

  return (
    <div
      className={`w-full max-w-6xl mx-auto h-full flex flex-col bg-gradient-to-br ${arcStyle.gradient} rounded-lg border border-zinc-800 overflow-hidden shadow-2xl`}
    >
      {/* Header */}
      <div className={`p-4 border-b border-zinc-800 ${arcStyle.headerBg} backdrop-blur-sm`}>
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-3">
              <div className="text-3xl filter drop-shadow-lg">🗺️</div>
              <div>
                <h2 className="text-xl font-serif text-zinc-100 tracking-[0.15em] uppercase">
                  {region.name}
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  {region.biome}
                </p>
              </div>
            </div>
            <p className="text-xs text-zinc-500 mt-2 max-w-md italic">
              "{region.theme}"
            </p>
          </div>

          <div className="text-right">
            {/* Progress section */}
            <div className="flex items-center gap-3 mb-2">
              <div className="text-right">
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Journey Progress</p>
                <p className="text-lg font-mono text-zinc-200">
                  {region.locationsCompleted} <span className="text-zinc-600">/</span> {region.totalLocations}
                </p>
              </div>
              <div className="w-16 h-16 relative">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="32" cy="32" r="28"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                    className="text-zinc-800"
                  />
                  <circle
                    cx="32" cy="32" r="28"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeDasharray={`${progressPercent * 1.76} 176`}
                    className="text-cyan-500 transition-all duration-500"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-mono text-zinc-300">{progressPercent}%</span>
                </div>
              </div>
            </div>

            {/* Intel status */}
            <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs ${
              region.hasIntel
                ? 'bg-amber-900/40 text-amber-300 border border-amber-700/50'
                : 'bg-zinc-800/50 text-zinc-500 border border-zinc-700/50'
            }`}>
              {region.hasIntel ? '🔮' : '⚪'}
              <span>{region.hasIntel ? 'Intel Available' : 'No Intel'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Region Map Content */}
      <div className="flex-1 overflow-auto p-4">
        {/* Column Layout */}
        <div className="grid grid-cols-5 gap-3 min-h-[350px]">
          {columnConfig.map(({ key, label, dangerRange, color, borderColor }) => (
            <div key={key} className="flex flex-col">
              {/* Column Header */}
              <div className={`mb-3 pb-2 border-b ${borderColor}`}>
                <div className="flex items-center justify-between">
                  <h3 className={`text-xs font-medium uppercase tracking-wider ${color}`}>
                    {label}
                  </h3>
                  <span className="text-[10px] text-zinc-600 font-mono">
                    ★{dangerRange}
                  </span>
                </div>
              </div>

              {/* Location Cards */}
              <div className="space-y-2 flex-1">
                {locationsByColumn[key]
                  .filter(l => l.isDiscovered)
                  .map((location, idx) => (
                    <LocationCard
                      key={location.id}
                      location={location}
                      isSelected={selectedLocationId === location.id}
                      isCurrent={location.isCurrent}
                      onClick={() => handleLocationClick(location)}
                      compact={locationsByColumn[key].length > 3}
                    />
                  ))}

                {/* Undiscovered placeholder */}
                {locationsByColumn[key].filter(l => !l.isDiscovered).length > 0 && (
                  <div className="p-3 rounded-lg border border-dashed border-zinc-800 bg-zinc-900/30 text-center">
                    <span className="text-zinc-700 text-lg">?</span>
                    <p className="text-[10px] text-zinc-700 mt-1">
                      {locationsByColumn[key].filter(l => !l.isDiscovered).length} hidden
                    </p>
                  </div>
                )}

                {/* Empty column placeholder */}
                {locationsByColumn[key].length === 0 && (
                  <div className="flex-1 flex items-center justify-center">
                    <span className="text-zinc-800 text-xs">—</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Selected Location Panel */}
      {selectedLocation && (
        <div className="border-t border-zinc-800 bg-black/70 backdrop-blur-sm p-4">
          <div className="flex items-start gap-4">
            {/* Location Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <span className="text-4xl filter drop-shadow-lg">{selectedLocation.icon}</span>
                  <span className="absolute -bottom-1 -right-1 text-sm">
                    {getTypeIcon(selectedLocation.type)}
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-zinc-100">
                    {selectedLocation.name}
                  </h3>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-zinc-500">{selectedLocation.biome}</span>
                    <span className="text-zinc-700">•</span>
                    <span className={`font-medium ${
                      selectedLocation.dangerLevel <= 2 ? 'text-green-400' :
                      selectedLocation.dangerLevel <= 4 ? 'text-yellow-400' :
                      selectedLocation.dangerLevel <= 5 ? 'text-orange-400' :
                      'text-red-400'
                    }`}>
                      Danger {selectedLocation.dangerLevel}
                    </span>
                  </div>
                </div>
              </div>
              <p className="text-sm text-zinc-400 mt-2 line-clamp-2">
                {selectedLocation.description}
              </p>

              {/* Location features */}
              <div className="flex flex-wrap gap-2 mt-3">
                {selectedLocation.flags.hasMerchant && (
                  <span className="text-xs px-2 py-1 bg-amber-900/30 text-amber-300 rounded-lg border border-amber-800/50">
                    🛒 Merchant
                  </span>
                )}
                {selectedLocation.flags.hasRest && (
                  <span className="text-xs px-2 py-1 bg-green-900/30 text-green-300 rounded-lg border border-green-800/50">
                    ⛺ Rest Point
                  </span>
                )}
                {selectedLocation.flags.hasTraining && (
                  <span className="text-xs px-2 py-1 bg-blue-900/30 text-blue-300 rounded-lg border border-blue-800/50">
                    ⚔️ Training
                  </span>
                )}
                {selectedLocation.flags.isSecret && (
                  <span className="text-xs px-2 py-1 bg-purple-900/30 text-purple-300 rounded-lg border border-purple-800/50">
                    🔮 Secret
                  </span>
                )}
                {selectedLocation.flags.isBoss && (
                  <span className="text-xs px-2 py-1 bg-red-900/30 text-red-300 rounded-lg border border-red-800/50">
                    👹 Region Boss
                  </span>
                )}
              </div>

              {/* Available Paths */}
              {selectedLocation.isCompleted && getPathsFromLocation(selectedLocation.id).length > 0 && (
                <div className="mt-3 pt-3 border-t border-zinc-800">
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-2">Revealed Paths</p>
                  <div className="flex flex-wrap gap-2">
                    {getPathsFromLocation(selectedLocation.id).map(path => {
                      const targetLoc = region.locations.find(l => l.id === path.targetLocationId);
                      return (
                        <span
                          key={path.id}
                          className={`text-xs px-2 py-1 rounded-lg border ${
                            path.pathType === PathType.LOOP
                              ? 'bg-purple-900/30 text-purple-300 border-purple-800/50'
                              : path.pathType === PathType.SECRET
                              ? 'bg-yellow-900/30 text-yellow-300 border-yellow-800/50'
                              : 'bg-zinc-800/50 text-zinc-300 border-zinc-700/50'
                          }`}
                        >
                          → {targetLoc?.name || 'Unknown'}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Action Button */}
            <div className="flex-shrink-0">
              {selectedLocation.isAccessible && !selectedLocation.isCompleted ? (
                <button
                  type="button"
                  onClick={handleEnterLocation}
                  className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white rounded-lg font-medium transition-all shadow-lg shadow-cyan-900/50"
                >
                  Enter Location
                </button>
              ) : selectedLocation.isCompleted ? (
                <span className="px-4 py-2 bg-green-900/30 text-green-400 rounded-lg text-sm border border-green-800/50 flex items-center gap-2">
                  <span>✓</span> Completed
                </span>
              ) : (
                <span className="px-4 py-2 bg-zinc-800/50 text-zinc-500 rounded-lg text-sm border border-zinc-700/50 flex items-center gap-2">
                  <span>🔒</span> Locked
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="px-4 py-2 border-t border-zinc-800/50 bg-zinc-900/80">
        <p className="text-[10px] text-zinc-500 text-center">
          Click to select • <span className="text-zinc-400">SPACE</span> or <span className="text-zinc-400">ENTER</span> to enter • <span className="text-zinc-400">1-9</span> quick select
        </p>
      </div>
    </div>
  );
};

export default RegionMap;
