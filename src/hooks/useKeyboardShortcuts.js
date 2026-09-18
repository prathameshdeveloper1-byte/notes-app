import { useEffect } from 'react';
import useUIStore from '../store/useUIStore';
import usePageStore from '../store/usePageStore';

export function useKeyboardShortcuts({ onNewPage, onSearch, onFocusMode }) {
  useEffect(() => {
    const handler = (e) => {
      const ctrl = e.ctrlKey || e.metaKey;

      if (ctrl && e.key === 'k') {
        e.preventDefault();
        onSearch?.();
      }
      if (ctrl && e.key === 'n') {
        e.preventDefault();
        onNewPage?.();
      }
      if (ctrl && e.shiftKey && e.key === 'F') {
        e.preventDefault();
        onFocusMode?.();
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onNewPage, onSearch, onFocusMode]);
}
