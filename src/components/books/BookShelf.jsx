'use client';
import React, { useEffect, useState } from 'react';
import useBookStore from '../../store/useBookStore';
import usePageStore from '../../store/usePageStore';
import useUIStore from '../../store/useUIStore';
import BookCard from './BookCard';
import BookCreateModal from './BookCreateModal';
import { BookShelfSkeleton } from '../ui/SkeletonLoaders';
import { motion } from 'framer-motion';
import { BookOpen, Plus, Clock, Flame, Sparkles, Loader2, Volume2, VolumeX } from 'lucide-react';
import { formatDate, formatActivityTime, calculateStreak } from '../../lib/utils';
import { createSampleNotebook } from '../../lib/sampleNotebook';
import { useRouter } from 'next/navigation';

export default function BookShelf() {
  const router = useRouter();
  const { books, loading, fetchBooks } = useBookStore();
  const { recentPages, fetchRecentPages, bookPages } = usePageStore();
  const { setActiveBook, setActivePage, setActiveFolder, soundEnabled, toggleSound } = useUIStore();
  const [createOpen, setCreateOpen] = useState(false);
  const [loadingSample, setLoadingSample] = useState(false);

  useEffect(() => {
    fetchBooks();
    fetchRecentPages();
  }, []);

  const streak = calculateStreak(recentPages);

  // Estimate page counts from available page store state
  const bookCounts = {};
  (recentPages || []).forEach((p) => {
    if (p.bookId) bookCounts[p.bookId] = (bookCounts[p.bookId] || 0) + 1;
  });
  (bookPages || []).forEach((p) => {
    if (p.bookId) bookCounts[p.bookId] = (bookCounts[p.bookId] || 0) + 1;
  });

  const handleLoadSample = async () => {
    setLoadingSample(true);
    try {
      const { bookId, folderId, pageId } = await createSampleNotebook();
      await fetchBooks();
      await fetchRecentPages();
      setActiveBook(bookId);
      setActiveFolder(folderId);
      setActivePage(pageId);
      router.push(`/books/${bookId}/pages/${pageId}`);
    } catch (err) {
      console.error('Failed to load sample notebook:', err);
    } finally {
      setLoadingSample(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl sm:text-4xl font-serif font-bold text-ink-900 dark:text-paper-100 tracking-tight">
              📚 My Library
            </h1>
            {/* Streak Pill */}
            {streak > 0 ? (
              <div
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 shadow-2xs"
                title={`${streak}-day consecutive writing habit`}
              >
                <Flame size={14} className="text-amber-500 fill-amber-500 animate-pulse" />
                <span>{streak}-Day Streak</span>
              </div>
            ) : (
              <div
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium text-ink-400 dark:text-ink-500 bg-paper-100 dark:bg-ink-800 border border-paper-200 dark:border-ink-700"
                title="Write a note today to start a streak!"
              >
                <span>🌱 Start a Streak</span>
              </div>
            )}
          </div>
          <p className="text-xs sm:text-sm text-ink-400 dark:text-ink-500 mt-1.5">
            Your personal digital study desk — physical books, tactile covers, distraction-free.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            className="p-2.5 rounded-xl border border-paper-300 dark:border-ink-750 bg-white dark:bg-ink-850 hover:bg-paper-100 dark:hover:bg-ink-750 text-ink-600 dark:text-paper-300 transition shadow-xs"
            title={soundEnabled ? 'Paper & Book sound effects enabled' : 'Sound effects muted'}
          >
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} className="text-ink-400" />}
          </button>

          <button
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-ink-900 dark:bg-paper-100 text-white dark:text-ink-900 rounded-xl text-xs sm:text-sm font-semibold hover:bg-ink-800 dark:hover:bg-white transition-all shadow-card active:scale-[0.98]"
          >
            <Plus size={17} />
            <span>New Notebook</span>
          </button>
        </div>
      </div>

      {/* Recent pages strip */}
      {recentPages.length > 0 && (
        <div className="mb-10">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ink-400 dark:text-ink-500 mb-3">
            <Clock size={13} />
            <span>Recently Opened Notes</span>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
            {recentPages.map((page) => (
              <button
                key={page.id}
                onClick={() => {
                  setActiveBook(page.bookId);
                  setActiveFolder(page.folderId);
                  setActivePage(page.id);
                  router.push(`/books/${page.bookId}/pages/${page.id}`);
                }}
                className="flex-shrink-0 px-4 py-2.5 bg-white dark:bg-ink-850 border border-paper-200 dark:border-ink-750 rounded-xl text-left hover:border-paper-400 dark:hover:border-ink-600 transition-all shadow-card min-w-[200px] group"
              >
                <p className="font-serif font-semibold text-xs sm:text-sm text-ink-800 dark:text-paper-100 truncate group-hover:text-amber-700 dark:group-hover:text-amber-300 transition-colors">
                  {page.title || 'Untitled Page'}
                </p>
                <p className="text-[11px] text-ink-400 font-mono mt-1">
                  {formatActivityTime(page.updatedAt || page.createdAt)}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Bookshelf Grid or Empty States */}
      {loading ? (
        <BookShelfSkeleton count={6} />
      ) : books.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center p-12 bg-white dark:bg-ink-850 rounded-2xl border border-paper-200 dark:border-ink-800 shadow-card text-center max-w-lg mx-auto my-12"
        >
          <div className="w-16 h-16 rounded-2xl bg-paper-100 dark:bg-ink-750 flex items-center justify-center text-ink-500 dark:text-paper-300 mb-4 shadow-inner">
            <BookOpen size={30} />
          </div>
          <h2 className="text-xl font-serif font-bold text-ink-900 dark:text-paper-100 mb-1">
            Your Bookshelf is Empty
          </h2>
          <p className="text-xs text-ink-400 dark:text-ink-500 mb-6 max-w-sm leading-relaxed">
            Create your first notebook to organize study notes, ideas, and lectures, or load a sample tour.
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <button
              onClick={() => setCreateOpen(true)}
              className="w-full sm:w-auto px-5 py-2.5 bg-ink-900 hover:bg-ink-800 dark:bg-paper-100 dark:hover:bg-white text-white dark:text-ink-900 rounded-xl text-xs font-semibold shadow-xs transition"
            >
              Create Blank Notebook
            </button>
            <button
              onClick={handleLoadSample}
              disabled={loadingSample}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-2.5 bg-paper-100 hover:bg-paper-200 dark:bg-ink-750 dark:hover:bg-ink-700 text-ink-700 dark:text-paper-200 border border-paper-300 dark:border-ink-650 rounded-xl text-xs font-semibold transition disabled:opacity-50"
            >
              {loadingSample ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Loading Tour...
                </>
              ) : (
                <>
                  <Sparkles size={14} className="text-amber-500" /> Load Sample Notebook
                </>
              )}
            </button>
          </div>
        </motion.div>
      ) : (
        /* AMBIENT WOODEN STUDY SHELF STRUCTURE */
        <div className="relative pt-6 pb-2 px-4 sm:px-6 rounded-3xl bg-amber-950/[0.03] dark:bg-black/30 border border-amber-900/10 dark:border-amber-900/20 shadow-inner">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 sm:gap-7 items-end">
            {books.map((book, i) => (
              <motion.div
                key={book.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <BookCard book={book} pageCount={bookCounts[book.id] || 0} />
              </motion.div>
            ))}
          </div>

          {/* REALISTIC WOODEN SHELF LEDGE */}
          <div className="relative mt-2 -mx-4 sm:-mx-6 pointer-events-none select-none">
            {/* Top surface & highlight */}
            <div className="h-3 w-full bg-gradient-to-r from-[#996556] via-[#b57a69] to-[#996556] dark:from-[#3a2016] dark:via-[#4a2b1f] dark:to-[#3a2016] shadow-xs border-t border-amber-400/40 rounded-t-xs" />
            {/* Beveled front wooden trim */}
            <div className="h-4.5 w-full bg-gradient-to-b from-[#7a483a] to-[#5a3227] dark:from-[#2a160e] dark:to-[#170b07] shadow-lg flex items-center justify-between px-6 border-b border-black/30">
              <div className="h-[1px] w-full bg-white/10" />
            </div>
            {/* Cast shadow under the shelf ledge */}
            <div className="h-4 w-full bg-gradient-to-b from-black/30 to-transparent" />
          </div>
        </div>
      )}

      <BookCreateModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
}
