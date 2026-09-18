import React, { useEffect } from 'react';
import useUIStore from './store/useUIStore';
import useBookStore from './store/useBookStore';
import BookShelf from './components/books/BookShelf';
import Sidebar from './components/layout/Sidebar';
import Topbar from './components/layout/Topbar';
import PageEditor from './components/pages/PageEditor';
import PageGrid from './components/pages/PageGrid';
import PageViewer from './components/pages/PageViewer';
import PageIndex from './components/pages/PageIndex';
import SearchBar from './components/search/SearchBar';
import { AnimatePresence, motion } from 'framer-motion';

export default function App() {
  const {
    darkMode,
    activeBookId,
    activeFolderId,
    activePageId,
    viewMode,
    focusMode,
    searchOpen,
  } = useUIStore();
  const { fetchBooks } = useBookStore();

  useEffect(() => {
    fetchBooks();
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, []);

  // No book selected → show shelf
  if (!activeBookId) {
    return (
      <div className="min-h-screen bg-paper-50 dark:bg-ink-900">
        <SearchBar />
        <BookShelf />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-paper-50 dark:bg-ink-900">
      {/* Sidebar */}
      {!focusMode && <Sidebar />}

      {/* Main area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {!focusMode && <Topbar />}

        <main className="flex-1 overflow-auto">
          <AnimatePresence mode="wait">
            {/* No folder selected → show index */}
            {!activeFolderId && (
              <motion.div
                key="index"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="h-full"
              >
                <PageIndex />
              </motion.div>
            )}

            {/* Folder selected, no page → grid or book view */}
            {activeFolderId && !activePageId && viewMode === 'grid' && (
              <motion.div
                key="grid"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="h-full"
              >
                <PageGrid />
              </motion.div>
            )}

            {activeFolderId && !activePageId && viewMode === 'book' && (
              <motion.div
                key="book"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="h-full"
              >
                <PageViewer />
              </motion.div>
            )}

            {/* Page selected → editor */}
            {activePageId && (
              <motion.div
                key={`editor-${activePageId}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="h-full"
              >
                <PageEditor />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* Global search overlay */}
      <SearchBar />
    </div>
  );
}
