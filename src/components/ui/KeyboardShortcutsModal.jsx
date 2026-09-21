'use client';
import React, { useEffect } from 'react';
import { Command, X, Keyboard } from 'lucide-react';
import useUIStore from '../../store/useUIStore';

const SHORTCUT_GROUPS = [
  {
    category: 'General Navigation',
    shortcuts: [
      { label: 'Quick Search anywhere', keys: ['Ctrl', 'K'] },
      { label: 'Close modal / Go back / Exit focus', keys: ['Esc'] },
      { label: 'Toggle Dark / Light theme', keys: ['D'] },
      { label: 'Show this shortcuts guide', keys: ['?'] },
    ],
  },
  {
    category: 'Book & Reading View',
    shortcuts: [
      { label: 'Next page in book', keys: ['→'] },
      { label: 'Previous page in book', keys: ['←'] },
      { label: 'Toggle Focus Mode', keys: ['F'] },
    ],
  },
  {
    category: 'Editor & Formatting',
    shortcuts: [
      { label: 'Save note immediately', keys: ['Ctrl', 'S'] },
      { label: 'Bold text', keys: ['Ctrl', 'B'] },
      { label: 'Italic text', keys: ['Ctrl', 'I'] },
      { label: 'Underline', keys: ['Ctrl', 'U'] },
      { label: 'Text highlight', keys: ['Ctrl', 'Shift', 'H'] },
      { label: 'Checklist task', keys: ['Ctrl', 'Shift', '9'] },
      { label: 'Bullet list', keys: ['Ctrl', 'Shift', '8'] },
      { label: 'Numbered list', keys: ['Ctrl', 'Shift', '7'] },
      { label: 'Heading 1 / 2 / 3', keys: ['Ctrl', 'Alt', '1-3'] },
    ],
  },
];

export default function KeyboardShortcutsModal() {
  const { shortcutsModalOpen, setShortcutsModalOpen } = useUIStore();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && shortcutsModalOpen) {
        setShortcutsModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcutsModalOpen, setShortcutsModalOpen]);

  if (!shortcutsModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-ink-900/60 backdrop-blur-sm transition-opacity"
        onClick={() => setShortcutsModalOpen(false)}
      />

      {/* Modal Card */}
      <div className="relative bg-white dark:bg-ink-850 rounded-2xl shadow-page border border-paper-200 dark:border-ink-700 w-full max-w-lg p-6 z-10 animate-fade-in max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-paper-200 dark:border-ink-700">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-paper-100 dark:bg-ink-750 flex items-center justify-center text-paper-700 dark:text-paper-300">
              <Keyboard size={20} />
            </div>
            <div>
              <h3 className="font-serif font-bold text-lg text-ink-900 dark:text-paper-100 leading-tight">
                Keyboard Shortcuts
              </h3>
              <p className="text-xs text-ink-400">Boost your writing speed & navigation</p>
            </div>
          </div>
          <button
            onClick={() => setShortcutsModalOpen(false)}
            className="p-1 hover:bg-paper-100 dark:hover:bg-ink-700 rounded-lg text-ink-400 hover:text-ink-600 dark:hover:text-paper-200 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Shortcuts list (scrollable) */}
        <div className="overflow-y-auto py-4 space-y-6 flex-1 pr-1 custom-scrollbar">
          {SHORTCUT_GROUPS.map((group) => (
            <div key={group.category} className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-ink-400 dark:text-ink-500 px-1">
                {group.category}
              </h4>
              <div className="bg-paper-50 dark:bg-ink-800/60 rounded-xl border border-paper-200/70 dark:border-ink-750 divide-y divide-paper-200/50 dark:divide-ink-750/70">
                {group.shortcuts.map((sc, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between px-3.5 py-2.5 text-xs text-ink-700 dark:text-paper-200"
                  >
                    <span>{sc.label}</span>
                    <div className="flex items-center gap-1">
                      {sc.keys.map((k, kIdx) => (
                        <kbd
                          key={kIdx}
                          className="px-2 py-0.5 text-[11px] font-mono font-medium rounded-md bg-white dark:bg-ink-700 border border-paper-300 dark:border-ink-600 text-ink-700 dark:text-paper-200 shadow-xs"
                        >
                          {k}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-paper-200 dark:border-ink-700 flex items-center justify-between text-xs text-ink-400">
          <span>Press <kbd className="px-1.5 py-0.5 rounded bg-paper-100 dark:bg-ink-700 text-ink-600 dark:text-paper-300 text-[10px]">Esc</kbd> to dismiss</span>
          <button
            onClick={() => setShortcutsModalOpen(false)}
            className="px-3 py-1.5 bg-paper-200 hover:bg-paper-300 dark:bg-ink-700 dark:hover:bg-ink-600 text-ink-800 dark:text-paper-200 font-medium rounded-lg transition"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
