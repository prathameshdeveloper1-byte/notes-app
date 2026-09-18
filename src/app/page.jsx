'use client';

import React, { useEffect } from 'react';
import useUIStore from '../store/useUIStore';
import useBookStore from '../store/useBookStore';
import useAuthStore from '../store/useAuthStore';
import BookShelf from '../components/books/BookShelf';
import Sidebar from '../components/layout/Sidebar';
import Topbar from '../components/layout/Topbar';
import PageEditor from '../components/pages/PageEditor';
import PageGrid from '../components/pages/PageGrid';
import PageViewer from '../components/pages/PageViewer';
import PageIndex from '../components/pages/PageIndex';
import SearchBar from '../components/search/SearchBar';
import { AnimatePresence, motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { BookOpen, KeyRound } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  const router = useRouter();
  const {
    darkMode,
    activeBookId,
    activeFolderId,
    activePageId,
    viewMode,
    focusMode,
  } = useUIStore();
  const { fetchBooks } = useBookStore();
  const { user, loading: authLoading, checkUser } = useAuthStore();

  useEffect(() => {
    checkUser();
    fetchBooks();
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, []);

  const isDemo = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('demo-project');

  return (
    <div className="min-h-screen flex flex-col bg-paper-50 dark:bg-ink-900">
      {/* Demo / Config Notice if credentials not set */}
      {isDemo && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 text-amber-800 dark:text-amber-200 px-4 py-2 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <KeyRound size={14} />
            <span>
              <strong>Supabase Setup:</strong> Connect your Supabase project by adding your keys to <code>.env.local</code>. Run <code>supabase-schema.sql</code> in your Supabase SQL editor.
            </span>
          </div>
          <Link href="/login" className="underline hover:text-amber-900 font-medium">
            Go to Sign In
          </Link>
        </div>
      )}

      {/* Main App Container */}
      {!activeBookId ? (
        <div className="flex-1 bg-paper-50 dark:bg-ink-900">
          <SearchBar />
          <BookShelf />
        </div>
      ) : (
        <div className="flex flex-1 h-[calc(100vh-2rem)] overflow-hidden">
          {!focusMode && <Sidebar />}

          <div className="flex flex-col flex-1 overflow-hidden">
            {!focusMode && <Topbar />}

            <main className="flex-1 overflow-auto">
              <AnimatePresence mode="wait">
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

          <SearchBar />
        </div>
      )}
    </div>
  );
}
