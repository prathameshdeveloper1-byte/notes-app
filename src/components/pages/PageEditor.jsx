'use client';

import React, { useState, useEffect } from 'react';
import { EditorContent } from '@tiptap/react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft, Star, Tag, Palette, Download, Cloud,
  Loader2, Sparkles, Undo2, Check, AlertCircle, CheckCircle2,
  X, Edit3, ChevronLeft, ChevronRight, Plus, Trash2,
  Share2, Minimize2, Save
} from 'lucide-react';

import usePageStore from '../../store/usePageStore';
import useBookStore from '../../store/useBookStore';
import useUIStore from '../../store/useUIStore';
import useAuthStore from '../../store/useAuthStore';
import { readingTime, PAGE_COLORS, formatDate, cn } from '../../lib/utils';
import { pageToMarkdown } from '../../lib/markdownExport';

import usePageAutosave from '../../hooks/usePageAutosave';
import usePageImages from '../../hooks/usePageImages';
import useTiptapEditor from '../../hooks/useTiptapEditor';
import usePageAI from '../../hooks/usePageAI';
import { sanitizeTiptapEditor } from '../../lib/sanitizeContent';

import EditorToolbar from './EditorToolbar';
import ImageLightbox from './ImageLightbox';
import SideMediaRail from './SideMediaRail';
import AISuggestionCard from './AISuggestionCard';
import ConfirmDeleteModal from '../ui/ConfirmDeleteModal';
import ShareModal from './ShareModal';

