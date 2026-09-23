'use client';

import React, { useEffect } from 'react';
import useUIStore from '../../../../../store/useUIStore';
import usePageStore from '../../../../../store/usePageStore';
import PageEditor from '../../../../../components/pages/PageEditor';
import { motion } from 'framer-motion';

export default function NotePage({ params }) {
  const { bookId, pageId } = params;
  const { syncRoute } = useUIStore();
  const { fetchPage } = usePageStore();

  useEffect(() => {
    syncRoute({ bookId, pageId });
    if (pageId) {
      fetchPage(pageId).then(page => {
        if (page?.folderId) {
          syncRoute({ bookId, pageId, folderId: page.folderId });
        }
      });
    }
  }, [bookId, pageId]);

  return (
    <div className="h-full">
      <PageEditor />
    </div>
  );
}
