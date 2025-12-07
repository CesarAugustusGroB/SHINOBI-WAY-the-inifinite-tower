import { useCallback, useState } from 'react';
import { Enemy } from '../game/types';
import { generateEnemyImage } from '../game/systems/EnemySystem';

// Extend Window interface for AI Studio integration
declare global {
  interface Window {
    aistudio?: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

interface UseGenAIProps {
  onSuccess: (imageUrl: string) => void;
  onError: (message: string) => void;
}

/**
 * Custom hook for handling Google GenAI image generation
 * Encapsulates API key handling and external API calls
 * Separates AI concerns from game logic
 */
export const useGenAI = ({ onSuccess, onError }: UseGenAIProps) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const generateImage = useCallback(
    async (enemy: Enemy, imageSize: '1K' | '2K' | '4K') => {
      if (!enemy) return;

      // Check for API key availability through window.aistudio
      if (window.aistudio) {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        if (!hasKey) {
          await window.aistudio.openSelectKey();
        }
      }

      setIsGenerating(true);
      try {
        const imageUrl = await generateEnemyImage(enemy, imageSize);
        if (imageUrl) {
          onSuccess(imageUrl);
        } else {
          onError("Genjutsu failed (No image returned).");
        }
      } catch (error: any) {
        console.error("Image Gen Error", error);
        if (error.toString().includes("403") || error.toString().includes("Permission denied")) {
          onError("Access denied. Please select a valid API Key.");
          if (window.aistudio) await window.aistudio.openSelectKey();
        } else {
          onError("Failed to visualize enemy.");
        }
      } finally {
        setIsGenerating(false);
      }
    },
    [onSuccess, onError]
  );

  return { generateImage, isGenerating };
};
