import { useEffect } from 'react';
import useUIStore from '../store/useUIStore';

export function useKeyboardShortcuts({
  onNewPage,
  onSearch,
  onFocusMode,
  onSave,
  onPrevPage,
  onNextPage,
}) {
  const { setShortcutsModalOpen, toggleDarkMode, toggleFocusMode } = useUIStore();

  useEffect(() => {
    const handler = (e) => {
      const ctrl = e.ctrlKey || e.metaKey;
      const target = e.target;
      const isTyping =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable ||
          target.closest?.('.tiptap') ||
          target.closest?.('.ProseMirror'));

      // 1. Ctrl + K -> Search
      if (ctrl && e.key === 'k') {
        e.preventDefault();
        onSearch?.();
        return;
      }

      // 2. Ctrl + S -> Force Save
      if (ctrl && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        onSave?.();
        return;
      }

      // 3. Ctrl + N -> New Page
      if (ctrl && e.key === 'n') {
        e.preventDefault();
        onNewPage?.();
        return;
      }

      // 4. Ctrl + Shift + F -> Focus Mode
      if (ctrl && e.shiftKey && (e.key === 'F' || e.key === 'f')) {
        e.preventDefault();
        if (onFocusMode) onFocusMode();
        else toggleFocusMode();
        return;
      }

      // 5. '?' or Shift + '/' -> Open Shortcuts Modal (only when not typing in text field)
      if (!isTyping && (e.key === '?' || (e.shiftKey && e.key === '/'))) {
        e.preventDefault();
        setShortcutsModalOpen(true);
        return;
      }

      // 6. 'd' or 'D' -> Toggle dark mode (only when not typing)
      if (!isTyping && !ctrl && !e.altKey && (e.key === 'd' || e.key === 'D')) {
        e.preventDefault();
        toggleDarkMode();
        return;
      }

      // 7. Arrow keys for page navigation in Book view / Focus mode (only when not typing)
      if (!isTyping && !ctrl && !e.altKey) {
        if (e.key === 'ArrowLeft') {
          onPrevPage?.();
        } else if (e.key === 'ArrowRight') {
          onNextPage?.();
        }
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onNewPage, onSearch, onFocusMode, onSave, onPrevPage, onNextPage, setShortcutsModalOpen, toggleDarkMode, toggleFocusMode]);
}
