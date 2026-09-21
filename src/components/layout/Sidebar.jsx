'use client';
import React, { useState } from 'react';
import useBookStore from '../../store/useBookStore';
import useUIStore from '../../store/useUIStore';
import useFolderStore from '../../store/useFolderStore';
import usePageStore from '../../store/usePageStore';
import FolderList from '../folders/FolderList';
import FolderCreateModal from '../folders/FolderCreateModal';
import {
  ArrowLeft,
  BookMarked,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Plus,
  Bookmark,
  Library,
  Layers,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useRouter } from 'next/navigation';
import { playPaperTurnSound, playTabClickSound } from '../../lib/soundEffects';

export default function Sidebar() {
  const router = useRouter();
  const { books } = useBookStore();
  const { folders } = useFolderStore();
  const { bookPages } = usePageStore();
  const {
    activeBookId,
    activeFolderId,
    activePageId,
    setActiveBook,
    setActiveFolder,
    setActivePage,
    sidebarCollapsed,
    toggleSidebarCollapsed,
    soundEnabled,
  } = useUIStore();

  const [createFolderModalOpen, setCreateFolderModalOpen] = useState(false);

  const activeBook = books.find((b) => b.id === activeBookId);
  const accentColor = activeBook?.coverColor || '#6366f1';
  const isIndexActive = !activeFolderId && !activePageId;

  const handleBackToShelf = () => {
    if (soundEnabled) playPaperTurnSound();
    setActiveBook(null);
    router.push('/');
  };

  const handleGoToIndex = () => {
    if (soundEnabled) playTabClickSound();
    setActiveFolder(null);
    setActivePage(null);
    router.push(`/books/${activeBookId}`);
  };

  return (
    <aside
      className={cn(
        'flex flex-col h-full border-r border-paper-200 dark:border-ink-800 bg-paper-50/70 dark:bg-ink-900/90 backdrop-blur-sm flex-shrink-0 transition-all duration-200 relative select-none z-20',
        sidebarCollapsed ? 'w-16' : 'w-72'
      )}
      style={{
        borderLeft: `4px solid ${accentColor}`,
      }}
    >
      {/* Top Header: Bookshelf Back Button & Collapse Controls */}
      <div
        className={cn(
          'border-b border-paper-200/90 dark:border-ink-800 bg-white/70 dark:bg-ink-900/60 backdrop-blur-xs transition-all',
          sidebarCollapsed ? 'p-2 flex flex-col items-center gap-2' : 'p-3.5 pb-3'
        )}
      >
        <div className="flex items-center justify-between w-full">
          <button
            onClick={handleBackToShelf}
            className={cn(
              'group inline-flex items-center gap-1.5 rounded-xl bg-white dark:bg-ink-800 hover:bg-paper-100 dark:hover:bg-ink-700 text-ink-700 dark:text-paper-200 text-xs font-semibold transition border border-paper-200 dark:border-ink-700 shadow-2xs hover:shadow-xs active:scale-95',
              sidebarCollapsed ? 'p-2 justify-center w-full' : 'px-2.5 py-1.5'
            )}
            title="Return to Bookshelf"
          >
            <ArrowLeft
              size={14}
              className="text-ink-500 dark:text-paper-400 group-hover:-translate-x-0.5 transition-transform duration-200"
            />
            {!sidebarCollapsed && <span>Bookshelf</span>}
          </button>

          {!sidebarCollapsed && (
            <button
              onClick={toggleSidebarCollapsed}
              className="p-1.5 rounded-xl text-ink-400 hover:text-ink-700 dark:hover:text-paper-200 hover:bg-paper-100 dark:hover:bg-ink-800 transition"
              title="Collapse sidebar"
            >
              <ChevronLeft size={16} />
            </button>
          )}
        </div>

        {/* Current Book Info Card */}
        <div
          onClick={handleGoToIndex}
          className={cn(
            'group flex items-center gap-2.5 cursor-pointer rounded-xl transition-all',
            sidebarCollapsed
              ? 'justify-center w-full pt-1'
              : 'mt-3 p-2 bg-paper-100/50 hover:bg-paper-100 dark:bg-ink-800/40 dark:hover:bg-ink-800/80 border border-transparent hover:border-paper-200 dark:hover:border-ink-700'
          )}
          title={`Notebook: ${activeBook?.title || 'Notebook'}`}
        >
          {/* Book Icon with 3D Spine Trim */}
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs flex-shrink-0 shadow-sm relative overflow-hidden group-hover:scale-105 transition-transform"
            style={{ backgroundColor: accentColor }}
          >
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-black/20" />
            <BookOpen size={15} />
          </div>

          {!sidebarCollapsed && (
            <div className="min-w-0 flex-1">
              <h2 className="font-serif font-bold text-sm text-ink-900 dark:text-paper-100 truncate leading-tight group-hover:text-ink-950 dark:group-hover:text-white transition-colors">
                {activeBook?.title || 'Notebook'}
              </h2>
              <p className="text-[11px] text-ink-400 dark:text-ink-400 truncate mt-0.5">
                {folders.length} {folders.length === 1 ? 'chapter' : 'chapters'} &bull; {bookPages.length} {bookPages.length === 1 ? 'page' : 'pages'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Index (Table of Contents) Tab Button */}
      <div className={cn('p-2.5 pb-1', sidebarCollapsed ? 'px-2' : '')}>
        <button
          onClick={handleGoToIndex}
          className={cn(
            'flex items-center rounded-xl text-xs font-semibold transition-all border shadow-2xs active:scale-[0.98]',
            sidebarCollapsed
              ? 'justify-center w-full p-2.5'
              : 'gap-2.5 w-full px-3 py-2.5',
            isIndexActive
              ? 'bg-ink-900 text-white dark:bg-paper-100 dark:text-ink-900 border-ink-900 dark:border-paper-100 shadow-xs'
              : 'bg-white dark:bg-ink-800/80 text-ink-700 dark:text-paper-200 border-paper-200 dark:border-ink-700 hover:bg-paper-100 dark:hover:bg-ink-700 hover:border-paper-300'
          )}
          title="Table of Contents (Index)"
        >
          <BookMarked
            size={16}
            className={
              isIndexActive
                ? 'text-amber-400 dark:text-amber-600'
                : 'text-amber-600 dark:text-amber-400'
            }
          />
          {!sidebarCollapsed && (
            <>
              <span className="truncate flex-1 text-left">Table of Contents</span>
              <span
                className={cn(
                  'text-[10px] font-mono px-1.5 py-0.5 rounded-full font-bold',
                  isIndexActive
                    ? 'bg-ink-700 text-paper-200 dark:bg-paper-300 dark:text-ink-800'
                    : 'bg-paper-100 dark:bg-ink-700 text-ink-500 dark:text-paper-300'
                )}
              >
                {bookPages.length}
              </span>
            </>
          )}
        </button>
      </div>

      {/* Section Divider & Header */}
      <div className={cn('border-t border-paper-200 dark:border-ink-800 my-1.5', sidebarCollapsed ? 'mx-2' : 'mx-3')} />

      {!sidebarCollapsed && (
        <div className="px-3 py-1 flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-ink-400 dark:text-ink-500">
            Chapters &amp; Notes
          </span>
          <button
            onClick={() => setCreateFolderModalOpen(true)}
            className="p-1 rounded-md text-ink-400 hover:text-ink-800 dark:hover:text-paper-100 hover:bg-paper-200/60 dark:hover:bg-ink-800 transition"
            title="Create Chapter"
          >
            <Plus size={13} />
          </button>
        </div>
      )}

      {/* Chapters and Pages List */}
      <div className="flex-1 overflow-y-auto pb-4 custom-scrollbar">
        <FolderList
          collapsed={sidebarCollapsed}
          createModalOpen={createFolderModalOpen}
          setCreateModalOpen={setCreateFolderModalOpen}
          accentColor={accentColor}
        />
      </div>

      {/* Expand Button when collapsed */}
      {sidebarCollapsed && (
        <div className="p-2 border-t border-paper-200 dark:border-ink-800 flex justify-center bg-white/50 dark:bg-ink-900/50">
          <button
            onClick={toggleSidebarCollapsed}
            className="p-2 rounded-xl text-ink-500 hover:text-ink-800 dark:hover:text-paper-100 hover:bg-paper-100 dark:hover:bg-ink-800 transition shadow-2xs"
            title="Expand sidebar"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}

      <FolderCreateModal
        open={createFolderModalOpen}
        onClose={() => setCreateFolderModalOpen(false)}
      />
    </aside>
  );
}
