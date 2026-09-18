'use client';
import React, { useState } from 'react';
import useBookStore from '../../store/useBookStore';
import useUIStore from '../../store/useUIStore';
import { getContrastColor } from '../../lib/utils';
import { MoreVertical, Edit2, Trash2, BookOpen } from 'lucide-react';
import BookCreateModal from './BookCreateModal';

export default function BookCard({ book }) {
  const { removeBook } = useBookStore();
  const { setActiveBook } = useUIStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const textColor = getContrastColor(book.coverColor);

  const handleDelete = (e) => {
    e.stopPropagation();
    if (confirmDelete) {
      removeBook(book.id);
    } else {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
    }
  };

  return (
    <>
      <div
        className="relative aspect-[3/4] rounded-2xl cursor-pointer group shadow-card hover:shadow-page transition-all duration-200 hover:-translate-y-1"
        style={{ backgroundColor: book.coverColor }}
        onClick={() => setActiveBook(book.id)}
      >
        {/* Spine effect */}
        <div
          className="absolute left-0 top-0 bottom-0 w-3 rounded-l-2xl opacity-30"
          style={{ background: 'linear-gradient(to right, rgba(0,0,0,0.3), transparent)' }}
        />

        {/* Page edge effect */}
        <div className="absolute right-1 top-1 bottom-1 w-2 bg-white opacity-10 rounded-r-xl" />
        <div className="absolute right-2.5 top-1 bottom-1 w-1 bg-white opacity-10 rounded-r-xl" />

        {/* Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center" style={{ color: textColor }}>
          <BookOpen size={32} className="opacity-80 mb-3" />
          <h3 className="font-serif font-bold text-sm leading-snug break-words">{book.title}</h3>
        </div>

        {/* Menu button */}
        <button
          onClick={(e) => { e.stopPropagation(); setMenuOpen(v => !v); }}
          className="absolute top-2 right-2 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ background: 'rgba(0,0,0,0.2)' }}
        >
          <MoreVertical size={14} style={{ color: textColor }} />
        </button>

        {/* Dropdown menu */}
        {menuOpen && (
          <div
            className="absolute top-10 right-2 bg-white dark:bg-ink-800 rounded-xl shadow-page border border-paper-200 dark:border-ink-700 z-20 overflow-hidden min-w-[140px]"
            onClick={e => e.stopPropagation()}
          >
            <button
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-ink-700 dark:text-paper-200 hover:bg-paper-100 dark:hover:bg-ink-700 transition-colors"
              onClick={() => { setEditOpen(true); setMenuOpen(false); }}
            >
              <Edit2 size={14} /> Edit
            </button>
            <button
              className={`flex items-center gap-2 w-full px-3 py-2 text-sm transition-colors ${
                confirmDelete
                  ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'
                  : 'text-ink-700 dark:text-paper-200 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400'
              }`}
              onClick={handleDelete}
            >
              <Trash2 size={14} /> {confirmDelete ? 'Confirm?' : 'Delete'}
            </button>
          </div>
        )}
      </div>

      {editOpen && (
        <BookCreateModal
          open={editOpen}
          onClose={() => setEditOpen(false)}
          initialBook={book}
        />
      )}
    </>
  );
}
