import React, { useEffect, useCallback } from 'react';
import {
  Region,
  Player,
  CharacterStats,
  LocationCard,
} from '../../game/types';
import { getCardDisplayInfo } from '../../game/systems/RegionSystem';
import LocationCardDisplay from './LocationCardDisplay';
import './exploration.css';

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

  // Get arc-based modifier
  const getArcModifier = (): string => {
    switch (region.arc) {
      case 'WAVES_ARC': return 'region-map--waves';
      case 'EXAMS_ARC': return 'region-map--exams';
      case 'ROGUE_ARC': return 'region-map--rogue';
      case 'WAR_ARC': return 'region-map--war';
      default: return 'region-map--default';
    }
  };

  // Progress calculation
  const progressPercent = region.totalLocations > 0
    ? Math.round((region.locationsCompleted / region.totalLocations) * 100)
    : 0;

  const selectedCard = selectedIndex !== null ? drawnCards[selectedIndex] : null;

  return (
    <div className={`region-map ${getArcModifier()}`}>
      {/* Header */}
      <div className="region-map__header">
        <div className="region-map__header-content">
          {/* Region Title with decorative flourish */}
          <div className="region-map__title-section">
            <div className="region-map__flourish">
              <span className="region-map__flourish-line">━━━━</span>
              <span className="region-map__flourish-icon">✦</span>
              <span className="region-map__flourish-line">━━━━</span>
            </div>
            <h2 className="region-map__title">
              {region.name}
            </h2>
            <p className="region-map__theme">
              {region.theme}
            </p>
          </div>
        </div>
      </div>

      {/* Card Selection Area */}
      <div className="region-map__cards">
        {/* Cards Container */}
        <div className="region-map__cards-grid">
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
            <div key={`placeholder-${i}`} className="region-map__placeholder">
              <span className="region-map__placeholder-text">No card</span>
            </div>
          ))}
        </div>

        {/* Enter Location Button */}
        <div className="region-map__enter-section">
          <button
            type="button"
            onClick={onEnterLocation}
            disabled={selectedIndex === null}
            className={`region-map__enter-btn ${selectedIndex !== null ? 'region-map__enter-btn--active' : 'region-map__enter-btn--disabled'}`}
          >
            {/* Glow effect */}
            {selectedIndex !== null && (
              <div className="region-map__enter-glow" />
            )}
            <span className="region-map__enter-text">Enter Location</span>
          </button>
        </div>

        {/* Selected card preview info */}
        {selectedCard && (
          <div className="region-map__preview">
            <p className="region-map__preview-text">
              {selectedCard.isRevisit
                ? 'Revisiting this location (reduced rewards)'
                : `Ready to explore ${getCardDisplayInfo(selectedCard).name}`
              }
            </p>
          </div>
        )}
      </div>

      {/* Footer - Progress & Instructions */}
      <div className="region-map__footer">
        {/* Progress */}
        <div className="region-map__progress">
          <span className="region-map__progress-label">Region Progress:</span>
          <div className="region-map__progress-bar-container">
            <div className="region-map__progress-bar">
              <div
                className="region-map__progress-fill"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="region-map__progress-value">{progressPercent}%</span>
          </div>
          <span className="region-map__progress-count">
            ({region.locationsCompleted}/{region.totalLocations})
          </span>
        </div>

        {/* Instructions */}
        <div className="region-map__instructions">
          <span className="region-map__key">1-3</span> select card •
          <span className="region-map__key"> SPACE</span> or <span className="region-map__key">ENTER</span> to enter
        </div>
      </div>
    </div>
  );
};

export default RegionMap;
