/**
 * Content Sanitizer for Tiptap JSON, HTML, and Markdown
 * Strips orphaned/stray bullet dots (•, ., etc.) appearing on their own lines
 * between headings and paragraphs.
 */

// Characters considered stray dots/bullets when alone on a line or paragraph
const LONE_BULLET_REGEX = /^[\s\u00a0\u200b]*([•·●○▪▫◦⁃‣\.\*\-]|&bull;|&middot;)+[\s\u00a0\u200b]*$/;

/**
 * Checks if a string contains ONLY stray bullet/dot characters or whitespace.
 */
export function isLoneBulletText(text) {
  if (text == null) return true;
  const trimmed = text.trim();
  if (trimmed === '') return true;
  return LONE_BULLET_REGEX.test(trimmed);
}

/**
 * Checks if a ProseMirror / Tiptap block node has solely stray bullet/dot text content.
 */
function isLoneBulletNode(node) {
  if (!node) return true;

  // Non-text blocks like images, code blocks, tables, rules are not lone bullets
  if (['image', 'codeBlock', 'table', 'horizontalRule'].includes(node.type)) {
    return false;
  }

  // If node has no content, it's empty
  if (!node.content || node.content.length === 0) {
    return true;
  }

  // Concatenate all text in this node
  const fullText = (node.content || [])
    .map((child) => {
      if (child.type === 'text') return child.text || '';
      return '';
    })
    .join('');

  return isLoneBulletText(fullText);
}

/**
 * Recursively cleans a Tiptap JSON document structure, removing:
 * 1. Paragraphs or blocks containing ONLY stray dots/bullets or whitespace
 * 2. Empty list items and empty lists
 */
export function sanitizeContentJSON(json) {
  if (!json) return json;

  let parsed = json;
  if (typeof json === 'string') {
    try {
      parsed = JSON.parse(json);
    } catch {
      return json;
    }
  }

  if (!parsed || typeof parsed !== 'object') return parsed;

  function cleanNode(node) {
    if (!node || !node.content) return node;

    const cleanedChildren = [];

    for (const child of node.content) {
      // 1. Check if child is a paragraph or blockquote containing only lone bullets
      if (['paragraph', 'blockquote'].includes(child.type)) {
        if (isLoneBulletNode(child)) {
          // Skip this stray dot paragraph!
          continue;
        }
      }

      // 2. Check list items
      if (child.type === 'listItem' || child.type === 'taskItem') {
        const cleanedChild = cleanNode(child);
        // If listItem has no remaining content or only lone bullet nodes, omit it
        if (!cleanedChild.content || cleanedChild.content.length === 0) {
          continue;
        }
        const hasValidContent = cleanedChild.content.some((c) => !isLoneBulletNode(c));
        if (!hasValidContent) {
          continue;
        }
        cleanedChildren.push(cleanedChild);
        continue;
      }

      // 3. Check lists (bulletList, orderedList, taskList)
      if (['bulletList', 'orderedList', 'taskList'].includes(child.type)) {
        const cleanedChild = cleanNode(child);
        // If list is empty after cleaning children, drop the whole list
        if (!cleanedChild.content || cleanedChild.content.length === 0) {
          continue;
        }
        cleanedChildren.push(cleanedChild);
        continue;
      }

      // For other nodes (headings, tables, etc.), clean their children
      const cleanedChild = cleanNode(child);
      cleanedChildren.push(cleanedChild);
    }

    return {
      ...node,
      content: cleanedChildren,
    };
  }

  const cleanedDoc = cleanNode(parsed);

  // Ensure doc has at least one paragraph so Tiptap doesn't break
  if (!cleanedDoc.content || cleanedDoc.content.length === 0) {
    cleanedDoc.content = [{ type: 'paragraph' }];
  }

  return typeof json === 'string' ? JSON.stringify(cleanedDoc) : cleanedDoc;
}

/**
 * Sanitizes raw HTML string: strips paragraphs or list items containing lone dots/bullets
 */
export function sanitizeHTML(html) {
  if (!html || typeof html !== 'string') return html;

  return html
    // Remove <p>•</p>, <p>.</p>, <p>&bull;</p>, etc.
    .replace(/<p[^>]*>[\s\u00a0\u200b]*([•·●○▪▫◦⁃‣\.\*\-]|&bull;|&middot;)+[\s\u00a0\u200b]*<\/p>/gi, '')
    // Remove empty paragraphs
    .replace(/<p[^>]*>[\s\u00a0\u200b]*<\/p>/gi, '')
    // Remove <li>•</li> or empty <li>
    .replace(/<li[^>]*>[\s\u00a0\u200b]*([•·●○▪▫◦⁃‣\.\*\-]|&bull;|&middot;)?[\s\u00a0\u200b]*<\/li>/gi, '')
    // Remove empty <ul></ul> or <ol></ol>
    .replace(/<ul[^>]*>[\s\u00a0\u200b]*<\/ul>/gi, '')
    .replace(/<ol[^>]*>[\s\u00a0\u200b]*<\/ol>/gi, '');
}

/**
 * Sanitizes Markdown string: removes lines containing only lone dots/bullets
 */
export function sanitizeMarkdown(md) {
  if (!md || typeof md !== 'string') return md;

  return md
    .split('\n')
    .filter((line) => {
      const trimmed = line.trim();
      // Keep headings, code fences, etc.
      if (trimmed === '') return true; // keep blank separator lines
      // Strip line if it is ONLY a bullet/dot with no words
      if (LONE_BULLET_REGEX.test(trimmed)) {
        return false;
      }
      return true;
    })
    .join('\n');
}

/**
 * Sanitizes Tiptap editor in-place:
 * Cleans the ProseMirror document and re-sets sanitized content if changed.
 * Returns true if changes were made.
 */
export function sanitizeTiptapEditor(editor) {
  if (!editor) return false;
  try {
    const rawJSON = editor.getJSON();
    const cleaned = sanitizeContentJSON(rawJSON);

    const rawStr = JSON.stringify(rawJSON);
    const cleanStr = JSON.stringify(cleaned);

    if (rawStr !== cleanStr) {
      editor.commands.setContent(cleaned);
      return true;
    }
  } catch (err) {
    console.error('Error sanitizing editor:', err);
  }
  return false;
}
