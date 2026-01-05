import React, { useState, useCallback } from 'react';
import { ArrowLeft, Wand2, Loader2 } from 'lucide-react';
import {
  DEFAULT_CONFIG,
  ART_STYLES,
  getAssetPreset,
  getArtStyle,
  type AssetPreset,
  type ArtStyle,
  type AssetCategoryId,
  type ImageSize,
  type ExportFormat,
  type TransformationType,
} from '../../config/assetCompanionConfig';
import { useAssetGeneration, type GenerationResult } from '../../hooks/useAssetGeneration';
import {
  ImageInputPanel,
  AssetPresetSelector,
  ArtStyleSelector,
  TransformationModeSelector,
  ExportPanel,
  ImagePreview,
  type InputMode,
} from '../../components/assetCompanion';
import './AssetCompanion.css';

interface AssetCompanionProps {
  onBack: () => void;
}

interface GenerationHistoryItem {
  id: string;
  timestamp: number;
  prompt: string;
  outputImage: string;
  assetPresetId: string | null;
  artStyleId: string | null;
}

const AssetCompanion: React.FC<AssetCompanionProps> = ({ onBack }) => {
  // Input state
  const [inputMode, setInputMode] = useState<InputMode>('prompt');
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [inputError, setInputError] = useState<string | null>(null);

  // Transformation state
  const [transformationType, setTransformationType] = useState<TransformationType>('generate');
  const [selectedAssetPreset, setSelectedAssetPreset] = useState<AssetPreset | null>(null);
  const [selectedArtStyle, setSelectedArtStyle] = useState<ArtStyle | null>(null);

  // Output configuration
  const [imageSize, setImageSize] = useState<ImageSize>(DEFAULT_CONFIG.imageSize);
  const [exportFormat, setExportFormat] = useState<ExportFormat>(DEFAULT_CONFIG.exportFormat);
  const [assetCategory, setAssetCategory] = useState<AssetCategoryId>(DEFAULT_CONFIG.category);
  const [customFilename, setCustomFilename] = useState('');

  // Generated output
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  // History
  const [history, setHistory] = useState<GenerationHistoryItem[]>([]);

  // Use the asset generation hook
  const handleGenerationSuccess = useCallback((result: GenerationResult) => {
    setGeneratedImage(result.imageUrl);
    // Add to history
    setHistory(prev => [{
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      prompt: result.metadata.prompt,
      outputImage: result.imageUrl,
      assetPresetId: selectedAssetPreset?.id || null,
      artStyleId: selectedArtStyle?.id || null,
    }, ...prev.slice(0, DEFAULT_CONFIG.maxHistoryItems - 1)]);
  }, [selectedAssetPreset, selectedArtStyle]);

  const {
    isGenerating,
    error,
    generateFromPrompt,
    transformWithStyle,
    removeBackground,
    clearError,
  } = useAssetGeneration({
    onSuccess: handleGenerationSuccess,
  });

  // Handle input error from ImageInputPanel
  const handleInputError = useCallback((message: string) => {
    setInputError(message);
    // Clear the error after 3 seconds
    setTimeout(() => setInputError(null), 3000);
  }, []);

  // Handle generation based on transformation type
  const handleGenerate = useCallback(async () => {
    clearError();

    switch (transformationType) {
      case 'generate':
        await generateFromPrompt({
          prompt,
          assetPreset: selectedAssetPreset,
          artStyle: selectedArtStyle,
          imageSize,
        });
        break;

      case 'styleTransfer':
        if (sourceImage && selectedArtStyle) {
          await transformWithStyle({
            sourceImage,
            artStyle: selectedArtStyle,
            additionalPrompt: prompt,
            imageSize,
          });
        }
        break;

      case 'backgroundRemoval':
        if (sourceImage) {
          await removeBackground({
            sourceImage,
            imageSize,
          });
        }
        break;
    }
  }, [
    transformationType,
    prompt,
    selectedAssetPreset,
    selectedArtStyle,
    sourceImage,
    imageSize,
    generateFromPrompt,
    transformWithStyle,
    removeBackground,
    clearError,
  ]);

  // Load from history
  const handleHistoryClick = useCallback((item: GenerationHistoryItem) => {
    setGeneratedImage(item.outputImage);
    setPrompt(item.prompt);
    // Restore asset preset selection
    setSelectedAssetPreset(item.assetPresetId ? getAssetPreset(item.assetPresetId) || null : null);
    // Restore art style selection
    setSelectedArtStyle(item.artStyleId ? getArtStyle(item.artStyleId) || null : null);
  }, []);

  // Check if generate button should be disabled
  const isGenerateDisabled = isGenerating || (
    transformationType === 'generate' && !prompt.trim() && !selectedAssetPreset && !selectedArtStyle
  ) || (
    (transformationType === 'styleTransfer' || transformationType === 'backgroundRemoval') && !sourceImage
  ) || (
    transformationType === 'styleTransfer' && !selectedArtStyle
  );

  return (
    <div className="asset-companion">
      {/* Header */}
      <header className="asset-companion__header">
        <button onClick={onBack} className="asset-companion__back-btn">
          <ArrowLeft size={20} />
          Back to Menu
        </button>
        <h1 className="asset-companion__title">Asset Companion</h1>
      </header>

      <div className="asset-companion__content">
        {/* Left Column - Controls */}
        <div className="asset-companion__controls">
          {/* Input Source - ImageInputPanel */}
          <section className="asset-companion__section">
            <h2 className="asset-companion__section-title">Input Source</h2>
            <ImageInputPanel
              inputMode={inputMode}
              onInputModeChange={setInputMode}
              sourceImage={sourceImage}
              onImageChange={setSourceImage}
              onError={handleInputError}
              showPreview={false}
            />
            {inputError && (
              <div className="asset-companion__input-error">
                {inputError}
              </div>
            )}
          </section>

          {/* Transformation Type */}
          <section className="asset-companion__section">
            <h2 className="asset-companion__section-title">Transformation</h2>
            <TransformationModeSelector
              selectedMode={transformationType}
              onModeChange={setTransformationType}
              hasSourceImage={!!sourceImage}
            />
          </section>

          {/* Asset Type Preset (WHAT to create) */}
          <section className="asset-companion__section">
            <AssetPresetSelector
              selectedPreset={selectedAssetPreset}
              onPresetChange={setSelectedAssetPreset}
            />
          </section>

          {/* Art Style (HOW it looks) */}
          <section className="asset-companion__section">
            <ArtStyleSelector
              selectedStyle={selectedArtStyle}
              onStyleChange={setSelectedArtStyle}
            />
          </section>

          {/* Prompt Input */}
          <section className="asset-companion__section">
            <h2 className="asset-companion__section-title">Prompt</h2>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe what you want to generate..."
              className="asset-companion__prompt"
              rows={4}
            />
          </section>

          {/* Image Size */}
          <section className="asset-companion__section">
            <h2 className="asset-companion__section-title">Output Size</h2>
            <div className="asset-companion__size-btns">
              {(['1K', '2K', '4K'] as const).map(size => (
                <button
                  key={size}
                  type="button"
                  className={`asset-companion__size-btn ${imageSize === size ? 'active' : ''}`}
                  onClick={() => setImageSize(size)}
                >
                  {size}
                </button>
              ))}
            </div>
          </section>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={isGenerateDisabled}
            className="asset-companion__generate-btn"
          >
            {isGenerating ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Wand2 size={20} />
                Generate
              </>
            )}
          </button>
        </div>

        {/* Right Column - Preview */}
        <div className="asset-companion__preview-area">
          {/* Image Preview Component */}
          <ImagePreview
            sourceImage={sourceImage}
            outputImage={generatedImage}
            isLoading={isGenerating}
            error={error}
            onClearError={clearError}
            layout={sourceImage ? 'side-by-side' : 'stacked'}
            showComparisonArrow={!!sourceImage}
          />

          {/* Export Panel */}
          {generatedImage && !isGenerating && (
            <section className="asset-companion__export-section">
              <h3>Export</h3>
              <ExportPanel
                imageData={generatedImage}
                styleId={selectedArtStyle?.id || null}
                category={assetCategory}
                onCategoryChange={setAssetCategory}
                format={exportFormat}
                onFormatChange={setExportFormat}
                customFilename={customFilename}
                onCustomFilenameChange={setCustomFilename}
                compact={true}
              />
            </section>
          )}

          {/* History */}
          {history.length > 0 && (
            <section className="asset-companion__history">
              <h3>Recent Generations</h3>
              <div className="asset-companion__history-items">
                {history.map(item => (
                  <button
                    key={item.id}
                    type="button"
                    className="asset-companion__history-item"
                    onClick={() => handleHistoryClick(item)}
                    title={item.prompt.slice(0, 100)}
                  >
                    <img src={item.outputImage} alt="History" />
                  </button>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};

export default AssetCompanion;
