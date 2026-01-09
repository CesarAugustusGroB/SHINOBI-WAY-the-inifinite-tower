import React from 'react';
import './exploration.css';

interface LocationPanelProps {
  locationName: string;
  dangerLevel: number;
  regionName: string;
  storyArcLabel: string;
  backgroundImage?: string;
}

const LocationPanel: React.FC<LocationPanelProps> = ({
  locationName,
  dangerLevel,
  regionName,
  storyArcLabel,
  backgroundImage,
}) => {
  // Get danger modifier class based on level
  const getDangerModifier = (level: number): string => {
    if (level <= 2) return 'location-panel__danger--safe';
    if (level <= 4) return 'location-panel__danger--medium';
    if (level <= 5) return 'location-panel__danger--high';
    return 'location-panel__danger--extreme';
  };

  return (
    <div 
      className="location-panel"
      style={backgroundImage ? { 
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      } : undefined}
    >
      <div className="location-panel__content">
        <div className="location-panel__header">
          <div className="location-panel__arc">
            {storyArcLabel}
          </div>
          <div className={`location-panel__danger ${getDangerModifier(dangerLevel)}`}>
            <span className="location-panel__danger-label">Danger</span>
            <span className="location-panel__danger-value">
              {dangerLevel}
            </span>
          </div>
        </div>
        <div className="location-panel__name">
          {locationName}
        </div>
        <div className="location-panel__region">
          {regionName}
        </div>
      </div>
    </div>
  );
};

export default LocationPanel;
