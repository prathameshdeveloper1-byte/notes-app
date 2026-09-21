'use client';
import React, { useState } from 'react';
import { Share2, Copy, Check, ExternalLink, X, Globe, ShieldCheck } from 'lucide-react';

export default function ShareModal({ open, onClose, page, bookTitle }) {
  const [copied, setCopied] = useState(false);

  if (!open || !page) return null;

  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/share/page/${page.id}`
    : `/share/page/${page.id}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy share link:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-ink-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative bg-white dark:bg-ink-850 rounded-2xl shadow-page border border-paper-200 dark:border-ink-700 w-full max-w-md p-6 z-10 animate-fade-in">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900/60 flex items-center justify-center text-blue-600 dark:text-blue-400 flex-shrink-0">
              <Share2 size={20} />
            </div>
            <div>
              <h3 className="font-serif font-bold text-lg text-ink-900 dark:text-paper-100 leading-tight">
                Share Note
              </h3>
              <p className="text-xs text-ink-400">Generate a read-only public link</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-paper-100 dark:hover:bg-ink-700 rounded-lg text-ink-400 hover:text-ink-600 dark:hover:text-paper-200 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Note info pill */}
        <div className="mb-4 p-3 bg-paper-50 dark:bg-ink-800 rounded-xl border border-paper-200 dark:border-ink-700 text-xs">
          <div className="font-semibold text-ink-800 dark:text-paper-100 truncate mb-0.5">
            {page.title || 'Untitled Page'}
          </div>
          {bookTitle && (
            <div className="text-ink-400 flex items-center gap-1.5 truncate">
              <span>From:</span>
              <span className="font-medium text-ink-600 dark:text-paper-300 truncate">{bookTitle}</span>
            </div>
          )}
        </div>

        {/* Link box */}
        <div className="space-y-2 mb-5">
          <label className="text-xs font-semibold text-ink-600 dark:text-paper-300 flex items-center gap-1.5">
            <Globe size={13} className="text-blue-500" />
            Public View Link
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={shareUrl}
              className="flex-1 bg-paper-50 dark:bg-ink-900 border border-paper-300 dark:border-ink-700 rounded-xl px-3 py-2 text-xs font-mono text-ink-700 dark:text-paper-200 select-all outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button
              onClick={handleCopy}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl transition ${
                copied
                  ? 'bg-green-600 text-white shadow-xs'
                  : 'bg-ink-900 hover:bg-ink-800 text-white dark:bg-paper-100 dark:text-ink-900 dark:hover:bg-white'
              }`}
            >
              {copied ? (
                <>
                  <Check size={14} /> Copied!
                </>
              ) : (
                <>
                  <Copy size={14} /> Copy
                </>
              )}
            </button>
          </div>
        </div>

        {/* Privacy Note */}
        <div className="flex items-start gap-2 text-[11px] text-ink-400 dark:text-ink-500 mb-6 bg-paper-50/70 dark:bg-ink-800/40 p-3 rounded-xl border border-paper-200/50 dark:border-ink-750">
          <ShieldCheck size={15} className="flex-shrink-0 text-emerald-500 mt-0.5" />
          <p className="leading-relaxed">
            Anyone with this link can read this note formatted in student notebook view. They cannot edit, delete, or modify your notebook.
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2">
          <a
            href={shareUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition"
          >
            <ExternalLink size={13} />
            Open live preview
          </a>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-ink-600 dark:text-paper-300 hover:bg-paper-100 dark:hover:bg-ink-700 rounded-xl border border-paper-200 dark:border-ink-700 transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
