'use client';
import React, { useEffect, useRef } from 'react';
import useUIStore from '../../store/useUIStore';
import usePageStore from '../../store/usePageStore';
import { useSearch } from '../../hooks/useSearch';
import { Search, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { formatDate } from '../../lib/utils';
import { useRouter } from 'next/navigation';

export default function SearchBar() {
  const router = useRouter();
  const { searchOpen, setSearchOpen, setActiveBook, setActiveFolder, setActivePage } = useUIStore();
  const { bookPages } = usePageStore();
  const { query, setQuery, results } = useSearch(bookPages);
  const inputRef = useRef(null);

  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery('');
    }
  }, [searchOpen]);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape' && searchOpen) setSearchOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [searchOpen]);

  const navigate = (page) => {
    setActiveBook(page.bookId);
    setActiveFolder(page.folderId);
    setActivePage(page.id);
    setSearchOpen(false);
    router.push(`/books/${page.bookId}/pages/${page.id}`);
  };

  return (
    <AnimatePresence>
      {searchOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4"
        >
          <div className="absolute inset-0 bg-ink-900/60 backdrop-blur-sm" onClick={() => setSearchOpen(false)} />

          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="relative bg-white dark:bg-ink-800 rounded-2xl shadow-page w-full max-w-lg overflow-hidden"
          >
            <div className="flex items-center gap-3 px-4 py-3 border-b border-paper-200 dark:border-ink-700">
              <Search size={18} className="text-ink-300 flex-shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search all pages..."
                className="flex-1 bg-transparent text-ink-800 dark:text-paper-100 placeholder-ink-300 focus:outline-none text-base"
              />
              {query && (
                <button onClick={() => setQuery('')} className="text-ink-300 hover:text-ink-600 transition">
                  <X size={16} />
                </button>
              )}
              <kbd className="hidden sm:inline text-xs text-ink-300 border border-paper-200 dark:border-ink-600 rounded px-1.5 py-0.5">Esc</kbd>
            </div>

            <div className="max-h-80 overflow-y-auto">
              {!query.trim() && (
                <p className="text-sm text-ink-300 text-center py-8">Type to search across all pages...</p>
              )}
              {query.trim() && results.length === 0 && (
                <p className="text-sm text-ink-300 text-center py-8">No pages found for "{query}"</p>
              )}
              {results.map(({ item }) => (
                <button
                  key={item.id}
                  onClick={() => navigate(item)}
                  className="flex items-center justify-between w-full px-4 py-3 hover:bg-paper-50 dark:hover:bg-ink-700 transition text-left"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink-800 dark:text-paper-100 truncate">{item.title}</p>
                    {item.tags?.length > 0 && (
                      <div className="flex gap-1 mt-0.5">
                        {item.tags.slice(0, 3).map(t => (
                          <span key={t} className="text-xs text-ink-400 dark:text-ink-500">#{t}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-ink-300 flex-shrink-0 ml-3">{formatDate(item.updatedAt)}</span>
                </button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
