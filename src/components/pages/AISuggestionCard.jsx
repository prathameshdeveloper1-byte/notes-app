'use client';

import React, { useState } from 'react';
import { Sparkles, Check, X, Code2, Lightbulb, Copy } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AISuggestionCard({ suggestion, onKeep, onDiscard }) {
  const [copied, setCopied] = useState(false);
  const isCode = suggestion.type === 'code' || suggestion.content.includes('```');

  const handleCopy = () => {
    navigator.clipboard.writeText(suggestion.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="my-4 p-4 rounded-2xl bg-gradient-to-br from-violet-50/70 to-indigo-50/40 dark:from-violet-950/20 dark:to-indigo-950/20 border border-violet-200/80 dark:border-violet-800/50 shadow-sm"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-violet-700 dark:text-violet-300">
          <Sparkles size={14} className="text-violet-500" />
          <span>AI Suggestion:</span>
          <span className="text-ink-600 dark:text-paper-300 font-medium">
            {suggestion.title}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5">
          {isCode && (
            <button
              onClick={handleCopy}
              className="p-1 hover:bg-violet-200/50 dark:hover:bg-violet-900/40 rounded-lg text-violet-600 dark:text-violet-300 text-xs transition"
              title="Copy snippet"
            >
              {copied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
            </button>
          )}
          <button
            onClick={() => onKeep(suggestion)}
            className="flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium transition shadow-sm"
            title="Keep this in your note"
          >
            <Check size={12} /> Keep
          </button>
          <button
            onClick={() => onDiscard(suggestion.id)}
            className="flex items-center gap-1 px-2 py-1 bg-paper-200/80 dark:bg-ink-800 text-ink-500 hover:text-red-500 dark:text-paper-400 rounded-lg text-xs transition"
            title="Discard suggestion"
          >
            <X size={12} /> Discard
          </button>
        </div>
      </div>

      {/* Suggestion Body */}
      <div className="text-xs text-ink-700 dark:text-paper-200 leading-relaxed font-sans">
        {isCode ? (
          <pre className="p-3 bg-ink-900 text-paper-100 rounded-xl overflow-x-auto font-mono text-[12px] my-1 border border-ink-800">
            <code>{suggestion.content.replace(/^```[a-z]*\n?/, '').replace(/```$/, '')}</code>
          </pre>
        ) : (
          <p className="italic bg-white/70 dark:bg-ink-900/50 p-2.5 rounded-xl border border-violet-100 dark:border-violet-900/50">
            {suggestion.content}
          </p>
        )}
      </div>
    </motion.div>
  );
}