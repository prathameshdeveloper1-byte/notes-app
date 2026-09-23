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
    <div className="h-full">
      {viewMode === 'book' ? <PageViewer /> : <PageGrid />}
    </div>
  );
}
