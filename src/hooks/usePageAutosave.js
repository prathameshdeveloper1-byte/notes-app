'use client';

import { useState, useEffect, useCallback } from 'react';
import { sanitizeContentJSON } from '../lib/sanitizeContent';

/**
 * Hook for managing page metadata (title, tags, color, starred)
 * and manual saving to Supabase (no auto-save on change).
 */
export function usePageAutosave({ page, activeBookId, activeFolderId, savePage }) {
  const [title, setTitle] = useState(page?.title || '');
  const [tags, setTags] = useState(page?.tags || []);
  const [tagInput, setTagInput] = useState('');
  const [color, setColor] = useState(page?.color || null);
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const [starred, setStarred] = useState(page?.starred || false);
  const [isDirty, setIsDirty] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState(page?.updatedAt || null);

  // Sync state when active page changes
  useEffect(() => {
    if (!page) return;
    setTitle(page.title || '');
    setTags(page.tags || []);
    setColor(page.color || null);
    setStarred(page.starred || false);
    setIsDirty(false);
    setLastSavedAt(page.updatedAt || null);
  }, [page?.id]);

  // Explicit Save function triggered ONLY by user action (Save button or Ctrl+S)
  const saveChanges = useCallback(
    async (getContentJSON) => {
      if (!page?.id) return false;
      try {
        const rawJSON = getContentJSON ? getContentJSON() : page.contentJSON;
        const contentJSON = sanitizeContentJSON(rawJSON);
        await savePage(
          page.id,
          {
            contentJSON,
            tags,
            title,
            color,
            starred,
          },
          activeBookId,
          activeFolderId
        );
        setIsDirty(false);
        setLastSavedAt(Date.now());
        return true;
      } catch (err) {
        console.error('Failed to save page:', err);
        return false;
      }
    },
    [page?.id, page?.contentJSON, tags, title, color, starred, activeBookId, activeFolderId, savePage]
  );

  // Direct save helper for atomic operations like image deletion or AI formatting
  const triggerSave = useCallback(
    async (contentJSON, newTags, newTitle, newColor, newStarred) => {
      if (!page?.id) return false;
      try {
        const cleanedJSON = contentJSON ? sanitizeContentJSON(contentJSON) : contentJSON;
        await savePage(
          page.id,
          {
            contentJSON: cleanedJSON,
            tags: newTags !== undefined ? newTags : tags,
            title: newTitle !== undefined ? newTitle : title,
            color: newColor !== undefined ? newColor : color,
            starred: newStarred !== undefined ? newStarred : starred,
          },
          activeBookId,
          activeFolderId
        );
        setIsDirty(false);
        setLastSavedAt(Date.now());
        return true;
      } catch (err) {
        console.error('Failed to save page:', err);
        return false;
      }
    },
    [page?.id, activeBookId, activeFolderId, savePage, tags, title, color, starred]
  );

  const handleTitleChange = (e) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    setIsDirty(true);
  };

  const addTag = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const tag = tagInput.trim().replace(/,$/, '');
      if (tag && !tags.includes(tag)) {
        const newTags = [...tags, tag];
        setTags(newTags);
        setTagInput('');
        setIsDirty(true);
      }
    }
  };

  const removeTag = (tag) => {
    const newTags = tags.filter((t) => t !== tag);
    setTags(newTags);
    setIsDirty(true);
  };

  const handleColorChange = (c) => {
    setColor(c);
    setColorPickerOpen(false);
    setIsDirty(true);
  };

  const handleStarToggle = () => {
    const newStarred = !starred;
    setStarred(newStarred);
    setIsDirty(true);
  };

  return {
    title,
    setTitle,
    tags,
    setTags,
    tagInput,
    setTagInput,
    color,
    setColor,
    colorPickerOpen,
    setColorPickerOpen,
    starred,
    setStarred,
    isDirty,
    setIsDirty,
    lastSavedAt,
    saveChanges,
    triggerSave,
    handleTitleChange,
    addTag,
    removeTag,
    handleColorChange,
    handleStarToggle,
  };
}

export default usePageAutosave;
