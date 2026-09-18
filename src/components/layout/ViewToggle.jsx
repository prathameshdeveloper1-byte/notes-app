'use client';
import React from 'react';
import useUIStore from '../../store/useUIStore';
import { LayoutGrid, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ViewToggle() {
  const { viewMode, setViewMode } = useUIStore();

  return (
    <div className="flex items-center bg-paper-100 dark:bg-ink-800 rounded-xl p-0.5 gap-0.5">
      {[{ id: 'grid', Icon: LayoutGrid, label: 'Grid' }, { id: 'book', Icon: BookOpen, label: 'Book' }].map(({ id, Icon, label }) => (
        <button
          key={id}
          onClick={() => setViewMode(id)}
          className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] text-sm font-medium transition-colors z-10 ${
            viewMode === id ? 'text-ink-800 dark:text-paper-100' : 'text-ink-400 dark:text-ink-500 hover:text-ink-600'
          }`}
        >
          {viewMode === id && (
            <motion.div
              layoutId="viewToggleBg"
              className="absolute inset-0 bg-white dark:bg-ink-700 rounded-[10px] shadow-sm"
              transition={{ type: 'spring', duration: 0.3 }}
            />
          )}
          <Icon size={14} className="relative z-10" />
          <span className="relative z-10">{label}</span>
        </button>
      ))}
    </div>
  );
}
