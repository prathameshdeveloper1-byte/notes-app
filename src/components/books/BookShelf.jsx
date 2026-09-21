'use client';
import React, { useEffect, useState } from 'react';
import useBookStore from '../../store/useBookStore';
import usePageStore from '../../store/usePageStore';
import useUIStore from '../../store/useUIStore';
import BookCard from './BookCard';
import BookCreateModal from './BookCreateModal';
import { motion } from 'framer-motion';
import { BookOpen, Plus, Clock } from 'lucide-react';
import { formatDate } from '../../lib/utils';
import { useRouter } from 'next/navigation';

export default function BookShelf() {
  const router = useRouter();
  const { books, loading, fetchBooks } = useBookStore();
  const { recentPages, fetchRecentPages } = usePageStore();
  const { setActiveBook, setActivePage, setActiveFolder } = useUIStore();
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    fetchBooks();
    fetchRecentPages();
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-4xl font-serif font-bold text-ink-800 dark:text-paper-100">
            📚 My Book Shelf
          </h1>
          <p className="text-ink-400 mt-1">Your personal library of thoughts</p>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-ink-800 dark:bg-paper-200 text-white dark:text-ink-900 rounded-xl font-medium hover:bg-ink-700 dark:hover:bg-paper-300 transition-colors shadow-card"
        >
          <Plus size={18} />
          New Book
        </button>
      </div>

      {/* Recent pages strip */}
      {recentPages.length > 0 && (
        <div className="mb-10">
          <div className="flex items-center gap-2 text-sm font-medium text-ink-400 dark:text-ink-500 mb-3">
            <Clock size={14} />
            Recently Edited
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {recentPages.map(page => (
              <button
                key={page.id}
                onClick={() => {
                  setActiveBook(page.bookId);
                  setActiveFolder(page.folderId);
                  setActivePage(page.id);
                  router.push(`/books/${page.bookId}/pages/${page.id}`);
                }}
                className="flex-shrink-0 px-4 py-2.5 bg-white dark:bg-ink-800 border border-paper-200 dark:border-ink-700 rounded-xl text-left hover:border-ink-300 dark:hover:border-ink-500 transition-all shadow-card min-w-[180px]"
              >
                <p className="font-medium text-sm text-ink-800 dark:text-paper-100 truncate">{page.title}</p>
                <p className="text-xs text-ink-400 mt-0.5">{formatDate(page.updatedAt)}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Books grid */}
      {loading ? (
        <div className="flex items-center justify-center h-40 text-ink-300">Loading...</div>
      ) : books.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center h-64 gap-4"
        >
          <BookOpen size={64} className="text-paper-300 dark:text-ink-700" />
          <p className="text-xl font-serif text-ink-400">No books yet</p>
          <p className="text-sm text-ink-300">Create your first book to start taking notes</p>
          <button
            onClick={() => setCreateOpen(true)}
            className="mt-2 px-5 py-2.5 bg-ink-800 text-white rounded-xl font-medium hover:bg-ink-700 transition-colors"
          >
            Create Book
          </button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {books.map((book, i) => (
            <motion.div
              key={book.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <BookCard book={book} />
            </motion.div>
          ))}
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: books.length * 0.05 }}
            onClick={() => setCreateOpen(true)}
            className="aspect-[3/4] rounded-2xl border-2 border-dashed border-paper-300 dark:border-ink-700 flex flex-col items-center justify-center gap-2 text-ink-300 dark:text-ink-600 hover:border-ink-400 dark:hover:border-ink-500 hover:text-ink-500 transition-all"
          >
            <Plus size={28} />
            <span className="text-sm">New Book</span>
          </motion.button>
        </div>
      )}

      <BookCreateModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
}
