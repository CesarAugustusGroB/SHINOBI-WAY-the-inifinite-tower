import React, { useState, useCallback, useRef } from 'react';
import { Upload, Clipboard, Image, X, Wand2 } from 'lucide-react';
import './ImageInputPanel.css';

// ============================================================================
// TYPES
// ============================================================================

export type InputMode = 'prompt' | 'upload';

export interface ImageInputPanelProps {
  /** Current input mode */
  inputMode: InputMode;
  /** Callback when input mode changes */
  onInputModeChange: (mode: InputMode) => void;
  /** Current source image (base64 data URL) */
  sourceImage: string | null;
  /** Callback when image is uploaded/pasted */
  onImageChange: (image: string | null) => void;
  /** Optional error callback */
  onError?: (message: string) => void;
  /** Whether to show the preview */
  showPreview?: boolean;
  /** Custom class name */
  className?: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Convert a File or Blob to base64 data URL
 */
function fileToBase64(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to read file'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Check if a file is a valid image type
 */
function isValidImageType(file: File): boolean {
  return file.type.startsWith('image/');
}

// ============================================================================
// COMPONENT
// ============================================================================

const ImageInputPanel: React.FC<ImageInputPanelProps> = ({
  inputMode,
  onInputModeChange,
  sourceImage,
  onImageChange,
  onError,
  showPreview = true,
  className = '',
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // Handle file selection from input
  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!isValidImageType(file)) {
      onError?.('Please select a valid image file');
      return;
    }

    try {
      const base64 = await fileToBase64(file);
      setFileName(file.name);
      onImageChange(base64);
      onInputModeChange('upload');
    } catch {
      onError?.('Failed to read the image file');
    }

    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [onImageChange, onInputModeChange, onError]);

  // Handle drag events
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set dragging to false if leaving the drop zone entirely
    if (dropZoneRef.current && !dropZoneRef.current.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length === 0) return;

    const file = files[0];
    if (!isValidImageType(file)) {
      onError?.('Please drop a valid image file');
      return;
    }

    try {
      const base64 = await fileToBase64(file);
      setFileName(file.name);
      onImageChange(base64);
      onInputModeChange('upload');
    } catch {
      onError?.('Failed to read the dropped image');
    }
  }, [onImageChange, onInputModeChange, onError]);

  // Handle paste from clipboard
  const handlePaste = useCallback(async () => {
    try {
      // Try the modern Clipboard API first
      if (navigator.clipboard && navigator.clipboard.read) {
        const clipboardItems = await navigator.clipboard.read();
        for (const item of clipboardItems) {
          const imageType = item.types.find(type => type.startsWith('image/'));
          if (imageType) {
            const blob = await item.getType(imageType);
            const base64 = await fileToBase64(blob);
            setFileName('Pasted image');
            onImageChange(base64);
            onInputModeChange('upload');
            return;
          }
        }
        onError?.('No image found in clipboard');
      } else {
        onError?.('Clipboard access not supported in this browser');
      }
    } catch (err) {
      // Clipboard access might be denied
      onError?.('Could not access clipboard. Try using Ctrl+V instead.');
    }
  }, [onImageChange, onInputModeChange, onError]);

  // Handle keyboard paste (Ctrl+V)
  const handleKeyboardPaste = useCallback(async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (const item of Array.from(items)) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          try {
            const base64 = await fileToBase64(file);
            setFileName('Pasted image');
            onImageChange(base64);
            onInputModeChange('upload');
            return;
          } catch {
            onError?.('Failed to read pasted image');
          }
        }
      }
    }
  }, [onImageChange, onInputModeChange, onError]);

  // Clear the current image
  const handleClear = useCallback(() => {
    setFileName(null);
    onImageChange(null);
    onInputModeChange('prompt');
  }, [onImageChange, onInputModeChange]);

  // Switch to prompt mode
  const handlePromptMode = useCallback(() => {
    setFileName(null);
    onImageChange(null);
    onInputModeChange('prompt');
  }, [onImageChange, onInputModeChange]);

  // Trigger file input click
  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <div className={`image-input-panel ${className}`} onPaste={handleKeyboardPaste}>
      {/* Mode Selection Buttons */}
      <div className="image-input-panel__modes">
        <button
          type="button"
          className={`image-input-panel__mode-btn ${inputMode === 'prompt' ? 'active' : ''}`}
          onClick={handlePromptMode}
        >
          <Wand2 size={16} />
          Generate New
        </button>
        <button
          type="button"
          className={`image-input-panel__mode-btn ${inputMode === 'upload' ? 'active' : ''}`}
          onClick={handleUploadClick}
        >
          <Upload size={16} />
          Upload
        </button>
        <button
          type="button"
          className="image-input-panel__mode-btn"
          onClick={handlePaste}
        >
          <Clipboard size={16} />
          Paste
        </button>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="image-input-panel__file-input"
        aria-label="Upload image file"
      />

      {/* Drop Zone */}
      <div
        ref={dropZoneRef}
        className={`image-input-panel__dropzone ${isDragging ? 'dragging' : ''} ${sourceImage ? 'has-image' : ''}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={sourceImage ? undefined : handleUploadClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (!sourceImage) handleUploadClick();
          }
        }}
      >
        {sourceImage && showPreview ? (
          <div className="image-input-panel__preview">
            <img src={sourceImage} alt="Source" />
            <button
              type="button"
              className="image-input-panel__clear-btn"
              onClick={(e) => {
                e.stopPropagation();
                handleClear();
              }}
              aria-label="Remove image"
            >
              <X size={16} />
            </button>
            {fileName && (
              <div className="image-input-panel__filename">
                {fileName}
              </div>
            )}
          </div>
        ) : (
          <div className="image-input-panel__placeholder">
            <Image size={32} />
            <p className="image-input-panel__placeholder-text">
              {isDragging ? 'Drop image here' : 'Drag & drop an image, or click to browse'}
            </p>
            <p className="image-input-panel__placeholder-hint">
              Supports PNG, JPG, WebP, GIF
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageInputPanel;
