'use client';
import React from 'react';

export function BookShelfSkeleton({ count = 6 }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex flex-col rounded-2xl overflow-hidden bg-white/60 dark:bg-ink-850/60 border border-paper-200 dark:border-ink-800 shadow-sm"
        >
          {/* Book Spine & Cover placeholder */}
          <div className="h-44 sm:h-52 bg-paper-100 dark:bg-ink-800 relative flex flex-col justify-between p-4">
            <div className="w-1.5 h-full absolute left-0 top-0 bg-paper-200 dark:bg-ink-700" />
            <div className="w-8 h-8 rounded-lg bg-paper-200 dark:bg-ink-700" />
            <div className="space-y-2">
              <div className="h-4 w-3/4 bg-paper-200 dark:bg-ink-700 rounded-md" />
              <div className="h-3 w-1/2 bg-paper-200/80 dark:bg-ink-700/80 rounded-md" />
            </div>
          </div>
          {/* Meta footer */}
          <div className="p-3.5 space-y-2 bg-paper-50/50 dark:bg-ink-900/50">
            <div className="flex items-center justify-between">
              <div className="h-3 w-16 bg-paper-200 dark:bg-ink-700 rounded" />
              <div className="h-3 w-12 bg-paper-200 dark:bg-ink-700 rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function PageGridSkeleton({ count = 8 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white dark:bg-ink-850 rounded-2xl border border-paper-200 dark:border-ink-800 p-5 shadow-sm space-y-4"
        >
          <div className="flex items-center justify-between">
            <div className="h-4 w-2/3 bg-paper-100 dark:bg-ink-750 rounded-md" />
            <div className="w-4 h-4 bg-paper-100 dark:bg-ink-750 rounded" />
          </div>
          {/* Simulated ruled paper text lines */}
          <div className="space-y-2 pt-2 border-t border-paper-100 dark:border-ink-800">
            <div className="h-2.5 w-full bg-paper-100 dark:bg-ink-750 rounded" />
            <div className="h-2.5 w-5/6 bg-paper-100 dark:bg-ink-750 rounded" />
            <div className="h-2.5 w-4/6 bg-paper-100 dark:bg-ink-750 rounded" />
            <div className="h-2.5 w-3/4 bg-paper-100 dark:bg-ink-750 rounded" />
          </div>
          <div className="flex items-center justify-between pt-2">
            <div className="h-3 w-14 bg-paper-100 dark:bg-ink-750 rounded-full" />
            <div className="h-3 w-20 bg-paper-100 dark:bg-ink-750 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function PageIndexSkeleton({ count = 6 }) {
  return (
    <div className="max-w-3xl mx-auto space-y-4 animate-pulse">
      {/* Title skeleton */}
      <div className="h-8 w-48 bg-paper-200 dark:bg-ink-800 rounded-lg mb-6" />
      
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-center justify-between py-3 px-4 rounded-xl bg-paper-50 dark:bg-ink-850/50 border border-paper-200/50 dark:border-ink-800"
        >
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-paper-200 dark:bg-ink-750" />
            <div className="h-4 w-40 bg-paper-200 dark:bg-ink-750 rounded" />
          </div>
          <div className="h-3.5 w-16 bg-paper-200 dark:bg-ink-750 rounded" />
        </div>
      ))}
    </div>
  );
}
