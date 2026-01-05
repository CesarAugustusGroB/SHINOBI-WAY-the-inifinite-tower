/**
 * AssetPresetSelector - Select asset type preset (WHAT to create)
 *
 * Displays the 8 asset type presets in a grid. These define compositional
 * requirements (aspect ratio, transparency, framing) - NOT visual style.
 */

import React from 'react';
import {
  User,
  Skull,
  Image,
  Square,
  Layout,
  Circle,
  Package,
  Zap,
  Grid3X3,
} from 'lucide-react';
import { ASSET_PRESETS, type AssetPreset } from '../../config/assetCompanionConfig';
import './AssetPresetSelector.css';

// ============================================================================
// TYPES
// ============================================================================

export interface AssetPresetSelectorProps {
  /** Currently selected asset preset */
  selectedPreset: AssetPreset | null;
  /** Callback when a preset is selected/deselected */
  onPresetChange: (preset: AssetPreset | null) => void;
  /** Custom class name */
  className?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/** Icon mapping for each asset preset */
const PRESET_ICONS: Record<string, React.FC<{ size?: number }>> = {
  'npc-portrait': User,
  'enemy-portrait': Skull,
  'background': Image,
  'button': Square,
  'ui-element': Layout,
  'icon': Circle,
  'item': Package,
  'skill': Zap,
};

// ============================================================================
// COMPONENT
// ============================================================================

const AssetPresetSelector: React.FC<AssetPresetSelectorProps> = ({
  selectedPreset,
  onPresetChange,
  className = '',
}) => {
  // Handle preset click - toggle selection
  const handlePresetClick = (preset: AssetPreset) => {
    if (selectedPreset?.id === preset.id) {
      onPresetChange(null);
    } else {
      onPresetChange(preset);
    }
  };

  return (
    <div className={`asset-preset-selector ${className}`}>
      <div className="asset-preset-selector__header">
        <Grid3X3 size={14} />
        <span className="asset-preset-selector__label">Asset Type</span>
        <span className="asset-preset-selector__hint">What to create</span>
        <span className="asset-preset-selector__count">{ASSET_PRESETS.length}</span>
      </div>

      <div className="asset-preset-selector__grid">
        {ASSET_PRESETS.map((preset) => {
          const isSelected = selectedPreset?.id === preset.id;
          const IconComponent = PRESET_ICONS[preset.id] || Package;

          return (
            <button
              key={preset.id}
              type="button"
              className={`asset-preset-card ${isSelected ? 'selected' : ''}`}
              onClick={() => handlePresetClick(preset)}
              title={preset.description}
              aria-pressed={isSelected}
            >
              <IconComponent size={18} />
              <span className="asset-preset-card__name">{preset.name}</span>
            </button>
          );
        })}
      </div>

      {/* Selected preset info */}
      {selectedPreset && (
        <div className="asset-preset-selector__info">
          <div className="asset-preset-selector__info-row">
            <span className="asset-preset-selector__info-label">Aspect:</span>
            <span className="asset-preset-selector__info-value">{selectedPreset.aspectRatio}</span>
          </div>
          <div className="asset-preset-selector__info-row">
            <span className="asset-preset-selector__info-label">Resolution:</span>
            <span className="asset-preset-selector__info-value">{selectedPreset.recommendedResolution}</span>
          </div>
          {selectedPreset.requiresTransparency && (
            <div className="asset-preset-selector__info-badge">
              Transparent BG
            </div>
          )}
        </div>
      )}

      {/* Clear selection button */}
      {selectedPreset && (
        <button
          type="button"
          className="asset-preset-selector__clear"
          onClick={() => onPresetChange(null)}
        >
          Clear Asset Type
        </button>
      )}
    </div>
  );
};

export default AssetPresetSelector;
