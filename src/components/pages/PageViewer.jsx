'use client';
import React, { useEffect, useState } from 'react';
import usePageStore from '../../store/usePageStore';
import useUIStore from '../../store/useUIStore';
import useFolderStore from '../../store/useFolderStore';
import useBookStore from '../../store/useBookStore';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Edit3 } from 'lucide-react';
import { wordCount, readingTime, formatDate } from '../../lib/utils';

const pageVariants = {
  enter: (direction) => ({
    x: direction > 0 ? '100%' : '-100%',
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: (direction) => ({
    x: direction > 0 ? '-100%' : '100%',
    opacity: 0,
  }),
};

export default function PageViewer() {
  const { pages, fetchPages } = usePageStore();
  const { activeFolderId, setActivePage, bookViewPageIndex, setBookViewPageIndex } = useUIStore();
  const [direction, setDirection] = useState(0);

  useEffect(() => {
    if (activeFolderId) fetchPages(activeFolderId);
  }, [activeFolderId]);

  const currentPage = pages[bookViewPageIndex] || null;
  const total = pages.length;

  const goTo = (idx) => {
    setDirection(idx > bookViewPageIndex ? 1 : -1);
    setBookViewPageIndex(idx);
  };

  const prev = () => { if (bookViewPageIndex > 0) goTo(bookViewPageIndex - 1); };
  const next = () => { if (bookViewPageIndex < total - 1) goTo(bookViewPageIndex + 1); };

  if (pages.length === 0) return (
    <div className="flex items-center justify-center h-full text-ink-400 font-serif text-xl">
      No pages in this chapter yet.
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      {/* Page nav controls */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-paper-200 dark:border-ink-800 bg-white dark:bg-ink-900">
        <button
          onClick={prev}
          disabled={bookViewPageIndex === 0}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm text-ink-500 hover:bg-paper-100 dark:hover:bg-ink-800 disabled:opacity-30 transition"
        >
          <ChevronLeft size={15} /> Previous
        </button>
        <span className="text-sm text-ink-400 dark:text-ink-500">
          Page {bookViewPageIndex + 1} of {total}
        </span>
        <button
          onClick={next}
          disabled={bookViewPageIndex === total - 1}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm text-ink-500 hover:bg-paper-100 dark:hover:bg-ink-800 disabled:opacity-30 transition"
        >
          Next <ChevronRight size={15} />
        </button>
      </div>

      {/* Page content with animation */}
      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence custom={direction} mode="wait">
          {currentPage && (
            <motion.div
              key={currentPage.id}
              custom={direction}
              variants={pageVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="absolute inset-0 overflow-y-auto"
            >
              <div className="max-w-2xl mx-auto px-8 py-10">
                {/* Paper shadow effect */}
                <div className="bg-white dark:bg-ink-900 rounded-2xl shadow-page p-8 min-h-[60vh] border border-paper-200 dark:border-ink-800">
                  {/* Page header */}
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <h1 className="text-3xl font-serif font-bold text-ink-800 dark:text-paper-100 mb-2">
                        {currentPage.title}
                      </h1>
                      <div className="flex items-center gap-3 text-xs text-ink-300 dark:text-ink-600">
                        <span>{formatDate(currentPage.updatedAt)}</span>
                        <span>·</span>
                        <span>{readingTime(wordCount(currentPage.contentJSON))}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => setActivePage(currentPage.id)}
                      className="p-2 hover:bg-paper-100 dark:hover:bg-ink-800 rounded-xl transition text-ink-400"
                    >
                      <Edit3 size={16} />
                    </button>
                  </div>

                  {/* Tags */}
                  {currentPage.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-6">
                      {currentPage.tags.map(tag => (
                        <span key={tag} className="px-2 py-0.5 bg-paper-100 dark:bg-ink-800 rounded-full text-xs text-ink-400">{tag}</span>
                      ))}
                    </div>
                  )}

                  {/* Content rendered */}
                  <div className="tiptap-editor prose max-w-none">
                    <RenderContent contentJSON={currentPage.contentJSON} />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Dots navigation */}
      {total > 1 && (
        <div className="flex items-center justify-center gap-1.5 py-3 border-t border-paper-200 dark:border-ink-800">
          {pages.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`rounded-full transition-all ${
                i === bookViewPageIndex
                  ? 'w-5 h-2 bg-ink-700 dark:bg-paper-300'
                  : 'w-2 h-2 bg-paper-300 dark:bg-ink-700 hover:bg-ink-400'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function RenderContent({ contentJSON }) {
  const renderNode = (node, index) => {
    if (!node) return null;
    switch (node.type) {
      case 'doc': return <>{(node.content || []).map((n, i) => renderNode(n, i))}</>;
      case 'paragraph': return <p key={index}>{(node.content || []).map((n, i) => renderNode(n, i))}</p>;
      case 'heading': {
        const Tag = `h${node.attrs?.level || 1}`;
        return <Tag key={index}>{(node.content || []).map((n, i) => renderNode(n, i))}</Tag>;
      }
      case 'bulletList': return <ul key={index}>{(node.content || []).map((n, i) => renderNode(n, i))}</ul>;
      case 'orderedList': return <ol key={index}>{(node.content || []).map((n, i) => renderNode(n, i))}</ol>;
      case 'listItem': return <li key={index}>{(node.content || []).map((n, i) => renderNode(n, i))}</li>;
      case 'blockquote': return <blockquote key={index}>{(node.content || []).map((n, i) => renderNode(n, i))}</blockquote>;
      case 'codeBlock': return <pre key={index}><code>{(node.content || []).map((n, i) => renderNode(n, i))}</code></pre>;
      case 'taskList': return <ul key={index} data-type="taskList">{(node.content || []).map((n, i) => renderNode(n, i))}</ul>;
      case 'taskItem': return (
        <li key={index} data-type="taskItem" data-checked={node.attrs?.checked}>
          <label><input type="checkbox" defaultChecked={node.attrs?.checked} readOnly /></label>
          <div>{(node.content || []).map((n, i) => renderNode(n, i))}</div>
        </li>
      );
      case 'text': {
        let content = node.text;
        if (node.marks) {
          node.marks.forEach(mark => {
            if (mark.type === 'bold') content = <strong>{content}</strong>;
            if (mark.type === 'italic') content = <em>{content}</em>;
            if (mark.type === 'code') content = <code>{content}</code>;
            if (mark.type === 'underline') content = <u>{content}</u>;
            if (mark.type === 'highlight') content = <mark>{content}</mark>;
          });
        }
        return <React.Fragment key={index}>{content}</React.Fragment>;
      }
      case 'hardBreak': return <br key={index} />;
      case 'image': return <img key={index} src={node.attrs?.src} alt={node.attrs?.alt || ''} />;
      default: return <React.Fragment key={index}>{(node.content || []).map((n, i) => renderNode(n, i))}</React.Fragment>;
    }
  };

  try {
    const json = typeof contentJSON === 'string' ? JSON.parse(contentJSON) : contentJSON;
    return renderNode(json, 0);
  } catch {
    return null;
  }
}
