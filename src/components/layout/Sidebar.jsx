'use client';
import React from 'react';
import useBookStore from '../../store/useBookStore';
import useUIStore from '../../store/useUIStore';
import FolderList from '../folders/FolderList';
import { Home, BookMarked, BookOpen } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function Sidebar() {
  const { books } = useBookStore();
  const { activeBookId, activeFolderId, setActiveBook, setActiveFolder } = useUIStore();

  const activeBook = books.find(b => b.id === activeBookId);
  const accentColor = activeBook?.coverColor || '#6366f1';

  return (
    <aside
      className="flex flex-col w-64 h-full border-r border-paper-200 dark:border-ink-800 bg-white dark:bg-ink-900 flex-shrink-0 overflow-hidden"
    >
      {/* Top Shelf Button & Book Title */}
      <div
        className="p-3.5 border-b border-paper-200 dark:border-ink-800 bg-paper-50/50 dark:bg-ink-900/40"
        style={{ borderLeftWidth: 4, borderLeftColor: accentColor }}
      >
        <button
          onClick={() => setActiveBook(null)}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white dark:bg-ink-800 hover:bg-paper-100 dark:hover:bg-ink-700 text-ink-700 dark:text-paper-200 text-xs font-semibold transition border border-paper-200 dark:border-ink-700 shadow-xs mb-2.5 active:scale-95"
          title="Return to bookshelf"
        >
          <Home size={13} /> Back to Shelf
        </button>
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-6 rounded-lg flex items-center justify-center text-white text-[11px] flex-shrink-0 shadow-xs"
            style={{ backgroundColor: accentColor }}
          >
            <BookOpen size={13} />
          </div>
          <h2 className="font-serif font-semibold text-sm text-ink-800 dark:text-paper-100 truncate">
            {activeBook?.title || 'Notebook'}
          </h2>
        </div>
      </div>

      {/* Table of Contents Button */}
      <div className="p-2.5 pb-1">
        <button
          onClick={() => setActiveFolder(null)}
          className={cn(
            'flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-xs font-semibold transition-all border shadow-xs active:scale-[0.98]',
            !activeFolderId
              ? 'bg-ink-800 text-white dark:bg-paper-100 dark:text-ink-900 border-ink-800 dark:border-paper-100 shadow-sm'
              : 'bg-white dark:bg-ink-800/80 text-ink-700 dark:text-paper-200 border-paper-200 dark:border-ink-700 hover:bg-paper-100 dark:hover:bg-ink-700 hover:border-paper-300'
          )}
        >
          <BookMarked size={15} className={!activeFolderId ? 'text-white dark:text-ink-900' : 'text-blue-500'} />
          <span className="truncate">Index (Table of Contents)</span>
        </button>
      </div>

      <div className="mx-3 border-t border-paper-200 dark:border-ink-800 my-2" />

      <div className="px-3 py-1">
        <span className="text-[10px] font-bold uppercase tracking-widest text-ink-400 dark:text-ink-500">
          Chapters
        </span>
      </div>

      {/* Chapter List */}
      <div className="flex-1 overflow-y-auto pb-4">
        <FolderList />
      </div>
    </aside>
  );
}
