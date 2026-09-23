/**
 * Chapter Topic Extractor
 * Extracts the ACTUAL topics and sections present in notes (e.g. "1. What Determines this?",
 * "2. Arrow Functions and this", "3. call / apply / bind").
 * Zero hallucination, zero latency, preserves exact headings and numbering as written by user.
 */

export function extractNodeText(node) {
  if (!node) return '';
  if (node.type === 'text') return node.text || '';
  if (!node.content || !Array.isArray(node.content)) return '';
  return node.content.map(extractNodeText).join('');
}

export function getPageTextForAI(page) {
  if (!page) return '';
  let content = page.contentJSON;
  if (typeof content === 'string') {
    try {
      content = JSON.parse(content);
    } catch {
      return '';
    }
  }
  if (!content) return '';
  return extractNodeText(content).trim();
}

/**
 * Extracts the literal, actual topics present on a single page
 */
export function extractTopicsFromPage(page) {
  if (!page || !page.id) return [];

  const text = getPageTextForAI(page);
  if (!text) return [];

  const lines = text.split('\n');
  const topics = [];
  const seen = new Set();

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i].trim();
    if (!rawLine) continue;

    let candidateTitle = null;

    // Pattern 1: Numbered sections (e.g. "1. What Determines this?", "2. Arrow Functions and this", "3. call / apply / bind")
    const numMatch = rawLine.match(/^(\d+[\.\)]\s+[A-Za-z0-9_\-\s\/\?\(\)\:\,\.\'\"\`]+)/);
    if (numMatch && rawLine.length < 90 && !rawLine.startsWith('http')) {
      candidateTitle = numMatch[1].replace(/[:\-]$/, '').trim();
    }
    // Pattern 2: Headings with markdown format (e.g. "# 1. What Determines this?" or "## Arrow Functions and this")
    else if (rawLine.startsWith('#')) {
      const headingText = rawLine.replace(/^#+\s*/, '').trim();
      if (headingText.length > 2 && headingText.length < 90) {
        candidateTitle = headingText;
      }
    }
    // Pattern 3: Bold markdown titles (e.g. "**1. What Determines this?**")
    else if (rawLine.startsWith('**') && rawLine.endsWith('**')) {
      const boldText = rawLine.replace(/^\*\*|\*\*$/g, '').trim();
      if (boldText.length > 2 && boldText.length < 90) {
        candidateTitle = boldText;
      }
    }

    if (candidateTitle) {
      const lower = candidateTitle.toLowerCase();
      // Ignore trivial meta words if unnumbered (e.g. raw "Example" or "Output")
      if (!/^\d+[\.\)]/.test(candidateTitle) && ['example', 'output', 'console log', 'notes'].includes(lower)) {
        continue;
      }

      if (!seen.has(lower)) {
        seen.add(lower);

        // Find next non-empty line as preview summary
        let summary = '';
        for (let j = i + 1; j < Math.min(i + 6, lines.length); j++) {
          const nextLine = lines[j].trim();
          if (
            nextLine &&
            !nextLine.startsWith('#') &&
            !/^\d+[\.\)]/.test(nextLine) &&
            !nextLine.startsWith('```') &&
            !nextLine.startsWith('|')
          ) {
            summary = nextLine.substring(0, 130);
            if (nextLine.length > 130) summary += '...';
            break;
          }
        }

        topics.push({
          id: `topic-${page.id}-${topics.length}-${candidateTitle.toLowerCase().replace(/[^\w]/g, '-')}`,
          title: candidateTitle,
          anchorText: candidateTitle,
          summary: summary || '',
          pageId: page.id,
          pageTitle: page.title || 'Untitled Note',
          folderId: page.folderId,
          sourceType: 'actual',
        });
      }
    }
  }

  return topics;
}

/**
 * Extracts actual topics from all notes across a chapter
 */
export function extractTopicsFromChapter(folderId, bookPages = []) {
  if (!folderId || !bookPages || bookPages.length === 0) return [];

  const chapterPages = bookPages
    .filter((p) => p.folderId === folderId)
    .sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));

  const allTopics = [];
  for (const page of chapterPages) {
    const pageTopics = extractTopicsFromPage(page);
    allTopics.push(...pageTopics);
  }

  return allTopics;
}
