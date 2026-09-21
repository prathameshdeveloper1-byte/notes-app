'use client';

import React, { useEffect, useState, useCallback } from 'react';
import usePageStore from '../../store/usePageStore';
import useUIStore from '../../store/useUIStore';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Edit3,
  Copy,
  Check,
  BookOpen,
  Volume2,
  VolumeX,
  Columns,
  Square,
  Sparkles,
  Image as ImageIcon,
} from 'lucide-react';
import { wordCount, readingTime, formatDate } from '../../lib/utils';
import { playPaperTurnSound } from '../../lib/soundEffects';
import ImageLightbox from './ImageLightbox';
import { useRouter } from 'next/navigation';

// 3D Realistic Page-Turn Physics Variants
const page3DVariants = {
  enter: (direction) => ({
    rotateY: direction > 0 ? 65 : -65,
    opacity: 0,
    scale: 0.95,
    transformOrigin: direction > 0 ? 'left center' : 'right center',
    filter: 'brightness(0.9)',
  }),
  center: {
    rotateY: 0,
    opacity: 1,
    scale: 1,
    filter: 'brightness(1)',
    transition: {
      type: 'spring',
      stiffness: 240,
      damping: 24,
    },
  },
  exit: (direction) => ({
    rotateY: direction > 0 ? -65 : 65,
    opacity: 0,
    scale: 0.95,
    transformOrigin: direction > 0 ? 'left center' : 'right center',
    filter: 'brightness(0.85)',
    transition: {
      duration: 0.22,
    },
  }),
};

