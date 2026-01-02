import { useCallback, useState } from 'react';
import {
  type StylePreset,
  type ImageSize,
  TRANSFORMATION_PROMPTS,
} from '../config/assetCompanionConfig';

// ============================================================================
// TYPES
// ============================================================================

export interface GenerationMetadata {
  prompt: string;
  model: string;
  size: ImageSize;
  processingTimeMs: number;
  transformationType: 'generate' | 'styleTransfer' | 'backgroundRemoval';
}

export interface GenerationResult {
  imageUrl: string;
  metadata: GenerationMetadata;
}

export interface UseAssetGenerationOptions {
  onSuccess?: (result: GenerationResult) => void;
  onError?: (message: string) => void;
}

export interface GenerateFromPromptOptions {
  prompt: string;
  stylePreset?: StylePreset | null;
  imageSize?: ImageSize;
  aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3';
}

export interface TransformWithStyleOptions {
  sourceImage: string;
  stylePreset: StylePreset;
  additionalPrompt?: string;
  imageSize?: ImageSize;
}

export interface RemoveBackgroundOptions {
  sourceImage: string;
  imageSize?: ImageSize;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const GEMINI_MODEL = 'gemini-3-pro-image-preview';
const DEFAULT_IMAGE_SIZE: ImageSize = '2K';

/**
 * Extracted inline data from Gemini response parts
 */
interface InlineImageData {
  data: string;
  mimeType?: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Strip base64 prefix from data URL
 */
function stripBase64Prefix(dataUrl: string): string {
  return dataUrl.replace(/^data:image\/\w+;base64,/, '');
}

/**
 * Extract image URL from Gemini response
 * Uses unknown type since Gemini SDK types are complex and vary by version
 */
function extractImageUrl(response: unknown): string | null {
  const resp = response as {
    candidates?: Array<{
      content?: {
        parts?: Array<{ inlineData?: InlineImageData }>;
      };
    }>;
  };

  if (resp.candidates && resp.candidates[0]?.content?.parts) {
    for (const part of resp.candidates[0].content.parts) {
      if (part.inlineData?.data) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
  }
  return null;
}

/**
 * Build the effective prompt combining style template and user prompt
 */
function buildEffectivePrompt(
  userPrompt: string,
  stylePreset: StylePreset | null | undefined
): string {
  if (stylePreset) {
    return `${stylePreset.promptTemplate}\n\n${userPrompt}`.trim();
  }
  return userPrompt.trim();
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Custom hook for AI-powered asset generation
 * Provides methods for text-to-image, style transfer, and background removal
 */
export function useAssetGeneration(options: UseAssetGenerationOptions = {}) {
  const { onSuccess, onError } = options;

  const [isGenerating, setIsGenerating] = useState(false);
  const [lastResult, setLastResult] = useState<GenerationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  /**
   * Initialize the Gemini AI client
   */
  const getAIClient = useCallback(async () => {
    const { GoogleGenAI } = await import('@google/genai');
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
  }, []);

  /**
   * Handle generation errors consistently
   */
  const handleError = useCallback((err: unknown, fallbackMessage: string) => {
    console.error('Asset Generation Error:', err);

    let message = fallbackMessage;
    const error = err as { status?: number; message?: string; toString?: () => string };

    if (error?.status === 403 || error?.toString?.().includes('403')) {
      message = 'Access denied. Please check your API key.';
    } else if (error?.message) {
      message = `Generation failed: ${error.message}`;
    }

    setError(message);
    onError?.(message);
  }, [onError]);

  /**
   * Generate an image from a text prompt
   */
  const generateFromPrompt = useCallback(async ({
    prompt,
    stylePreset,
    imageSize = DEFAULT_IMAGE_SIZE,
    aspectRatio = '1:1',
  }: GenerateFromPromptOptions): Promise<GenerationResult | null> => {
    const effectivePrompt = buildEffectivePrompt(prompt, stylePreset);

    if (!effectivePrompt) {
      const message = 'Please enter a prompt or select a style preset';
      setError(message);
      onError?.(message);
      return null;
    }

    setIsGenerating(true);
    setError(null);
    const startTime = performance.now();

    try {
      const ai = await getAIClient();

      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: { parts: [{ text: effectivePrompt }] },
        config: {
          imageConfig: {
            imageSize,
            aspectRatio,
          },
        },
      });

      const imageUrl = extractImageUrl(response);

      if (!imageUrl) {
        throw new Error('No image was returned from the API');
      }

      const result: GenerationResult = {
        imageUrl,
        metadata: {
          prompt: effectivePrompt,
          model: GEMINI_MODEL,
          size: imageSize,
          processingTimeMs: performance.now() - startTime,
          transformationType: 'generate',
        },
      };

      setLastResult(result);
      onSuccess?.(result);
      return result;

    } catch (err) {
      handleError(err, 'Failed to generate image');
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, [getAIClient, handleError, onSuccess, onError]);

  /**
   * Transform an image with a style preset
   */
  const transformWithStyle = useCallback(async ({
    sourceImage,
    stylePreset,
    additionalPrompt = '',
    imageSize = DEFAULT_IMAGE_SIZE,
  }: TransformWithStyleOptions): Promise<GenerationResult | null> => {
    if (!sourceImage) {
      const message = 'Please upload an image first';
      setError(message);
      onError?.(message);
      return null;
    }

    setIsGenerating(true);
    setError(null);
    const startTime = performance.now();

    try {
      const ai = await getAIClient();

      // Build the transformation prompt
      const transformPrompt = TRANSFORMATION_PROMPTS.styleTransfer(
        stylePreset.name,
        stylePreset.promptTemplate,
        additionalPrompt
      );

      // Build content parts with both text and image
      const parts: Array<{ text: string } | { inlineData: { data: string; mimeType: string } }> = [
        { text: transformPrompt },
        {
          inlineData: {
            data: stripBase64Prefix(sourceImage),
            mimeType: 'image/png',
          },
        },
      ];

      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: { parts },
        config: {
          imageConfig: {
            imageSize,
            aspectRatio: '1:1',
          },
        },
      });

      const imageUrl = extractImageUrl(response);

      if (!imageUrl) {
        throw new Error('No image was returned from the API');
      }

      const result: GenerationResult = {
        imageUrl,
        metadata: {
          prompt: transformPrompt,
          model: GEMINI_MODEL,
          size: imageSize,
          processingTimeMs: performance.now() - startTime,
          transformationType: 'styleTransfer',
        },
      };

      setLastResult(result);
      onSuccess?.(result);
      return result;

    } catch (err) {
      handleError(err, 'Failed to apply style transfer');
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, [getAIClient, handleError, onSuccess, onError]);

  /**
   * Remove the background from an image
   */
  const removeBackground = useCallback(async ({
    sourceImage,
    imageSize = DEFAULT_IMAGE_SIZE,
  }: RemoveBackgroundOptions): Promise<GenerationResult | null> => {
    if (!sourceImage) {
      const message = 'Please upload an image first';
      setError(message);
      onError?.(message);
      return null;
    }

    setIsGenerating(true);
    setError(null);
    const startTime = performance.now();

    try {
      const ai = await getAIClient();

      const bgRemovalPrompt = TRANSFORMATION_PROMPTS.backgroundRemoval;

      // Build content parts with both text and image
      const parts: Array<{ text: string } | { inlineData: { data: string; mimeType: string } }> = [
        { text: bgRemovalPrompt },
        {
          inlineData: {
            data: stripBase64Prefix(sourceImage),
            mimeType: 'image/png',
          },
        },
      ];

      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: { parts },
        config: {
          imageConfig: {
            imageSize,
            aspectRatio: '1:1',
          },
        },
      });

      const imageUrl = extractImageUrl(response);

      if (!imageUrl) {
        throw new Error('No image was returned from the API');
      }

      const result: GenerationResult = {
        imageUrl,
        metadata: {
          prompt: bgRemovalPrompt,
          model: GEMINI_MODEL,
          size: imageSize,
          processingTimeMs: performance.now() - startTime,
          transformationType: 'backgroundRemoval',
        },
      };

      setLastResult(result);
      onSuccess?.(result);
      return result;

    } catch (err) {
      handleError(err, 'Failed to remove background');
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, [getAIClient, handleError, onSuccess, onError]);

  /**
   * Clear the current error
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Clear the last result
   */
  const clearResult = useCallback(() => {
    setLastResult(null);
  }, []);

  return {
    // State
    isGenerating,
    lastResult,
    error,

    // Methods
    generateFromPrompt,
    transformWithStyle,
    removeBackground,
    clearError,
    clearResult,
  };
}

export default useAssetGeneration;
