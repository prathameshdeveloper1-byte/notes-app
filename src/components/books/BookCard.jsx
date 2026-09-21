'use client';
import React, { useState } from 'react';
import useBookStore from '../../store/useBookStore';
import useUIStore from '../../store/useUIStore';
import { getContrastColor, getBookTheme, formatActivityTime } from '../../lib/utils';
import { MoreVertical, Edit2, Trash2, BookOpen, Clock } from 'lucide-react';
import BookCreateModal from './BookCreateModal';
import ConfirmDeleteModal from '../ui/ConfirmDeleteModal';
import { useRouter } from 'next/navigation';

export default function BookCard({ book }) {
  const router = useRouter();
  const { removeBook } = useBookStore();
  const { setActiveBook } = useUIStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const theme = getBookTheme(book.coverColor);
  const textColor = getContrastColor(book.coverColor);
  const activity = formatActivityTime(book.updatedAt || book.createdAt);

  return (
    <>
      <div
        className="relative aspect-[3/4] rounded-2xl cursor-pointer group shadow-book hover:shadow-page transition-all duration-250 hover:-translate-y-1.5 flex flex-col justify-between overflow-hidden border border-black/10 dark:border-white/10 select-none"
        style={{ backgroundColor: book.coverColor }}
        onClick={() => {
          setActiveBook(book.id);
          router.push(`/books/${book.id}`);
        }}
      >
        {/* Leather spine effect */}
        <div
          className="absolute left-0 top-0 bottom-0 w-3.5 rounded-l-2xl z-10"
          style={{ background: 'linear-gradient(to right, rgba(0,0,0,0.35), rgba(0,0,0,0.05))' }}
        />
        {/* Spine stitched crease */}
        <div className="absolute left-3.5 top-0 bottom-0 w-[1px] bg-white/20 z-10" />

        {/* Realistic Page edge layers */}
        <div className="absolute right-1 top-1.5 bottom-1.5 w-2 bg-white/15 rounded-r-xl" />
        <div className="absolute right-2 top-1.5 bottom-1.5 w-1 bg-white/10 rounded-r-xl" />

        {/* Top Header inside book cover */}
        <div className="p-3.5 flex items-start justify-between z-10">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center backdrop-blur-sm"
            style={{ backgroundColor: 'rgba(255,255,255,0.18)', color: textColor }}
          >
            <BookOpen size={15} />
          </div>

          {/* Menu button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen((v) => !v);
            }}
            className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/20"
            style={{ color: textColor }}
            title="Notebook actions"
          >
            <MoreVertical size={15} />
          </button>
        </div>

        {/* Title area (foil embossed style) */}
        <div className="px-5 py-2 text-center my-auto z-10">
          <h3
            className="font-serif font-bold text-base sm:text-lg leading-snug break-words tracking-tight drop-shadow-xs"
            style={{ color: textColor }}
          >
            {book.title}
          </h3>
          <div
            className="h-0.5 w-8 mx-auto mt-2.5 rounded-full"
            style={{ backgroundColor: textColor, opacity: 0.35 }}
          />
        </div>

        {/* Footer timestamp & theme pill */}
        <div
          className="px-3.5 py-2.5 flex items-center justify-between text-[11px] font-mono z-10 backdrop-blur-xs"
          style={{
            backgroundColor: 'rgba(0,0,0,0.18)',
            color: textColor,
            borderTop: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <span className="opacity-80 truncate">{theme.name}</span>
          <span className="opacity-90 flex items-center gap-1 font-sans text-[10px]">
            <Clock size={10} className="opacity-70" />
            {activity}
          </span>
        </div>

        {/* Dropdown menu */}
        {menuOpen && (
          <div
            className="absolute top-11 right-3 bg-white dark:bg-ink-850 rounded-2xl shadow-page border border-paper-200 dark:border-ink-700 z-30 overflow-hidden min-w-[140px] animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="flex items-center gap-2 w-full px-3.5 py-2 text-xs text-ink-700 dark:text-paper-200 hover:bg-paper-100 dark:hover:bg-ink-700 transition"
              onClick={() => {
                setEditOpen(true);
                setMenuOpen(false);
              }}
            >
              <Edit2 size={13} /> Edit Title
            </button>
            <button
              className="flex items-center gap-2 w-full px-3.5 py-2 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
              onClick={() => {
                setDeleteOpen(true);
                setMenuOpen(false);
              }}
            >
              <Trash2 size={13} /> Delete Book
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

      {deleteOpen && (
        <ConfirmDeleteModal
          open={deleteOpen}
          onClose={() => setDeleteOpen(false)}
          onConfirm={() => removeBook(book.id)}
          title="Delete Book"
          itemName={book.title}
          description="Are you sure you want to delete this notebook? All chapters and pages inside will be permanently deleted."
          itemType="book"
        />
      )}
    </>
  );
}
