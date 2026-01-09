import React from 'react';
import { LocationCard, LocationType } from '../../game/types';
import { getCardDisplayInfo } from '../../game/systems/RegionSystem';
import LocationIcon from '../shared/LocationIcon';
import DangerLevelBar from './DangerLevelBar';
import WealthLevelBar from './WealthLevelBar';
import ActivityIcons from './ActivityIcons';
import './exploration.css';

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

  // Build card classes
  const cardClasses = [
    'location-card',
    isSelected ? 'location-card--selected' : 'location-card--default',
  ].join(' ');

  return (
    <button
      type="button"
      onClick={onClick}
      className={cardClasses}
    >
      {/* Keyboard shortcut badge */}
      <div className="location-card__shortcut">
        <span className="location-card__shortcut-text">{cardIndex + 1}</span>
      </div>

      {/* Revisit badge */}
      {displayInfo.revisitBadge && (
        <div className="location-card__revisit-badge">
          <span className="location-card__revisit-text">Revisit</span>
        </div>
      )}

      {/* Title Bar */}
      <div className={`location-card__header ${displayInfo.showMystery ? 'location-card__header--mystery' : 'location-card__header--revealed'}`}>
        <div className="location-card__header-content">
          <LocationIcon
            icon={card.location.icon}
            size="md"
            showMystery={displayInfo.showMystery}
          />
          <div className="location-card__header-text">
            <h3 className={`location-card__title ${displayInfo.showMystery ? 'location-card__title--mystery' : 'location-card__title--revealed'}`}>
              {displayInfo.name}
            </h3>
            <p className="location-card__subtitle">
              <span>{getTypeIcon(displayInfo.locationType)}</span>
              <span>{displayInfo.subtitle}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Image Area (Placeholder) */}
      <div className={`location-card__image ${displayInfo.showMystery ? 'location-card__image--mystery' : 'location-card__image--revealed'}`}>
        {displayInfo.showMystery ? (
          <div className="location-card__image-content">
            <span className="location-card__image-icon">❓</span>
            <p className="location-card__image-text">Unknown Territory</p>
          </div>
        ) : (
          <div className="location-card__image-content">
            <LocationIcon icon={card.location.icon} size="xl" />
            <p className="location-card__image-biome">"{card.location.biome}"</p>
          </div>
        )}

        {/* Mystery overlay effect */}
        {displayInfo.showMystery && (
          <div className="location-card__image-overlay" />
        )}
      </div>

      {/* Stats Bars Section */}
      <div className="location-card__stats">
        <DangerLevelBar level={displayInfo.dangerLevel} />
        <WealthLevelBar level={displayInfo.wealthLevel} />
        {displayInfo.minRooms !== null && (
          <div className="location-card__rooms">
            <span className="location-card__rooms-label">
              <span>🚪</span>
              <span>Rooms</span>
            </span>
            <span className="location-card__rooms-value">{displayInfo.minRooms}+</span>
          </div>
        )}
      </div>

      {/* Activity Icons */}
      <div className="location-card__activities">
        <ActivityIcons activities={displayInfo.activities} />
      </div>

      {/* Special Feature (only at FULL intel) */}
      {displayInfo.specialFeature && (
        <div className="location-card__feature">
          <span className="location-card__feature-icon">★</span>
          <span className="location-card__feature-text">{displayInfo.specialFeature}</span>
        </div>
      )}

      {/* Boss/Secret badges */}
      {(displayInfo.isBoss || displayInfo.isSecret) && (
        <div className="location-card__badges">
          {displayInfo.isBoss && (
            <span className="location-card__badge location-card__badge--boss">
              💀 Boss Location
            </span>
          )}
          {displayInfo.isSecret && (
            <span className="location-card__badge location-card__badge--secret">
              🔮 Secret
            </span>
          )}
        </div>
      )}

      {/* Selected indicator glow */}
      {isSelected && (
        <div className="location-card__selection-glow" />
      )}
    </button>
  );
};

export default LocationCardDisplay;
