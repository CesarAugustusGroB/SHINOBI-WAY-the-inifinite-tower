import React from 'react';
import { Wand2, Palette, Eraser } from 'lucide-react';
import { type TransformationType } from '../../config/assetCompanionConfig';
import './TransformationModeSelector.css';

// ============================================================================
// TYPES
// ============================================================================

export interface TransformationModeSelectorProps {
  /** Currently selected transformation type */
  selectedMode: TransformationType;
  /** Callback when transformation mode changes */
  onModeChange: (mode: TransformationType) => void;
  /** Whether source image is available (enables style transfer & bg removal) */
  hasSourceImage: boolean;
  /** Custom class name */
  className?: string;
}

interface TransformationOption {
  id: TransformationType;
  label: string;
  description: string;
  icon: React.ReactNode;
  requiresImage: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const TRANSFORMATION_OPTIONS: TransformationOption[] = [
  {
    id: 'generate',
    label: 'Generate',
    description: 'Create a new image from text prompt',
    icon: <Wand2 size={18} />,
    requiresImage: false,
  },
  {
    id: 'styleTransfer',
    label: 'Style Transfer',
    description: 'Apply a style preset to an uploaded image',
    icon: <Palette size={18} />,
    requiresImage: true,
  },
  {
    id: 'backgroundRemoval',
    label: 'Remove BG',
    description: 'Remove background from an image',
    icon: <Eraser size={18} />,
    requiresImage: true,
  },
];

// ============================================================================
// COMPONENT
// ============================================================================

const TransformationModeSelector: React.FC<TransformationModeSelectorProps> = ({
  selectedMode,
  onModeChange,
  hasSourceImage,
  className = '',
}) => {
  return (
    <div className={`transformation-mode-selector ${className}`}>
      {TRANSFORMATION_OPTIONS.map(option => {
        const isDisabled = option.requiresImage && !hasSourceImage;
        const isSelected = selectedMode === option.id;

        return (
          <button
            key={option.id}
            type="button"
            className={`transformation-mode-option ${isSelected ? 'selected' : ''}`}
            onClick={() => !isDisabled && onModeChange(option.id)}
            disabled={isDisabled}
            title={isDisabled ? 'Upload an image first' : option.description}
            aria-pressed={isSelected || undefined}
          >
            <span className="transformation-mode-option__icon">
              {option.icon}
            </span>
            <span className="transformation-mode-option__label">
              {option.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default TransformationModeSelector;
