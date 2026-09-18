'use client';
import React from 'react';
import useUIStore from '../../store/useUIStore';
import usePageStore from '../../store/usePageStore';
import { Star, Trash2, Tag, MoreVertical } from 'lucide-react';
import { cn, extractSnippet, wordCount, formatDate } from '../../lib/utils';
import { motion } from 'framer-motion';
import { useState } from 'react';

export default function PageCard({ page }) {
  const { setActivePage, activeBookId, activeFolderId } = useUIStore();
  const { deletePage, toggleStar } = usePageStore();
  const [menuOpen, setMenuOpen] = useState(false);

  const snippet = extractSnippet(page.contentJSON, 100);
  const wc = wordCount(page.contentJSON);

  const handleDelete = (e) => {
    e.stopPropagation();
    deletePage(page.id, activeBookId, activeFolderId);
    setMenuOpen(false);
  };

  const handleStar = (e) => {
    e.stopPropagation();
    toggleStar(page.id, activeBookId, activeFolderId);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={cn(
        'relative break-inside-avoid rounded-2xl border cursor-pointer group transition-all hover:shadow-page hover:-translate-y-0.5 mb-4',
        'border-paper-200 dark:border-ink-700 shadow-card'
      )}
      style={{ backgroundColor: page.color || undefined }}
      onClick={() => setActivePage(page.id)}
    >
      {/* Color bar */}
      {!page.color && (
        <div className="h-1 rounded-t-2xl bg-gradient-to-r from-paper-200 to-paper-300 dark:from-ink-700 dark:to-ink-600" />
      )}

      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className={cn(
            'font-serif font-semibold text-base leading-snug',
            page.color ? 'text-ink-800' : 'text-ink-800 dark:text-paper-100'
          )}>
            {page.title}
          </h3>
          <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={handleStar} className="p-1 hover:bg-black/5 rounded-lg">
              <Star size={13} className={cn(page.starred ? 'fill-amber-400 text-amber-400' : 'text-ink-300')} />
            </button>
            <button onClick={(e) => { e.stopPropagation(); setMenuOpen(v => !v); }} className="p-1 hover:bg-black/5 rounded-lg">
              <MoreVertical size={13} className="text-ink-400" />
            </button>
          </div>
        </div>

        {/* Snippet */}
        {snippet && (
          <p className={cn(
            'text-sm leading-relaxed mb-3 line-clamp-3',
            page.color ? 'text-ink-600' : 'text-ink-500 dark:text-ink-400'
          )}>
            {snippet}
          </p>
        )}

        {/* Tags */}
        {page.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {page.tags.map(tag => (
              <span key={tag} className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-black/5 dark:bg-white/10 rounded-full text-xs text-ink-500 dark:text-ink-400">
                <Tag size={9} />{tag}
              </span>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-ink-300 dark:text-ink-600">{formatDate(page.updatedAt)}</span>
          <span className="text-xs text-ink-300 dark:text-ink-600">{wc} words</span>
        </div>
      </div>

      {/* Context menu */}
      {menuOpen && (
        <div
          className="absolute top-8 right-2 bg-white dark:bg-ink-800 rounded-xl shadow-page border border-paper-200 dark:border-ink-700 z-20 overflow-hidden min-w-[130px]"
          onClick={e => e.stopPropagation()}
        >
          <button
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
            onClick={handleDelete}
          >
            <Trash2 size={13} /> Delete
          </button>
        </div>
      )}
    </motion.div>
  );
}
