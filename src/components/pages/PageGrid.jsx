'use client';
import React, { useEffect } from 'react';
import usePageStore from '../../store/usePageStore';
import useUIStore from '../../store/useUIStore';
import PageCard from './PageCard';
import { AnimatePresence, motion } from 'framer-motion';
import { FileText, Plus } from 'lucide-react';

export default function PageGrid() {
  const { pages, fetchPages, addPage, loading } = usePageStore();
  const { activeBookId, activeFolderId, setActivePage } = useUIStore();

  useEffect(() => {
    if (activeFolderId) fetchPages(activeFolderId);
  }, [activeFolderId]);

  const handleNewPage = async () => {
    const id = await addPage({ bookId: activeBookId, folderId: activeFolderId, title: 'Untitled Page' });
    setActivePage(id);
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-ink-300">Loading pages...</div>
  );

  return (
    <div className="p-6">
      {pages.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center h-64 gap-4"
        >
          <FileText size={56} className="text-paper-300 dark:text-ink-700" />
          <p className="text-xl font-serif text-ink-400">No pages yet</p>
          <p className="text-sm text-ink-300">Start writing your first page in this chapter</p>
          <button
            onClick={handleNewPage}
            className="mt-2 px-5 py-2.5 bg-ink-800 text-white rounded-xl font-medium hover:bg-ink-700 transition"
          >
            Create First Page
          </button>
        </motion.div>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-5">
            <p className="text-sm text-ink-400">{pages.length} page{pages.length !== 1 ? 's' : ''}</p>
            <button
              onClick={handleNewPage}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-ink-800 text-white text-sm rounded-xl hover:bg-ink-700 transition"
            >
              <Plus size={14} /> New Page
            </button>
          </div>
          <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4">
            <AnimatePresence>
              {pages.map(page => (
                <PageCard key={page.id} page={page} />
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}
