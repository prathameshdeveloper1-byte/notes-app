'use client';
import React from 'react';
import useBookStore from '../../store/useBookStore';
import useUIStore from '../../store/useUIStore';
import FolderList from '../folders/FolderList';
import { Home, BookMarked, BookOpen, ChevronLeft, ChevronRight, Folder } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useRouter } from 'next/navigation';

export default function Sidebar() {
  const router = useRouter();
  const { books } = useBookStore();
  const {
    activeBookId,
    activeFolderId,
    setActiveBook,
    setActiveFolder,
    sidebarCollapsed,
    toggleSidebarCollapsed,
  } = useUIStore();

  const activeBook = books.find((b) => b.id === activeBookId);
  const accentColor = activeBook?.coverColor || '#6366f1';

  return (
    <aside
      className={cn(
        'flex flex-col h-full border-r border-paper-200 dark:border-ink-800 bg-white dark:bg-ink-900 flex-shrink-0 transition-all duration-200 relative select-none',
        sidebarCollapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Top Shelf Button & Book Title */}
      <div
        className={cn(
          'border-b border-paper-200 dark:border-ink-800 bg-paper-50/50 dark:bg-ink-900/40 transition-all',
          sidebarCollapsed ? 'p-2 flex flex-col items-center gap-2' : 'p-3.5'
        )}
        style={{ borderLeftWidth: 4, borderLeftColor: accentColor }}
      >
        <div className="flex items-center justify-between w-full">
          <button
            onClick={() => {
              setActiveBook(null);
              router.push('/');
            }}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-lg bg-white dark:bg-ink-800 hover:bg-paper-100 dark:hover:bg-ink-700 text-ink-700 dark:text-paper-200 text-xs font-semibold transition border border-paper-200 dark:border-ink-700 shadow-xs active:scale-95',
              sidebarCollapsed ? 'p-2 justify-center w-full' : 'px-2.5 py-1.5 mb-2.5'
            )}
            title="Return to bookshelf"
          >
            <Home size={14} />
            {!sidebarCollapsed && <span>Back to Shelf</span>}
          </button>

          {!sidebarCollapsed && (
            <button
              onClick={toggleSidebarCollapsed}
              className="p-1.5 rounded-lg text-ink-400 hover:text-ink-700 dark:hover:text-paper-200 hover:bg-paper-100 dark:hover:bg-ink-800 transition -mt-2.5"
              title="Collapse sidebar"
            >
              <ChevronLeft size={16} />
            </button>
          )}
        </div>

        {/* Book Badge / Avatar */}
        <div
          className={cn(
            'flex items-center gap-2',
            sidebarCollapsed ? 'justify-center w-full pt-1' : ''
          )}
          title={activeBook?.title || 'Notebook'}
        >
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-[11px] flex-shrink-0 shadow-xs"
            style={{ backgroundColor: accentColor }}
          >
            <BookOpen size={14} />
          </div>
          {!sidebarCollapsed && (
            <h2 className="font-serif font-semibold text-sm text-ink-800 dark:text-paper-100 truncate">
              {activeBook?.title || 'Notebook'}
            </h2>
          )}
        </div>
      </div>

      {/* Table of Contents Button */}
      <div className={cn('p-2.5 pb-1', sidebarCollapsed ? 'px-2' : '')}>
        <button
          onClick={() => {
            setActiveFolder(null);
            router.push(`/books/${activeBookId}`);
          }}
          className={cn(
            'flex items-center rounded-xl text-xs font-semibold transition-all border shadow-xs active:scale-[0.98]',
            sidebarCollapsed
              ? 'justify-center w-full p-2.5'
              : 'gap-2.5 w-full px-3 py-2.5',
            !activeFolderId
              ? 'bg-ink-800 text-white dark:bg-paper-100 dark:text-ink-900 border-ink-800 dark:border-paper-100 shadow-sm'
              : 'bg-white dark:bg-ink-800/80 text-ink-700 dark:text-paper-200 border-paper-200 dark:border-ink-700 hover:bg-paper-100 dark:hover:bg-ink-700 hover:border-paper-300'
          )}
          title="Table of Contents (Index)"
        >
          <BookMarked
            size={16}
            className={!activeFolderId ? 'text-white dark:text-ink-900' : 'text-blue-500'}
          />
          {!sidebarCollapsed && <span className="truncate">Index (Table of Contents)</span>}
        </button>
      </div>

      <div className={cn('border-t border-paper-200 dark:border-ink-800 my-2', sidebarCollapsed ? 'mx-2' : 'mx-3')} />

      {!sidebarCollapsed && (
        <div className="px-3 py-1">
          <span className="text-[10px] font-bold uppercase tracking-widest text-ink-400 dark:text-ink-500">
            Chapters
          </span>
        </div>
      )}

      {/* Chapter List */}
      <div className="flex-1 overflow-y-auto pb-4 custom-scrollbar">
        <FolderList collapsed={sidebarCollapsed} />
      </div>

      {/* Expand Button when collapsed */}
      {sidebarCollapsed && (
        <div className="p-2 border-t border-paper-200 dark:border-ink-800 flex justify-center">
          <button
            onClick={toggleSidebarCollapsed}
            className="p-2 rounded-xl text-ink-500 hover:text-ink-800 dark:hover:text-paper-100 hover:bg-paper-100 dark:hover:bg-ink-800 transition"
            title="Expand sidebar"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}
    </aside>
  );
}
