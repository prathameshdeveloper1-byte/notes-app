'use client';

import React, { useEffect, useState } from 'react';
import { getPublicPage } from '../../../../lib/supabase/queries';
import { RenderContent } from '../../../../components/pages/PageViewer';
import ImageLightbox from '../../../../components/pages/ImageLightbox';
import { formatDate, readingTime, wordCount } from '../../../../lib/utils';
import { BookOpen, Copy, Check, Sun, Moon, ArrowLeft, Share2 } from 'lucide-react';
import Link from 'next/link';

export default function SharedNotePage({ params }) {
  // Support both React.use(params) or params.pageId
  const unwrappedParams = typeof React.use === 'function' ? React.use(params) : params;
  const pageId = unwrappedParams?.pageId;

  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [lightboxImg, setLightboxImg] = useState(null);

  useEffect(() => {
    // Check initial dark mode
    if (typeof window !== 'undefined') {
      const isDark = document.documentElement.classList.contains('dark') ||
        window.matchMedia('(prefers-color-scheme: dark)').matches;
      setDarkMode(isDark);
      if (isDark) {
        document.documentElement.classList.add('dark');
      }
    }
  }, []);

  const toggleDarkMode = () => {
    const next = !darkMode;
    setDarkMode(next);
    if (next) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  useEffect(() => {
    if (!pageId) return;
    setLoading(true);
    getPublicPage(pageId)
      .then((data) => {
        setPage(data);
      })
      .catch((err) => {
        console.error('Failed to load shared page:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [pageId]);

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Helper to extract plain text for stats
  const extractText = (contentJSON) => {
    try {
      const parsed = typeof contentJSON === 'string' ? JSON.parse(contentJSON) : contentJSON;
      const texts = [];
      const traverse = (node) => {
        if (!node) return;
        if (node.text) texts.push(node.text);
        if (node.content) node.content.forEach(traverse);
      };
      traverse(parsed);
      return texts.join(' ');
    } catch {
      return '';
    }
  };

  const plainText = page ? extractText(page.contentJSON) : '';
  const words = wordCount(plainText);
  const readTime = readingTime(plainText);

  if (loading) {
    return (
      <div className="min-h-screen bg-paper-50 dark:bg-ink-900 flex flex-col items-center justify-center p-6">
        <div className="max-w-2xl w-full animate-pulse space-y-6">
          <div className="h-10 w-48 bg-paper-200 dark:bg-ink-800 rounded-xl" />
          <div className="bg-white dark:bg-ink-850 rounded-2xl p-8 border border-paper-200 dark:border-ink-800 space-y-4">
            <div className="h-8 w-3/4 bg-paper-100 dark:bg-ink-750 rounded" />
            <div className="h-4 w-1/3 bg-paper-100 dark:bg-ink-750 rounded mb-8" />
            <div className="space-y-3 pt-6 border-t border-paper-100 dark:border-ink-800">
              <div className="h-3 w-full bg-paper-100 dark:bg-ink-750 rounded" />
              <div className="h-3 w-5/6 bg-paper-100 dark:bg-ink-750 rounded" />
              <div className="h-3 w-4/6 bg-paper-100 dark:bg-ink-750 rounded" />
              <div className="h-3 w-3/4 bg-paper-100 dark:bg-ink-750 rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!page) {
    return (
      <div className="min-h-screen bg-paper-50 dark:bg-ink-900 flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md bg-white dark:bg-ink-850 p-8 rounded-2xl border border-paper-200 dark:border-ink-800 shadow-page">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900/60 flex items-center justify-center text-amber-600 dark:text-amber-400 mx-auto mb-4">
            <BookOpen size={24} />
          </div>
          <h2 className="font-serif font-bold text-xl text-ink-900 dark:text-paper-100 mb-2">
            Note Not Found
          </h2>
          <p className="text-xs text-ink-500 dark:text-paper-400 mb-6 leading-relaxed">
            This note might have been deleted, or the shared link is no longer available.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 bg-ink-900 hover:bg-ink-800 dark:bg-paper-100 dark:hover:bg-white text-white dark:text-ink-900 text-xs font-semibold rounded-xl transition"
          >
            <ArrowLeft size={14} /> Go to Book Notes Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper-100 dark:bg-ink-950 text-ink-900 dark:text-paper-100 selection:bg-amber-200 dark:selection:bg-amber-900 flex flex-col">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 bg-white/80 dark:bg-ink-900/80 backdrop-blur-md border-b border-paper-200 dark:border-ink-800 px-4 sm:px-8 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-2 text-ink-800 dark:text-paper-200 hover:opacity-80 transition group"
            >
              <div className="w-8 h-8 rounded-xl bg-paper-200 dark:bg-ink-800 flex items-center justify-center text-ink-700 dark:text-paper-300">
                <BookOpen size={16} />
              </div>
              <span className="font-serif font-bold text-sm tracking-tight hidden sm:inline">
                Book Notes
              </span>
            </Link>

            <span className="text-paper-300 dark:text-ink-700">/</span>

            <div className="text-xs text-ink-500 dark:text-paper-400 flex items-center gap-1.5 truncate max-w-[200px] sm:max-w-xs">
              {page.bookTitle && <span className="font-medium truncate">{page.bookTitle}</span>}
              {page.folderTitle && (
                <>
                  <span className="text-paper-300 dark:text-ink-700">&middot;</span>
                  <span className="truncate">{page.folderTitle}</span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                copied
                  ? 'bg-green-600 text-white shadow-xs'
                  : 'bg-paper-100 hover:bg-paper-200 dark:bg-ink-800 dark:hover:bg-ink-700 text-ink-700 dark:text-paper-300 border border-paper-300 dark:border-ink-700'
              }`}
            >
              {copied ? (
                <>
                  <Check size={13} /> Link Copied
                </>
              ) : (
                <>
                  <Share2 size={13} /> Share Link
                </>
              )}
            </button>

            <button
              onClick={toggleDarkMode}
              aria-label="Toggle theme"
              className="p-2 rounded-xl text-ink-500 dark:text-paper-400 hover:bg-paper-200 dark:hover:bg-ink-800 transition"
            >
              {darkMode ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Notebook Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-8">
        <div className="notebook-page rounded-2xl shadow-page bg-[var(--bg-page)] border border-paper-200 dark:border-ink-800 min-h-[80vh] p-6 sm:p-12 relative">
          {/* Header Metadata */}
          <div className="border-b-2 border-red-300/70 dark:border-red-900/50 pb-4 mb-8">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-ink-400 dark:text-ink-500 mb-3">
              <div className="flex items-center gap-2">
                <span className="font-bold text-red-600/90 dark:text-red-400 uppercase tracking-wider text-[11px]">
                  READ-ONLY NOTE
                </span>
                <span>&middot;</span>
                <span>{formatDate(page.updatedAt || page.createdAt)}</span>
              </div>
              <div className="flex items-center gap-3">
                <span>{words} words</span>
                <span>&middot;</span>
                <span>{readTime}</span>
              </div>
            </div>

            <h1 className="font-serif font-bold text-2xl sm:text-4xl text-ink-900 dark:text-paper-100 tracking-tight leading-tight mb-3">
              {page.title || 'Untitled Page'}
            </h1>

            {page.tags && page.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {page.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 rounded-md text-[11px] font-mono bg-paper-200 dark:bg-ink-800 text-ink-600 dark:text-paper-300 border border-paper-300/70 dark:border-ink-700"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Rendered Content */}
          <div className="tiptap-editor select-text leading-relaxed font-serif text-ink-850 dark:text-paper-200">
            <RenderContent
              contentJSON={page.contentJSON}
              onImageClick={(src, alt) => setLightboxImg({ src, alt })}
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-xs text-ink-400 dark:text-ink-500 border-t border-paper-200 dark:border-ink-900 mt-8">
        Crafted with <span className="text-red-500">♥</span> in Book Notes — The Digital Student Notebook
      </footer>

      {/* Lightbox for zooming note images */}
      {lightboxImg && (
        <ImageLightbox
          src={lightboxImg.src}
          alt={lightboxImg.alt}
          onClose={() => setLightboxImg(null)}
        />
      )}
    </div>
  );
}
