import { useEffect } from 'react';

/**
 * Global Keyboard Shortcuts Hook
 * Space: Play/Pause (only when NOT focused on buttons, links, inputs, selects, or summary)
 * ArrowLeft / ArrowRight: Step Year (only when focused on body, main, or timeline slider)
 * ArrowUp / ArrowDown: Speed change (only when focused on body, main, or timeline slider)
 * KeyM: Toggle Mute (only when NOT typing in form fields)
 * KeyH: Open Keyboard Shortcuts Modal
 * Escape: Close any open modal
 */
export function useKeyboardShortcuts({
  onTogglePlay,
  onStepBackward,
  onStepForward,
  onIncreaseSpeed,
  onDecreaseSpeed,
  onToggleMute,
  onToggleHelpModal,
  onCloseModal
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      const activeEl = document.activeElement;

      // Escape always closes any open dialog/modal
      if (e.code === 'Escape') {
        e.preventDefault();
        onCloseModal?.();
        return;
      }

      // Check if focus is on an interactive UI element
      const isInteractive =
        activeEl &&
        (activeEl.tagName === 'BUTTON' ||
         activeEl.tagName === 'A' ||
         activeEl.tagName === 'SELECT' ||
         activeEl.tagName === 'TEXTAREA' ||
         activeEl.tagName === 'SUMMARY' ||
         activeEl.isContentEditable ||
         (activeEl.tagName === 'INPUT' && activeEl.type !== 'range'));

      // If focused on a button, link, input, select, summary: do NOT intercept Space or normal keys
      if (isInteractive) {
        return;
      }

      // Arrow keys: only trigger global steps when focus is on body, main region, or timeline range slider
      const isGlobalArrowScope =
        !activeEl ||
        activeEl === document.body ||
        activeEl === document.documentElement ||
        activeEl.id === 'main-content' ||
        (activeEl.tagName === 'INPUT' && activeEl.type === 'range');

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          onTogglePlay?.();
          break;

        case 'ArrowLeft':
          if (isGlobalArrowScope) {
            e.preventDefault();
            onStepBackward?.();
          }
          break;

        case 'ArrowRight':
          if (isGlobalArrowScope) {
            e.preventDefault();
            onStepForward?.();
          }
          break;

        case 'ArrowUp':
          if (isGlobalArrowScope) {
            e.preventDefault();
            onIncreaseSpeed?.();
          }
          break;

        case 'ArrowDown':
          if (isGlobalArrowScope) {
            e.preventDefault();
            onDecreaseSpeed?.();
          }
          break;

        case 'KeyM':
          e.preventDefault();
          onToggleMute?.();
          break;

        case 'KeyH':
          e.preventDefault();
          onToggleHelpModal?.();
          break;

        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    onTogglePlay,
    onStepBackward,
    onStepForward,
    onIncreaseSpeed,
    onDecreaseSpeed,
    onToggleMute,
    onToggleHelpModal,
    onCloseModal
  ]);
}
