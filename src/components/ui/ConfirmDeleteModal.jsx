'use client';
import React, { useState, useEffect } from 'react';
import { AlertTriangle, Trash2, X, Loader2 } from 'lucide-react';

export default function ConfirmDeleteModal({
  open,
  onClose,
  onConfirm,
  title = 'Delete Item',
  itemName = '',
  description = 'Are you sure you want to delete this item? This action cannot be undone.',
  itemType = 'item',
}) {
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && open && !isDeleting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, isDeleting, onClose]);

  if (!open) return null;

  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      await onConfirm();
      onClose();
    } catch (err) {
      console.error('Delete error:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-ink-900/60 backdrop-blur-sm transition-opacity"
        onClick={!isDeleting ? onClose : undefined}
      />

      {/* Modal Card */}
      <div className="relative bg-white dark:bg-ink-850 rounded-2xl shadow-page border border-paper-200 dark:border-ink-700 w-full max-w-md p-6 z-10 animate-fade-in">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/60 flex items-center justify-center text-red-600 dark:text-red-400 flex-shrink-0">
              <Trash2 size={20} />
            </div>
            <div>
              <h3 className="font-serif font-bold text-lg text-ink-900 dark:text-paper-100">
                {title}
              </h3>
              <span className="text-xs text-ink-400 capitalize">Delete {itemType}</span>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isDeleting}
            className="p-1 hover:bg-paper-100 dark:hover:bg-ink-700 rounded-lg text-ink-400 transition"
          >
            <X size={16} />
          </button>
        </div>

        {/* Item preview & message */}
        <div className="mb-6">
          <p className="text-sm text-ink-600 dark:text-paper-300 leading-relaxed mb-3">
            {description}
          </p>

          {itemName && (
            <div className="p-3 bg-paper-50 dark:bg-ink-800 rounded-xl border border-paper-200 dark:border-ink-700 font-mono text-xs text-ink-700 dark:text-paper-200 truncate">
              &ldquo;{itemName}&rdquo;
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 text-xs font-semibold text-ink-600 dark:text-paper-300 hover:bg-paper-100 dark:hover:bg-ink-700 rounded-xl border border-paper-200 dark:border-ink-700 transition"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={isDeleting}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-xl shadow-xs transition disabled:opacity-50"
          >
            {isDeleting ? (
              <>
                <Loader2 size={13} className="animate-spin" /> Deleting...
              </>
            ) : (
              <>
                <Trash2 size={13} /> Confirm Delete
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
