'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Highlight from '@tiptap/extension-highlight';
import Underline from '@tiptap/extension-underline';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import { marked } from 'marked';
import usePageStore from '../../store/usePageStore';
import useUIStore from '../../store/useUIStore';
import useBookStore from '../../store/useBookStore';
import useFolderStore from '../../store/useFolderStore';
import useAuthStore from '../../store/useAuthStore';
import { uploadPageImage } from '../../lib/supabase/storage';
import { wordCount, readingTime, PAGE_COLORS, formatDate, cn } from '../../lib/utils';
import { pageToMarkdown, nodeToMarkdown } from '../../lib/markdownExport';
import ImageLightbox from './ImageLightbox';
import SideMediaRail from './SideMediaRail';
import AISuggestionCard from './AISuggestionCard';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Bold, Italic, Underline as UnderlineIcon, Highlighter, Heading1, Heading2, Heading3,
  List, ListOrdered, CheckSquare, Code, Quote, ArrowLeft, Star, Tag, Palette,
  Download, Cloud, Loader2, Sparkles, Undo2, Check, AlertCircle, CheckCircle2, X,
  Edit3, Eye, Copy, Table as TableIcon, ChevronLeft, ChevronRight, Plus
} from 'lucide-react';

export default function PageEditor() {
  const { pages, bookPages, savePage, saving, addPage } = usePageStore();
  const { activePageId, activeBookId, activeFolderId, setActivePage } = useUIStore();
  const { user } = useAuthStore();

  const page = [...pages, ...bookPages].find(p => p.id === activePageId);

  // Dual View vs Edit Mode
  const [isEditing, setIsEditing] = useState(false);

  // Topic / Folder Multi-Page Navigation
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

  const [title, setTitle] = useState(page?.title || '');
  const [tags, setTags] = useState(page?.tags || []);
  const [tagInput, setTagInput] = useState('');
  const [color, setColor] = useState(page?.color || null);
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const [starred, setStarred] = useState(page?.starred || false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // In-app Toast Notification state
  const [toast, setToast] = useState(null);

  const showToast = (type, message, detail = '') => {
    setToast({ type, message, detail });
    setTimeout(() => {
      setToast(prev => (prev?.message === message ? null : prev));
    }, 7000);
  };

  // AI & Suggestions state
  const [aiFormatting, setAiFormatting] = useState(false);
  const [undoBackup, setUndoBackup] = useState(null);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [lightboxImg, setLightboxImg] = useState(null);
  const [mediaRailOpen, setMediaRailOpen] = useState(false);
  const [uploadedImages, setUploadedImages] = useState([]);

  const saveTimerRef = useRef(null);
  const titleTimerRef = useRef(null);

  const triggerSave = useCallback((contentJSON, newTags, newTitle, newColor, newStarred) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      await savePage(
        activePageId,
        {
          contentJSON,
          tags: newTags,
          title: newTitle,
          color: newColor,
          starred: newStarred,
        },
        activeBookId,
        activeFolderId,
      );
    }, 800);
  }, [activePageId, activeBookId, activeFolderId, savePage]);

  const handlePrevPage = () => {
    if (hasPrevPage && prevPageItem) {
      setActivePage(prevPageItem.id);
    }
  };

  const handleNextPage = () => {
    if (hasNextPage && nextPageItem) {
      setActivePage(nextPageItem.id);
    }
  };

  const handleAddNewPage = async () => {
    try {
      const newId = await addPage({
        bookId: activeBookId || page?.bookId,
        folderId: currentFolderId || page?.folderId,
        title: '',
      });
      if (newId) {
        setActivePage(newId);
        showToast('success', 'Created new page in this topic!');
      }
    } catch (err) {
      console.error('Failed to add page:', err);
      showToast('error', 'Could not create new page', err.message);
    }
  };

  // Extract all images from the Tiptap document
  const extractImagesFromJSON = (doc) => {
    const list = [];
    function walk(node) {
      if (node.type === 'image' && node.attrs?.src) {
        list.push({ src: node.attrs.src, alt: node.attrs.alt || '' });
      }
      if (node.content) node.content.forEach(walk);
    }
    if (doc) walk(doc);
    return list;
  };

  const handleImageFile = async (file) => {
    if (!file) return;
    setUploadingImage(true);
    try {
      const publicUrl = await uploadPageImage(file, user?.id || 'guest', activeBookId || 'general');
      const newImg = { src: publicUrl, alt: file.name || 'image' };
      
      editor.chain().focus().setImage(newImg).run();
      setUploadedImages(prev => [...prev, newImg]);
      setMediaRailOpen(true);
      showToast('success', 'Image uploaded to cloud storage!');
    } catch (err) {
      console.error('Failed to upload image:', err);
      showToast('error', 'Image Upload Failed', 'Please verify the page-images bucket exists.');
    } finally {
      setUploadingImage(false);
    }
  };

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ codeBlock: false }),
      Highlight,
      Underline,
      TaskList,
      TaskItem.configure({ nested: true }),
      Placeholder.configure({ placeholder: 'Write your notes or paste screenshots...' }),
      Image.configure({ inline: false, allowBase64: true }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: page?.contentJSON ? JSON.parse(page.contentJSON) : undefined,
    onUpdate: ({ editor: ed }) => {
      const json = JSON.stringify(ed.getJSON());
      triggerSave(json, tags, title, color, starred);
      setUploadedImages(extractImagesFromJSON(ed.getJSON()));
    },
    editorProps: {
      attributes: { class: 'tiptap-editor focus:outline-none min-h-[400px]' },
      handleClick: (view, pos, event) => {
        if (event.target.tagName === 'IMG') {
          setLightboxImg({
            src: event.target.getAttribute('src'),
            alt: event.target.getAttribute('alt') || '',
          });
          return true;
        }
        return false;
      },
      handlePaste: (view, event) => {
        const items = Array.from(event.clipboardData?.items || []);
        const imageItem = items.find(item => item.type.startsWith('image/'));
        if (!imageItem) return false;
        event.preventDefault();
        const blob = imageItem.getAsFile();
        handleImageFile(blob);
        return true;
      },
      handleDrop: (view, event) => {
        const files = Array.from(event.dataTransfer?.files || []);
        const imageFile = files.find(f => f.type.startsWith('image/'));
        if (!imageFile) return false;
        event.preventDefault();
        handleImageFile(imageFile);
        return true;
      },
    },
  });

  // Determine initial mode: if empty note, edit mode; if existing content, view mode
  useEffect(() => {
    if (!page) return;
    setTitle(page.title);
    setTags(page.tags || []);
    setColor(page.color || null);
    setStarred(page.starred || false);
    setUndoBackup(null);
    setAiSuggestions([]);

    let hasExistingContent = false;
    if (page.contentJSON) {
      try {
        const json = JSON.parse(page.contentJSON);
        const images = extractImagesFromJSON(json);
        setUploadedImages(images);
        
        // Check if there is meaningful text
        const textLength = JSON.stringify(json).length;
        hasExistingContent = textLength > 80 || images.length > 0;
      } catch (err) {
        console.error('Error parsing JSON:', err);
      }
    }

    // Default to Edit on empty/new page, View on existing page
    setIsEditing(!hasExistingContent);

    if (editor && page.contentJSON) {
      try {
        const json = JSON.parse(page.contentJSON);
        editor.commands.setContent(json, false);
      } catch (err) {}
    } else if (editor) {
      editor.commands.clearContent();
    }
  }, [activePageId]);

  useEffect(() => () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); }, []);

  // Keyboard shortcut: E toggles Edit mode
  useEffect(() => {
    const handleKey = (e) => {
      if ((e.key === 'e' || e.key === 'E') && !isEditing && (e.ctrlKey || e.metaKey || document.activeElement === document.body)) {
        e.preventDefault();
        setIsEditing(true);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isEditing]);

  // Sync editable status with view/edit mode
  useEffect(() => {
    if (editor && !editor.isDestroyed) {
      editor.setEditable(isEditing);
    }
  }, [isEditing, editor]);

  if (!page) return <div className="flex items-center justify-center h-full text-ink-400">Page not found</div>;

  // Delete image from document and rail
  const handleDeleteImage = (srcToDelete) => {
    if (!editor) return;
    try {
      const { state, dispatch } = editor.view;
      const { tr, doc } = state;
      const positionsToDelete = [];
      doc.descendants((node, pos) => {
        if (node.type.name === 'image' && node.attrs?.src === srcToDelete) {
          positionsToDelete.unshift({ pos, size: node.nodeSize });
        }
      });

      if (positionsToDelete.length > 0) {
        positionsToDelete.forEach(({ pos, size }) => {
          tr.delete(pos, pos + size);
        });
        dispatch(tr);
      }

      setUploadedImages(prev => prev.filter(img => img.src !== srcToDelete));
      const newJSON = JSON.stringify(editor.getJSON());
      triggerSave(newJSON, tags, title, color, starred);
      showToast('success', 'Image removed from note');
    } catch (err) {
      console.error('Failed to delete image:', err);
      showToast('error', 'Could not delete image', err.message);
    }
  };

  // Freeform click-anywhere: if clicking in blank space below content, auto-insert blank lines down to cursor
  const handleEditorContainerClick = (e) => {
    if (!editor || !isEditing) return;

    const target = e.target;
    // Don't interfere with buttons, inputs, images, or links
    if (target.closest('button') || target.closest('input') || target.tagName === 'IMG' || target.tagName === 'A') {
      return;
    }

    const editorDom = editor.view?.dom;
    if (!editorDom) return;

    const clickY = e.clientY;
    const lastChild = editorDom.lastElementChild;

    if (lastChild) {
      const lastChildRect = lastChild.getBoundingClientRect();
      // If clicking below the last child element in the editor's empty space
      if (clickY > lastChildRect.bottom + 8) {
        const distance = clickY - lastChildRect.bottom;
        const lineHeight = 36; // 36px line height
        const linesToInsert = Math.max(1, Math.min(25, Math.floor(distance / lineHeight)));

        const emptyParagraphs = Array(linesToInsert).fill({ type: 'paragraph' });
        editor.chain().focus('end').insertContent(emptyParagraphs).focus('end').run();
        return;
      }
    }

    if (!editor.isFocused) {
      editor.commands.focus();
    }
  };

  // AI Formatting Action (Strict Fidelity + Tables + Granular Suggestions)
  const handleAIFormat = async () => {
    if (!editor) return;
    setAiFormatting(true);

    let backupJSON = null;
    try {
      backupJSON = editor.getJSON();
      const rawText = editor.getText();
      const markdownContent = nodeToMarkdown(backupJSON);
      const images = extractImagesFromJSON(backupJSON);

      if (!rawText.trim() && images.length === 0) {
        showToast('error', 'Cannot format empty note', 'Please write some notes or paste screenshots first.');
        setAiFormatting(false);
        return;
      }

      setUndoBackup(backupJSON);

      const res = await fetch('/api/ai/format', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          rawText: markdownContent || rawText,
          images,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to format with AI');
      }

      const { generatedTitle, formattedUserContent, suggestions } = data;

      if (!formattedUserContent || !formattedUserContent.trim()) {
        throw new Error('AI returned empty content. Your original note was kept intact.');
      }

      // Auto-set title if page is untitled
      let currentTitle = title;
      if (generatedTitle && (!title || title === 'Untitled Page' || title === 'Untitled Note' || !title.trim())) {
        setTitle(generatedTitle);
        currentTitle = generatedTitle;
      }

      // SAFETY: If the AI accidentally returned raw JSON as content, reject it
      const trimmedContent = formattedUserContent.trim();
      if (trimmedContent.startsWith('{') && trimmedContent.includes('"formattedUserContent"')) {
        throw new Error('AI returned malformed response. Your original note was kept intact.');
      }

      // Convert Markdown to clean HTML using marked
      let parsedHTML = marked.parse(formattedUserContent);
      if (!parsedHTML || !parsedHTML.trim()) {
        throw new Error('Markdown parser produced empty output. Your original note was kept intact.');
      }

      // CRITICAL: Tiptap Table extension does NOT understand <thead>/<tbody>/<tfoot>.
      // Strip them so Tiptap sees <table> → <tr> → <th>/<td> directly.
      parsedHTML = parsedHTML
        .replace(/<thead>/gi, '')
        .replace(/<\/thead>/gi, '')
        .replace(/<tbody>/gi, '')
        .replace(/<\/tbody>/gi, '')
        .replace(/<tfoot>/gi, '')
        .replace(/<\/tfoot>/gi, '');

      // Atomically set content into Tiptap
      editor.commands.setContent(parsedHTML);

      // Safety check: verify content was not lost
      const updatedText = editor.getText();
      if (!updatedText.trim() && rawText.trim().length > 0) {
        editor.commands.setContent(backupJSON);
        throw new Error('Formatting resulted in empty content. Reverted safely to your original note.');
      }

      const newJSON = JSON.stringify(editor.getJSON());
      triggerSave(newJSON, tags, currentTitle, color, starred);
      savePage(
        activePageId,
        {
          contentJSON: newJSON,
          tags,
          title: currentTitle,
          color,
          starred,
        },
        activeBookId,
        activeFolderId,
      );
      setUploadedImages(extractImagesFromJSON(editor.getJSON()));

      // Store AI suggestion cards separately for individual Keep/Discard
      if (suggestions && suggestions.length > 0) {
        setAiSuggestions(suggestions);
      }
      showToast('success', currentTitle !== title ? `Title set to "${currentTitle}" & notes formatted!` : 'Note formatted cleanly with original content intact!');
    } catch (err) {
      console.error('AI Format Error:', err);
      if (backupJSON && editor) {
        try {
          editor.commands.setContent(backupJSON);
        } catch (revertErr) {
          console.error('Revert error:', revertErr);
        }
      }
      showToast('error', 'AI Formatting Error', err.message || 'Original note was kept intact.');
    } finally {
      setAiFormatting(false);
    }
  };

  // Granular Keep Suggestion
  const handleKeepSuggestion = (suggestion) => {
    if (!editor) return;
    
    // Append suggestion to current editor content
    if (suggestion.type === 'code') {
      const cleanCode = suggestion.content.replace(/^```[a-z]*\n?/, '').replace(/```$/, '');
      editor.chain().focus().insertContent([
        { type: 'paragraph', content: [{ type: 'text', marks: [{ type: 'code' }], text: cleanCode }] }
      ]).run();
    } else {
      editor.chain().focus().insertContent([
        {
          type: 'blockquote',
          content: [{ type: 'paragraph', content: [{ type: 'text', text: `${suggestion.title}: ${suggestion.content}` }] }]
        }
      ]).run();
    }

    // Remove from active suggestions list
    setAiSuggestions(prev => prev.filter(s => s.id !== suggestion.id));
    showToast('success', `Added "${suggestion.title}" to note!`);
  };

  // Discard Suggestion
  const handleDiscardSuggestion = (suggestionId) => {
    setAiSuggestions(prev => prev.filter(s => s.id !== suggestionId));
  };

  const handleUndoAI = () => {
    if (undoBackup && editor) {
      editor.commands.setContent(undoBackup);
      setUndoBackup(null);
      setAiSuggestions([]);
      triggerSave(JSON.stringify(undoBackup), tags, title, color, starred);
      showToast('success', 'Reverted back to your original note.');
    }
  };

  const handleTitleChange = (e) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    if (titleTimerRef.current) clearTimeout(titleTimerRef.current);
    titleTimerRef.current = setTimeout(() => {
      const json = editor ? JSON.stringify(editor.getJSON()) : page.contentJSON;
      triggerSave(json, tags, newTitle, color, starred);
    }, 800);
  };

  const addTag = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const tag = tagInput.trim().replace(/,$/, '');
      if (tag && !tags.includes(tag)) {
        const newTags = [...tags, tag];
        setTags(newTags);
        setTagInput('');
        const json = editor ? JSON.stringify(editor.getJSON()) : page.contentJSON;
        triggerSave(json, newTags, title, color, starred);
      }
    }
  };

  const removeTag = (tag) => {
    const newTags = tags.filter(t => t !== tag);
    setTags(newTags);
    const json = editor ? JSON.stringify(editor.getJSON()) : page.contentJSON;
    triggerSave(json, newTags, title, color, starred);
  };

  const handleColorChange = (c) => {
    setColor(c);
    setColorPickerOpen(false);
    const json = editor ? JSON.stringify(editor.getJSON()) : page.contentJSON;
    triggerSave(json, tags, title, c, starred);
  };

  const handleStarToggle = () => {
    const newStarred = !starred;
    setStarred(newStarred);
    const json = editor ? JSON.stringify(editor.getJSON()) : page.contentJSON;
    triggerSave(json, tags, title, color, newStarred);
  };

  const handleMarkdownExport = () => {
    const md = pageToMarkdown({ ...page, title, tags, contentJSON: editor ? JSON.stringify(editor.getJSON()) : page.contentJSON });
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title || 'page'}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const wc = editor ? wordCount(JSON.stringify(editor.getJSON())) : 0;

  const ToolbarBtn = ({ onClick, active, title: t, children }) => (
    <button
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      title={t}
      className={cn(
        'p-1.5 rounded-lg transition-colors',
        active
          ? 'bg-ink-800 text-white dark:bg-paper-200 dark:text-ink-900'
          : 'text-ink-500 dark:text-ink-400 hover:bg-paper-100 dark:hover:bg-ink-800'
      )}
    >
      {children}
    </button>
  );

  const Divider = () => <div className="w-px h-4 bg-paper-200 dark:bg-ink-700 mx-1" />;

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
            onClick={() => setActivePage(null)}
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
        </div>

        <div className="flex items-center gap-2">
          {/* View / Edit Mode Toggle Button */}
          <button
            onClick={() => setIsEditing(!isEditing)}
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

          <button onClick={handleStarToggle} className="p-1.5 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition" title="Star this page">
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
                    onClick={() => handleColorChange(c)}
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
        </div>
      </div>

      {/* Editor Formatting Toolbar (ONLY VISIBLE IN EDIT MODE) */}
      {isEditing && editor && (
        <div className="flex items-center flex-wrap gap-0.5 px-6 sm:px-10 py-2 border-b border-paper-200 dark:border-ink-800 bg-white/70 dark:bg-ink-900/70 backdrop-blur-sm sticky top-0 z-10">
          <ToolbarBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold">
            <Bold size={14} />
          </ToolbarBtn>
          <ToolbarBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic">
            <Italic size={14} />
          </ToolbarBtn>
          <ToolbarBtn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Underline">
            <UnderlineIcon size={14} />
          </ToolbarBtn>
          <ToolbarBtn onClick={() => editor.chain().focus().toggleHighlight().run()} active={editor.isActive('highlight')} title="Highlight">
            <Highlighter size={14} />
          </ToolbarBtn>
          <Divider />
          <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })} title="H1">
            <Heading1 size={14} />
          </ToolbarBtn>
          <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="H2">
            <Heading2 size={14} />
          </ToolbarBtn>
          <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="H3">
            <Heading3 size={14} />
          </ToolbarBtn>
          <Divider />
          <ToolbarBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Bullet list">
            <List size={14} />
          </ToolbarBtn>
          <ToolbarBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Ordered list">
            <ListOrdered size={14} />
          </ToolbarBtn>
          <ToolbarBtn onClick={() => editor.chain().focus().toggleTaskList().run()} active={editor.isActive('taskList')} title="Task list">
            <CheckSquare size={14} />
          </ToolbarBtn>
          <Divider />
          <ToolbarBtn onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive('code')} title="Inline code">
            <Code size={14} />
          </ToolbarBtn>
          <ToolbarBtn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Definition / Callout Box">
            <Quote size={14} />
          </ToolbarBtn>
          <Divider />
          <ToolbarBtn
            onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
            active={editor.isActive('table')}
            title="Insert Table (3x3)"
          >
            <TableIcon size={14} />
          </ToolbarBtn>

          {editor.isActive('table') && (
            <div className="flex items-center gap-1 pl-2 border-l border-paper-300 dark:border-ink-700">
              <button
                type="button"
                onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().addRowAfter().run(); }}
                className="px-2 py-0.5 rounded bg-paper-200 dark:bg-ink-800 hover:bg-paper-300 text-ink-700 dark:text-paper-200 text-[11px] font-medium transition"
                title="Add row below"
              >
                + Row
              </button>
              <button
                type="button"
                onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().deleteRow().run(); }}
                className="px-2 py-0.5 rounded bg-paper-200 dark:bg-ink-800 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 text-[11px] font-medium transition"
                title="Delete row"
              >
                - Row
              </button>
              <button
                type="button"
                onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().addColumnAfter().run(); }}
                className="px-2 py-0.5 rounded bg-paper-200 dark:bg-ink-800 hover:bg-paper-300 text-ink-700 dark:text-paper-200 text-[11px] font-medium transition"
                title="Add column right"
              >
                + Col
              </button>
              <button
                type="button"
                onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().deleteColumn().run(); }}
                className="px-2 py-0.5 rounded bg-paper-200 dark:bg-ink-800 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 text-[11px] font-medium transition"
                title="Delete column"
              >
                - Col
              </button>
              <button
                type="button"
                onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().deleteTable().run(); }}
                className="px-2 py-0.5 rounded bg-red-100 dark:bg-red-950/60 hover:bg-red-200 text-red-600 text-[11px] font-medium transition"
                title="Delete table"
              >
                Del Table
              </button>
            </div>
          )}
        </div>
      )}

      {/* Main Document Body */}
      <div className="flex-1 overflow-y-auto">
        <div className={cn(
          isEditing
            ? 'max-w-4xl px-6 sm:px-12 py-8 text-left'
            : 'notebook-page'
        )}>
          
          {/* Notebook Page Header (Clean, Authentic Student Notebook Style) */}
          {isEditing ? (
            <div className="mb-4 pb-2 border-b border-paper-200 dark:border-ink-700">
              <input
                type="text"
                value={title}
                onChange={handleTitleChange}
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

              {/* Show title ONLY if custom named (no 'Untitled Page' clutter) */}
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
                  <button onClick={() => removeTag(tag)} className="hover:text-red-400 transition">&times;</button>
                )}
              </span>
            ))}
            {isEditing && (
              <input
                type="text"
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={addTag}
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
        onDeleteImage={handleDeleteImage}
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
          onDelete={handleDeleteImage}
        />
      )}

      {/* Footer */}
      <div className="flex items-center justify-between px-6 sm:px-10 py-2.5 border-t border-paper-200 dark:border-ink-800 bg-white/60 dark:bg-ink-900/60 text-xs text-ink-300 dark:text-ink-600">
        <span>{wc} word{wc !== 1 ? 's' : ''} &middot; {readingTime(wc)}</span>
        <span className="flex items-center gap-1">
          {saving ? (
            <span className="text-amber-500 animate-pulse flex items-center gap-1">
              <Loader2 size={11} className="animate-spin" /> Saving to cloud...
            </span>
          ) : (
            <span className="text-green-600 dark:text-green-500 flex items-center gap-1">
              <Cloud size={11} /> Cloud synced
            </span>
          )}
        </span>
      </div>
    </div>
  );
}