'use client';
import React, { useState, useRef } from 'react';
import useFolderStore from '../../store/useFolderStore';
import usePageStore from '../../store/usePageStore';
import useUIStore from '../../store/useUIStore';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, ChevronRight, Pencil, Trash2, Check, X } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function FolderItem({ folder, isActive }) {
  const { renameFolder, removeFolder } = useFolderStore();
  const { activeBookId, setActiveFolder } = useUIStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(folder.title);
  const [showDelete, setShowDelete] = useState(false);
  const inputRef = useRef(null);

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
    opacity: isDragging ? 0.5 : 1,
  };

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

  const handleDelete = async () => {
    if (showDelete) {
      if (isActive) setActiveFolder(null);
      await removeFolder(folder.id, activeBookId);
    } else {
      setShowDelete(true);
      setTimeout(() => setShowDelete(false), 3000);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group flex items-center gap-1 px-2 py-1.5 rounded-xl cursor-pointer transition-all',
        isActive
          ? 'bg-ink-800/10 dark:bg-paper-100/10 text-ink-800 dark:text-paper-100'
          : 'hover:bg-ink-800/5 dark:hover:bg-paper-100/5 text-ink-600 dark:text-ink-400'
      )}
      onClick={() => !isEditing && setActiveFolder(folder.id)}
    >
      <div {...attributes} {...listeners} className="opacity-0 group-hover:opacity-60 cursor-grab active:cursor-grabbing flex-shrink-0 touch-none">
        <GripVertical size={14} />
      </div>

      <ChevronRight size={14} className={cn('flex-shrink-0 transition-transform', isActive && 'rotate-90')} />

      {isEditing ? (
        <div className="flex-1 flex items-center gap-1" onClick={e => e.stopPropagation()}>
          <input
            ref={inputRef}
            value={editTitle}
            onChange={e => setEditTitle(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') cancelEdit(); }}
            className="flex-1 bg-transparent border-b border-ink-400 focus:outline-none text-sm"
          />
          <button onClick={saveEdit} className="p-0.5 hover:text-green-600"><Check size={12} /></button>
          <button onClick={cancelEdit} className="p-0.5 hover:text-red-500"><X size={12} /></button>
        </div>
      ) : (
        <span
          className="flex-1 text-sm font-medium truncate"
          onDoubleClick={(e) => { e.stopPropagation(); startEdit(); }}
        >
          {folder.title}
        </span>
      )}

      {!isEditing && (
        <div className="opacity-0 group-hover:opacity-100 flex gap-0.5 flex-shrink-0" onClick={e => e.stopPropagation()}>
          <button onClick={startEdit} className="p-1 hover:bg-ink-200 dark:hover:bg-ink-700 rounded-lg transition" title="Rename">
            <Pencil size={11} />
          </button>
          <button
            onClick={handleDelete}
            title={showDelete ? "Click again to confirm delete" : "Delete chapter"}
            className={cn('p-1 rounded-lg transition', showDelete ? 'text-red-500 bg-red-50 dark:bg-red-900/20' : 'hover:bg-ink-200 dark:hover:bg-ink-700')}
          >
            <Trash2 size={11} />
          </button>
        </div>
      )}
    </div>
  );
}
