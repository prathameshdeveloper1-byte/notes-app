'use client';

import React, { useEffect } from 'react';
import useUIStore from '../store/useUIStore';
import useBookStore from '../store/useBookStore';
import useAuthStore from '../store/useAuthStore';
import BookShelf from '../components/books/BookShelf';
import SearchBar from '../components/search/SearchBar';
import KeyboardShortcutsModal from '../components/ui/KeyboardShortcutsModal';
import { KeyRound } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  const { darkMode, syncRoute } = useUIStore();
  const { fetchBooks } = useBookStore();
  const { checkUser } = useAuthStore();

  useEffect(() => {
    checkUser();
    fetchBooks();
    syncRoute({ bookId: null, folderId: null, pageId: null });
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, []);

  const isDemo = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('demo-project');

  return (
    <div className="min-h-screen flex flex-col bg-paper-50 dark:bg-ink-900">
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

      <div className="flex-1 bg-paper-50 dark:bg-ink-900">
        <SearchBar />
        <BookShelf />
        <KeyboardShortcutsModal />
      </div>
    </div>
  );
}
