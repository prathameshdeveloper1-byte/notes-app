'use client';

import React, { useEffect } from 'react';
import useUIStore from '../../../store/useUIStore';
import useBookStore from '../../../store/useBookStore';
import useFolderStore from '../../../store/useFolderStore';
import usePageStore from '../../../store/usePageStore';
import useAuthStore from '../../../store/useAuthStore';
import Sidebar from '../../../components/layout/Sidebar';
import Topbar from '../../../components/layout/Topbar';
import SearchBar from '../../../components/search/SearchBar';

export default function BookLayout({ children, params }) {
  const { bookId } = params;
  const { focusMode, syncRoute, darkMode } = useUIStore();
  const { books, fetchBooks } = useBookStore();
  const { fetchFolders } = useFolderStore();
  const { fetchBookPages } = usePageStore();
  const { checkUser } = useAuthStore();

  useEffect(() => {
    checkUser();
    syncRoute({ bookId });
    fetchBooks();
    if (bookId) {
      fetchFolders(bookId);
      fetchBookPages(bookId);
    }
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [bookId]);

  return (
    <div className="min-h-screen flex flex-col bg-paper-50 dark:bg-ink-900">
      <div className="flex flex-1 h-[calc(100vh-2rem)] overflow-hidden">
        {!focusMode && <Sidebar />}

        <div className="flex flex-col flex-1 overflow-hidden">
          {!focusMode && <Topbar />}

          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>

        <SearchBar />
      </div>
    </div>
  );
}
