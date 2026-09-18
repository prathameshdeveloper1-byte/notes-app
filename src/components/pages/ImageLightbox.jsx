'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, ExternalLink, ZoomIn, ZoomOut, Trash2 } from 'lucide-react';

export default function ImageLightbox({ src, alt, onClose, onDelete }) {
  const [zoomed, setZoomed] = React.useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!src) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
        onClick={onClose}
      >
        {/* Top bar controls */}
        <div
          className="absolute top-4 right-4 flex items-center gap-2 z-10"
          onClick={(e) => e.stopPropagation()}
        >
          {onDelete && (
            <button
              onClick={() => {
                if (window.confirm('Delete this image from the note?')) {
                  onDelete(src);
                  onClose();
                }
              }}
              className="p-2.5 bg-red-600/80 hover:bg-red-600 text-white rounded-xl backdrop-blur-sm transition flex items-center gap-1 text-xs"
              title="Delete Image from Note"
            >
              <Trash2 size={18} />
            </button>
          )}
          <button
            onClick={() => setZoomed(!zoomed)}
            className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl backdrop-blur-sm transition"
            title={zoomed ? 'Zoom Out' : 'Zoom In'}
          >
            {zoomed ? <ZoomOut size={18} /> : <ZoomIn size={18} />}
          </button>
          <a
            href={src}
            target="_blank"
            rel="noopener noreferrer"
            download
            className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl backdrop-blur-sm transition"
            title="Download / Open Original"
          >
            <Download size={18} />
          </a>
          <button
            onClick={onClose}
            className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl backdrop-blur-sm transition"
            title="Close (Esc)"
          >
            <X size={18} />
          </button>
        </div>

        {/* Image Display */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: zoomed ? 1.4 : 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="max-w-[90vw] max-h-[85vh] overflow-auto flex items-center justify-center rounded-2xl shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <img
            src={src}
            alt={alt || 'Full preview'}
            className={`max-w-full max-h-[85vh] object-contain rounded-2xl transition-transform duration-300 ${
              zoomed ? 'cursor-zoom-out' : 'cursor-zoom-in'
            }`}
            onClick={() => setZoomed(!zoomed)}
          />
        </motion.div>

        {alt && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white/90 text-xs px-4 py-2 rounded-full backdrop-blur-sm pointer-events-none">
            {alt}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}