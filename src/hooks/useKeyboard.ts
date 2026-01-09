import { useEffect, useRef } from 'react';

/**
 * Options for the useKeyboard hook
 */
export interface UseKeyboardOptions {
  /** Whether keyboard handling is enabled (default: true) */
  enabled?: boolean;
  /** Whether to call preventDefault on matched keys (default: false) */
  preventDefault?: boolean;
  /** Whether to ignore events from input/textarea elements (default: true) */
  ignoreInputs?: boolean;
}

/**
 * Key configuration mapping keys to their handlers.
 * Keys can be event.key values (e.g., 'a', 'Enter', 'ArrowLeft')
 * or event.code values (e.g., 'Space', 'KeyA').
 */
export type KeyConfig = Record<string, () => void>;

/**
 * A reusable hook for keyboard handling.
 * Replaces the duplicate keyboard handling pattern across components.
 *
 * @example
 * ```tsx
 * // Basic usage
 * useKeyboard({
 *   'Enter': handleConfirm,
 *   'Escape': handleCancel,
 *   'ArrowLeft': goToPrev,
 *   'ArrowRight': goToNext,
 * });
 *
 * // With options
 * useKeyboard(
 *   { 'Space': handleAction },
 *   { preventDefault: true, enabled: isModalOpen }
 * );
 *
 * // Number keys (1-4)
 * useKeyboard({
 *   '1': () => selectItem(0),
 *   '2': () => selectItem(1),
 *   '3': () => selectItem(2),
 *   '4': () => selectItem(3),
 * });
 * ```
 */
export function useKeyboard(
  keyConfig: KeyConfig,
  options: UseKeyboardOptions = {}
): void {
  const {
    enabled = true,
    preventDefault = false,
    ignoreInputs = true,
  } = options;

  // Use ref to avoid re-adding listeners when handlers change
  const keyConfigRef = useRef(keyConfig);
  keyConfigRef.current = keyConfig;

  const optionsRef = useRef({ enabled, preventDefault, ignoreInputs });
  optionsRef.current = { enabled, preventDefault, ignoreInputs };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const opts = optionsRef.current;

      // Skip if disabled
      if (!opts.enabled) return;

      // Skip if event is from an input element
      if (opts.ignoreInputs) {
        const target = e.target as HTMLElement;
        if (
          target instanceof HTMLInputElement ||
          target instanceof HTMLTextAreaElement ||
          target.isContentEditable
        ) {
          return;
        }
      }

      const config = keyConfigRef.current;

      // Try matching by key first, then by code
      const handler = config[e.key] || config[e.code];

      if (handler) {
        if (opts.preventDefault) {
          e.preventDefault();
        }
        handler();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []); // Empty deps - refs handle updates
}

export default useKeyboard;
