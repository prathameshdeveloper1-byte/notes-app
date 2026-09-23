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
    <div className="h-full">
      <PageViewer />
    </div>
  );
}
