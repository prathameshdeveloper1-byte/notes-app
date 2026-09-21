'use client';
import React, { useState, useRef } from 'react';
import useFolderStore from '../../store/useFolderStore';
import usePageStore from '../../store/usePageStore';
import useUIStore from '../../store/useUIStore';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, ChevronRight, Pencil, Trash2, Check, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import ConfirmDeleteModal from '../ui/ConfirmDeleteModal';
import { useRouter } from 'next/navigation';

export default function FolderItem({ folder, collapsed = false }) {
  const router = useRouter();
  const { renameFolder, removeFolder } = useFolderStore();
  const { activeBookId, activeFolderId, setActiveFolder } = useUIStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(folder.title);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const inputRef = useRef(null);

  const isActive = activeFolderId === folder.id;

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

  if (collapsed) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className={cn(
          'flex items-center justify-center p-2.5 rounded-xl cursor-pointer transition-all border shadow-xs active:scale-95',
          isActive
            ? 'bg-amber-100/80 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-700 font-semibold'
            : 'bg-white dark:bg-ink-800/60 text-ink-600 dark:text-paper-300 border-paper-200/80 dark:border-ink-700/80 hover:bg-paper-100 dark:hover:bg-ink-700'
        )}
        onClick={() => {
          setActiveFolder(folder.id);
          router.push(`/books/${activeBookId}/chapters/${folder.id}`);
        }}
        title={`Chapter: ${folder.title}`}
      >
        <span className="text-xs font-serif font-bold uppercase truncate max-w-[2ch]">
          {folder.title ? folder.title.charAt(0).toUpperCase() : 'C'}
        </span>
      </div>
    );
  }

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        className={cn(
          'group flex items-center gap-1.5 px-2.5 py-2 my-1 rounded-xl cursor-pointer transition-all border shadow-xs active:scale-[0.98]',
          isActive
            ? 'bg-amber-100/70 dark:bg-amber-950/40 text-ink-900 dark:text-amber-100 border-amber-300 dark:border-amber-800 font-semibold shadow-xs'
            : 'bg-white dark:bg-ink-800/60 text-ink-700 dark:text-paper-200 border-paper-200/80 dark:border-ink-700/80 hover:bg-paper-100 dark:hover:bg-ink-700 hover:border-paper-300'
        )}
        onClick={() => {
          if (!isEditing) {
            setActiveFolder(folder.id);
            router.push(`/books/${activeBookId}/chapters/${folder.id}`);
          }
        }}
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
            <button onClick={startEdit} className="p-1 hover:bg-ink-200 dark:hover:bg-ink-700 rounded-lg transition" title="Rename chapter">
              <Pencil size={11} />
            </button>
            <button
              onClick={() => setDeleteModalOpen(true)}
              title="Delete chapter"
              className="p-1 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-ink-400 hover:text-red-600 transition"
            >
              <Trash2 size={11} />
            </button>
          </div>
        )}
      </div>

      <ConfirmDeleteModal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={async () => {
          await removeFolder(folder.id, activeBookId);
          if (isActive) {
            setActiveFolder(null);
            router.push(`/books/${activeBookId}`);
          }
        }}
        title="Delete Chapter"
        itemName={folder.title}
        description="Are you sure you want to delete this chapter? All notes and pages inside this chapter will be permanently deleted."
        itemType="chapter"
      />
    </>
  );
}
