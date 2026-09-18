import { useMemo, useState, useCallback } from 'react';
import Fuse from 'fuse.js';

function extractText(contentJSON) {
  try {
    const parsed = typeof contentJSON === 'string' ? JSON.parse(contentJSON) : contentJSON;
    const texts = [];
    function walk(node) {
      if (node.text) texts.push(node.text);
      if (node.content) node.content.forEach(walk);
    }
    walk(parsed);
    return texts.join(' ');
  } catch {
    return '';
  }
}

export function useSearch(pages) {
  const [query, setQuery] = useState('');

  const enriched = useMemo(
    () => pages.map(p => ({ ...p, _text: extractText(p.contentJSON) })),
    [pages]
  );

  const fuse = useMemo(
    () =>
      new Fuse(enriched, {
        keys: [
          { name: 'title', weight: 0.5 },
          { name: 'tags', weight: 0.3 },
          { name: '_text', weight: 0.2 },
        ],
        threshold: 0.35,
        includeScore: true,
        includeMatches: true,
      }),
    [enriched]
  );

  const results = useMemo(() => {
    if (!query.trim()) return [];
    return fuse.search(query);
  }, [fuse, query]);

  return { query, setQuery, results };
}
