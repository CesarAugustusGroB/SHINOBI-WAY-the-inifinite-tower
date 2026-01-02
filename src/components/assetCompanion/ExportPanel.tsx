import React, { useState, useCallback, useMemo } from 'react';
import { Download, Copy, Check, FolderOpen, FileImage, FileType } from 'lucide-react';
import {
  ASSET_CATEGORIES,
  type AssetCategoryId,
  type ExportFormat,
  generateFilename,
} from '../../config/assetCompanionConfig';
import './ExportPanel.css';

// ============================================================================
// TYPES
// ============================================================================

export interface ExportPanelProps {
  /** The generated image data URL to export */
  imageData: string | null;
  /** Currently selected style ID for filename generation */
  styleId: string | null;
  /** Current asset category */
  category: AssetCategoryId;
  /** Callback when category changes */
  onCategoryChange: (category: AssetCategoryId) => void;
  /** Current export format */
  format: ExportFormat;
  /** Callback when format changes */
  onFormatChange: (format: ExportFormat) => void;
  /** Custom filename (optional) */
  customFilename: string;
  /** Callback when custom filename changes */
  onCustomFilenameChange: (filename: string) => void;
  /** Custom class name */
  className?: string;
  /** Whether to show in compact mode */
  compact?: boolean;
}

interface FormatOption {
  id: ExportFormat;
  label: string;
  description: string;
  extension: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const FORMAT_OPTIONS: FormatOption[] = [
  {
    id: 'png',
    label: 'PNG',
    description: 'Lossless with transparency support',
    extension: 'png',
  },
  {
    id: 'webp',
    label: 'WebP',
    description: 'Modern format, smaller file size',
    extension: 'webp',
  },
  {
    id: 'jpg',
    label: 'JPG',
    description: 'Compressed, no transparency',
    extension: 'jpg',
  },
  {
    id: 'base64',
    label: 'Base64',
    description: 'Data URL for code embedding',
    extension: 'txt',
  },
];

// ============================================================================
// COMPONENT
// ============================================================================

const ExportPanel: React.FC<ExportPanelProps> = ({
  imageData,
  styleId,
  category,
  onCategoryChange,
  format,
  onFormatChange,
  customFilename,
  onCustomFilenameChange,
  className = '',
  compact = false,
}) => {
  const [copySuccess, setCopySuccess] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // Generate the filename preview
  const filenamePreview = useMemo(() => {
    const baseName = generateFilename(category, styleId, customFilename || undefined);
    const extension = format === 'base64' ? 'png' : format;
    return `${baseName}.${extension}`;
  }, [category, styleId, customFilename, format]);

  // Handle download
  const handleDownload = useCallback(async () => {
    if (!imageData) return;

    try {
      const baseName = generateFilename(category, styleId, customFilename || undefined);
      const extension = format === 'base64' ? 'png' : format;

      // For base64 format, download as text file
      if (format === 'base64') {
        const blob = new Blob([imageData], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${baseName}.txt`;
        link.click();
        URL.revokeObjectURL(url);
      } else {
        // For image formats, download directly
        const link = document.createElement('a');
        link.href = imageData;
        link.download = `${baseName}.${extension}`;
        link.click();
      }

      // Show success feedback
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 2000);
    } catch (err) {
      console.error('Download failed:', err);
    }
  }, [imageData, category, styleId, customFilename, format]);

  // Handle copy to clipboard
  const handleCopyBase64 = useCallback(async () => {
    if (!imageData) return;

    try {
      await navigator.clipboard.writeText(imageData);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  }, [imageData]);

  // Get category icon
  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'Skull': return '💀';
      case 'User': return '👤';
      case 'Package': return '📦';
      case 'Layout': return '🎨';
      case 'Image': return '🖼️';
      case 'Circle': return '⭕';
      default: return '📁';
    }
  };

  return (
    <div className={`export-panel ${compact ? 'export-panel--compact' : ''} ${className}`}>
      {/* Category Selector */}
      <div className="export-panel__section">
        <label className="export-panel__label">
          <FolderOpen size={14} />
          Category
        </label>
        <div className="export-panel__category-grid">
          {ASSET_CATEGORIES.map(cat => (
            <button
              key={cat.id}
              type="button"
              className={`export-panel__category-btn ${category === cat.id ? 'selected' : ''}`}
              onClick={() => onCategoryChange(cat.id)}
              title={cat.name}
            >
              <span className="export-panel__category-icon">
                {getCategoryIcon(cat.icon)}
              </span>
              <span className="export-panel__category-name">{cat.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Format Selector */}
      <div className="export-panel__section">
        <label className="export-panel__label">
          <FileImage size={14} />
          Format
        </label>
        <div className="export-panel__format-grid">
          {FORMAT_OPTIONS.map(opt => (
            <button
              key={opt.id}
              type="button"
              className={`export-panel__format-btn ${format === opt.id ? 'selected' : ''}`}
              onClick={() => onFormatChange(opt.id)}
              title={opt.description}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Filename */}
      <div className="export-panel__section">
        <label className="export-panel__label">
          <FileType size={14} />
          Filename
        </label>
        <input
          type="text"
          value={customFilename}
          onChange={(e) => onCustomFilenameChange(e.target.value)}
          placeholder="auto-generated"
          className="export-panel__filename-input"
        />
        <div className="export-panel__filename-preview">
          {filenamePreview}
        </div>
      </div>

      {/* Export Actions */}
      <div className="export-panel__actions">
        <button
          type="button"
          className={`export-panel__action-btn export-panel__action-btn--primary ${downloadSuccess ? 'success' : ''}`}
          onClick={handleDownload}
          disabled={!imageData}
          title="Download image file"
        >
          {downloadSuccess ? (
            <>
              <Check size={16} />
              Downloaded!
            </>
          ) : (
            <>
              <Download size={16} />
              Download
            </>
          )}
        </button>

        <button
          type="button"
          className={`export-panel__action-btn ${copySuccess ? 'success' : ''}`}
          onClick={handleCopyBase64}
          disabled={!imageData}
          title="Copy base64 data URL to clipboard"
        >
          {copySuccess ? (
            <>
              <Check size={16} />
              Copied!
            </>
          ) : (
            <>
              <Copy size={16} />
              Copy Base64
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default ExportPanel;
