'use client';
import React, { useState, useEffect } from 'react';
import useFolderStore from '../../store/useFolderStore';
import useUIStore from '../../store/useUIStore';
import { X } from 'lucide-react';

export default function FolderCreateModal({ open, onClose, initialFolder }) {
  const { addFolder, renameFolder } = useFolderStore();
  const { activeBookId } = useUIStore();
  const [title, setTitle] = useState(initialFolder?.title || '');
  const isEdit = !!initialFolder;

  useEffect(() => {
    if (open) setTitle(initialFolder?.title || '');
  }, [open, initialFolder]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    if (isEdit) {
      await renameFolder(initialFolder.id, title.trim(), activeBookId);
    } else {
      await addFolder({ bookId: activeBookId, title: title.trim() });
    }
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-ink-800 rounded-2xl shadow-page w-full max-w-sm p-6 z-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-serif font-semibold text-ink-800 dark:text-paper-100">
            {isEdit ? 'Rename Chapter' : 'New Chapter'}
          </h2>
          <button onClick={onClose} className="p-1.5 hover:bg-paper-100 dark:hover:bg-ink-700 rounded-lg">
            <X size={16} className="text-ink-400" />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <input
            autoFocus
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Chapter name..."
            className="w-full px-3 py-2.5 border border-paper-300 dark:border-ink-600 rounded-xl bg-paper-50 dark:bg-ink-700 text-ink-800 dark:text-paper-100 placeholder-ink-300 focus:outline-none focus:ring-2 focus:ring-ink-400 transition mb-4"
          />
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 px-3 py-2 border border-paper-300 dark:border-ink-600 rounded-xl text-ink-600 dark:text-paper-300 hover:bg-paper-100 dark:hover:bg-ink-700 transition">
              Cancel
            </button>
            <button type="submit" disabled={!title.trim()} className="flex-1 px-3 py-2 bg-ink-800 text-white dark:bg-paper-200 dark:text-ink-900 rounded-xl font-medium hover:bg-ink-700 transition disabled:opacity-40">
              {isEdit ? 'Save' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
