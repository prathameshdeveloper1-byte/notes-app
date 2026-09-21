'use client';

import React, { useEffect } from 'react';
import useUIStore from '../../../../store/useUIStore';
import PageViewer from '../../../../components/pages/PageViewer';
import { motion } from 'framer-motion';

export default function BookReadPage({ params }) {
  const { bookId } = params;
  const { syncRoute, setViewMode } = useUIStore();

  useEffect(() => {
    syncRoute({ bookId, pageId: null });
    setViewMode('book');
  }, [bookId]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2 }}
      className="h-full"
    >
      <PageViewer />
    </motion.div>
  );
}
