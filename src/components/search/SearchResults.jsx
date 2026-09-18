'use client';
import React from 'react';
import { formatDate, extractSnippet } from '../../lib/utils';
import { FileText } from 'lucide-react';

export default function SearchResults({ results, onSelect }) {
  if (results.length === 0) return null;

  return (
    <div className="divide-y divide-paper-100 dark:divide-ink-700">
      {results.map(({ item }) => (
        <button
          key={item.id}
          onClick={() => onSelect(item)}
          className="flex items-start gap-3 w-full px-4 py-3 hover:bg-paper-50 dark:hover:bg-ink-700 transition text-left"
        >
          <FileText size={16} className="text-ink-300 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-ink-800 dark:text-paper-100 truncate">{item.title}</p>
            <p className="text-xs text-ink-400 dark:text-ink-500 mt-0.5 truncate">
              {extractSnippet(item.contentJSON, 80)}
            </p>
          </div>
          <span className="text-xs text-ink-300 flex-shrink-0">{formatDate(item.updatedAt)}</span>
        </button>
      ))}
    </div>
  );
}
