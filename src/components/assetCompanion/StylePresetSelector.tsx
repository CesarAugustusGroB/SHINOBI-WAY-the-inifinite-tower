import React, { useMemo } from 'react';
import {
  STYLE_PRESETS,
  type StylePreset,
  type StyleCategory,
} from '../../config/assetCompanionConfig';
import './StylePresetSelector.css';

// ============================================================================
// TYPES
// ============================================================================

export interface StylePresetSelectorProps {
  /** Currently selected style preset */
  selectedStyle: StylePreset | null;
  /** Callback when a style is selected/deselected */
  onStyleChange: (style: StylePreset | null) => void;
  /** Whether to group presets by category */
  groupByCategory?: boolean;
  /** Custom class name */
  className?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const CATEGORY_LABELS: Record<StyleCategory, string> = {
  anime: 'Anime',
  pixel: 'Pixel Art',
  stylized: 'Stylized',
  icon: 'Icons',
  portrait: 'Portraits',
  ui: 'UI Elements',
};

const CATEGORY_ORDER: StyleCategory[] = ['anime', 'stylized', 'pixel', 'icon', 'portrait', 'ui'];

// ============================================================================
// COMPONENT
// ============================================================================

const StylePresetSelector: React.FC<StylePresetSelectorProps> = ({
  selectedStyle,
  onStyleChange,
  groupByCategory = true,
  className = '',
}) => {
  // Group presets by category
  const groupedPresets = useMemo(() => {
    const groups: Record<StyleCategory, StylePreset[]> = {
      anime: [],
      pixel: [],
      stylized: [],
      icon: [],
      portrait: [],
      ui: [],
    };

    for (const preset of STYLE_PRESETS) {
      groups[preset.category].push(preset);
    }

    return groups;
  }, []);

  // Handle style click - toggle selection
  const handleStyleClick = (preset: StylePreset) => {
    if (selectedStyle?.id === preset.id) {
      onStyleChange(null);
    } else {
      onStyleChange(preset);
    }
  };

  // Render a single preset card
  const renderPresetCard = (preset: StylePreset) => {
    const isSelected = selectedStyle?.id === preset.id;

    return (
      <button
        key={preset.id}
        type="button"
        className={`style-preset-card ${isSelected ? 'selected' : ''}`}
        onClick={() => handleStyleClick(preset)}
        title={preset.description}
        aria-pressed={isSelected}
      >
        <span className="style-preset-card__name">{preset.name}</span>
        {preset.sizeOverride && (
          <span className="style-preset-card__size">
            {preset.sizeOverride.width}x{preset.sizeOverride.height}
          </span>
        )}
      </button>
    );
  };

  // Render grouped view
  if (groupByCategory) {
    return (
      <div className={`style-preset-selector ${className}`}>
        {CATEGORY_ORDER.map(category => {
          const presets = groupedPresets[category];
          if (presets.length === 0) return null;

          return (
            <div key={category} className="style-preset-group">
              <h4 className="style-preset-group__label">{CATEGORY_LABELS[category]}</h4>
              <div className="style-preset-group__items">
                {presets.map(renderPresetCard)}
              </div>
            </div>
          );
        })}

        {/* Clear selection button */}
        {selectedStyle && (
          <button
            type="button"
            className="style-preset-clear"
            onClick={() => onStyleChange(null)}
          >
            Clear Style
          </button>
        )}

        {/* Selected style preview */}
        {selectedStyle && (
          <div className="style-preset-preview">
            <div className="style-preset-preview__header">
              <span className="style-preset-preview__label">Selected:</span>
              <span className="style-preset-preview__name">{selectedStyle.name}</span>
            </div>
            <p className="style-preset-preview__description">{selectedStyle.description}</p>
          </div>
        )}
      </div>
    );
  }

  // Render flat view (all presets in one grid)
  return (
    <div className={`style-preset-selector style-preset-selector--flat ${className}`}>
      <div className="style-preset-grid">
        {STYLE_PRESETS.map(renderPresetCard)}
      </div>

      {selectedStyle && (
        <button
          type="button"
          className="style-preset-clear"
          onClick={() => onStyleChange(null)}
        >
          Clear Style
        </button>
      )}
    </div>
  );
};

export default StylePresetSelector;
