'use client';

import React, { useEffect, useState } from 'react';
import usePageStore from '../../store/usePageStore';
import useUIStore from '../../store/useUIStore';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Edit3, Copy, Check, BookOpen, Sparkles, Image as ImageIcon } from 'lucide-react';
import { wordCount, readingTime, formatDate } from '../../lib/utils';
import ImageLightbox from './ImageLightbox';

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
  const [lightboxImg, setLightboxImg] = useState(null);

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
    <div className="flex flex-col h-full bg-paper-50 dark:bg-ink-900">
      {/* Page navigation controls */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-paper-200 dark:border-ink-800 bg-white/80 dark:bg-ink-900/80 backdrop-blur-sm z-10">
        <button
          onClick={prev}
          disabled={bookViewPageIndex === 0}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm text-ink-600 dark:text-paper-300 hover:bg-paper-100 dark:hover:bg-ink-800 disabled:opacity-30 transition"
        >
          <ChevronLeft size={15} /> Previous
        </button>
        <span className="text-xs font-medium text-ink-400 dark:text-ink-500 uppercase tracking-wider">
          Page {bookViewPageIndex + 1} of {total}
        </span>
        <button
          onClick={next}
          disabled={bookViewPageIndex === total - 1}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm text-ink-600 dark:text-paper-300 hover:bg-paper-100 dark:hover:bg-ink-800 disabled:opacity-30 transition"
        >
          Next <ChevronRight size={15} />
        </button>
      </div>

      {/* Page reader area */}
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
              <div className="max-w-4xl mx-auto py-6">
                <div className="notebook-page rounded-2xl shadow-page min-h-[70vh]">
                  {/* Notebook Top Rule with Page Number, Date, and Edit button */}
                  <div className="flex items-center justify-between pb-2 mb-6 border-b-2 border-red-300/70 dark:border-red-900/50 text-xs font-mono select-none">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-red-600/90 dark:text-red-400 tracking-widest uppercase text-[11px]">
                        PAGE {bookViewPageIndex + 1}
                      </span>
                      <span className="text-ink-400 dark:text-ink-500 font-normal">of {total}</span>
                      <span className="text-ink-300 dark:text-ink-600">&middot;</span>
                      <span className="text-ink-400 dark:text-ink-500 text-[11px]">
                        Date: {formatDate(currentPage.updatedAt)}
                      </span>
                    </div>

                    <button
                      onClick={() => setActivePage(currentPage.id)}
                      className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-semibold transition"
                      title="Edit this note"
                    >
                      <Edit3 size={13} /> Edit Note
                    </button>
                  </div>

                  {/* Show Title only if named */}
                  {currentPage.title && currentPage.title !== 'Untitled Page' && currentPage.title !== 'Untitled Note' && (
                    <h1 className="text-2xl sm:text-3xl font-serif font-bold text-ink-900 dark:text-paper-100 leading-tight mb-6 pb-2 border-b-2 border-blue-200/80 dark:border-blue-900/50">
                      {currentPage.title}
                    </h1>
                  )}

                  {/* Tags */}
                  {currentPage.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {currentPage.tags.map(tag => (
                        <span key={tag} className="px-2.5 py-0.5 bg-paper-100/80 dark:bg-ink-700 rounded-full text-xs font-medium text-ink-600 dark:text-paper-300">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Notebook Content */}
                  <div className="tiptap-editor">
                    <RenderContent
                      contentJSON={currentPage.contentJSON}
                      onImageClick={(src, alt) => setLightboxImg({ src, alt })}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Lightbox */}
      {lightboxImg && (
        <ImageLightbox
          src={lightboxImg.src}
          alt={lightboxImg.alt}
          onClose={() => setLightboxImg(null)}
        />
      )}

      {/* Bottom Dots pagination */}
      {total > 1 && (
        <div className="flex items-center justify-center gap-1.5 py-3 border-t border-paper-200 dark:border-ink-800 bg-white/60 dark:bg-ink-900/60">
          {pages.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`rounded-full transition-all ${
                i === bookViewPageIndex
                  ? 'w-6 h-2 bg-ink-800 dark:bg-paper-200'
                  : 'w-2 h-2 bg-paper-300 dark:bg-ink-700 hover:bg-ink-400'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Code Block with 1-Click Copy Button
function CodeBlock({ codeText }) {
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

function RenderContent({ contentJSON, onImageClick }) {
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
        const rawCode = (node.content || []).map(n => n.text || '').join('');
        return <CodeBlock key={index} codeText={rawCode} />;
      }
      case 'taskList':
        return <ul key={index} data-type="taskList">{(node.content || []).map((n, i) => renderNode(n, i))}</ul>;
      case 'taskItem':
        return (
          <li key={index} data-type="taskItem" data-checked={node.attrs?.checked}>
            <label><input type="checkbox" defaultChecked={node.attrs?.checked} readOnly /></label>
            <div>{(node.content || []).map((n, i) => renderNode(n, i))}</div>
          </li>
        );
      case 'table':
        return (
          <div key={index} className="overflow-x-auto my-6">
            <table className="gfg-table w-full border-collapse">
              <tbody>
                {(node.content || []).map((n, i) => renderNode(n, i))}
              </tbody>
            </table>
          </div>
        );
      case 'tableRow':
        return <tr key={index}>{(node.content || []).map((n, i) => renderNode(n, i))}</tr>;
      case 'tableHeader':
        return (
          <th
            key={index}
            colSpan={node.attrs?.colspan || 1}
            rowSpan={node.attrs?.rowspan || 1}
          >
            {(node.content || []).map((n, i) => renderNode(n, i))}
          </th>
        );
      case 'tableCell':
        return (
          <td
            key={index}
            colSpan={node.attrs?.colspan || 1}
            rowSpan={node.attrs?.rowspan || 1}
          >
            {(node.content || []).map((n, i) => renderNode(n, i))}
          </td>
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