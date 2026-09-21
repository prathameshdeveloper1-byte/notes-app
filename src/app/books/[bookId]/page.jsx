'use client';

import React, { useEffect } from 'react';
import useUIStore from '../../../store/useUIStore';
import usePageStore from '../../../store/usePageStore';
import useFolderStore from '../../../store/useFolderStore';
import PageIndex from '../../../components/pages/PageIndex';
import { motion } from 'framer-motion';

export default function BookIndexPage({ params }) {
  const { bookId } = params;
  const { syncRoute } = useUIStore();
  const { fetchFolders } = useFolderStore();
  const { fetchBookPages } = usePageStore();

  useEffect(() => {
    syncRoute({ bookId, folderId: null, pageId: null });
    fetchFolders(bookId);
    fetchBookPages(bookId);
  }, [bookId]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      className="h-full"
    >
      <PageIndex />
    </motion.div>
  );
}
