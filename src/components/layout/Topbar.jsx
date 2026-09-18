'use client';
import React from 'react';
import useUIStore from '../../store/useUIStore';
import useBookStore from '../../store/useBookStore';
import useFolderStore from '../../store/useFolderStore';
import usePageStore from '../../store/usePageStore';
import useAuthStore from '../../store/useAuthStore';
import ViewToggle from './ViewToggle';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import { Search, Moon, Sun, Maximize2, Minimize2, Download, Plus, ChevronRight, LogOut, User } from 'lucide-react';
import { exportBookAsPDF } from '../../lib/pdfExport';

export default function Topbar() {
  const {
    darkMode, toggleDarkMode,
    focusMode, toggleFocusMode,
    setSearchOpen,
    activeBookId, activeFolderId, activePageId,
    setActivePage, setActiveFolder,
  } = useUIStore();
  const { books } = useBookStore();
  const { folders } = useFolderStore();
  const { pages, bookPages, addPage, saving } = usePageStore();
  const { user, signOut } = useAuthStore();

  const activeBook = books.find(b => b.id === activeBookId);
  const activeFolder = folders.find(f => f.id === activeFolderId);
  const activePage = [...pages, ...bookPages].find(p => p.id === activePageId);

  const handleNewPage = async () => {
    if (!activeFolderId) return;
    const id = await addPage({ bookId: activeBookId, folderId: activeFolderId, title: 'Untitled Page' });
    setActivePage(id);
  };

  const handleExport = async () => {
    if (!activeBook) return;
    const pagesByFolder = {};
    for (const folder of folders) {
      pagesByFolder[folder.id] = bookPages.filter(p => p.folderId === folder.id);
    }
    await exportBookAsPDF(activeBook, folders, pagesByFolder);
  };

  useKeyboardShortcuts({
    onNewPage: handleNewPage,
    onSearch: () => setSearchOpen(true),
    onFocusMode: toggleFocusMode,
  });

  return (
    <header className="flex items-center gap-3 px-4 py-3 border-b border-paper-200 dark:border-ink-800 bg-white dark:bg-ink-900 flex-shrink-0">
      <div className="flex items-center gap-1 text-sm text-ink-400 dark:text-ink-500 flex-1 min-w-0">
        <button onClick={() => setActiveFolder(null)} className="hover:text-ink-700 dark:hover:text-paper-100 transition truncate">
          {activeBook?.title || 'Book'}
        </button>
        {activeFolder && (
          <>
            <ChevronRight size={14} className="flex-shrink-0" />
            <button onClick={() => setActivePage(null)} className="hover:text-ink-700 dark:hover:text-paper-100 transition truncate">
              {activeFolder.title}
            </button>
          </>
        )}
        {activePage && (
          <>
            <ChevronRight size={14} className="flex-shrink-0" />
            <span className="text-ink-700 dark:text-paper-100 font-medium truncate">{activePage.title}</span>
          </>
        )}
        {saving && <span className="text-xs text-ink-300 ml-2 animate-pulse">Syncing…</span>}
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {activeFolderId && !activePageId && <ViewToggle />}

        <button
          onClick={() => setSearchOpen(true)}
          className="p-2 hover:bg-paper-100 dark:hover:bg-ink-800 rounded-xl transition text-ink-500"
          title="Search (Ctrl+K)"
        >
          <Search size={16} />
        </button>

        {activeFolderId && (
          <button
            onClick={handleNewPage}
            className="p-2 hover:bg-paper-100 dark:hover:bg-ink-800 rounded-xl transition text-ink-500"
            title="New Page (Ctrl+N)"
          >
            <Plus size={16} />
          </button>
        )}

        <button
          onClick={handleExport}
          className="p-2 hover:bg-paper-100 dark:hover:bg-ink-800 rounded-xl transition text-ink-500"
          title="Export as PDF"
        >
          <Download size={16} />
        </button>

        <button
          onClick={toggleFocusMode}
          className="p-2 hover:bg-paper-100 dark:hover:bg-ink-800 rounded-xl transition text-ink-500"
          title="Focus mode (Ctrl+Shift+F)"
        >
          {focusMode ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
        </button>

        <button
          onClick={toggleDarkMode}
          className="p-2 hover:bg-paper-100 dark:hover:bg-ink-800 rounded-xl transition text-ink-500"
          title="Toggle theme"
        >
          {darkMode ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {user && (
          <div className="flex items-center gap-2 pl-2 border-l border-paper-200 dark:border-ink-800">
            <span className="text-xs text-ink-500 dark:text-ink-400 hidden sm:inline max-w-[120px] truncate" title={user.email}>
              {user.email}
            </span>
            <button
              onClick={() => signOut()}
              className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-ink-400 hover:text-red-500 rounded-xl transition"
              title="Sign Out"
            >
              <LogOut size={15} />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
