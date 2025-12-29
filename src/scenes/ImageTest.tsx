import React, { useState, useCallback } from 'react';

interface ImageTestProps {
  onBack: () => void;
}

// Preset prompts for quick testing
const PRESETS = [
  { label: 'Ninja', prompt: 'A dark fantasy, gritty anime style character portrait of a Naruto-inspired ninja. Chunin rank. The character looks dangerous and stealthy. High contrast, detailed, atmospheric lighting. Close-up shot.' },
  { label: 'Samurai', prompt: 'A dark fantasy, gritty anime style character portrait of a ronin samurai warrior. Battle-scarred and weathered. High contrast, detailed, atmospheric lighting. Waist-up shot.' },
  { label: 'Monk', prompt: 'A dark fantasy, gritty anime style character portrait of a chakra monk with spiritual energy. Mysterious and powerful. High contrast, detailed, atmospheric lighting. Close-up shot.' },
  { label: 'Puppeteer', prompt: 'A dark fantasy, gritty anime style character portrait of a puppet master ninja with chakra strings. Sinister and calculating. High contrast, detailed, atmospheric lighting. Close-up shot.' },
  { label: 'Boss', prompt: 'A dark fantasy, gritty anime style character portrait of a legendary S-Rank ninja boss. Overwhelming power and killing intent. High contrast, detailed, atmospheric red lighting. Dramatic waist-up shot.' },
];

const ImageTest: React.FC<ImageTestProps> = ({ onBack }) => {
  const [prompt, setPrompt] = useState('');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageSize, setImageSize] = useState<'1K' | '2K' | '4K'>('1K');

  const generateImage = useCallback(async (customPrompt?: string) => {
    const promptToUse = customPrompt || prompt;
    if (!promptToUse.trim()) {
      setError('Please enter a prompt or select a preset');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setGeneratedImage(null);

    try {
      const { GoogleGenAI } = await import('@google/genai');
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-image-preview',
        contents: { parts: [{ text: promptToUse }] },
        config: {
          imageConfig: {
            imageSize: imageSize,
            aspectRatio: '1:1'
          }
        }
      });

      let imageUrl: string | null = null;
      if (response.candidates && response.candidates[0].content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          // Check for inline image data in the response
          const partWithData = part as { inlineData?: { data: string } };
          if (partWithData.inlineData) {
            imageUrl = `data:image/png;base64,${partWithData.inlineData.data}`;
            break;
          }
        }
      }

      if (imageUrl) {
        setGeneratedImage(imageUrl);
      } else {
        setError('No image was returned from the API');
      }
    } catch (err: unknown) {
      console.error('Image Gen Error:', err);
      const error = err as { status?: number; message?: string };
      if (error?.status === 403) {
        setError('Access denied. Please check your API key.');
      } else if (error?.message) {
        setError(`Generation failed: ${error.message}`);
      } else {
        setError('Failed to generate image. Check console for details.');
      }
    } finally {
      setIsGenerating(false);
    }
  }, [prompt, imageSize]);

  const handlePresetClick = (presetPrompt: string) => {
    setPrompt(presetPrompt);
    generateImage(presetPrompt);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-amber-400">AI Image Generator Test</h1>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
        >
          Back to Menu
        </button>
      </div>

      <div className="max-w-4xl mx-auto">
        {/* Image Display Area */}
        <div className="bg-slate-800 rounded-xl p-4 mb-6 aspect-square max-w-lg mx-auto flex items-center justify-center border-2 border-slate-700">
          {isGenerating ? (
            <div className="text-center">
              <div className="animate-spin w-16 h-16 border-4 border-amber-400 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-slate-400">Generating image...</p>
              <p className="text-sm text-slate-500 mt-2">This may take 5-15 seconds</p>
            </div>
          ) : generatedImage ? (
            <img
              src={generatedImage}
              alt="Generated"
              className="max-w-full max-h-full object-contain rounded-lg"
            />
          ) : (
            <div className="text-center text-slate-500">
              <div className="text-6xl mb-4">🎨</div>
              <p>Enter a prompt or select a preset to generate an image</p>
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Quick Presets */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-slate-300 mb-3">Quick Presets</h2>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((preset) => (
              <button
                key={preset.label}
                onClick={() => handlePresetClick(preset.prompt)}
                disabled={isGenerating}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:bg-slate-600 disabled:cursor-not-allowed rounded-lg transition-colors font-medium"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Image Size Selection */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-slate-300 mb-3">Image Size</h2>
          <div className="flex gap-2">
            {(['1K', '2K', '4K'] as const).map((size) => (
              <button
                key={size}
                onClick={() => setImageSize(size)}
                className={`px-4 py-2 rounded-lg transition-colors font-medium ${
                  imageSize === size
                    ? 'bg-amber-600 text-white'
                    : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Prompt */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-slate-300 mb-3">Custom Prompt</h2>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="A dark fantasy, gritty anime style character portrait of..."
            className="w-full h-32 bg-slate-700 border border-slate-600 rounded-lg p-3 text-white placeholder-slate-400 focus:outline-none focus:border-amber-500"
          />
        </div>

        {/* Generate Button */}
        <button
          onClick={() => generateImage()}
          disabled={isGenerating || !prompt.trim()}
          className="w-full py-4 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 disabled:from-slate-600 disabled:to-slate-600 disabled:cursor-not-allowed rounded-lg font-bold text-lg transition-all"
        >
          {isGenerating ? 'Generating...' : 'Generate Image'}
        </button>

        {/* Download Button */}
        {generatedImage && !isGenerating && (
          <a
            href={generatedImage}
            download="generated-image.png"
            className="block mt-4 w-full py-3 bg-slate-700 hover:bg-slate-600 rounded-lg font-medium text-center transition-colors"
          >
            Download Image
          </a>
        )}

        {/* Status */}
        <div className="mt-6 text-center text-sm text-slate-500">
          Model: gemini-3-pro-image-preview | Size: {imageSize}
        </div>
      </div>
    </div>
  );
};

export default ImageTest;
