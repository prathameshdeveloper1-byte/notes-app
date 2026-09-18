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
import usePageStore from '../../store/usePageStore';
import useUIStore from '../../store/useUIStore';
import useBookStore from '../../store/useBookStore';
import useFolderStore from '../../store/useFolderStore';
import useAuthStore from '../../store/useAuthStore';
import { uploadPageImage } from '../../lib/supabase/storage';
import { wordCount, readingTime, PAGE_COLORS, cn } from '../../lib/utils';
import { pageToMarkdown } from '../../lib/markdownExport';
import {
  Bold, Italic, Underline as UnderlineIcon, Highlighter, Heading1, Heading2, Heading3,
  List, ListOrdered, CheckSquare, Code, Quote, ArrowLeft, Star, Tag, Palette,
  Download, Cloud, CloudCheck, Loader2
} from 'lucide-react';

export default function PageEditor() {
  const { pages, bookPages, savePage, saving } = usePageStore();
  const { activePageId, activeBookId, activeFolderId, setActivePage } = useUIStore();
  const { user } = useAuthStore();
  const [uploadingImage, setUploadingImage] = useState(false);

  const page = [...pages, ...bookPages].find(p => p.id === activePageId);

  const [title, setTitle] = useState(page?.title || '');
  const [tags, setTags] = useState(page?.tags || []);
  const [tagInput, setTagInput] = useState('');
  const [color, setColor] = useState(page?.color || null);
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const [starred, setStarred] = useState(page?.starred || false);

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

  const handleImageFile = async (file) => {
    if (!file) return;
    setUploadingImage(true);
    try {
      const publicUrl = await uploadPageImage(file, user?.id || 'guest', activeBookId || 'general');
      editor.chain().focus().setImage({ src: publicUrl, alt: file.name || 'image' }).run();
    } catch (err) {
      console.error('Failed to upload image to Supabase Storage:', err);
      alert('Failed to upload image to Supabase Storage. Check your bucket configuration.');
    } finally {
      setUploadingImage(false);
    }
  };

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ codeBlock: false }),
      Highlight,
      Underline,
      TaskList,
      TaskItem.configure({ nested: true }),
      Placeholder.configure({ placeholder: 'Start writing your notes...' }),
      Image.configure({ inline: false, allowBase64: true }),
    ],
    content: page?.contentJSON ? JSON.parse(page.contentJSON) : undefined,
    onUpdate: ({ editor: ed }) => {
      const json = JSON.stringify(ed.getJSON());
      triggerSave(json, tags, title, color, starred);
    },
    editorProps: {
      attributes: { class: 'tiptap-editor focus:outline-none min-h-[400px]' },
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

  useEffect(() => {
    if (!page) return;
    setTitle(page.title);
    setTags(page.tags || []);
    setColor(page.color || null);
    setStarred(page.starred || false);
    if (editor && page.contentJSON) {
      try {
        const json = JSON.parse(page.contentJSON);
        editor.commands.setContent(json, false);
      } catch (err) {
        console.error('Failed to parse contentJSON', err);
      }
    }
  }, [activePageId]);

  useEffect(() => () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); }, []);

  if (!page) return <div className="flex items-center justify-center h-full text-ink-400">Page not found</div>;

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
      className="flex flex-col h-full"
      style={color ? { backgroundColor: color } : undefined}
    >
      <div className="flex items-center gap-2 px-6 pt-5 pb-2">
        <button
          onClick={() => setActivePage(null)}
          className="flex items-center gap-1.5 text-sm text-ink-400 hover:text-ink-700 dark:hover:text-paper-100 transition"
        >
          <ArrowLeft size={14} /> Back
        </button>
        <div className="flex-1" />
        {uploadingImage && (
          <span className="flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 dark:bg-amber-900/30 px-2 py-1 rounded-md animate-pulse">
            <Loader2 size={12} className="animate-spin" /> Uploading image to Supabase...
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

      <div className="px-6 pb-2">
        <input
          type="text"
          value={title}
          onChange={handleTitleChange}
          placeholder="Page title..."
          className="w-full text-3xl font-serif font-bold text-ink-800 dark:text-paper-100 bg-transparent placeholder-ink-300 focus:outline-none"
        />
      </div>

      <div className="flex flex-wrap items-center gap-1.5 px-6 pb-3">
        <Tag size={13} className="text-ink-300 dark:text-ink-600" />
        {tags.map(tag => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-ink-100 dark:bg-ink-800 rounded-full text-xs text-ink-600 dark:text-ink-300"
          >
            {tag}
            <button onClick={() => removeTag(tag)} className="hover:text-red-400 transition">&times;</button>
          </span>
        ))}
        <input
          type="text"
          value={tagInput}
          onChange={e => setTagInput(e.target.value)}
          onKeyDown={addTag}
          placeholder="Add tag, press Enter"
          className="flex-1 min-w-[120px] text-xs bg-transparent focus:outline-none text-ink-500 dark:text-ink-400 placeholder-ink-300"
        />
      </div>

      {editor && (
        <div className="flex items-center flex-wrap gap-0.5 px-4 py-2 border-y border-paper-200 dark:border-ink-800 bg-white/60 dark:bg-ink-900/60 backdrop-blur-sm sticky top-0 z-10">
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
          <ToolbarBtn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Quote">
            <Quote size={14} />
          </ToolbarBtn>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-8 py-6">
          <EditorContent editor={editor} />
        </div>
      </div>

      <div className="flex items-center justify-between px-6 py-2 border-t border-paper-200 dark:border-ink-800 bg-white/60 dark:bg-ink-900/60 text-xs text-ink-300 dark:text-ink-600">
        <span>{wc} word{wc !== 1 ? 's' : ''} &middot; {readingTime(wc)}</span>
        <span className="flex items-center gap-1">
          {saving ? (
            <span className="text-amber-500 animate-pulse flex items-center gap-1">
              <Loader2 size={11} className="animate-spin" /> Saving to Supabase...
            </span>
          ) : (
            <span className="text-green-600 dark:text-green-500 flex items-center gap-1">
              <Cloud size={11} /> Saved to cloud
            </span>
          )}
        </span>
      </div>
    </div>
  );
}
