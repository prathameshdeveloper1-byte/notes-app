import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export const BOOK_COLORS = [
  { name: 'Indigo',   value: '#6366f1' },
  { name: 'Rose',     value: '#f43f5e' },
  { name: 'Amber',    value: '#f59e0b' },
  { name: 'Emerald',  value: '#10b981' },
  { name: 'Sky',      value: '#0ea5e9' },
  { name: 'Violet',   value: '#8b5cf6' },
  { name: 'Pink',     value: '#ec4899' },
  { name: 'Teal',     value: '#14b8a6' },
  { name: 'Orange',   value: '#f97316' },
  { name: 'Slate',    value: '#64748b' },
];

export const PAGE_COLORS = [
  null,
  '#fef9c3', // yellow
  '#dcfce7', // green
  '#dbeafe', // blue
  '#fce7f3', // pink
  '#ede9fe', // purple
  '#ffedd5', // orange
];

export function getContrastColor(hexColor) {
  if (!hexColor) return '#1a1a1a';
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#1a1a1a' : '#ffffff';
}

export function wordCount(contentJSON) {
  try {
    const parsed = typeof contentJSON === 'string' ? JSON.parse(contentJSON) : contentJSON;
    const texts = [];
    function walk(node) {
      if (node.text) texts.push(node.text);
      if (node.content) node.content.forEach(walk);
    }
    walk(parsed);
    const words = texts.join(' ').trim().split(/\s+/).filter(Boolean);
    return words.length;
  } catch {
    return 0;
  }
}

export function readingTime(wc) {
  const mins = Math.ceil(wc / 200);
  return mins === 1 ? '1 min read' : `${mins} min read`;
}

export function extractSnippet(contentJSON, maxLen = 120) {
  try {
    const parsed = typeof contentJSON === 'string' ? JSON.parse(contentJSON) : contentJSON;
    const texts = [];
    function walk(node) {
      if (node.text) texts.push(node.text);
      if (node.content) node.content.forEach(walk);
    }
    walk(parsed);
    const full = texts.join(' ').trim();
    return full.length > maxLen ? full.slice(0, maxLen) + '...' : full;
  } catch {
    return '';
  }
}

export function formatDate(ts) {
  if (!ts) return '';
  return new Date(ts).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export const BOOK_THEMES = [
  { id: 'indigo', name: 'Indigo', primary: '#6366f1', lightAccent: '#e0e7ff', darkAccent: '#3730a3', spine: '#4f46e5', badge: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300' },
  { id: 'rose', name: 'Rose', primary: '#f43f5e', lightAccent: '#ffe4e6', darkAccent: '#9f1239', spine: '#e11d48', badge: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' },
  { id: 'amber', name: 'Amber', primary: '#d97706', lightAccent: '#fef3c7', darkAccent: '#92400e', spine: '#b45309', badge: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' },
  { id: 'emerald', name: 'Emerald', primary: '#10b981', lightAccent: '#d1fae5', darkAccent: '#065f46', spine: '#059669', badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' },
  { id: 'sky', name: 'Sky', primary: '#0ea5e9', lightAccent: '#e0f2fe', darkAccent: '#075985', spine: '#0284c7', badge: 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300' },
  { id: 'violet', name: 'Violet', primary: '#8b5cf6', lightAccent: '#ede9fe', darkAccent: '#5b21b6', spine: '#7c3aed', badge: 'bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300' },
  { id: 'teal', name: 'Teal', primary: '#14b8a6', lightAccent: '#ccfbf1', darkAccent: '#115e59', spine: '#0d9488', badge: 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300' },
  { id: 'slate', name: 'Slate', primary: '#475569', lightAccent: '#f1f5f9', darkAccent: '#1e293b', spine: '#334155', badge: 'bg-slate-100 text-slate-800 dark:bg-slate-950 dark:text-slate-300' },
];

export function getBookTheme(colorValue) {
  if (!colorValue) return BOOK_THEMES[0];
  const match = BOOK_THEMES.find(t => t.primary.toLowerCase() === colorValue.toLowerCase() || t.id === colorValue.toLowerCase());
  if (match) return match;
  return {
    id: 'custom',
    name: 'Custom',
    primary: colorValue,
    lightAccent: '#e0e7ff',
    darkAccent: '#312e81',
    spine: colorValue,
    badge: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300',
  };
}

export function formatActivityTime(timestamp) {
  if (!timestamp) return 'No edits yet';
  const now = Date.now();
  const diff = now - Number(timestamp);
  const oneHour = 60 * 60 * 1000;
  const oneDay = 24 * oneHour;

  if (diff < 2 * 60 * 1000) return 'Edited just now';
  if (diff < oneHour) {
    const mins = Math.floor(diff / (60 * 1000));
    return `Edited ${mins}m ago`;
  }
  if (diff < oneDay) {
    const hours = Math.floor(diff / oneHour);
    return `Edited ${hours}h ago`;
  }
  if (diff < 2 * oneDay) {
    return 'Edited yesterday';
  }
  const days = Math.floor(diff / oneDay);
  if (days < 7) {
    return `Edited ${days}d ago`;
  }
  return formatDate(timestamp);
}

export function calculateStreak(pages = []) {
  if (!pages || pages.length === 0) return { streak: 0, editedToday: false };
  const timestamps = pages
    .map(p => p.updatedAt || p.createdAt)
    .filter(Boolean)
    .sort((a, b) => b - a);

  if (timestamps.length === 0) return { streak: 0, editedToday: false };

  const startOfDay = (d) => {
    const date = new Date(d);
    date.setHours(0, 0, 0, 0);
    return date.getTime();
  };

  const today = startOfDay(Date.now());
  const oneDay = 24 * 60 * 60 * 1000;
  const uniqueDays = Array.from(new Set(timestamps.map(startOfDay))).sort((a, b) => b - a);

  const editedToday = uniqueDays[0] === today;
  let streak = 0;
  let expectedDay = editedToday ? today : today - oneDay;

  for (const day of uniqueDays) {
    if (day === expectedDay) {
      streak++;
      expectedDay -= oneDay;
    } else if (day > expectedDay) {
      continue;
    } else {
      break;
    }
  }

  return { streak, editedToday };
}
