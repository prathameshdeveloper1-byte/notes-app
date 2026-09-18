'use client';
import React from 'react';
import useBookStore from '../../store/useBookStore';
import useUIStore from '../../store/useUIStore';
import FolderList from '../folders/FolderList';
import { Home, BookMarked } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function Sidebar() {
  const { books } = useBookStore();
  const { activeBookId, activeFolderId, setActiveBook, setActiveFolder } = useUIStore();

  const activeBook = books.find(b => b.id === activeBookId);
  const accentColor = activeBook?.coverColor || '#6366f1';

  return (
    <aside
      className="flex flex-col w-60 h-full border-r border-paper-200 dark:border-ink-800 bg-white dark:bg-ink-900 flex-shrink-0 overflow-hidden"
    >
      <div
        className="px-4 py-4 border-b border-paper-200 dark:border-ink-800"
        style={{ borderLeftWidth: 4, borderLeftColor: accentColor }}
      >
        <button
          onClick={() => setActiveBook(null)}
          className="flex items-center gap-2 text-xs text-ink-400 hover:text-ink-600 dark:hover:text-ink-200 transition mb-2"
        >
          <Home size={12} /> Back to Shelf
        </button>
        <h2 className="font-serif font-semibold text-sm text-ink-800 dark:text-paper-100 truncate">
          {activeBook?.title || 'Book'}
        </h2>
      </div>

      <div className="px-2 pt-3 pb-1">
        <button
          onClick={() => setActiveFolder(null)}
          className={cn(
            'flex items-center gap-2 w-full px-3 py-2 rounded-xl text-sm transition',
            !activeFolderId
              ? 'bg-ink-800/10 dark:bg-paper-100/10 text-ink-800 dark:text-paper-100 font-medium'
              : 'text-ink-500 dark:text-ink-400 hover:bg-ink-50 dark:hover:bg-ink-800'
          )}
        >
          <BookMarked size={14} /> Index (Table of Contents)
        </button>
      </div>

      <div className="mx-4 border-t border-paper-200 dark:border-ink-800 my-1" />

      <div className="px-4 py-1">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-ink-300 dark:text-ink-600">
          Chapters
        </span>
      </div>

      <div className="flex-1 overflow-y-auto pb-4">
        <FolderList />
      </div>
    </aside>
  );
}
