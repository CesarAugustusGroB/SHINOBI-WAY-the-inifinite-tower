import React from 'react';
import { Wand2, ImageIcon, Loader2, AlertCircle, ArrowRight } from 'lucide-react';
import './ImagePreview.css';

// ============================================================================
// TYPES
// ============================================================================

export interface ImagePreviewProps {
  /** Source image (uploaded/input image) */
  sourceImage: string | null;
  /** Generated/output image */
  outputImage: string | null;
  /** Whether currently generating */
  isLoading: boolean;
  /** Error message if any */
  error: string | null;
  /** Callback to clear error */
  onClearError?: () => void;
  /** Custom class name */
  className?: string;
  /** Layout mode */
  layout?: 'side-by-side' | 'stacked';
  /** Show comparison arrow between panels */
  showComparisonArrow?: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

const ImagePreview: React.FC<ImagePreviewProps> = ({
  sourceImage,
  outputImage,
  isLoading,
  error,
  onClearError,
  className = '',
  layout = 'side-by-side',
  showComparisonArrow = true,
}) => {
  const hasSourceImage = !!sourceImage;
  const hasOutputImage = !!outputImage;
  const showBothPanels = hasSourceImage || layout === 'side-by-side';

  return (
    <div className={`image-preview image-preview--${layout} ${className}`}>
      {/* Error Banner */}
      {error && (
        <div className="image-preview__error">
          <AlertCircle size={18} />
          <span>{error}</span>
          {onClearError && (
            <button
              type="button"
              className="image-preview__error-dismiss"
              onClick={onClearError}
              aria-label="Dismiss error"
            >
              &times;
            </button>
          )}
        </div>
      )}

      {/* Preview Container */}
      <div className="image-preview__container">
        {/* Source Panel */}
        {showBothPanels && (
          <div className="image-preview__panel">
            <h3 className="image-preview__panel-title">
              <ImageIcon size={14} />
              Source
            </h3>
            <div className="image-preview__frame">
              {hasSourceImage ? (
                <img
                  src={sourceImage}
                  alt="Source"
                  className="image-preview__image"
                />
              ) : (
                <div className="image-preview__empty">
                  <ImageIcon size={32} />
                  <p>No source image</p>
                  <p className="image-preview__empty-hint">
                    Upload an image for style transfer or background removal
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Comparison Arrow */}
        {showBothPanels && showComparisonArrow && (
          <div className="image-preview__arrow">
            <ArrowRight size={24} />
          </div>
        )}

        {/* Output Panel */}
        <div className="image-preview__panel image-preview__panel--output">
          <h3 className="image-preview__panel-title">
            <Wand2 size={14} />
            Output
          </h3>
          <div className="image-preview__frame">
            {isLoading ? (
              <div className="image-preview__loading">
                <Loader2 size={48} className="image-preview__spinner" />
                <p>Generating image...</p>
                <p className="image-preview__loading-hint">This may take 5-15 seconds</p>
                <div className="image-preview__progress">
                  <div className="image-preview__progress-bar" />
                </div>
              </div>
            ) : hasOutputImage ? (
              <img
                src={outputImage}
                alt="Generated output"
                className="image-preview__image"
              />
            ) : (
              <div className="image-preview__empty">
                <Wand2 size={32} />
                <p>No output yet</p>
                <p className="image-preview__empty-hint">
                  Select a style preset or enter a prompt to generate
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImagePreview;
