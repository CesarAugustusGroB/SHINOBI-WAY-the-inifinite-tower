import React, { useState, useMemo } from 'react';
import {
  Region,
  LocationPath,
  PathType,
} from '../../game/types';
import { getAvailablePaths, getRandomPath, getLocationById } from '../../game/systems/RegionSystem';

interface PathChoiceModalProps {
  region: Region;
  hasIntel: boolean;
  onChoosePath: (path: LocationPath) => void;
  onClose: () => void;
}

const PathChoiceModal: React.FC<PathChoiceModalProps> = ({
  region,
  hasIntel,
  onChoosePath,
  onClose,
}) => {
  const [selectedPathId, setSelectedPathId] = useState<string | null>(null);

  // Get available paths
  const availablePaths = useMemo(() => getAvailablePaths(region), [region]);

  // Get random path (if no intel)
  const randomPath = useMemo(() => getRandomPath(region), [region]);

  // Get selected path
  const selectedPath = useMemo(
    () => selectedPathId ? availablePaths.find(p => p.id === selectedPathId) : null,
    [availablePaths, selectedPathId]
  );

  // Get danger color
  const getDangerColor = (danger: number): string => {
    if (danger <= 2) return 'text-green-400 border-green-500/30 bg-green-900/20';
    if (danger <= 4) return 'text-yellow-400 border-yellow-500/30 bg-yellow-900/20';
    if (danger <= 5) return 'text-orange-400 border-orange-500/30 bg-orange-900/20';
    return 'text-red-400 border-red-500/30 bg-red-900/20';
  };

  // Get path type styling
  const getPathTypeStyle = (type: PathType): { label: string; color: string } => {
    switch (type) {
      case PathType.FORWARD:
        return { label: 'Forward', color: 'bg-blue-900/30 text-blue-400' };
      case PathType.BRANCH:
        return { label: 'Branch', color: 'bg-green-900/30 text-green-400' };
      case PathType.LOOP:
        return { label: 'Loop', color: 'bg-purple-900/30 text-purple-400' };
      case PathType.SECRET:
        return { label: 'Secret', color: 'bg-yellow-900/30 text-yellow-400' };
      default:
        return { label: 'Unknown', color: 'bg-zinc-800 text-zinc-400' };
    }
  };

  // Handle path selection
  const handleSelectPath = (path: LocationPath) => {
    setSelectedPathId(path.id);
  };

  // Handle confirm
  const handleConfirm = () => {
    if (hasIntel && selectedPath) {
      onChoosePath(selectedPath);
    } else if (!hasIntel && randomPath) {
      onChoosePath(randomPath);
    }
  };

  // Handle random selection (when no intel)
  const handleRandomPath = () => {
    if (randomPath) {
      onChoosePath(randomPath);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-2xl bg-zinc-900 border border-zinc-700 rounded-lg overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-zinc-800 bg-zinc-900">
          <h2 className="text-xl font-serif text-zinc-200 tracking-wide">
            {hasIntel ? 'Choose Your Path' : 'Random Destination'}
          </h2>
          <p className="text-sm text-zinc-500 mt-1">
            {hasIntel
              ? 'Your intel reveals multiple paths forward. Choose wisely.'
              : 'Without intel, fate decides your path...'}
          </p>
        </div>

        {/* Path Options */}
        <div className="p-4 space-y-3 max-h-[400px] overflow-y-auto">
          {hasIntel ? (
            // Show all available paths when player has intel
            availablePaths.length > 0 ? (
              availablePaths.map(path => {
                const targetLocation = getLocationById(region, path.targetLocationId);
                if (!targetLocation) return null;

                const pathStyle = getPathTypeStyle(path.pathType);
                const isSelected = selectedPathId === path.id;

                return (
                  <div
                    key={path.id}
                    onClick={() => handleSelectPath(path)}
                    className={`p-4 rounded-lg border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-cyan-500 bg-cyan-950/30 ring-1 ring-cyan-500/30'
                        : 'border-zinc-700 bg-zinc-800/50 hover:border-zinc-600 hover:bg-zinc-800'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      {/* Location icon */}
                      <div className="text-3xl">{targetLocation.icon}</div>

                      {/* Path info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-md font-medium text-zinc-200">
                            {targetLocation.name}
                          </h3>
                          <span className={`text-xs px-2 py-0.5 rounded ${pathStyle.color}`}>
                            {pathStyle.label}
                          </span>
                        </div>
                        <p className="text-sm text-zinc-400 mt-1">
                          {path.description}
                        </p>
                        {path.dangerHint && (
                          <p className="text-xs text-zinc-500 mt-1 italic">
                            "{path.dangerHint}"
                          </p>
                        )}
                      </div>

                      {/* Danger indicator */}
                      <div className={`px-3 py-2 rounded border ${getDangerColor(targetLocation.dangerLevel)}`}>
                        <div className="text-center">
                          <p className="text-xs opacity-70">Danger</p>
                          <p className="text-lg font-bold">{targetLocation.dangerLevel}</p>
                        </div>
                      </div>
                    </div>

                    {/* Location flags */}
                    <div className="flex gap-2 mt-3">
                      {targetLocation.flags.hasMerchant && (
                        <span className="text-xs px-2 py-0.5 bg-amber-900/30 text-amber-400 rounded">
                          🛒 Merchant
                        </span>
                      )}
                      {targetLocation.flags.hasRest && (
                        <span className="text-xs px-2 py-0.5 bg-green-900/30 text-green-400 rounded">
                          ⛺ Rest
                        </span>
                      )}
                      {targetLocation.flags.hasTraining && (
                        <span className="text-xs px-2 py-0.5 bg-blue-900/30 text-blue-400 rounded">
                          💪 Training
                        </span>
                      )}
                      {targetLocation.flags.isBoss && (
                        <span className="text-xs px-2 py-0.5 bg-red-900/30 text-red-400 rounded">
                          👹 Boss
                        </span>
                      )}
                      {path.pathType === PathType.LOOP && (
                        <span className="text-xs px-2 py-0.5 bg-purple-900/30 text-purple-400 rounded">
                          ⚠️ One-time use
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-zinc-500">
                No paths available. The journey ends here...
              </div>
            )
          ) : (
            // Show mystery message when no intel
            <div className="text-center py-8">
              <div className="text-6xl mb-4">🎲</div>
              <h3 className="text-lg text-zinc-300 mb-2">Fate Awaits</h3>
              <p className="text-sm text-zinc-500">
                Without intel from the elite fight, your destination will be chosen at random.
              </p>
              {randomPath && (
                <p className="text-xs text-zinc-600 mt-4">
                  One of {availablePaths.length + 1} possible paths will be selected...
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-900/80 flex justify-between items-center">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-zinc-400 hover:text-zinc-300 transition-colors"
          >
            Cancel
          </button>

          {hasIntel ? (
            <button
              onClick={handleConfirm}
              disabled={!selectedPath}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                selectedPath
                  ? 'bg-cyan-600 hover:bg-cyan-500 text-white'
                  : 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
              }`}
            >
              Travel to {selectedPath ? getLocationById(region, selectedPath.targetLocationId)?.name : '...'}
            </button>
          ) : (
            <button
              onClick={handleRandomPath}
              className="px-6 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-medium transition-colors"
            >
              🎲 Accept Fate
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PathChoiceModal;
