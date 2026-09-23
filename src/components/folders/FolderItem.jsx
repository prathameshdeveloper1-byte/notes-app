'use client';
import React, { useState, useRef, useEffect } from 'react';
import useFolderStore from '../../store/useFolderStore';
import usePageStore from '../../store/usePageStore';
import useUIStore from '../../store/useUIStore';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GripVertical,
  ChevronRight,
  Pencil,
  Trash2,
  Check,
  X,
  Plus,
  FileText,
  Star,
  Sparkles,
  Bookmark,
  Loader2,
  Compass,
  Zap,
  Database,
  Search,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import ConfirmDeleteModal from '../ui/ConfirmDeleteModal';
import { useRouter } from 'next/navigation';
import { playPaperTurnSound, playTabClickSound } from '../../lib/soundEffects';
import useTopicStore from '../../store/useTopicStore';

export default function FolderItem({
  folder,
  index = 0,
  collapsed = false,
  accentColor = '#6366f1',
}) {
  const router = useRouter();
  const { renameFolder, removeFolder } = useFolderStore();
  const { bookPages, addPage, deletePage } = usePageStore();
  const {
    activeBookId,
    activeFolderId,
    activePageId,
    setActiveFolder,
    setActivePage,
    soundEnabled,
  } = useUIStore();

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(folder.title);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [pageToDelete, setPageToDelete] = useState(null);
  const inputRef = useRef(null);

  const {
    getChapterTopics,
    getTopicMetadata,
    generateChapterTopics,
    hasGeneratedTopics,
    initFolderTopicsFromDB,
    generatingByFolder,
  } = useTopicStore();

  const isGeneratingAI = generatingByFolder[folder.id] || false;
  const chapterTopics = getChapterTopics(folder.id);
  const topicMetadata = getTopicMetadata(folder.id);
  const [subView, setSubView] = useState('notes'); // 'notes' | 'topics'
  const [topicSearch, setTopicSearch] = useState('');

  // Hydrate topics from database on load (with instant note extraction fallback)
  useEffect(() => {
    if (folder.id) {
      initFolderTopicsFromDB(folder.id, folder.topics, bookPages);
    }
  }, [folder.id, folder.topics, bookPages, initFolderTopicsFromDB]);

  const handleSwitchToTopics = () => {
    setSubView('topics');
    if (!hasGeneratedTopics(folder.id) && chapterPages.length > 0 && !isGeneratingAI) {
      generateChapterTopics(folder.id, folder.title, bookPages).catch((err) => {
        console.error('Auto topic generation failed:', err);
      });
    }
  };

  const isActiveFolder = activeFolderId === folder.id;
  const chapterPages = (bookPages || []).filter((p) => p.folderId === folder.id);
  const hasActivePage = chapterPages.some((p) => p.id === activePageId);

  const [isOpen, setIsOpen] = useState(isActiveFolder || hasActivePage);

  useEffect(() => {
    if (isActiveFolder || hasActivePage) {
      setIsOpen(true);
    }
  }, [isActiveFolder, hasActivePage]);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: folder.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const formattedIndex = String(index + 1).padStart(2, '0');

  const startEdit = () => {
    setIsEditing(true);
    setEditTitle(folder.title);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const saveEdit = async () => {
    if (editTitle.trim() && editTitle !== folder.title) {
      await renameFolder(folder.id, editTitle.trim(), activeBookId);
    }
    setIsEditing(false);
  };

  const cancelEdit = () => {
    setEditTitle(folder.title);
    setIsEditing(false);
  };

  const handleSelectChapter = () => {
    if (isEditing) return;
    if (soundEnabled) playTabClickSound();
    setActiveFolder(folder.id);
    setIsOpen(true);
    router.push(`/books/${activeBookId}/chapters/${folder.id}`);
  };

  const handleToggleOpen = (e) => {
    e.stopPropagation();
    if (soundEnabled) playTabClickSound();
    setIsOpen(!isOpen);
  };

  const handleCreatePage = async (e) => {
    e.stopPropagation();
    if (soundEnabled) playPaperTurnSound();
    try {
      const newId = await addPage({
        bookId: activeBookId,
        folderId: folder.id,
        title: 'Untitled Note',
      });
      if (newId) {
        setIsOpen(true);
        setActiveFolder(folder.id);
        setActivePage(newId);
        router.push(`/books/${activeBookId}/pages/${newId}`);
      }
    } catch (err) {
      console.error('Failed to create note in chapter:', err);
    }
  };

  const handleSelectPage = (pageId) => {
    if (soundEnabled) playTabClickSound();
    setActiveFolder(folder.id);
    setActivePage(pageId);
    router.push(`/books/${activeBookId}/pages/${pageId}`);
  };

  const handleDeletePageConfirm = async () => {
    if (!pageToDelete) return;
    const isCurrent = activePageId === pageToDelete.id;
    await deletePage(pageToDelete.id, activeBookId, folder.id);
    setPageToDelete(null);
    if (isCurrent) {
      setActivePage(null);
      router.push(`/books/${activeBookId}/chapters/${folder.id}`);
    }
  };

  const handleSelectTopic = (topic) => {
    if (soundEnabled) playTabClickSound();
    setActiveFolder(folder.id);
    const targetPageId = topic.pageId || chapterPages[0]?.id;
    if (!targetPageId) return;

    const topicQuery = topic.anchorText || topic.title;
    const targetUrl = `/books/${activeBookId}/pages/${targetPageId}?topic=${encodeURIComponent(topicQuery)}`;

    if (activePageId === targetPageId) {
      window.history.replaceState(null, '', targetUrl);
      // Already on page: trigger smooth scroll and pulse highlight immediately
      const editorEl = document.querySelector('.tiptap-editor, .notebook-page');
      if (editorEl) {
        const candidates = Array.from(
          editorEl.querySelectorAll('h1, h2, h3, h4, h5, h6, p, blockquote, strong, li')
        );
        const query = topicQuery.toLowerCase().trim();
        const matched = candidates.find((el) => {
          const text = el.textContent.toLowerCase();
          return text.includes(query) || query.includes(text) || el.id === topic.id;
        });
        if (matched) {
          matched.scrollIntoView({ behavior: 'smooth', block: 'center' });
          matched.classList.remove('topic-highlight-pulse');
          void matched.offsetWidth;
          matched.classList.add('topic-highlight-pulse');
          setTimeout(() => matched.classList.remove('topic-highlight-pulse'), 3200);
        }
      }
    } else {
      setActivePage(targetPageId);
      router.push(targetUrl);
    }
  };

  const handleGenerateAITopics = async (e) => {
    e.stopPropagation();
    if (isGeneratingAI) return;
    try {
      await generateChapterTopics(folder.id, folder.title, bookPages);
      setSubView('topics');
    } catch (err) {
      console.error('Failed to generate topics:', err);
    }
  };

  // ── Collapsed mode: tactile notebook index tabs ────────────────────────────
  if (collapsed) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className={cn(
          'relative flex flex-col items-center justify-center p-2 rounded-xl cursor-pointer transition-all border shadow-2xs active:scale-95 group',
          isActiveFolder || hasActivePage
            ? 'bg-amber-100/90 dark:bg-amber-950/60 text-ink-900 dark:text-amber-100 border-amber-300 dark:border-amber-700 shadow-xs'
            : 'bg-white dark:bg-ink-800/60 text-ink-600 dark:text-paper-300 border-paper-200/80 dark:border-ink-700/80 hover:bg-paper-100 dark:hover:bg-ink-700'
        )}
        onClick={handleSelectChapter}
        title={`Chapter ${formattedIndex}: ${folder.title} (${chapterPages.length} notes, ${chapterTopics.length} topics)`}
      >
        {(isActiveFolder || hasActivePage) && (
          <div
            className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full"
            style={{ backgroundColor: accentColor }}
          />
        )}
        <span className="text-[10px] font-mono font-bold">{formattedIndex}</span>
        <span className="text-[9px] font-serif font-bold uppercase truncate max-w-[2.5ch] mt-0.5">
          {folder.title ? folder.title.charAt(0) : 'C'}
        </span>
      </div>
    );
  }

  // ── Expanded mode: tactile chapter divider with nested pages accordion ─────
  return (
    <>
      <div ref={setNodeRef} style={style} className="my-1">
        {/* Chapter Header Row */}
        <div
          className={cn(
            'group relative flex items-center gap-1.5 px-2 py-2 rounded-xl cursor-pointer transition-all border shadow-2xs active:scale-[0.99]',
            isActiveFolder
              ? 'bg-amber-100/70 dark:bg-amber-950/40 text-ink-900 dark:text-amber-100 border-amber-300 dark:border-amber-800 font-semibold shadow-xs'
              : 'bg-white/80 dark:bg-ink-800/60 text-ink-700 dark:text-paper-200 border-paper-200/80 dark:border-ink-700/80 hover:bg-paper-100/80 dark:hover:bg-ink-700 hover:border-paper-300'
          )}
          onClick={handleSelectChapter}
        >
          {/* Active Accent Spine Strip */}
          {isActiveFolder && (
            <div
              className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full"
              style={{ backgroundColor: accentColor }}
            />
          )}

          {/* Reorder Grip */}
          <div
            {...attributes}
            {...listeners}
            className="opacity-0 group-hover:opacity-60 cursor-grab active:cursor-grabbing flex-shrink-0 touch-none -ml-0.5"
            title="Drag to reorder"
          >
            <GripVertical size={13} />
          </div>

          {/* Expand/Collapse Chevron */}
          <button
            onClick={handleToggleOpen}
            className="p-0.5 rounded-md hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            title={isOpen ? 'Collapse section' : 'Expand section'}
          >
            <ChevronRight
              size={14}
              className={cn(
                'flex-shrink-0 transition-transform duration-200 text-ink-400 dark:text-paper-400',
                isOpen && 'rotate-90 text-ink-700 dark:text-paper-200'
              )}
            />
          </button>

          {/* Chapter Index Badge (01, 02...) */}
          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-paper-200/70 dark:bg-ink-700 text-ink-500 dark:text-paper-400 flex-shrink-0">
            {formattedIndex}
          </span>

          {/* Chapter Title or Rename Input */}
          {isEditing ? (
            <div className="flex-1 flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
              <input
                ref={inputRef}
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') saveEdit();
                  if (e.key === 'Escape') cancelEdit();
                }}
                className="flex-1 bg-transparent border-b border-ink-500 focus:outline-none text-xs py-0.5"
              />
              <button onClick={saveEdit} className="p-0.5 hover:text-green-600">
                <Check size={13} />
              </button>
              <button onClick={cancelEdit} className="p-0.5 hover:text-red-500">
                <X size={13} />
              </button>
            </div>
          ) : (
            <span
              className="flex-1 text-xs font-serif font-medium truncate"
              onDoubleClick={(e) => {
                e.stopPropagation();
                startEdit();
              }}
              title="Double click to rename"
            >
              {folder.title}
            </span>
          )}

          {/* Note Count Badge */}
          {!isEditing && (
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full text-ink-400 dark:text-ink-500 group-hover:opacity-0 transition-opacity">
              {chapterPages.length}
            </span>
          )}

          {/* Hover Actions */}
          {!isEditing && (
            <div
              className="absolute right-1.5 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 dark:bg-ink-800/90 backdrop-blur-xs px-1 py-0.5 rounded-lg border border-paper-200 dark:border-ink-700 shadow-2xs"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={handleCreatePage}
                className="p-1 hover:bg-paper-100 dark:hover:bg-ink-700 rounded-md text-ink-600 dark:text-paper-300 hover:text-ink-900 transition"
                title="Add note to chapter"
              >
                <Plus size={12} />
              </button>
              <button
                onClick={startEdit}
                className="p-1 hover:bg-paper-100 dark:hover:bg-ink-700 rounded-md text-ink-600 dark:text-paper-300 hover:text-ink-900 transition"
                title="Rename chapter"
              >
                <Pencil size={11} />
              </button>
              <button
                onClick={() => setDeleteModalOpen(true)}
                title="Delete chapter"
                className="p-1 rounded-md hover:bg-red-50 dark:hover:bg-red-950/40 text-ink-400 hover:text-red-600 transition"
              >
                <Trash2 size={11} />
              </button>
            </div>
          )}
        </div>

        {/* Nested Pages & Topics Accordion Tree */}
        <AnimatePresence initial={false}>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="overflow-hidden"
            >
              <div className="ml-4 pl-2.5 my-1 space-y-1 border-l-2 border-dashed border-paper-200 dark:border-ink-700/60">
                {/* Subview Selector: Notes vs Topics Covered */}
                <div className="flex items-center gap-1 my-1 p-0.5 bg-paper-200/50 dark:bg-ink-800/50 rounded-lg text-[10px] font-semibold select-none">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSubView('notes');
                    }}
                    className={cn(
                      'flex-1 py-1 px-1.5 rounded-md transition-all flex items-center justify-center gap-1',
                      subView === 'notes'
                        ? 'bg-white dark:bg-ink-700 text-ink-900 dark:text-paper-100 shadow-2xs font-bold'
                        : 'text-ink-500 hover:text-ink-800 dark:text-paper-400'
                    )}
                  >
                    <FileText size={10} />
                    <span>Notes ({chapterPages.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSwitchToTopics();
                    }}
                    className={cn(
                      'flex-1 py-1 px-1.5 rounded-md transition-all flex items-center justify-center gap-1',
                      subView === 'topics'
                        ? 'bg-white dark:bg-ink-700 text-amber-700 dark:text-amber-300 shadow-2xs font-bold'
                        : 'text-ink-500 hover:text-ink-800 dark:text-paper-400'
                    )}
                  >
                    <Compass size={10} />
                    <span>Topics</span>
                    {isGeneratingAI ? (
                      <Loader2 size={10} className="animate-spin text-amber-500 ml-0.5" />
                    ) : chapterTopics.length > 0 ? (
                      <span className="text-[9px] font-mono px-1 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 font-bold">
                        {chapterTopics.length}
                      </span>
                    ) : (
                      <Sparkles size={9} className="text-amber-500 ml-0.5" />
                    )}
                  </button>
                </div>

                {/* ── Subview 1: Notes List ── */}
                {subView === 'notes' && (
                  <div className="space-y-0.5">
                    {chapterPages.length === 0 ? (
                      <div className="py-1.5 px-2 flex items-center justify-between text-[11px] text-ink-400 dark:text-ink-500 italic">
                        <span>Empty chapter</span>
                        <button
                          onClick={handleCreatePage}
                          className="not-italic text-[11px] font-semibold text-amber-700 dark:text-amber-400 hover:underline inline-flex items-center gap-1"
                        >
                          <Plus size={11} />
                          <span>Add Note</span>
                        </button>
                      </div>
                    ) : (
                      <>
                        {chapterPages.map((page) => {
                          const isPageActive = activePageId === page.id;
                          return (
                            <div
                              key={page.id}
                              onClick={() => handleSelectPage(page.id)}
                              className={cn(
                                'group/page relative flex items-center gap-1.5 px-2 py-1.5 rounded-lg cursor-pointer transition-all text-xs select-none',
                                isPageActive
                                  ? 'bg-white dark:bg-ink-800 text-ink-900 dark:text-paper-100 font-semibold shadow-2xs border border-paper-300 dark:border-ink-600'
                                  : 'text-ink-600 dark:text-paper-300 hover:bg-paper-100/70 dark:hover:bg-ink-800/50 hover:text-ink-900 dark:hover:text-paper-100'
                              )}
                            >
                              {/* Active Bookmark Dot */}
                              {isPageActive && (
                                <div
                                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                                  style={{ backgroundColor: accentColor }}
                                />
                              )}

                              <FileText
                                size={12}
                                className={cn(
                                  'flex-shrink-0',
                                  isPageActive
                                    ? 'text-amber-600 dark:text-amber-400'
                                    : 'text-ink-400 dark:text-ink-500 group-hover/page:text-ink-700'
                                )}
                              />

                              <span className="truncate flex-1 font-serif text-[12px] group-hover/page:translate-x-0.5 transition-transform">
                                {page.title || 'Untitled Note'}
                              </span>

                              {page.starred && (
                                <Star
                                  size={10}
                                  className="text-amber-400 fill-amber-400 flex-shrink-0"
                                />
                              )}

                              {/* Quick Delete Page on Hover */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPageToDelete(page);
                                }}
                                className="opacity-0 group-hover/page:opacity-100 p-0.5 rounded hover:bg-red-50 dark:hover:bg-red-950/40 text-ink-300 hover:text-red-500 transition-opacity"
                                title="Delete note"
                              >
                                <Trash2 size={11} />
                              </button>
                            </div>
                          );
                        })}

                        {/* Add Note Button under Chapter Pages */}
                        <button
                          onClick={handleCreatePage}
                          className="flex items-center gap-1.5 w-full px-2 py-1.5 text-[11px] font-medium text-ink-400 hover:text-ink-800 dark:text-ink-400 dark:hover:text-paper-200 hover:bg-paper-100/50 dark:hover:bg-ink-800/40 rounded-lg transition-colors group"
                          title="Add note to chapter"
                        >
                          <Plus
                            size={12}
                            className="group-hover:rotate-90 transition-transform duration-200"
                          />
                          <span>New Note</span>
                        </button>
                      </>
                    )}
                  </div>
                )}

                {/* ── Subview 2: AI Core Topics List ── */}
                {subView === 'topics' && (
                  <div className="space-y-1">
                    {/* Header with DB badge & Re-index Button */}
                    <div className="flex items-center justify-between px-1 py-1 text-[10px] text-ink-400 dark:text-paper-400">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="font-bold uppercase tracking-wider text-[9px] flex items-center gap-1 text-ink-700 dark:text-paper-200">
                          <Sparkles size={10} className="text-amber-500 flex-shrink-0" />
                          <span>Core Topics</span>
                        </span>
                        {chapterTopics.length > 0 && (
                          <span className="text-[9px] font-mono px-1 py-0.2 rounded-full bg-emerald-100/80 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 inline-flex items-center gap-0.5">
                            <Database size={8} />
                            <span>Saved</span>
                          </span>
                        )}
                      </div>

                      {chapterPages.length > 0 && (
                        <button
                          onClick={handleGenerateAITopics}
                          disabled={isGeneratingAI}
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md hover:bg-paper-200/60 dark:hover:bg-ink-700 text-ink-500 dark:text-paper-400 hover:text-ink-800 transition text-[10px] font-medium"
                          title="Re-analyze chapter notes with ultra-fast Groq AI"
                        >
                          {isGeneratingAI ? (
                            <>
                              <Loader2 size={10} className="animate-spin text-amber-500" />
                              <span className="text-amber-600 font-semibold">Indexing...</span>
                            </>
                          ) : (
                            <>
                              <Zap size={9} className="text-amber-500" />
                              <span>Re-index</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>

                    {/* AI Loading State */}
                    {isGeneratingAI && (
                      <div className="p-3 my-1 rounded-xl bg-gradient-to-br from-amber-50/90 to-orange-50/80 dark:from-amber-950/40 dark:to-orange-950/30 border border-amber-200/80 dark:border-amber-800/80 text-center animate-pulse shadow-2xs">
                        <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-amber-900 dark:text-amber-200 mb-1">
                          <Zap size={13} className="text-amber-600 dark:text-amber-400 animate-bounce" />
                          <span>⚡ Fast Groq AI Indexing...</span>
                        </div>
                        <p className="text-[10px] text-amber-700 dark:text-amber-300 leading-tight">
                          Analyzing notes with Groq LPU in ~1s to extract key study concepts.
                        </p>
                      </div>
                    )}

                    {/* Topic Search Filter (when chapter has 3+ topics) */}
                    {!isGeneratingAI && chapterTopics.length >= 3 && (
                      <div className="relative my-1">
                        <Search size={11} className="absolute left-2 top-2 text-ink-400" />
                        <input
                          type="text"
                          value={topicSearch}
                          onChange={(e) => setTopicSearch(e.target.value)}
                          placeholder="Filter topics..."
                          className="w-full bg-paper-100 dark:bg-ink-800 text-[11px] pl-6 pr-2 py-1 rounded-lg border border-paper-200/80 dark:border-ink-700/80 focus:outline-none focus:border-amber-400"
                        />
                      </div>
                    )}

                    {/* Empty State */}
                    {!isGeneratingAI && chapterTopics.length === 0 && (
                      <div className="p-3 text-center rounded-xl bg-paper-100/50 dark:bg-ink-800/40 border border-paper-200 dark:border-ink-700">
                        <Compass size={16} className="mx-auto mb-1 text-ink-400" />
                        <p className="text-xs font-serif font-semibold text-ink-700 dark:text-paper-200 mb-1">
                          No topics indexed yet
                        </p>
                        <p className="text-[10px] text-ink-400 mb-2 leading-tight">
                          {chapterPages.length === 0
                            ? 'Add notes to this chapter to generate an AI topic index.'
                            : 'Extract core study concepts with ultra-fast Groq AI and save to database.'}
                        </p>
                        {chapterPages.length > 0 && (
                          <button
                            onClick={handleGenerateAITopics}
                            disabled={isGeneratingAI}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold rounded-xl bg-amber-600 hover:bg-amber-700 text-white shadow-2xs transition active:scale-95"
                          >
                            <Zap size={12} />
                            <span>⚡ Generate with Groq AI</span>
                          </button>
                        )}
                      </div>
                    )}

                    {/* Topics List */}
                    {!isGeneratingAI && chapterTopics.length > 0 && (
                      <div className="space-y-1">
                        {(topicSearch.trim()
                          ? chapterTopics.filter(
                              (t) =>
                                (t.title || '').toLowerCase().includes(topicSearch.toLowerCase()) ||
                                (t.summary || '').toLowerCase().includes(topicSearch.toLowerCase())
                            )
                          : chapterTopics
                        ).map((topic) => (
                          <div
                            key={topic.id}
                            onClick={() => handleSelectTopic(topic)}
                            className="group/topic relative flex items-start gap-2 p-2 rounded-xl cursor-pointer bg-white/80 dark:bg-ink-800/70 hover:bg-white dark:hover:bg-ink-800 border border-paper-200/80 dark:border-ink-700/80 hover:border-amber-300 dark:hover:border-amber-700 shadow-2xs hover:shadow-xs transition-all"
                            title={`Jump to "${topic.title}" in notes`}
                          >
                            <div className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0 mt-1 group-hover/topic:scale-125 transition-transform" />
                            <div className="min-w-0 flex-1">
                              <span className="block font-serif font-semibold text-ink-900 dark:text-paper-100 text-[12px] leading-snug group-hover/topic:text-amber-800 dark:group-hover/topic:text-amber-300 transition-colors">
                                {topic.title}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Delete Chapter Modal */}
      <ConfirmDeleteModal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={async () => {
          await removeFolder(folder.id, activeBookId);
          if (isActiveFolder) {
            setActiveFolder(null);
            router.push(`/books/${activeBookId}`);
          }
        }}
        title="Delete Chapter"
        itemName={folder.title}
        description="Are you sure you want to delete this chapter? All notes inside this chapter will be permanently deleted."
        itemType="chapter"
      />

      {/* Delete Page Modal */}
      <ConfirmDeleteModal
        open={!!pageToDelete}
        onClose={() => setPageToDelete(null)}
        onConfirm={handleDeletePageConfirm}
        title="Delete Note"
        itemName={pageToDelete?.title || 'Untitled Note'}
        description="Are you sure you want to delete this note? This cannot be undone."
        itemType="note"
      />
    </>
  );
}
