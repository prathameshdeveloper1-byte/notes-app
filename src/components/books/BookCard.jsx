'use client';
import React, { useState } from 'react';
import useBookStore from '../../store/useBookStore';
import useUIStore from '../../store/useUIStore';
import { getContrastColor, getBookTheme, formatActivityTime } from '../../lib/utils';
import { playBookOpenSound } from '../../lib/soundEffects';
import { MoreVertical, Edit2, Trash2, BookOpen, Clock, Sparkles } from 'lucide-react';
import BookCreateModal from './BookCreateModal';
import ConfirmDeleteModal from '../ui/ConfirmDeleteModal';
import { useRouter } from 'next/navigation';

export default function BookCard({ book, pageCount = 0 }) {
  const router = useRouter();
  const { removeBook } = useBookStore();
  const { setActiveBook, soundEnabled } = useUIStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isOpening, setIsOpening] = useState(false);
  const [rotate, setRotate] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const theme = getBookTheme(book.coverColor);
  const textColor = getContrastColor(book.coverColor);
  const activity = formatActivityTime(book.updatedAt || book.createdAt);

  // Dynamic spine thickness based on notebook content volume
  const spineWidth = Math.min(32, Math.max(14, 14 + pageCount * 2.5));

  const handleMouseMove = (e) => {
    if (isOpening) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    setRotate({
      x: -((y / rect.height) * 14),
      y: (x / rect.width) * 16,
    });
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotate({ x: 0, y: 0 });
  };

  const handleCardClick = () => {
    if (isOpening) return;
    if (soundEnabled) {
      playBookOpenSound();
    }
    setIsOpening(true);
    setTimeout(() => {
      setActiveBook(book.id);
      router.push(`/books/${book.id}`);
    }, 450);
  };

  return (
    <>
      <div
        className="relative group perspective-[1200px] select-none py-3"
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={handleMouseLeave}
      >
        {/* 3D Realistic Contact Shadow onto the Wooden Shelf */}
        <div
          className="absolute -bottom-1 left-3 right-3 h-4 rounded-[100%] transition-all duration-300 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.2) 60%, transparent 80%)',
            transform: isOpening
              ? 'scale(0.85) translateY(12px) blur(8px)'
              : isHovered
              ? 'scale(1.08) translateY(6px) blur(6px)'
              : 'scale(1) translateY(0px) blur(3px)',
            opacity: isOpening ? 0.4 : isHovered ? 0.75 : 0.6,
          }}
        />

        {/* 3D Book Container */}
        <div
          onClick={handleCardClick}
          className="relative aspect-[3/4] rounded-r-2xl rounded-l-md cursor-pointer transition-transform duration-350 ease-out"
          style={{
            transformStyle: 'preserve-3d',
            transform: isOpening
              ? 'scale(0.96) translateZ(50px)'
              : isHovered
              ? `rotateX(${rotate.x}deg) rotateY(${rotate.y}deg) translateZ(16px)`
              : 'rotateX(0deg) rotateY(0deg) translateZ(0px)',
          }}
        >
          {/* 3D SPINE (Left Edge) */}
          <div
            className="absolute left-0 top-0 bottom-0 rounded-l-md overflow-hidden z-20 flex flex-col justify-between py-4 select-none"
            style={{
              width: `${spineWidth}px`,
              transform: `translateX(-${spineWidth / 2}px) translateZ(-${spineWidth / 2}px) rotateY(-90deg)`,
              backgroundColor: book.coverColor,
              backgroundImage: 'linear-gradient(to right, rgba(0,0,0,0.45), rgba(255,255,255,0.12) 60%, rgba(0,0,0,0.3))',
              boxShadow: 'inset 0 0 10px rgba(0,0,0,0.5)',
            }}
          >
            {/* Ribbed leather spine ridges */}
            <div className="h-[2px] w-full bg-white/25 shadow-xs" />
            <div className="h-[2px] w-full bg-white/20 shadow-xs" />
            {/* Vertical spine foil title */}
            <div
              className="text-[9px] font-serif font-bold tracking-widest uppercase truncate writing-vertical text-center mx-auto opacity-75"
              style={{ color: textColor }}
            >
              {book.title}
            </div>
            <div className="h-[2px] w-full bg-white/20 shadow-xs" />
            <div className="h-[2px] w-full bg-white/25 shadow-xs" />
          </div>

          {/* 3D PAGES BLOCK (Stacked paper layers on right, top, bottom edges) */}
          <div
            className="absolute right-1 top-1 bottom-1 rounded-r-xl z-0 pointer-events-none"
            style={{
              width: `${spineWidth - 2}px`,
              right: `-${spineWidth - 4}px`,
              background:
                'repeating-linear-gradient(to bottom, #fdfbf7 0px, #fdfbf7 2px, #ebd9bc 3px, #e3cdad 4px)',
              boxShadow:
                'inset 2px 0 5px rgba(0,0,0,0.25), 2px 3px 8px rgba(0,0,0,0.3)',
              transform: 'translateZ(-2px)',
            }}
          />

          {/* HANGING SATIN RIBBON BOOKMARK */}
          <div
            className="absolute left-1/2 -bottom-5 w-4 pointer-events-none z-10 transition-transform duration-300"
            style={{
              height: '32px',
              backgroundColor: theme.accentLight || '#d97706',
              boxShadow: '1px 3px 5px rgba(0,0,0,0.35)',
              clipPath: 'polygon(0 0, 100% 0, 100% 100%, 50% 80%, 0 100%)',
              transform: isHovered ? 'rotate(5deg) scale(1.05)' : 'rotate(2deg)',
            }}
          />

          {/* INSIDE REVEALED FIRST PAGE (Visible during cover-flip opening) */}
          <div
            className="absolute inset-0 rounded-r-2xl rounded-l-md bg-paper-50 dark:bg-ink-800 p-5 z-0 flex flex-col justify-between overflow-hidden shadow-inner border border-paper-200 dark:border-ink-700"
            style={{ transform: 'translateZ(-1px)' }}
          >
            {/* Ruled lines background */}
            <div
              className="absolute inset-0 opacity-40 pointer-events-none"
              style={{
                backgroundImage:
                  'repeating-linear-gradient(transparent, transparent 27px, rgba(147, 197, 253, 0.25) 28px)',
              }}
            />
            {/* Red left margin guideline */}
            <div className="absolute left-6 top-0 bottom-0 w-[1.5px] bg-red-400/40" />

            <div className="relative z-10 pl-4 pt-4">
              <span className="text-[10px] font-mono uppercase tracking-widest text-red-500 font-bold">
                CHAPTER I
              </span>
              <h4 className="font-serif font-bold text-base text-ink-900 dark:text-paper-100 mt-1 line-clamp-2">
                {book.title}
              </h4>
              <div className="h-0.5 w-10 bg-amber-500/40 rounded mt-2" />
            </div>

            <div className="relative z-10 pl-4 text-[11px] font-mono text-ink-400">
              Opening notebook...
            </div>
          </div>

          {/* FRONT COVER (Hinges open along left spine on click) */}
          <div
            className="absolute inset-0 rounded-r-2xl rounded-l-md flex flex-col justify-between overflow-hidden shadow-page transition-transform duration-450 ease-out z-10"
            style={{
              backgroundColor: book.coverColor,
              transformOrigin: 'left center',
              transformStyle: 'preserve-3d',
              transform: isOpening ? 'rotateY(-120deg)' : 'rotateY(0deg)',
              backfaceVisibility: 'hidden',
            }}
          >
            {/* Cover Leather/Cloth Micro-Texture Overlay */}
            <div
              className="absolute inset-0 opacity-15 pointer-events-none"
              style={{
                backgroundImage:
                  'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.2) 1px, transparent 1px)',
                backgroundSize: '8px 8px',
              }}
            />

            {/* Specular sheen gradient moving on hover */}
            <div
              className="absolute inset-0 pointer-events-none transition-opacity duration-300"
              style={{
                background: `linear-gradient(${125 + rotate.y * 2}deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.02) 45%, transparent 70%)`,
                opacity: isHovered ? 0.9 : 0.4,
              }}
            />

            {/* Debossed spine groove line */}
            <div className="absolute left-3 top-0 bottom-0 w-[1.5px] bg-black/25 shadow-inner" />
            <div className="absolute left-[13.5px] top-0 bottom-0 w-[1px] bg-white/20" />

            {/* Brass / Gold Corner Protectors */}
            <div
              className="absolute top-0 right-0 w-5 h-5 pointer-events-none"
              style={{
                background:
                  'linear-gradient(135deg, transparent 50%, #d4af37 50%, #f6e07a 75%, #aa820a 100%)',
                borderTopRightRadius: '1rem',
                boxShadow: '0 1px 2px rgba(0,0,0,0.3)',
              }}
            />
            <div
              className="absolute bottom-0 right-0 w-5 h-5 pointer-events-none"
              style={{
                background:
                  'linear-gradient(45deg, transparent 50%, #d4af37 50%, #f6e07a 75%, #aa820a 100%)',
                borderBottomRightRadius: '1rem',
                boxShadow: '0 1px 2px rgba(0,0,0,0.3)',
              }}
            />

            {/* Cover Header */}
            <div className="p-3.5 flex items-start justify-between z-10">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center backdrop-blur-sm shadow-xs border border-white/20"
                style={{ backgroundColor: 'rgba(255,255,255,0.18)', color: textColor }}
              >
                <BookOpen size={14} />
              </div>

              {/* Menu button (Doesn't trigger book open) */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen((v) => !v);
                }}
                className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/20 z-30"
                style={{ color: textColor }}
                title="Notebook options"
              >
                <MoreVertical size={15} />
              </button>
            </div>

            {/* Embossed & Gilded Foil Title */}
            <div className="px-5 py-2 text-center my-auto z-10">
              <h3
                className="font-serif font-bold text-base sm:text-lg leading-snug break-words tracking-tight"
                style={{
                  color: textColor,
                  textShadow:
                    '0 1px 2px rgba(0,0,0,0.7), 0 -1px 0 rgba(255,255,255,0.25)',
                }}
              >
                {book.title}
              </h3>
              <div
                className="h-0.5 w-8 mx-auto mt-2.5 rounded-full"
                style={{ backgroundColor: textColor, opacity: 0.4 }}
              />
              {pageCount > 0 && (
                <span
                  className="inline-block mt-2 text-[10px] font-mono tracking-wider opacity-75 uppercase"
                  style={{ color: textColor }}
                >
                  {pageCount} Note{pageCount !== 1 ? 's' : ''}
                </span>
              )}
            </div>

            {/* Footer timestamp & theme pill */}
            <div
              className="px-3.5 py-2.5 flex items-center justify-between text-[11px] font-mono z-10 backdrop-blur-xs"
              style={{
                backgroundColor: 'rgba(0,0,0,0.2)',
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
          </div>
        </div>

        {/* Dropdown menu */}
        {menuOpen && (
          <div
            className="absolute top-12 right-3 bg-white dark:bg-ink-850 rounded-2xl shadow-page border border-paper-200 dark:border-ink-700 z-50 overflow-hidden min-w-[140px] animate-fade-in"
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
