'use client';

import React, { useEffect } from 'react';
import useUIStore from '../../../../../store/useUIStore';
import usePageStore from '../../../../../store/usePageStore';
import PageGrid from '../../../../../components/pages/PageGrid';
import PageViewer from '../../../../../components/pages/PageViewer';
import { motion } from 'framer-motion';

export default function ChapterPage({ params }) {
  const { bookId, folderId } = params;
  const { syncRoute, viewMode } = useUIStore();
  const { fetchPages } = usePageStore();

  useEffect(() => {
    syncRoute({ bookId, folderId, pageId: null });
    if (folderId) fetchPages(folderId);
  }, [bookId, folderId]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      className="h-full"
    >
      {viewMode === 'book' ? <PageViewer /> : <PageGrid />}
    </motion.div>
  );
}
