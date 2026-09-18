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
