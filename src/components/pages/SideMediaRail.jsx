'use client';

import React from 'react';
import { Image as ImageIcon, Plus, Maximize2, Trash2, ChevronRight, ChevronLeft } from 'lucide-react';

export default function SideMediaRail({
  images = [],
  isOpen,
  onToggle,
  onImageClick,
  onInsertImage,
  onDeleteImage,
}) {
  return (
    <div
      className={`fixed right-0 top-16 bottom-0 z-20 flex transition-all duration-300 ${
        isOpen ? 'translate-x-0' : 'translate-x-[calc(100%-2.5rem)]'
      }`}
    >
      {/* Tab toggle button */}
      <button
        onClick={onToggle}
        className="self-center -ml-10 flex items-center gap-1.5 px-2.5 py-3 bg-white dark:bg-ink-800 border-l border-y border-paper-200 dark:border-ink-700 rounded-l-2xl shadow-page text-xs font-medium text-ink-600 dark:text-paper-200 hover:text-ink-900 transition-colors"
        title="Toggle Attached Media"
      >
        {isOpen ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
        <span className="flex items-center gap-1">
          <ImageIcon size={14} />
          <span className="bg-paper-200 dark:bg-ink-700 px-1.5 py-0.5 rounded-full text-[10px] font-bold">
            {images.length}
          </span>
        </span>
      </button>

      {/* Drawer content */}
      <div className="w-72 h-full bg-white/95 dark:bg-ink-900/95 backdrop-blur-md border-l border-paper-200 dark:border-ink-800 flex flex-col shadow-page">
        <div className="p-4 border-b border-paper-200 dark:border-ink-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-serif font-bold text-ink-800 dark:text-paper-100">
            <ImageIcon size={16} />
            <span>Attached Media</span>
            <span className="text-xs font-normal text-ink-400">({images.length})</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {images.length === 0 ? (
            <div className="text-center py-12 text-ink-400">
              <ImageIcon size={32} className="mx-auto text-ink-300 dark:text-ink-700 mb-2" />
              <p className="text-xs font-medium">No images uploaded yet</p>
              <p className="text-[11px] text-ink-300 mt-1">
                Paste or drag screenshots directly into the editor.
              </p>
            </div>
          ) : (
            images.map((img, index) => (
              <div
                key={index}
                className="group relative bg-paper-50 dark:bg-ink-800 border border-paper-200 dark:border-ink-700 rounded-2xl overflow-hidden shadow-sm hover:shadow-page transition-all"
              >
                <div
                  className="aspect-video w-full overflow-hidden bg-paper-100 dark:bg-ink-700 cursor-pointer"
                  onClick={() => onImageClick(img.src, img.alt)}
                >
                  <img
                    src={img.src}
                    alt={img.alt || `Media ${index + 1}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                </div>

                {/* Overlay actions */}
                <div className="p-2 flex items-center justify-between gap-1 text-xs">
                  <span className="truncate text-ink-600 dark:text-paper-300 text-[11px] flex-1">
                    {img.alt || `Figure ${index + 1}`}
                  </span>
                  <button
                    onClick={() => onImageClick(img.src, img.alt)}
                    className="p-1 hover:bg-paper-200 dark:hover:bg-ink-700 rounded-lg text-ink-400 hover:text-ink-700 transition"
                    title="Expand Full Screen"
                  >
                    <Maximize2 size={13} />
                  </button>
                  {onInsertImage && (
                    <button
                      onClick={() => onInsertImage(img.src, img.alt)}
                      className="p-1 hover:bg-paper-200 dark:hover:bg-ink-700 rounded-lg text-ink-400 hover:text-emerald-600 transition"
                      title="Insert into text at cursor"
                    >
                      <Plus size={13} />
                    </button>
                  )}
                  {onDeleteImage && (
                    <button
                      onClick={() => onDeleteImage(img.src)}
                      className="p-1 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg text-ink-400 hover:text-red-500 transition"
                      title="Delete image from note"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}