export default function PageEditor() {
  const router = useRouter();
  const { pages, bookPages, savePage, saving, addPage, deletePage } = usePageStore();
  const { books } = useBookStore();
  const {
    activePageId,
    activeBookId,
    activeFolderId,
    setActivePage,
    addRecentVisitedPage,
    focusMode,
    toggleFocusMode,
  } = useUIStore();
  const { user } = useAuthStore();

  const page = [...pages, ...bookPages].find(p => p.id === activePageId);

  const [shareModalOpen, setShareModalOpen] = useState(false);

  useEffect(() => {
    if (page) {
      addRecentVisitedPage(page);
    }
  }, [page?.id]);

  // In-app Toast Notification state
  const [toast, setToast] = useState(null);
  const showToast = (type, message, detail = '') => {
    setToast({ type, message, detail });
    setTimeout(() => {
      setToast(prev => (prev?.message === message ? null : prev));
    }, 7000);
  };

  const [deletePageModalOpen, setDeletePageModalOpen] = useState(false);

  // 1. Metadata & Manual Save Hook
  const {
    title,
    setTitle,
    tags,
    tagInput,
    setTagInput,
    color,
    colorPickerOpen,
    setColorPickerOpen,
    starred,
    isDirty,
    setIsDirty,
    saveChanges,
    triggerSave,
    handleTitleChange,
    addTag,
    removeTag,
    handleColorChange,
    handleStarToggle,
  } = usePageAutosave({
    page,
    activeBookId,
    activeFolderId,
    savePage,
  });

  // 2. Image Upload & Lightbox Hook
  const {
    uploadedImages,
    setUploadedImages,
    uploadingImage,
    lightboxImg,
    setLightboxImg,
    mediaRailOpen,
    setMediaRailOpen,
    handleImageFile,
    handleDeleteImage,
  } = usePageImages({
    user,
    activeBookId,
    showToast,
  });

  // 3. Tiptap Editor Hook
  const {
    editor,
    isEditing,
    setIsEditing,
    handleEditorContainerClick,
    wc,
  } = useTiptapEditor({
    page,
    triggerSave,
    metadata: { tags, title, color, starred },
    onContentChange: () => setIsDirty(true),
    onImagesUpdated: setUploadedImages,
    onImageUploaded: (file) => handleImageFile(file, editor),
    onImageClicked: setLightboxImg,
  });

  // Manual save handler (Triggered ONLY by Save button or Ctrl+S)
  const handleSaveClick = async () => {
    if (!editor && !page) return;
    // Sanitize stray dots in-place from Tiptap editor so user immediately sees them disappear
    let dotsRemoved = false;
    if (editor) {
      dotsRemoved = sanitizeTiptapEditor(editor);
    }
    const ok = await saveChanges(() => (editor ? JSON.stringify(editor.getJSON()) : page?.contentJSON));
    if (ok) {
      showToast(
        'success',
        dotsRemoved ? 'Saved & cleaned stray bullet dots!' : 'Changes saved successfully!'
      );
    } else {
      showToast('error', 'Failed to save changes');
    }
  };

  // Keyboard shortcut: Ctrl+S to save immediately
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        handleSaveClick();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editor, saveChanges]);

  // Topic deep-link: smooth scroll & pulse highlight matching heading on page
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let retryCount = 0;
    let timerId = null;

    const checkAndScrollToTopic = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const topicQuery = urlParams.get('topic');
      const hash = window.location.hash ? decodeURIComponent(window.location.hash.substring(1)) : '';
      const targetQuery = (topicQuery || hash || '').trim().toLowerCase();

      if (!targetQuery) return;

      const editorEl = document.querySelector('.tiptap-editor');
      if (!editorEl) {
        if (retryCount < 5) {
          retryCount++;
          timerId = setTimeout(checkAndScrollToTopic, 250);
        }
        return;
      }

      // Find matching heading, strong text, or paragraph
      const candidates = Array.from(
        editorEl.querySelectorAll('h1, h2, h3, h4, h5, h6, p, blockquote, strong, li')
      );

      let matched = null;
      for (const el of candidates) {
        const text = el.textContent.trim().toLowerCase();
        if (text && (text.includes(targetQuery) || targetQuery.includes(text) || el.id === targetQuery)) {
          matched = el;
          break;
        }
      }

      if (matched) {
        matched.scrollIntoView({ behavior: 'smooth', block: 'center' });
        matched.classList.remove('topic-highlight-pulse');
        // Force reflow for animation restart
        void matched.offsetWidth;
        matched.classList.add('topic-highlight-pulse');
        setTimeout(() => {
          matched.classList.remove('topic-highlight-pulse');
        }, 3200);
      } else if (retryCount < 5) {
        retryCount++;
        timerId = setTimeout(checkAndScrollToTopic, 250);
      }
    };

    timerId = setTimeout(checkAndScrollToTopic, 200);
    window.addEventListener('hashchange', checkAndScrollToTopic);
    return () => {
      if (timerId) clearTimeout(timerId);
      window.removeEventListener('hashchange', checkAndScrollToTopic);
    };
  }, [activePageId, editor]);

  // 4. AI Formatting Hook
  const {
    aiFormatting,
    undoBackup,
    setUndoBackup,
    aiSuggestions,
    setAiSuggestions,
    handleAIFormat,
    handleKeepSuggestion,
    handleDiscardSuggestion,
    handleUndoAI,
  } = usePageAI({
    editor,
    title,
    setTitle,
    tags,
    color,
    starred,
    pageId: activePageId,
    bookId: activeBookId,
    folderId: activeFolderId,
    savePage,
    triggerSave,
    showToast,
    setUploadedImages,
  });

  if (!page) {
    return <div className="flex items-center justify-center h-full text-ink-400">Page not found</div>;
  }

  // Topic / Folder Multi-Page Navigation calculation
  const currentFolderId = activeFolderId || page?.folderId;
  const topicPages = (currentFolderId
    ? [...pages, ...bookPages].filter(p => p.folderId === currentFolderId)
    : (activeBookId
        ? [...pages, ...bookPages].filter(p => p.bookId === activeBookId)
        : [...pages, ...bookPages])
  ).filter((p, index, self) => index === self.findIndex(t => t.id === p.id));

  topicPages.sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0) || (a.createdAt || 0) - (b.createdAt || 0));

  const currentPageIndex = topicPages.findIndex(p => p.id === activePageId);
  const totalTopicPages = topicPages.length;
  const hasPrevPage = currentPageIndex > 0;
  const hasNextPage = currentPageIndex >= 0 && currentPageIndex < totalTopicPages - 1;
  const prevPageItem = hasPrevPage ? topicPages[currentPageIndex - 1] : null;
  const nextPageItem = hasNextPage ? topicPages[currentPageIndex + 1] : null;

  const handlePrevPage = () => {
    if (hasPrevPage && prevPageItem) {
      setActivePage(prevPageItem.id);
      router.push(`/books/${prevPageItem.bookId || activeBookId}/pages/${prevPageItem.id}`);
    }
  };

  const handleNextPage = () => {
    if (hasNextPage && nextPageItem) {
      setActivePage(nextPageItem.id);
      router.push(`/books/${nextPageItem.bookId || activeBookId}/pages/${nextPageItem.id}`);
    }
  };

  const handleAddNewPage = async () => {
    try {
      const bookId = activeBookId || page?.bookId;
      const folderId = currentFolderId || page?.folderId;
      const newId = await addPage({
        bookId,
        folderId,
        title: '',
      });
      if (newId) {
        setActivePage(newId);
        showToast('success', 'Created new page in this topic!');
        router.push(`/books/${bookId}/pages/${newId}`);
      }
    } catch (err) {
      console.error('Failed to add page:', err);
      showToast('error', 'Could not create new page', err.message);
    }
  };

  const handleMarkdownExport = () => {
    const md = pageToMarkdown({
      ...page,
      title,
      tags,
      contentJSON: editor ? JSON.stringify(editor.getJSON()) : page.contentJSON,
    });
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title || 'page'}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className="flex flex-col h-full relative"
      style={color ? { backgroundColor: color } : undefined}
    >
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -15, scale: 0.95 }}
            className="fixed top-6 right-6 z-[100] max-w-md w-full"
          >
            <div
              className={`p-4 rounded-2xl shadow-page border backdrop-blur-md flex items-start gap-3 ${
                toast.type === 'error'
                  ? 'bg-red-50/95 dark:bg-red-950/90 border-red-200 dark:border-red-800 text-red-900 dark:text-red-200'
                  : 'bg-emerald-50/95 dark:bg-emerald-950/90 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
              }`}
            >
              {toast.type === 'error' ? (
                <AlertCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
              ) : (
                <CheckCircle2 size={20} className="text-emerald-500 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold leading-tight">{toast.message}</p>
                {toast.detail && (
                  <p className="text-xs opacity-80 mt-1 leading-normal font-mono break-words">
                    {toast.detail}
                  </p>
                )}
              </div>
              <button
                onClick={() => setToast(null)}
                className="p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg transition-colors flex-shrink-0"
              >
                <X size={15} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Undo AI Format Banner */}
      {undoBackup && (
        <div className="bg-emerald-500/10 border-b border-emerald-500/30 px-6 py-2 flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300 z-10">
          <span className="flex items-center gap-1.5 font-medium">
            <Sparkles size={14} className="text-emerald-500" /> Formatted while keeping your content original.
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => { setUndoBackup(null); setAiSuggestions([]); }}
              className="flex items-center gap-1 px-2.5 py-1 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
            >
              <Check size={12} /> Keep
            </button>
            <button
              onClick={handleUndoAI}
              className="flex items-center gap-1 px-2.5 py-1 bg-paper-200 dark:bg-ink-800 text-ink-700 dark:text-paper-200 rounded-lg hover:bg-paper-300 transition"
            >
              <Undo2 size={12} /> Undo to Original
            </button>
          </div>
        </div>
      )}

      {/* Top Header & Mode Toggle Bar */}
      <div className="flex items-center justify-between px-6 sm:px-10 pt-5 pb-3 border-b border-paper-200/80 dark:border-ink-800 bg-white/60 dark:bg-ink-900/60 backdrop-blur-md z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setActivePage(null);
              const bookId = activeBookId || page?.bookId;
              const folderId = currentFolderId || page?.folderId;
              if (folderId) {
                router.push(`/books/${bookId}/chapters/${folderId}`);
              } else if (bookId) {
                router.push(`/books/${bookId}`);
              } else {
                router.push('/');
              }
            }}
            className="flex items-center gap-1.5 text-sm text-ink-400 hover:text-ink-700 dark:hover:text-paper-100 transition"
          >
            <ArrowLeft size={14} /> Back
          </button>

          <div className="h-4 w-px bg-paper-300 dark:bg-ink-700" />

          {/* Topic Page Navigation */}
          <div className="flex items-center gap-1 bg-paper-100 dark:bg-ink-800 px-2 py-1 rounded-xl border border-paper-200 dark:border-ink-700 text-xs shadow-sm">
            <button
              onClick={handlePrevPage}
              disabled={!hasPrevPage}
              className="p-1 rounded-lg hover:bg-paper-200 dark:hover:bg-ink-700 disabled:opacity-25 transition text-ink-600 dark:text-paper-300"
              title="Previous Page (Topic)"
            >
              <ChevronLeft size={13} />
            </button>
            <span className="font-mono text-[11px] font-medium text-ink-700 dark:text-paper-200 px-1 select-none">
              Page {currentPageIndex >= 0 ? currentPageIndex + 1 : 1} of {totalTopicPages || 1}
            </span>
            <button
              onClick={handleNextPage}
              disabled={!hasNextPage}
              className="p-1 rounded-lg hover:bg-paper-200 dark:hover:bg-ink-700 disabled:opacity-25 transition text-ink-600 dark:text-paper-300"
              title="Next Page (Topic)"
            >
              <ChevronRight size={13} />
            </button>
          </div>

          {/* Add Page to Topic */}
          <button
            onClick={handleAddNewPage}
            className="flex items-center gap-1 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-semibold transition"
            title="Add another page to this topic"
          >
            <Plus size={13} /> Add Page
          </button>

          {/* Manual Save Button (Only saves on click or Ctrl+S, not on stop change) */}
          <div className="flex items-center ml-1">
            <button
              onClick={handleSaveClick}
              disabled={saving}
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shadow-xs active:scale-95',
                saving
                  ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                  : isDirty
                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm ring-2 ring-blue-400/30'
                  : 'bg-paper-100 hover:bg-paper-200 dark:bg-ink-800 dark:hover:bg-ink-700 text-ink-600 dark:text-paper-300 border border-paper-300 dark:border-ink-700'
              )}
              title={isDirty ? 'Click to save your changes (Ctrl+S)' : 'All changes saved (Ctrl+S)'}
            >
              {saving ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  <span>Saving...</span>
                </>
              ) : isDirty ? (
                <>
                  <Save size={13} />
                  <span>Save Changes</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-300 animate-pulse" />
                </>
              ) : (
                <>
                  <Check size={13} className="text-emerald-500" />
                  <span>Saved</span>
                </>
              )}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* View / Edit Mode Toggle Button */}
          <button
            onClick={async () => {
              if (isEditing && isDirty) {
                await handleSaveClick();
              }
              setIsEditing(!isEditing);
            }}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all shadow-sm ${
              isEditing
                ? 'bg-ink-800 text-white dark:bg-paper-200 dark:text-ink-900'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
          >
            {isEditing ? (
              <>
                <Check size={13} /> Done Editing
              </>
            ) : (
              <>
                <Edit3 size={13} /> Edit Note
              </>
            )}
          </button>

          {/* AI Format Button (Accessible in both View & Edit) */}
          <button
            onClick={handleAIFormat}
            disabled={aiFormatting}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition disabled:opacity-50"
            title="Clean up formatting with Gemini AI"
          >
            {aiFormatting ? (
              <>
                <Loader2 size={13} className="animate-spin" /> Formatting...
              </>
            ) : (
              <>
                <Sparkles size={13} /> Format with AI
              </>
            )}
          </button>

          {uploadingImage && (
            <span className="flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 dark:bg-amber-900/30 px-2 py-1 rounded-md animate-pulse">
              <Loader2 size={12} className="animate-spin" /> Uploading image...
            </span>
          )}

          <button
            onClick={() => handleStarToggle(() => editor ? JSON.stringify(editor.getJSON()) : page.contentJSON)}
            className="p-1.5 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition"
            title="Star this page"
          >
            <Star size={16} className={cn(starred ? 'fill-amber-400 text-amber-400' : 'text-ink-300')} />
          </button>

          <div className="relative">
            <button
              onClick={() => setColorPickerOpen(v => !v)}
              className="p-1.5 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition"
              title="Page color"
            >
              <Palette size={16} className="text-ink-400" />
            </button>
            {colorPickerOpen && (
              <div className="absolute right-0 top-9 z-20 flex gap-1.5 p-2 bg-white dark:bg-ink-800 rounded-xl shadow-page border border-paper-200 dark:border-ink-700">
                {PAGE_COLORS.map((c, i) => (
                  <button
                    key={i}
                    onClick={() => handleColorChange(c, () => editor ? JSON.stringify(editor.getJSON()) : page.contentJSON)}
                    className={cn(
                      'w-6 h-6 rounded-lg border-2 transition-transform hover:scale-110',
                      color === c ? 'border-ink-600' : 'border-transparent'
                    )}
                    style={{ backgroundColor: c || '#f4ead8' }}
                    title={c ? 'Color' : 'None'}
                  />
                ))}
              </div>
            )}
          </div>

          <button onClick={handleMarkdownExport} className="p-1.5 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition" title="Export as Markdown">
            <Download size={16} className="text-ink-400" />
          </button>

          <button
            onClick={() => setShareModalOpen(true)}
            className="p-1.5 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-ink-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg transition"
            title="Share note (read-only link)"
          >
            <Share2 size={16} />
          </button>

          <button
            onClick={() => setDeletePageModalOpen(true)}
            className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/30 text-ink-400 hover:text-red-600 rounded-lg transition"
            title="Delete this page"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Editor Formatting Toolbar (ONLY VISIBLE IN EDIT MODE) */}
      {isEditing && <EditorToolbar editor={editor} />}

      {/* Main Document Body */}
      <div className="flex-1 overflow-y-auto">
        <div className={cn(
          isEditing
            ? 'max-w-4xl px-6 sm:px-12 py-8 text-left'
            : 'notebook-page'
        )}>

          {/* Notebook Page Header */}
          {isEditing ? (
            <div className="mb-4 pb-2 border-b border-paper-200 dark:border-ink-700">
              <input
                type="text"
                value={title}
                onChange={(e) => handleTitleChange(e, () => editor ? JSON.stringify(editor.getJSON()) : page.contentJSON)}
                placeholder="Page title (optional)..."
                className="w-full text-2xl sm:text-3xl font-serif font-bold text-ink-900 dark:text-paper-100 bg-transparent placeholder-ink-300 focus:outline-none tracking-tight"
              />
            </div>
          ) : (
            <>
              {/* Notebook Top Rule with Page Number & Date */}
              <div className="flex items-center justify-between pb-2 mb-6 border-b-2 border-red-300/70 dark:border-red-900/50 text-xs font-mono select-none">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-red-600/90 dark:text-red-400 tracking-widest uppercase text-[11px]">
                    PAGE {currentPageIndex >= 0 ? currentPageIndex + 1 : 1}
                  </span>
                  {totalTopicPages > 1 && (
                    <span className="text-ink-400 dark:text-ink-500 font-normal">of {totalTopicPages}</span>
                  )}
                </div>
                <span className="text-ink-400 dark:text-ink-500 text-[11px]">
                  Date: {formatDate(page.updatedAt)}
                </span>
              </div>

              {/* Show title ONLY if custom named */}
              {title && title !== 'Untitled Page' && title !== 'Untitled Note' && title.trim() !== '' && (
                <h1
                  onDoubleClick={() => setIsEditing(true)}
                  className="text-2xl sm:text-3xl font-serif font-bold text-ink-900 dark:text-paper-100 tracking-tight cursor-pointer hover:opacity-80 transition mb-6 pb-2 border-b-2 border-blue-200/80 dark:border-blue-900/50"
                  title="Double-click to edit title"
                >
                  {title}
                </h1>
              )}
            </>
          )}

          {/* Tags */}
          <div className="flex flex-wrap items-center gap-1.5 mb-4">
            <Tag size={13} className="text-ink-300 dark:text-ink-600" />
            {tags.map(tag => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-paper-100 dark:bg-ink-800 rounded-full text-xs text-ink-600 dark:text-paper-300"
              >
                #{tag}
                {isEditing && (
                  <button onClick={() => removeTag(tag, () => editor ? JSON.stringify(editor.getJSON()) : page.contentJSON)} className="hover:text-red-400 transition">&times;</button>
                )}
              </span>
            ))}
            {isEditing && (
              <input
                type="text"
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={(e) => addTag(e, () => editor ? JSON.stringify(editor.getJSON()) : page.contentJSON)}
                placeholder="Add tag, Enter"
                className="min-w-[100px] text-xs bg-transparent focus:outline-none text-ink-500 placeholder-ink-300"
              />
            )}
          </div>

          {/* AI Suggestion Cards (Individual Keep / Discard) */}
          {aiSuggestions.length > 0 && (
            <div className="mb-6 space-y-2">
              <div className="flex items-center justify-between text-xs font-medium text-violet-700 dark:text-violet-300 mb-1">
                <span>AI Suggestions ({aiSuggestions.length})</span>
                <button
                  onClick={() => setAiSuggestions([])}
                  className="text-ink-400 hover:text-red-500 transition text-[11px]"
                >
                  Dismiss all
                </button>
              </div>
              {aiSuggestions.map(sug => (
                <AISuggestionCard
                  key={sug.id}
                  suggestion={sug}
                  onKeep={handleKeepSuggestion}
                  onDiscard={handleDiscardSuggestion}
                />
              ))}
            </div>
          )}

          {/* Note Content */}
          <div
            className={cn('tiptap-editor min-h-[500px]', isEditing ? 'cursor-text' : 'cursor-default')}
            onClick={handleEditorContainerClick}
            onDoubleClick={() => !isEditing && setIsEditing(true)}
          >
            <EditorContent editor={editor} />
          </div>

          {/* Student Notebook Multi-Page Navigation Footer */}
          <div className="mt-12 pt-6 border-t-2 border-dashed border-paper-300 dark:border-ink-700 flex items-center justify-between text-xs text-ink-500 dark:text-ink-400 select-none">
            {hasPrevPage ? (
              <button
                onClick={handlePrevPage}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-paper-200 dark:hover:bg-ink-800 text-ink-700 dark:text-paper-200 font-medium transition shadow-sm border border-paper-200 dark:border-ink-700"
              >
                <ChevronLeft size={14} /> Previous Page
              </button>
            ) : (
              <div />
            )}

            <div className="font-mono text-ink-400 dark:text-ink-500 font-medium text-xs">
              — Page {currentPageIndex >= 0 ? currentPageIndex + 1 : 1} of {totalTopicPages || 1} —
            </div>

            <div className="flex items-center gap-2">
              {hasNextPage ? (
                <button
                  onClick={handleNextPage}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-paper-200 dark:hover:bg-ink-800 text-ink-700 dark:text-paper-200 font-medium transition shadow-sm border border-paper-200 dark:border-ink-700"
                >
                  Next Page <ChevronRight size={14} />
                </button>
              ) : null}
              <button
                onClick={handleAddNewPage}
                className="flex items-center gap-1 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-xl font-medium transition shadow-sm"
                title="Add a new page to this topic"
              >
                <Plus size={13} /> Add Page
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Side Media Rail (Thumbnails & Lightbox launcher) */}
      <SideMediaRail
        images={uploadedImages}
        isOpen={mediaRailOpen}
        onToggle={() => setMediaRailOpen(!mediaRailOpen)}
        onImageClick={(src, alt) => setLightboxImg({ src, alt })}
        onDeleteImage={(src) => handleDeleteImage(src, editor, triggerSave, { tags, title, color, starred })}
        onInsertImage={isEditing ? (src, alt) => {
          editor?.chain().focus().setImage({ src, alt }).run();
        } : null}
      />

      {/* Image Lightbox Modal */}
      {lightboxImg && (
        <ImageLightbox
          src={lightboxImg.src}
          alt={lightboxImg.alt}
          onClose={() => setLightboxImg(null)}
          onDelete={(src) => handleDeleteImage(src, editor, triggerSave, { tags, title, color, starred })}
        />
      )}

      {/* Delete Page Confirmation Modal */}
      {deletePageModalOpen && (
        <ConfirmDeleteModal
          open={deletePageModalOpen}
          onClose={() => setDeletePageModalOpen(false)}
          onConfirm={async () => {
            const bookId = activeBookId || page?.bookId;
            const folderId = currentFolderId || page?.folderId;
            await deletePage(activePageId, bookId, folderId);
            setDeletePageModalOpen(false);
            setActivePage(null);
            if (folderId) {
              router.push(`/books/${bookId}/chapters/${folderId}`);
            } else if (bookId) {
              router.push(`/books/${bookId}`);
            } else {
              router.push('/');
            }
          }}
          title="Delete Page"
          itemName={title || page?.title || 'Untitled Page'}
          description="Are you sure you want to delete this page? All notes and content on this page will be permanently removed."
          itemType="page"
        />
      )}

      {/* Share Note Modal */}
      {shareModalOpen && (
        <ShareModal
          open={shareModalOpen}
          onClose={() => setShareModalOpen(false)}
          page={page}
          bookTitle={books.find((b) => b.id === (activeBookId || page?.bookId))?.title}
        />
      )}

      {/* Floating Bottom Navigation Bar in Focus Mode */}
      {focusMode && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-ink-900/90 dark:bg-paper-100/90 text-white dark:text-ink-900 backdrop-blur-md px-4 py-2 rounded-2xl shadow-page flex items-center gap-3 border border-white/10 dark:border-black/10 text-xs select-none"
        >
          <button
            onClick={handlePrevPage}
            disabled={!hasPrevPage}
            className="p-1 rounded-lg hover:bg-white/15 dark:hover:bg-black/10 disabled:opacity-30 transition"
            title="Previous Page"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="font-mono text-[11px] font-medium tracking-wide">
            Page {currentPageIndex >= 0 ? currentPageIndex + 1 : 1} of {totalTopicPages || 1}
          </span>
          <button
            onClick={handleNextPage}
            disabled={!hasNextPage}
            className="p-1 rounded-lg hover:bg-white/15 dark:hover:bg-black/10 disabled:opacity-30 transition"
            title="Next Page"
          >
            <ChevronRight size={16} />
          </button>

          <div className="h-4 w-px bg-white/20 dark:bg-black/20" />

          <button
            onClick={toggleFocusMode}
            className="flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-white/15 dark:hover:bg-black/10 transition font-medium"
            title="Exit Focus Mode (Esc or Ctrl+Shift+F)"
          >
            <Minimize2 size={13} />
            <span>Exit Focus</span>
          </button>
        </motion.div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between px-6 sm:px-10 py-2.5 border-t border-paper-200 dark:border-ink-800 bg-white/60 dark:bg-ink-900/60 text-xs text-ink-300 dark:text-ink-600">
        <span>{wc} word{wc !== 1 ? 's' : ''} &middot; {readingTime(wc)}</span>
        <span className="flex items-center gap-1">
          {saving ? (
            <span className="text-amber-500 animate-pulse flex items-center gap-1">
              <Loader2 size={11} className="animate-spin" /> Saving changes...
            </span>
          ) : isDirty ? (
            <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1.5 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
              Unsaved changes &middot; Click &ldquo;Save Changes&rdquo; or Ctrl+S
            </span>
          ) : (
            <span className="text-emerald-600 dark:text-emerald-500 flex items-center gap-1">
              <Check size={11} /> All changes saved
            </span>
          )}
        </span>
      </div>
    </div>
  );
}