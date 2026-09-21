'use client';
import React, { useState, useRef, useEffect } from 'react';
import useUIStore from '../../store/useUIStore';
import useBookStore from '../../store/useBookStore';
import useFolderStore from '../../store/useFolderStore';
import usePageStore from '../../store/usePageStore';
import useAuthStore from '../../store/useAuthStore';
import ViewToggle from './ViewToggle';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import {
  Search,
  Moon,
  Sun,
  Maximize2,
  Minimize2,
  Download,
  Plus,
  ChevronRight,
  LogOut,
  ChevronDown,
  BookOpen,
  HelpCircle,
} from 'lucide-react';
import { exportBookAsPDF } from '../../lib/pdfExport';
import { useRouter } from 'next/navigation';

export default function Topbar() {
  const router = useRouter();
  const {
    darkMode,
    toggleDarkMode,
    focusMode,
    toggleFocusMode,
    setSearchOpen,
    activeBookId,
    activeFolderId,
    activePageId,
    setActivePage,
    setActiveFolder,
    setActiveBook,
    setShortcutsModalOpen,
  } = useUIStore();
  const { books } = useBookStore();
  const { folders } = useFolderStore();
  const { pages, bookPages, addPage, saving } = usePageStore();
  const { user, signOut } = useAuthStore();

  const [bookMenuOpen, setBookMenuOpen] = useState(false);
  const bookMenuRef = useRef(null);

  const activeBook = books.find((b) => b.id === activeBookId);
  const activeFolder = folders.find((f) => f.id === activeFolderId);
  const activePage = [...pages, ...bookPages].find((p) => p.id === activePageId);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (bookMenuRef.current && !bookMenuRef.current.contains(e.target)) {
        setBookMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNewPage = async () => {
    if (!activeFolderId) return;
    const id = await addPage({ bookId: activeBookId, folderId: activeFolderId, title: 'Untitled Page' });
    setActivePage(id);
    router.push(`/books/${activeBookId}/pages/${id}`);
  };

  const handleExport = async () => {
    if (!activeBook) return;
    const pagesByFolder = {};
    for (const folder of folders) {
      pagesByFolder[folder.id] = bookPages.filter((p) => p.folderId === folder.id);
    }
    await exportBookAsPDF(activeBook, folders, pagesByFolder);
  };

  useKeyboardShortcuts({
    onNewPage: handleNewPage,
    onSearch: () => setSearchOpen(true),
    onFocusMode: toggleFocusMode,
  });

  return (
    <header className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 border-b border-paper-200 dark:border-ink-800 bg-white dark:bg-ink-900 flex-shrink-0 z-20">
      {/* Breadcrumb Hierarchy with Book Switcher Dropdown */}
      <div className="flex items-center gap-1 text-sm text-ink-400 dark:text-ink-500 flex-1 min-w-0">
        {/* Book switcher */}
        <div className="relative" ref={bookMenuRef}>
          <button
            onClick={() => setBookMenuOpen((v) => !v)}
            className="flex items-center gap-1.5 hover:text-ink-900 dark:hover:text-paper-100 transition truncate font-medium py-1 px-1.5 rounded-lg hover:bg-paper-100 dark:hover:bg-ink-800 text-xs sm:text-sm"
            title="Switch Notebook"
          >
            <span className="truncate max-w-[120px] sm:max-w-[180px]">
              {activeBook?.title || 'Notebook'}
            </span>
            <ChevronDown size={13} className="text-ink-400 flex-shrink-0" />
          </button>

          {bookMenuOpen && (
            <div className="absolute left-0 top-full mt-1.5 w-60 bg-white dark:bg-ink-850 rounded-2xl shadow-page border border-paper-200 dark:border-ink-700 py-2 z-50 animate-fade-in">
              <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-ink-400 dark:text-ink-500 border-b border-paper-200/60 dark:border-ink-750/60 mb-1">
                Switch Notebook
              </div>
              <div className="max-h-56 overflow-y-auto custom-scrollbar">
                {books.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => {
                      setBookMenuOpen(false);
                      setActiveBook(b.id);
                      setActiveFolder(null);
                      setActivePage(null);
                      router.push(`/books/${b.id}`);
                    }}
                    className={`flex items-center gap-2.5 w-full px-3 py-2 text-xs text-left transition ${
                      b.id === activeBookId
                        ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 font-semibold'
                        : 'text-ink-700 dark:text-paper-200 hover:bg-paper-100 dark:hover:bg-ink-800'
                    }`}
                  >
                    <div
                      className="w-3.5 h-3.5 rounded flex-shrink-0 shadow-2xs"
                      style={{ backgroundColor: b.coverColor || '#6366f1' }}
                    />
                    <span className="truncate flex-1">{b.title}</span>
                  </button>
                ))}
              </div>
              <div className="border-t border-paper-200/60 dark:border-ink-750/60 pt-1 mt-1 px-2">
                <button
                  onClick={() => {
                    setBookMenuOpen(false);
                    setActiveBook(null);
                    router.push('/');
                  }}
                  className="flex items-center gap-2 w-full px-2 py-1.5 text-xs text-ink-500 hover:text-ink-800 dark:hover:text-paper-100 rounded-lg hover:bg-paper-100 dark:hover:bg-ink-800 transition"
                >
                  <BookOpen size={13} />
                  <span>All Notebooks Shelf</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {activeFolder && (
          <>
            <ChevronRight size={13} className="flex-shrink-0 text-paper-300 dark:text-ink-700" />
            <button
              onClick={() => {
                setActivePage(null);
                router.push(`/books/${activeBookId}/chapters/${activeFolderId}`);
              }}
              className="hover:text-ink-700 dark:hover:text-paper-100 transition truncate text-xs sm:text-sm max-w-[100px] sm:max-w-[150px]"
            >
              {activeFolder.title}
            </button>
          </>
        )}

        {activePage && (
          <>
            <ChevronRight size={13} className="flex-shrink-0 text-paper-300 dark:text-ink-700" />
            <span className="text-ink-800 dark:text-paper-100 font-medium truncate text-xs sm:text-sm max-w-[120px] sm:max-w-[200px]">
              {activePage.title}
            </span>
          </>
        )}

        {saving && (
          <span className="text-[11px] text-amber-600 dark:text-amber-400 font-mono ml-2 animate-pulse hidden sm:inline">
            Saving…
          </span>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
        {activeFolderId && !activePageId && <ViewToggle />}

        <button
          onClick={() => setSearchOpen(true)}
          className="p-1.5 sm:p-2 hover:bg-paper-100 dark:hover:bg-ink-800 rounded-xl transition text-ink-500 hover:text-ink-800 dark:hover:text-paper-200"
          title="Search (Ctrl+K)"
        >
          <Search size={16} />
        </button>

        {activeFolderId && (
          <button
            onClick={handleNewPage}
            className="p-1.5 sm:p-2 hover:bg-paper-100 dark:hover:bg-ink-800 rounded-xl transition text-ink-500 hover:text-ink-800 dark:hover:text-paper-200"
            title="New Page (Ctrl+N)"
          >
            <Plus size={16} />
          </button>
        )}

        <button
          onClick={handleExport}
          className="p-1.5 sm:p-2 hover:bg-paper-100 dark:hover:bg-ink-800 rounded-xl transition text-ink-500 hover:text-ink-800 dark:hover:text-paper-200"
          title="Export as PDF"
        >
          <Download size={16} />
        </button>

        <button
          onClick={toggleFocusMode}
          className="p-1.5 sm:p-2 hover:bg-paper-100 dark:hover:bg-ink-800 rounded-xl transition text-ink-500 hover:text-ink-800 dark:hover:text-paper-200"
          title="Focus mode (Ctrl+Shift+F)"
        >
          {focusMode ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
        </button>

        <button
          onClick={toggleDarkMode}
          className="p-1.5 sm:p-2 hover:bg-paper-100 dark:hover:bg-ink-800 rounded-xl transition text-ink-500 hover:text-ink-800 dark:hover:text-paper-200"
          title="Toggle theme (D)"
        >
          {darkMode ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        <button
          onClick={() => setShortcutsModalOpen(true)}
          className="p-1.5 sm:p-2 hover:bg-paper-100 dark:hover:bg-ink-800 rounded-xl transition text-ink-400 hover:text-ink-700 dark:hover:text-paper-200"
          title="Keyboard Shortcuts (?)"
        >
          <HelpCircle size={16} />
        </button>

        {user && (
          <div className="flex items-center gap-1.5 pl-1.5 sm:pl-2 border-l border-paper-200 dark:border-ink-800">
            <span
              className="text-xs text-ink-500 dark:text-ink-400 hidden lg:inline max-w-[120px] truncate"
              title={user.email}
            >
              {user.email}
            </span>
            <button
              onClick={() => signOut()}
              className="p-1.5 sm:p-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-ink-400 hover:text-red-500 rounded-xl transition"
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