export default function PageViewer() {
  const router = useRouter();
  const { pages, bookPages, fetchPages, fetchBookPages } = usePageStore();
  const {
    activeBookId,
    activeFolderId,
    setActivePage,
    bookViewPageIndex,
    setBookViewPageIndex,
    soundEnabled,
    toggleSound,
    twoPageSpread,
    toggleTwoPageSpread,
  } = useUIStore();

  const [direction, setDirection] = useState(0);
  const [lightboxImg, setLightboxImg] = useState(null);

  useEffect(() => {
    if (activeFolderId) fetchPages(activeFolderId);
    else if (activeBookId) fetchBookPages(activeBookId);
  }, [activeFolderId, activeBookId]);

  const displayPages = activeFolderId ? pages : bookPages.length > 0 ? bookPages : pages;
  const total = displayPages.length;

  const goTo = useCallback(
    (idx) => {
      if (idx === bookViewPageIndex || idx < 0 || idx >= total) return;
      if (soundEnabled) playPaperTurnSound();
      setDirection(idx > bookViewPageIndex ? 1 : -1);
      setBookViewPageIndex(idx);
    },
    [bookViewPageIndex, total, soundEnabled, setBookViewPageIndex]
  );

  const prev = useCallback(() => {
    if (twoPageSpread && bookViewPageIndex > 1) {
      goTo(bookViewPageIndex - 2);
    } else if (bookViewPageIndex > 0) {
      goTo(bookViewPageIndex - 1);
    }
  }, [bookViewPageIndex, twoPageSpread, goTo]);

  const next = useCallback(() => {
    if (twoPageSpread && bookViewPageIndex + 2 < total) {
      goTo(bookViewPageIndex + 2);
    } else if (bookViewPageIndex < total - 1) {
      goTo(bookViewPageIndex + 1);
    }
  }, [bookViewPageIndex, total, twoPageSpread, goTo]);

  if (displayPages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-ink-400 font-serif text-xl">
        No pages to display yet.
      </div>
    );
  }

  // Two-page spread indices
  const leftPageIdx = twoPageSpread ? Math.floor(bookViewPageIndex / 2) * 2 : bookViewPageIndex;
  const rightPageIdx = leftPageIdx + 1;
  const leftPage = displayPages[leftPageIdx] || null;
  const rightPage = twoPageSpread ? displayPages[rightPageIdx] || null : null;

  return (
    <div className="flex flex-col h-full bg-paper-100/60 dark:bg-ink-950 select-none">
      {/* Top Reading Controls Header */}
      <div className="flex items-center justify-between px-4 sm:px-8 py-2.5 border-b border-paper-200 dark:border-ink-800 bg-white/80 dark:bg-ink-900/80 backdrop-blur-md z-20">
        <div className="flex items-center gap-2">
          <button
            onClick={prev}
            disabled={bookViewPageIndex === 0}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-ink-700 dark:text-paper-200 bg-paper-50 hover:bg-paper-200 dark:bg-ink-800 dark:hover:bg-ink-700 border border-paper-200 dark:border-ink-700 disabled:opacity-30 transition shadow-xs"
          >
            <ChevronLeft size={14} /> Previous
          </button>
          <button
            onClick={next}
            disabled={
              twoPageSpread ? rightPageIdx >= total - 1 && leftPageIdx >= total - 1 : bookViewPageIndex >= total - 1
            }
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-ink-700 dark:text-paper-200 bg-paper-50 hover:bg-paper-200 dark:bg-ink-800 dark:hover:bg-ink-700 border border-paper-200 dark:border-ink-700 disabled:opacity-30 transition shadow-xs"
          >
            Next <ChevronRight size={14} />
          </button>
        </div>

        {/* Page progress badge */}
        <div className="text-center font-mono text-xs text-ink-500 dark:text-paper-400">
          {twoPageSpread && rightPage ? (
            <span>
              Pages {leftPageIdx + 1}–{rightPageIdx + 1} <span className="opacity-50">of {total}</span>
            </span>
          ) : (
            <span>
              Page {bookViewPageIndex + 1} <span className="opacity-50">of {total}</span>
            </span>
          )}
        </div>

        {/* Right action toggles */}
        <div className="flex items-center gap-1.5">
          {/* Two-page spread toggle (Desktop only) */}
          <button
            onClick={toggleTwoPageSpread}
            className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs text-ink-600 dark:text-paper-300 hover:bg-paper-200 dark:hover:bg-ink-800 transition"
            title={twoPageSpread ? 'Switch to single page view' : 'Switch to two-page open book spread'}
          >
            {twoPageSpread ? <Columns size={15} className="text-blue-500" /> : <Square size={15} />}
            <span className="text-[11px] font-medium hidden xl:inline">
              {twoPageSpread ? '2-Page Spread' : 'Single Page'}
            </span>
          </button>

          {/* Sound toggle */}
          <button
            onClick={toggleSound}
            className="p-2 rounded-xl text-ink-500 dark:text-paper-400 hover:bg-paper-200 dark:hover:bg-ink-800 transition"
            title={soundEnabled ? 'Paper flip sounds active (click to mute)' : 'Muted (click to enable sounds)'}
          >
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} className="opacity-40" />}
          </button>
        </div>
      </div>

      {/* Main 3D Book Reading Area */}
      <div className="flex-1 overflow-hidden relative perspective-[1800px] flex items-center justify-center p-4 sm:p-6">
        {/* LEFT PAGE-EDGE TAP ZONE (Click to flip prev) */}
        <div
          onClick={prev}
          className={`absolute left-0 top-0 bottom-0 w-[12%] sm:w-[15%] z-30 cursor-w-resize group flex items-center justify-start pl-4 ${
            bookViewPageIndex === 0 ? 'pointer-events-none' : ''
          }`}
          title="Previous Page (Click)"
        >
          <div className="w-9 h-9 rounded-full bg-white/70 dark:bg-ink-800/70 border border-paper-300 dark:border-ink-700 shadow-md flex items-center justify-center text-ink-700 dark:text-paper-200 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-xs">
            <ChevronLeft size={18} />
          </div>
        </div>

        {/* RIGHT PAGE-EDGE TAP ZONE (Click to flip next) */}
        <div
          onClick={next}
          className={`absolute right-0 top-0 bottom-0 w-[12%] sm:w-[15%] z-30 cursor-e-resize group flex items-center justify-end pr-4 ${
            twoPageSpread
              ? rightPageIdx >= total - 1 && leftPageIdx >= total - 1
                ? 'pointer-events-none'
                : ''
              : bookViewPageIndex >= total - 1
              ? 'pointer-events-none'
              : ''
          }`}
          title="Next Page (Click)"
        >
          <div className="w-9 h-9 rounded-full bg-white/70 dark:bg-ink-800/70 border border-paper-300 dark:border-ink-700 shadow-md flex items-center justify-center text-ink-700 dark:text-paper-200 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-xs">
            <ChevronRight size={18} />
          </div>
        </div>

        {/* OPEN HARDCOVER SPREAD CONTAINER */}
        <div className="w-full max-w-5xl h-full flex flex-col justify-center">
          <AnimatePresence custom={direction} mode="wait">
            <motion.div
              key={`${leftPage?.id}-${twoPageSpread ? rightPage?.id : 'single'}`}
              custom={direction}
              variants={page3DVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="w-full h-full max-h-[82vh] overflow-hidden flex shadow-book rounded-2xl border border-paper-300 dark:border-ink-800 bg-[var(--bg-page)] relative"
              style={{ transformStyle: 'preserve-3d' }}
            >
              {/* TWO-PAGE SPREAD ON WIDE SCREENS */}
              {twoPageSpread && rightPage ? (
                <div className="flex w-full h-full divide-x divide-paper-300 dark:divide-ink-800">
                  {/* LEFT PAGE */}
                  <div className="flex-1 overflow-y-auto p-6 sm:p-10 relative custom-scrollbar">
                    {/* Page Binding Gutter Shadow (Right side of left page) */}
                    <div className="absolute right-0 top-0 bottom-0 w-8 pointer-events-none bg-gradient-to-l from-black/10 dark:from-black/30 to-transparent" />
                    <SinglePageViewContent
                      page={leftPage}
                      pageIndex={leftPageIdx}
                      total={total}
                      onEdit={() => {
                        setActivePage(leftPage.id);
                        router.push(`/books/${leftPage.bookId || activeBookId}/pages/${leftPage.id}`);
                      }}
                      onImageClick={(src, alt) => setLightboxImg({ src, alt })}
                    />
                  </div>

                  {/* CENTER SEWN BINDING SEAM */}
                  <div className="w-[3px] bg-paper-400 dark:bg-ink-750 flex-shrink-0 relative shadow-inner">
                    <div className="absolute inset-y-0 -left-1 -right-1 pointer-events-none bg-gradient-to-r from-black/20 via-black/40 to-black/20" />
                  </div>

                  {/* RIGHT PAGE */}
                  <div className="flex-1 overflow-y-auto p-6 sm:p-10 relative custom-scrollbar">
                    {/* Page Binding Gutter Shadow (Left side of right page) */}
                    <div className="absolute left-0 top-0 bottom-0 w-8 pointer-events-none bg-gradient-to-r from-black/10 dark:from-black/30 to-transparent" />
                    <SinglePageViewContent
                      page={rightPage}
                      pageIndex={rightPageIdx}
                      total={total}
                      onEdit={() => {
                        setActivePage(rightPage.id);
                        router.push(`/books/${rightPage.bookId || activeBookId}/pages/${rightPage.id}`);
                      }}
                      onImageClick={(src, alt) => setLightboxImg({ src, alt })}
                    />
                  </div>
                </div>
              ) : (
                /* SINGLE PAGE VIEW (Mobile / Default) */
                <div className="w-full h-full overflow-y-auto p-6 sm:p-12 relative custom-scrollbar">
                  {leftPage && (
                    <SinglePageViewContent
                      page={leftPage}
                      pageIndex={bookViewPageIndex}
                      total={total}
                      onEdit={() => {
                        setActivePage(leftPage.id);
                        router.push(`/books/${leftPage.bookId || activeBookId}/pages/${leftPage.id}`);
                      }}
                      onImageClick={(src, alt) => setLightboxImg({ src, alt })}
                    />
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Image Lightbox */}
      {lightboxImg && (
        <ImageLightbox
          src={lightboxImg.src}
          alt={lightboxImg.alt}
          onClose={() => setLightboxImg(null)}
        />
      )}

      {/* Bottom pagination dots */}
      {total > 1 && (
        <div className="flex items-center justify-center gap-1.5 py-2.5 border-t border-paper-200 dark:border-ink-800 bg-white/60 dark:bg-ink-900/60 z-10">
          {displayPages.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`rounded-full transition-all ${
                i === bookViewPageIndex
                  ? 'w-6 h-2 bg-ink-900 dark:bg-paper-100'
                  : 'w-2 h-2 bg-paper-300 dark:bg-ink-700 hover:bg-ink-400'
              }`}
              title={`Jump to page ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Single Page Content Component
function SinglePageViewContent({ page, pageIndex, total, onEdit, onImageClick }) {
  if (!page) return null;

  return (
    <div className="notebook-page min-h-full">
      {/* Header rule with Page Number, Date, and Edit Button */}
      <div className="flex items-center justify-between pb-2 mb-6 border-b-2 border-red-300/70 dark:border-red-900/50 text-xs font-mono select-none">
        <div className="flex items-center gap-2">
          <span className="font-bold text-red-600/90 dark:text-red-400 tracking-widest uppercase text-[11px]">
            PAGE {pageIndex + 1}
          </span>
          <span className="text-ink-400 dark:text-ink-500 font-normal">of {total}</span>
          <span className="text-ink-300 dark:text-ink-600">&middot;</span>
          <span className="text-ink-400 dark:text-ink-500 text-[11px]">
            {formatDate(page.updatedAt || page.createdAt)}
          </span>
        </div>

        <button
          onClick={onEdit}
          className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-semibold transition"
          title="Edit this note"
        >
          <Edit3 size={12} /> Edit
        </button>
      </div>

      {/* Note Title */}
      {page.title &&
        page.title !== 'Untitled Page' &&
        page.title !== 'Untitled Note' &&
        page.title.trim() !== '' && (
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-ink-900 dark:text-paper-100 leading-tight mb-6 pb-2 border-b-2 border-blue-200/80 dark:border-blue-900/50">
            {page.title}
          </h1>
        )}

      {/* Tags */}
      {page.tags && page.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-5">
          {page.tags.map((tag) => (
            <span
              key={tag}
              className="px-2.5 py-0.5 bg-paper-200/70 dark:bg-ink-800 rounded-full text-xs font-medium text-ink-600 dark:text-paper-300 border border-paper-300/60 dark:border-ink-700"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Rendered Body Content */}
      <div className="tiptap-editor select-text font-serif leading-relaxed">
        <RenderContent contentJSON={page.contentJSON} onImageClick={onImageClick} />
      </div>
    </div>
  );
}

// Code Block with 1-Click Copy Button
export function CodeBlock({ codeText }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(codeText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group my-6 rounded-2xl overflow-hidden shadow-page border border-ink-800">
      <div className="flex items-center justify-between px-4 py-2 bg-ink-950 text-ink-400 text-xs font-mono border-b border-ink-800">
        <span className="text-[11px] font-semibold text-emerald-400">Code Snippet</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 hover:text-white transition px-2 py-0.5 rounded-md hover:bg-white/10"
        >
          {copied ? (
            <>
              <Check size={12} className="text-emerald-400" />
              <span className="text-emerald-400">Copied!</span>
            </>
          ) : (
            <>
              <Copy size={12} />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-4 bg-ink-900 text-paper-100 text-[13px] font-mono overflow-x-auto m-0">
        <code>{codeText}</code>
      </pre>
    </div>
  );
}

export function RenderContent({ contentJSON, onImageClick }) {
  const renderNode = (node, index) => {
    if (!node) return null;
    switch (node.type) {
      case 'doc':
        return <React.Fragment key={index}>{(node.content || []).map((n, i) => renderNode(n, i))}</React.Fragment>;
      case 'paragraph':
        return <p key={index}>{(node.content || []).map((n, i) => renderNode(n, i))}</p>;
      case 'heading': {
        const Tag = `h${node.attrs?.level || 1}`;
        return <Tag key={index}>{(node.content || []).map((n, i) => renderNode(n, i))}</Tag>;
      }
      case 'bulletList':
        return <ul key={index}>{(node.content || []).map((n, i) => renderNode(n, i))}</ul>;
      case 'orderedList':
        return <ol key={index}>{(node.content || []).map((n, i) => renderNode(n, i))}</ol>;
      case 'listItem':
        return <li key={index}>{(node.content || []).map((n, i) => renderNode(n, i))}</li>;
      case 'blockquote':
        return (
          <blockquote key={index} className="gfg-callout">
            {(node.content || []).map((n, i) => renderNode(n, i))}
          </blockquote>
        );
      case 'codeBlock': {
        const rawCode = (node.content || []).map((n) => n.text || '').join('');
        return <CodeBlock key={index} codeText={rawCode} />;
      }
      case 'taskList':
        return <ul key={index} data-type="taskList">{(node.content || []).map((n, i) => renderNode(n, i))}</ul>;
      case 'taskItem':
        return (
          <li key={index} data-type="taskItem" data-checked={node.attrs?.checked}>
            <label>
              <input type="checkbox" defaultChecked={node.attrs?.checked} readOnly />
            </label>
            <div>{(node.content || []).map((n, i) => renderNode(n, i))}</div>
          </li>
        );
      case 'table':
        return (
          <div key={index} className="overflow-x-auto my-6">
            <table className="gfg-table w-full border-collapse">
              <tbody>{(node.content || []).map((n, i) => renderNode(n, i))}</tbody>
            </table>
          </div>
        );
      case 'tableRow':
        return <tr key={index}>{(node.content || []).map((n, i) => renderNode(n, i))}</tr>;
      case 'tableHeader':
        return (
          <th key={index} colSpan={node.attrs?.colspan || 1} rowSpan={node.attrs?.rowspan || 1}>
            {(node.content || []).map((n, i) => renderNode(n, i))}
          </th>
        );
      case 'tableCell':
        return (
          <td key={index} colSpan={node.attrs?.colspan || 1} rowSpan={node.attrs?.rowspan || 1}>
            {(node.content || []).map((n, i) => renderNode(n, i))}
          </td>
        );
      case 'text': {
        let content = node.text;
        if (node.marks) {
          node.marks.forEach((mark) => {
            if (mark.type === 'bold') content = <strong>{content}</strong>;
            if (mark.type === 'italic') content = <em>{content}</em>;
            if (mark.type === 'code') content = <code>{content}</code>;
            if (mark.type === 'underline') content = <u>{content}</u>;
            if (mark.type === 'highlight') content = <mark>{content}</mark>;
          });
        }
        return <React.Fragment key={index}>{content}</React.Fragment>;
      }
      case 'hardBreak':
        return <br key={index} />;
      case 'image':
        return (
          <div key={index} className="my-6">
            <img
              src={node.attrs?.src}
              alt={node.attrs?.alt || 'Note illustration'}
              className="rounded-2xl max-w-full shadow-page cursor-zoom-in border border-paper-200 dark:border-ink-700"
              onClick={() => onImageClick?.(node.attrs?.src, node.attrs?.alt)}
            />
            {node.attrs?.alt && (
              <p className="text-center text-xs text-ink-400 mt-2 font-mono">{node.attrs.alt}</p>
            )}
          </div>
        );
      default:
        return <React.Fragment key={index}>{(node.content || []).map((n, i) => renderNode(n, i))}</React.Fragment>;
    }
  };

  try {
    const json = typeof contentJSON === 'string' ? JSON.parse(contentJSON) : contentJSON;
    return renderNode(json, 0);
  } catch {
    return null;
  }
}