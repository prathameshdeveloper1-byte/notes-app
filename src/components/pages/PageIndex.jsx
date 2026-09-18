'use client';
import React, { useEffect, useState } from 'react';
import useFolderStore from '../../store/useFolderStore';
import usePageStore from '../../store/usePageStore';
import useBookStore from '../../store/useBookStore';
import useUIStore from '../../store/useUIStore';
import { useSearch } from '../../hooks/useSearch';
import FolderCreateModal from '../folders/FolderCreateModal';
import {
  BookMarked,
  Search,
  Star,
  FileText,
  ChevronRight,
  BookOpen,
  Clock,
  Plus,
  X,
  Layers,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { cn, formatDate, wordCount, readingTime, extractSnippet } from '../../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export default function PageIndex() {
  const { folders, fetchFolders } = useFolderStore();
  const { bookPages, fetchBookPages, addPage } = usePageStore();
  const { books } = useBookStore();
  const { activeBookId, setActiveFolder, setActivePage, setViewMode } = useUIStore();
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const activeBook = books.find(b => b.id === activeBookId);
  const accentColor = activeBook?.coverColor || '#4f46e5';

  useEffect(() => {
    if (activeBookId) {
      fetchFolders(activeBookId);
      fetchBookPages(activeBookId);
    }
  }, [activeBookId]);

  const { query, setQuery, results } = useSearch(bookPages);

  const starredPages = bookPages.filter(p => p.starred);
  const totalWords = bookPages.reduce((acc, p) => acc + wordCount(p.contentJSON), 0);

  const navigateTo = (page) => {
    setActiveFolder(page.folderId);
    setActivePage(page.id);
  };

  const handleCreatePageInFolder = async (folderId) => {
    try {
      const id = await addPage({
        bookId: activeBookId,
        folderId,
        title: '',
      });
      if (id) {
        setActiveFolder(folderId);
        setActivePage(id);
      }
    } catch (err) {
      console.error('Failed to create page in folder:', err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 sm:px-10 py-10">
      {/* Table of Contents Book Header */}
      <div className="mb-8 pb-8 border-b border-paper-200 dark:border-ink-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3.5">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-md flex-shrink-0"
              style={{ backgroundColor: accentColor }}
            >
              <BookOpen size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-ink-400 font-mono">
                  {activeBook?.title || 'Notebook'}
                </span>
                <span className="text-ink-300 dark:text-ink-600">&middot;</span>
                <span className="text-xs text-ink-400">Table of Contents</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-serif font-bold text-ink-900 dark:text-paper-100 tracking-tight">
                Index & Chapters
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => { setViewMode('book'); }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-paper-100 dark:bg-ink-800 hover:bg-paper-200 dark:hover:bg-ink-700 text-ink-700 dark:text-paper-200 text-xs font-semibold rounded-xl border border-paper-300/80 dark:border-ink-700 shadow-xs transition"
              title="Read as a continuous book"
            >
              <BookMarked size={14} className="text-indigo-500" />
              Book View
            </button>
            <button
              onClick={() => setCreateModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition"
            >
              <Plus size={14} />
              New Chapter
            </button>
          </div>
        </div>

        {/* Quick Stats Badges */}
        <div className="flex flex-wrap items-center gap-2 pt-2 text-xs text-ink-500 dark:text-ink-400">
          <span className="px-2.5 py-1 rounded-lg bg-paper-100 dark:bg-ink-800 border border-paper-200 dark:border-ink-700 font-medium">
            <strong className="text-ink-800 dark:text-paper-100">{folders.length}</strong> Chapters
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-paper-100 dark:bg-ink-800 border border-paper-200 dark:border-ink-700 font-medium">
            <strong className="text-ink-800 dark:text-paper-100">{bookPages.length}</strong> Pages
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-paper-100 dark:bg-ink-800 border border-paper-200 dark:border-ink-700 font-medium">
            <strong className="text-ink-800 dark:text-paper-100">{totalWords}</strong> Words
          </span>
          {starredPages.length > 0 && (
            <span className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 font-medium flex items-center gap-1">
              <Star size={11} className="fill-amber-400 text-amber-400" />
              <strong>{starredPages.length}</strong> Starred
            </span>
          )}
        </div>
      </div>

      {/* Search Input */}
      <div className="relative mb-8">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
        <input
          type="text"
          placeholder="Filter topics, search notes or tags..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="w-full pl-10 pr-10 py-3 border border-paper-300/90 dark:border-ink-700 rounded-2xl bg-white dark:bg-ink-800/90 text-sm text-ink-900 dark:text-paper-100 placeholder-ink-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition shadow-xs"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 hover:bg-paper-200 dark:hover:bg-ink-700 rounded-lg text-ink-400 transition"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Search Results Display */}
      {query.trim() && (
        <div className="mb-10">
          <div className="flex items-center justify-between mb-3 text-xs font-semibold text-ink-500 uppercase tracking-wider">
            <span>Search Results ({results.length})</span>
            {results.length > 0 && <span>Click to open</span>}
          </div>
          {results.length === 0 ? (
            <div className="p-8 text-center bg-white dark:bg-ink-800/50 rounded-2xl border border-paper-200 dark:border-ink-700">
              <p className="text-ink-400 font-serif text-sm">No notes matching &ldquo;{query}&rdquo;</p>
            </div>
          ) : (
            <div className="space-y-2">
              {results.map(({ item }) => (
                <PageRow key={item.id} page={item} folders={folders} onClick={() => navigateTo(item)} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Starred / Important Quick Access */}
      {!query && starredPages.length > 0 && (
        <section className="mb-10">
          <div className="flex items-center gap-2 mb-3 text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
            <Star size={14} className="fill-amber-400 text-amber-400" />
            <span>Starred Notes ({starredPages.length})</span>
          </div>
          <div className="bg-amber-50/40 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 rounded-2xl p-3 space-y-1">
            {starredPages.map(page => (
              <PageRow key={page.id} page={page} folders={folders} onClick={() => navigateTo(page)} />
            ))}
          </div>
        </section>
      )}

      {/* Structured Chapters Index */}
      {!query && (
        <div className="space-y-6">
          {folders.map((folder, index) => {
            const folderPages = bookPages.filter(p => p.folderId === folder.id);
            folderPages.sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0) || (a.createdAt || 0) - (b.createdAt || 0));

            return (
              <div
                key={folder.id}
                className="bg-white dark:bg-ink-800/80 border border-paper-200 dark:border-ink-700/80 rounded-2xl p-5 sm:p-6 shadow-xs hover:shadow-sm transition-all"
              >
                {/* Chapter Header Bar */}
                <div className="flex items-center justify-between gap-3 pb-4 mb-3 border-b border-paper-200/80 dark:border-ink-700/80">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-xl bg-paper-100 dark:bg-ink-700 border border-paper-200 dark:border-ink-600 flex items-center justify-center font-mono text-xs font-bold text-ink-600 dark:text-paper-300">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <div>
                      <h2 className="font-serif font-bold text-base sm:text-lg text-ink-900 dark:text-paper-100 leading-snug">
                        {folder.title}
                      </h2>
                      <span className="text-xs text-ink-400">
                        {folderPages.length} {folderPages.length === 1 ? 'page' : 'pages'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCreatePageInFolder(folder.id)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 rounded-lg border border-emerald-200 dark:border-emerald-800 transition"
                      title="Add a new page to this chapter"
                    >
                      <Plus size={12} /> Add Page
                    </button>
                    <button
                      onClick={() => setActiveFolder(folder.id)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-ink-600 dark:text-paper-300 hover:text-ink-900 dark:hover:text-white transition"
                    >
                      View Chapter <ArrowRight size={12} />
                    </button>
                  </div>
                </div>

                {/* Chapter Pages List */}
                {folderPages.length === 0 ? (
                  <div className="py-4 text-center">
                    <p className="text-xs text-ink-400 mb-2">No pages in this chapter yet.</p>
                    <button
                      onClick={() => handleCreatePageInFolder(folder.id)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700"
                    >
                      <Plus size={12} /> Create first page
                    </button>
                  </div>
                ) : (
                  <div className="divide-y divide-paper-100 dark:divide-ink-750">
                    {folderPages.map((page, pageIdx) => (
                      <PageRow
                        key={page.id}
                        indexNumber={pageIdx + 1}
                        page={page}
                        folders={folders}
                        onClick={() => navigateTo(page)}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {folders.length === 0 && (
        <div className="text-center py-16 bg-white dark:bg-ink-800/60 rounded-3xl border border-paper-200 dark:border-ink-700 p-8">
          <BookMarked size={48} className="mx-auto text-paper-400 dark:text-ink-600 mb-3" />
          <h3 className="font-serif font-bold text-lg text-ink-800 dark:text-paper-100 mb-1">Your Table of Contents is Empty</h3>
          <p className="text-sm text-ink-400 max-w-sm mx-auto mb-5">Create your first chapter or topic in this notebook to begin organizing your notes.</p>
          <button
            onClick={() => setCreateModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
          >
            <Plus size={14} /> Create Chapter
          </button>
        </div>
      )}

      {/* Create Chapter Modal */}
      <FolderCreateModal open={createModalOpen} onClose={() => setCreateModalOpen(false)} />
    </div>
  );
}

function PageRow({ page, indexNumber, folders, onClick }) {
  const folder = folders.find(f => f.id === page.folderId);
  const wc = wordCount(page.contentJSON);
  const snippet = extractSnippet(page.contentJSON, 80);

  return (
    <button
      onClick={onClick}
      className={cn(
        'group flex items-center justify-between w-full py-2.5 px-3 rounded-xl text-left transition-all',
        'hover:bg-paper-100/80 dark:hover:bg-ink-750/70'
      )}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1 pr-4">
        {/* Page Index Number */}
        {indexNumber && (
          <span className="font-mono text-xs text-ink-400 w-5 flex-shrink-0">
            {String(indexNumber).padStart(2, '0')}.
          </span>
        )}

        {page.starred && (
          <Star size={13} className="fill-amber-400 text-amber-400 flex-shrink-0" />
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-ink-900 dark:text-paper-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
              {page.title || 'Untitled Page'}
            </span>

            {/* Tags */}
            {page.tags?.slice(0, 2).map(tag => (
              <span
                key={tag}
                className="text-[10px] px-2 py-0.5 bg-paper-200/70 dark:bg-ink-700 rounded-full text-ink-500 dark:text-paper-300 font-medium hidden sm:inline-block"
              >
                #{tag}
              </span>
            ))}
          </div>

          {/* Snippet Preview */}
          {snippet && (
            <p className="text-xs text-ink-400 dark:text-ink-500 truncate mt-0.5 font-normal">
              {snippet}
            </p>
          )}
        </div>
      </div>

      {/* Meta details */}
      <div className="flex items-center gap-3 flex-shrink-0 text-xs text-ink-400">
        <span className="hidden sm:inline-flex items-center gap-1 font-mono text-[11px]">
          <Clock size={11} className="text-ink-300 dark:text-ink-600" />
          {readingTime(wc)}
        </span>
        <span className="text-ink-300 dark:text-ink-600 hidden sm:inline">&middot;</span>
        <span className="text-[11px] font-mono">{formatDate(page.updatedAt)}</span>
        <ChevronRight size={14} className="text-ink-300 group-hover:text-ink-600 dark:group-hover:text-paper-200 group-hover:translate-x-0.5 transition-all" />
      </div>
    </button>
  );
}
