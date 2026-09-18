'use client';
import React, { useState, useEffect } from 'react';
import useBookStore from '../../store/useBookStore';
import { BOOK_COLORS } from '../../lib/utils';
import { X } from 'lucide-react';

export default function BookCreateModal({ open, onClose, initialBook }) {
  const { addBook, editBook } = useBookStore();
  const [title, setTitle] = useState(initialBook?.title || '');
  const [color, setColor] = useState(initialBook?.coverColor || BOOK_COLORS[0].value);
  const [custom, setCustom] = useState('');
  const isEdit = !!initialBook;

  useEffect(() => {
    if (open) {
      setTitle(initialBook?.title || '');
      setColor(initialBook?.coverColor || BOOK_COLORS[0].value);
    }
  }, [open, initialBook]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    const coverColor = custom || color;
    if (isEdit) {
      await editBook(initialBook.id, { title: title.trim(), coverColor });
    } else {
      await addBook({ title: title.trim(), coverColor });
    }
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-ink-900/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white dark:bg-ink-800 rounded-2xl shadow-page w-full max-w-md p-6 z-10">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-serif font-semibold text-ink-800 dark:text-paper-100">
            {isEdit ? 'Edit Book' : 'Create New Book'}
          </h2>
          <button onClick={onClose} className="p-1.5 hover:bg-paper-100 dark:hover:bg-ink-700 rounded-lg transition-colors">
            <X size={18} className="text-ink-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-5">
            <label className="block text-sm font-medium text-ink-600 dark:text-paper-300 mb-1.5">Book Title</label>
            <input
              autoFocus
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="My Awesome Book..."
              className="w-full px-3 py-2.5 border border-paper-300 dark:border-ink-600 rounded-xl bg-paper-50 dark:bg-ink-700 text-ink-800 dark:text-paper-100 placeholder-ink-300 focus:outline-none focus:ring-2 focus:ring-ink-400 dark:focus:ring-ink-500 transition"
            />
          </div>

          <div className="mb-5">
            <label className="block text-sm font-medium text-ink-600 dark:text-paper-300 mb-2">Cover Color</label>
            <div className="grid grid-cols-5 gap-2 mb-3">
              {BOOK_COLORS.map(c => (
                <button
                  key={c.value}
                  type="button"
                  className={`h-9 rounded-xl border-2 transition-all ${
                    color === c.value && !custom ? 'border-ink-800 dark:border-paper-100 scale-110' : 'border-transparent hover:scale-105'
                  }`}
                  style={{ backgroundColor: c.value }}
                  onClick={() => { setColor(c.value); setCustom(''); }}
                  title={c.name}
                />
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={custom || color}
                onChange={e => setCustom(e.target.value)}
                className="w-9 h-9 rounded-lg cursor-pointer border border-paper-300 dark:border-ink-600"
              />
              <span className="text-sm text-ink-400">Custom color</span>
            </div>
          </div>

          {/* Preview */}
          <div className="mb-5 flex justify-center">
            <div
              className="w-16 h-24 rounded-xl shadow-page flex items-center justify-center"
              style={{ backgroundColor: custom || color }}
            >
              <span className="text-xs font-serif text-center px-1 text-white opacity-90 break-words leading-tight">
                {title || 'Book'}
              </span>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-paper-300 dark:border-ink-600 rounded-xl text-ink-600 dark:text-paper-300 hover:bg-paper-100 dark:hover:bg-ink-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim()}
              className="flex-1 px-4 py-2.5 bg-ink-800 dark:bg-paper-200 text-white dark:text-ink-900 rounded-xl font-medium hover:bg-ink-700 dark:hover:bg-paper-100 transition-colors disabled:opacity-40"
            >
              {isEdit ? 'Save' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
