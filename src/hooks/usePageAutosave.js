'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Hook for managing page metadata (title, tags, color, starred) and debounced autosave to Supabase.
 */
export function usePageAutosave({ page, activeBookId, activeFolderId, savePage }) {
  const [title, setTitle] = useState(page?.title || '');
  const [tags, setTags] = useState(page?.tags || []);
  const [tagInput, setTagInput] = useState('');
  const [color, setColor] = useState(page?.color || null);
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const [starred, setStarred] = useState(page?.starred || false);

  const saveTimerRef = useRef(null);
  const titleTimerRef = useRef(null);

  // Sync state when active page changes
  useEffect(() => {
    if (!page) return;
    setTitle(page.title || '');
    setTags(page.tags || []);
    setColor(page.color || null);
    setStarred(page.starred || false);
  }, [page?.id]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      if (titleTimerRef.current) clearTimeout(titleTimerRef.current);
    };
  }, []);

  const triggerSave = useCallback((contentJSON, newTags, newTitle, newColor, newStarred) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      if (!page?.id) return;
      await savePage(
        page.id,
        {
          contentJSON,
          tags: newTags !== undefined ? newTags : tags,
          title: newTitle !== undefined ? newTitle : title,
          color: newColor !== undefined ? newColor : color,
          starred: newStarred !== undefined ? newStarred : starred,
        },
        activeBookId,
        activeFolderId,
      );
    }, 800);
  }, [page?.id, activeBookId, activeFolderId, savePage, tags, title, color, starred]);

  const handleTitleChange = (e, getContentJSON) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    if (titleTimerRef.current) clearTimeout(titleTimerRef.current);
    titleTimerRef.current = setTimeout(() => {
      const json = getContentJSON ? getContentJSON() : page?.contentJSON;
      triggerSave(json, tags, newTitle, color, starred);
    }, 800);
  };

  const addTag = (e, getContentJSON) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const tag = tagInput.trim().replace(/,$/, '');
      if (tag && !tags.includes(tag)) {
        const newTags = [...tags, tag];
        setTags(newTags);
        setTagInput('');
        const json = getContentJSON ? getContentJSON() : page?.contentJSON;
        triggerSave(json, newTags, title, color, starred);
      }
    }
  };

  const removeTag = (tag, getContentJSON) => {
    const newTags = tags.filter(t => t !== tag);
    setTags(newTags);
    const json = getContentJSON ? getContentJSON() : page?.contentJSON;
    triggerSave(json, newTags, title, color, starred);
  };

  const handleColorChange = (c, getContentJSON) => {
    setColor(c);
    setColorPickerOpen(false);
    const json = getContentJSON ? getContentJSON() : page?.contentJSON;
    triggerSave(json, tags, title, c, starred);
  };

  const handleStarToggle = (getContentJSON) => {
    const newStarred = !starred;
    setStarred(newStarred);
    const json = getContentJSON ? getContentJSON() : page?.contentJSON;
    triggerSave(json, tags, title, color, newStarred);
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
    triggerSave,
    handleTitleChange,
    addTag,
    removeTag,
    handleColorChange,
    handleStarToggle,
  };
}

export default usePageAutosave;
