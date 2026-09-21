'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useEditor } from '@tiptap/react';
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
import { wordCount } from '../lib/utils';
import { extractImagesFromJSON } from './usePageImages';

/**
 * Hook for configuring and controlling the Tiptap rich-text editor instance.
 */
export function useTiptapEditor({
  page,
  triggerSave,
  metadata = {},
  onContentChange,
  onImagesUpdated,
  onImageUploaded,
  onImageClicked,
}) {
  const [isEditing, setIsEditing] = useState(false);

  // Keep references to latest metadata and callbacks to prevent stale closures inside Tiptap event handlers
  const metadataRef = useRef(metadata);
  metadataRef.current = metadata;

  const onContentChangeRef = useRef(onContentChange);
  onContentChangeRef.current = onContentChange;

  const onImagesUpdatedRef = useRef(onImagesUpdated);
  onImagesUpdatedRef.current = onImagesUpdated;

  const onImageUploadedRef = useRef(onImageUploaded);
  onImageUploadedRef.current = onImageUploaded;

  const onImageClickedRef = useRef(onImageClicked);
  onImageClickedRef.current = onImageClicked;

  const triggerSaveRef = useRef(triggerSave);
  triggerSaveRef.current = triggerSave;

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
    content: page?.contentJSON ? (() => {
      try { return JSON.parse(page.contentJSON); } catch { return undefined; }
    })() : undefined,
    onUpdate: ({ editor: ed }) => {
      if (onContentChangeRef.current) {
        onContentChangeRef.current();
      }
      if (onImagesUpdatedRef.current) {
        onImagesUpdatedRef.current(extractImagesFromJSON(ed.getJSON()));
      }
    },
    editorProps: {
      attributes: { class: 'tiptap-editor focus:outline-none min-h-[400px]' },
      handleClick: (view, pos, event) => {
        if (event.target.tagName === 'IMG' && onImageClickedRef.current) {
          onImageClickedRef.current({
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
        if (onImageUploadedRef.current) {
          onImageUploadedRef.current(blob);
        }
        return true;
      },
      handleDrop: (view, event) => {
        const files = Array.from(event.dataTransfer?.files || []);
        const imageFile = files.find(f => f.type.startsWith('image/'));
        if (!imageFile) return false;
        event.preventDefault();
        if (onImageUploadedRef.current) {
          onImageUploadedRef.current(imageFile);
        }
        return true;
      },
    },
  });

  // Content hydration effect: syncs editor content and default view/edit mode when page loads or changes
  useEffect(() => {
    if (!page) return;

    let hasExistingContent = false;
    if (page.contentJSON) {
      try {
        const json = JSON.parse(page.contentJSON);
        const images = extractImagesFromJSON(json);
        if (onImagesUpdatedRef.current) {
          onImagesUpdatedRef.current(images);
        }
        const textLength = JSON.stringify(json).length;
        hasExistingContent = textLength > 80 || images.length > 0;
      } catch (err) {
        console.error('Error parsing page JSON:', err);
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
  }, [page?.id, page?.contentJSON, editor]);

  // Sync editor editable status with view/edit mode
  useEffect(() => {
    if (editor && !editor.isDestroyed) {
      editor.setEditable(isEditing);
    }
  }, [isEditing, editor]);

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

  // Freeform click-anywhere: if clicking in blank space below content, auto-insert blank lines down to cursor
  const handleEditorContainerClick = useCallback((e) => {
    if (!editor || !isEditing) return;

    const target = e.target;
    if (target.closest('button') || target.closest('input') || target.tagName === 'IMG' || target.tagName === 'A') {
      return;
    }

    const editorDom = editor.view?.dom;
    if (!editorDom) return;

    const clickY = e.clientY;
    const lastChild = editorDom.lastElementChild;

    if (lastChild) {
      const lastChildRect = lastChild.getBoundingClientRect();
      if (clickY > lastChildRect.bottom + 8) {
        const distance = clickY - lastChildRect.bottom;
        const lineHeight = 36;
        const linesToInsert = Math.max(1, Math.min(25, Math.floor(distance / lineHeight)));
        const emptyParagraphs = Array(linesToInsert).fill({ type: 'paragraph' });
        editor.chain().focus('end').insertContent(emptyParagraphs).focus('end').run();
        return;
      }
    }

    if (!editor.isFocused) {
      editor.commands.focus();
    }
  }, [editor, isEditing]);

  const wc = editor ? wordCount(JSON.stringify(editor.getJSON())) : 0;

  return {
    editor,
    isEditing,
    setIsEditing,
    handleEditorContainerClick,
    wc,
  };
}

export default useTiptapEditor;
