import React, { useState } from 'react';
import { LocationIcon as LocationIconType, LocationIconAsset } from '../../game/types';

// ============================================================================
// SIZE CONFIGURATIONS
// ============================================================================

const SIZE_CONFIG = {
  sm: { text: 'text-lg', img: 'w-5 h-5' },      // 20px
  md: { text: 'text-2xl', img: 'w-8 h-8' },     // 32px
  lg: { text: 'text-4xl', img: 'w-12 h-12' },   // 48px
  xl: { text: 'text-6xl', img: 'w-24 h-24' },   // 96px
} as const;

type IconSize = keyof typeof SIZE_CONFIG;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Extract the emoji fallback from a LocationIcon (string or object).
 */
export function getIconFallback(icon: LocationIconType): string {
  if (typeof icon === 'string') {
    return icon;
  }
  return icon.fallback;
}

/**
 * Extract the asset path from a LocationIcon, if present.
 */
export function getIconAsset(icon: LocationIconType): string | undefined {
  if (typeof icon === 'string') {
    return undefined;
  }
  return icon.asset;
}

/**
 * Check if icon has an asset defined.
 */
export function hasIconAsset(icon: LocationIconType): icon is LocationIconAsset {
  return typeof icon !== 'string' && !!icon.asset;
}

// ============================================================================
// LOCATION ICON COMPONENT
// ============================================================================

interface LocationIconProps {
  icon: LocationIconType;
  size?: IconSize;
  showMystery?: boolean;
  className?: string;
}

const LocationIconComponent: React.FC<LocationIconProps> = ({
  icon,
  size = 'md',
  showMystery = false,
  className = '',
}) => {
  const [imageError, setImageError] = useState(false);

  const sizeConfig = SIZE_CONFIG[size];
  const fallback = getIconFallback(icon);
  const asset = getIconAsset(icon);

  // If mystery mode, always show mystery icon
  if (showMystery) {
    return (
      <span className={`${sizeConfig.text} filter drop-shadow-md ${className}`}>
        ❓
      </span>
    );
  }

  // If we have an asset and no error, try to show the image
  if (asset && !imageError) {
    return (
      <img
        src={asset}
        alt={fallback}
        className={`${sizeConfig.img} object-contain filter drop-shadow-md ${className}`}
        onError={() => setImageError(true)}
      />
    );
  }

  // Fallback to emoji
  return (
    <span className={`${sizeConfig.text} filter drop-shadow-md ${className}`}>
      {fallback}
    </span>
  );
};

export default LocationIconComponent;
