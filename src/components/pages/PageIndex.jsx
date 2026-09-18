'use client';
import React, { useEffect } from 'react';
import useFolderStore from '../../store/useFolderStore';
import usePageStore from '../../store/usePageStore';
import useUIStore from '../../store/useUIStore';
import { useSearch } from '../../hooks/useSearch';
import { BookMarked, Search, Star, FileText } from 'lucide-react';
import { cn, formatDate } from '../../lib/utils';
import { motion } from 'framer-motion';

export default function PageIndex() {
  const { folders, fetchFolders } = useFolderStore();
  const { bookPages, fetchBookPages } = usePageStore();
  const { activeBookId, setActiveFolder, setActivePage } = useUIStore();

  useEffect(() => {
    if (activeBookId) {
      fetchFolders(activeBookId);
      fetchBookPages(activeBookId);
    }
  }, [activeBookId]);

  const { query, setQuery, results } = useSearch(bookPages);

  const starredPages = bookPages.filter(p => p.starred);

  const navigateTo = (page) => {
    setActiveFolder(page.folderId);
    setActivePage(page.id);
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <BookMarked size={28} className="text-ink-400" />
        <div>
          <h2 className="text-2xl font-serif font-bold text-ink-800 dark:text-paper-100">Index</h2>
          <p className="text-sm text-ink-400">{bookPages.length} pages across {folders.length} chapters</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-8">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-300" />
        <input
          type="text"
          placeholder="Search pages, tags, content..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 border border-paper-300 dark:border-ink-700 rounded-xl bg-white dark:bg-ink-800 text-ink-800 dark:text-paper-100 placeholder-ink-300 focus:outline-none focus:ring-2 focus:ring-ink-400 transition"
        />
      </div>

      {/* Search results */}
      {query.trim() && (
        <div className="mb-8">
          <p className="text-sm font-medium text-ink-400 mb-3">
            {results.length} result{results.length !== 1 ? 's' : ''} for "{query}"
          </p>
          {results.length === 0 ? (
            <p className="text-sm text-ink-300 text-center py-8">No results found</p>
          ) : (
            <div className="space-y-2">
              {results.map(({ item }) => (
                <PageRow key={item.id} page={item} folders={folders} onClick={() => navigateTo(item)} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Starred */}
      {!query && starredPages.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Star size={15} className="fill-amber-400 text-amber-400" />
            <h3 className="text-sm font-semibold text-ink-600 dark:text-ink-300 uppercase tracking-wide">Starred</h3>
          </div>
          <div className="space-y-1.5">
            {starredPages.map(page => (
              <PageRow key={page.id} page={page} folders={folders} onClick={() => navigateTo(page)} />
            ))}
          </div>
        </section>
      )}

      {/* By folder */}
      {!query && folders.map(folder => {
        const fps = bookPages.filter(p => p.folderId === folder.id);
        if (!fps.length) return null;
        return (
          <motion.section
            key={folder.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <button
              className="flex items-center gap-2 mb-3 hover:text-ink-800 dark:hover:text-paper-100 transition"
              onClick={() => setActiveFolder(folder.id)}
            >
              <FileText size={15} className="text-ink-400" />
              <h3 className="text-sm font-semibold text-ink-600 dark:text-ink-300 uppercase tracking-wide">
                {folder.title}
              </h3>
              <span className="text-xs text-ink-300">({fps.length})</span>
            </button>
            <div className="space-y-1.5">
              {fps.map(page => (
                <PageRow key={page.id} page={page} folders={folders} onClick={() => navigateTo(page)} />
              ))}
            </div>
          </motion.section>
        );
      })}

      {folders.length === 0 && (
        <div className="text-center py-16">
          <BookMarked size={48} className="mx-auto text-paper-300 dark:text-ink-700 mb-3" />
          <p className="text-ink-400 font-serif">No chapters yet. Create one in the sidebar.</p>
        </div>
      )}
    </div>
  );
}

function PageRow({ page, folders, onClick }) {
  const folder = folders.find(f => f.id === page.folderId);
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center justify-between w-full px-4 py-2.5 rounded-xl text-left transition-all group',
        'hover:bg-paper-100 dark:hover:bg-ink-800 border border-transparent hover:border-paper-200 dark:hover:border-ink-700'
      )}
    >
      <div className="flex items-center gap-2 min-w-0">
        {page.starred && <Star size={11} className="fill-amber-400 text-amber-400 flex-shrink-0" />}
        <span className="text-sm font-medium text-ink-700 dark:text-paper-200 truncate">{page.title}</span>
        {page.tags?.slice(0, 2).map(tag => (
          <span key={tag} className="text-xs px-1.5 py-0.5 bg-paper-200 dark:bg-ink-700 rounded-md text-ink-400 hidden sm:inline">{tag}</span>
        ))}
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        <span className="text-xs text-ink-300 dark:text-ink-600 hidden sm:inline">{folder?.title}</span>
        <span className="text-xs text-ink-300 dark:text-ink-600">{formatDate(page.updatedAt)}</span>
      </div>
    </button>
  );
}
