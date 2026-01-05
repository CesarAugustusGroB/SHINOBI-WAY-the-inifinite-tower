/**
 * ArtStyleSelector - Select art style (HOW it looks)
 *
 * Displays custom art styles from src/config/artStyles/.
 * These define visual treatment (colors, rendering technique, mood) -
 * completely independent from asset type presets.
 */

import React from 'react';
import { Palette, Sparkles } from 'lucide-react';
import { ART_STYLES, type ArtStyle } from '../../config/assetCompanionConfig';
import './ArtStyleSelector.css';

// ============================================================================
// TYPES
// ============================================================================

export interface ArtStyleSelectorProps {
  /** Currently selected art style */
  selectedStyle: ArtStyle | null;
  /** Callback when a style is selected/deselected */
  onStyleChange: (style: ArtStyle | null) => void;
  /** Custom class name */
  className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

const ArtStyleSelector: React.FC<ArtStyleSelectorProps> = ({
  selectedStyle,
  onStyleChange,
  className = '',
}) => {
  // Handle style click - toggle selection
  const handleStyleClick = (style: ArtStyle) => {
    if (selectedStyle?.id === style.id) {
      onStyleChange(null);
    } else {
      onStyleChange(style);
    }
  };

  // Empty state - no custom styles defined
  if (ART_STYLES.length === 0) {
    return (
      <div className={`art-style-selector art-style-selector--empty ${className}`}>
        <div className="art-style-selector__header">
          <Palette size={14} />
          <span className="art-style-selector__label">Art Style</span>
          <span className="art-style-selector__hint">How it looks</span>
        </div>
        <div className="art-style-selector__empty-state">
          <Palette size={24} />
          <p>No custom art styles</p>
          <span>Create styles in src/config/artStyles/</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`art-style-selector ${className}`}>
      <div className="art-style-selector__header">
        <Sparkles size={14} />
        <span className="art-style-selector__label">Art Style</span>
        <span className="art-style-selector__hint">How it looks</span>
        <span className="art-style-selector__count">{ART_STYLES.length}</span>
      </div>

      <div className="art-style-selector__list">
        {ART_STYLES.map((style) => {
          const isSelected = selectedStyle?.id === style.id;

          return (
            <button
              key={style.id}
              type="button"
              className={`art-style-card ${isSelected ? 'selected' : ''}`}
              onClick={() => handleStyleClick(style)}
              aria-pressed={isSelected}
            >
              <div className="art-style-card__icon">
                <Palette size={16} />
              </div>
              <div className="art-style-card__content">
                <span className="art-style-card__name">{style.name}</span>
                <span className="art-style-card__category">{style.category}</span>
              </div>
              {isSelected && (
                <div className="art-style-card__check">
                  <Sparkles size={12} />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected style preview */}
      {selectedStyle && (
        <div className="art-style-selector__preview">
          <div className="art-style-selector__preview-header">
            <span className="art-style-selector__preview-name">{selectedStyle.name}</span>
          </div>
          <p className="art-style-selector__preview-description">
            {selectedStyle.description}
          </p>
          <details className="art-style-selector__preview-details">
            <summary>View Prompt Template</summary>
            <pre className="art-style-selector__preview-prompt">
              {selectedStyle.promptTemplate}
            </pre>
          </details>
        </div>
      )}

      {/* Clear selection button */}
      {selectedStyle && (
        <button
          type="button"
          className="art-style-selector__clear"
          onClick={() => onStyleChange(null)}
        >
          Clear Art Style
        </button>
      )}
    </div>
  );
};

export default ArtStyleSelector;
