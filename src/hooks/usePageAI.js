'use client';

import { useState, useCallback } from 'react';
import { marked } from 'marked';
import { nodeToMarkdown } from '../lib/markdownExport';
import { extractImagesFromJSON } from './usePageImages';
import { sanitizeMarkdown, sanitizeHTML, sanitizeTiptapEditor } from '../lib/sanitizeContent';

/**
 * Hook for AI-powered note formatting, suggestions management, and undo safety backup.
 */
export function usePageAI({
  editor,
  title,
  setTitle,
  tags,
  color,
  starred,
  pageId,
  bookId,
  folderId,
  savePage,
  triggerSave,
  showToast,
  setUploadedImages,
}) {
  const [aiFormatting, setAiFormatting] = useState(false);
  const [undoBackup, setUndoBackup] = useState(null);
  const [aiSuggestions, setAiSuggestions] = useState([]);

  const handleAIFormat = useCallback(async () => {
    if (!editor) return;
    setAiFormatting(true);

    let backupJSON = null;
    try {
      backupJSON = editor.getJSON();
      const rawText = editor.getText();
      const markdownContent = nodeToMarkdown(backupJSON);
      const images = extractImagesFromJSON(backupJSON);

      if (!rawText.trim() && images.length === 0) {
        if (showToast) {
          showToast('error', 'Cannot format empty note', 'Please write some notes or paste screenshots first.');
        }
        setAiFormatting(false);
        return;
      }

      setUndoBackup(backupJSON);

      const res = await fetch('/api/ai/format', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          rawText: markdownContent || rawText,
          images,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to format with AI');
      }

      const { generatedTitle, formattedUserContent, suggestions } = data;

      if (!formattedUserContent || !formattedUserContent.trim()) {
        throw new Error('AI returned empty content. Your original note was kept intact.');
      }

      // Auto-set title if page is currently untitled
      let currentTitle = title;
      if (generatedTitle && (!title || title === 'Untitled Page' || title === 'Untitled Note' || !title.trim())) {
        if (setTitle) setTitle(generatedTitle);
        currentTitle = generatedTitle;
      }

      // SAFETY: If the AI accidentally returned raw JSON as content, reject it
      const trimmedContent = formattedUserContent.trim();
      if (trimmedContent.startsWith('{') && trimmedContent.includes('"formattedUserContent"')) {
        throw new Error('AI returned malformed response. Your original note was kept intact.');
      }

      // Sanitize AI Markdown output
      const cleanMarkdown = sanitizeMarkdown(formattedUserContent);

      // Convert Markdown to clean HTML using marked
      let parsedHTML = marked.parse(cleanMarkdown);
      if (!parsedHTML || !parsedHTML.trim()) {
        throw new Error('Markdown parser produced empty output. Your original note was kept intact.');
      }

      // Tiptap Table extension does NOT understand <thead>/<tbody>/<tfoot>.
      // Strip them so Tiptap sees <table> → <tr> → <th>/<td> directly.
      parsedHTML = parsedHTML
        .replace(/<thead>/gi, '')
        .replace(/<\/thead>/gi, '')
        .replace(/<tbody>/gi, '')
        .replace(/<\/tbody>/gi, '')
        .replace(/<tfoot>/gi, '')
        .replace(/<\/tfoot>/gi, '');

      // Sanitize stray bullet dots from HTML
      parsedHTML = sanitizeHTML(parsedHTML);

      // Atomically set content into Tiptap
      editor.commands.setContent(parsedHTML);

      // Clean ProseMirror document structure in-place
      sanitizeTiptapEditor(editor);

      // Safety check: verify content was not lost
      const updatedText = editor.getText();
      if (!updatedText.trim() && rawText.trim().length > 0) {
        editor.commands.setContent(backupJSON);
        throw new Error('Formatting resulted in empty content. Reverted safely to your original note.');
      }

      const newJSON = JSON.stringify(editor.getJSON());
      if (triggerSave) {
        triggerSave(newJSON, tags, currentTitle, color, starred);
      }
      if (savePage && pageId) {
        savePage(
          pageId,
          {
            contentJSON: newJSON,
            tags,
            title: currentTitle,
            color,
            starred,
          },
          bookId,
          folderId,
        );
      }

      if (setUploadedImages) {
        setUploadedImages(extractImagesFromJSON(editor.getJSON()));
      }

      if (suggestions && suggestions.length > 0) {
        setAiSuggestions(suggestions);
      }

      if (showToast) {
        showToast(
          'success',
          currentTitle !== title
            ? `Title set to "${currentTitle}" & notes formatted!`
            : 'Note formatted cleanly with original content intact!'
        );
      }
    } catch (err) {
      console.error('AI Format Error:', err);
      if (backupJSON && editor) {
        try {
          editor.commands.setContent(backupJSON);
        } catch (revertErr) {
          console.error('Revert error:', revertErr);
        }
      }
      if (showToast) {
        showToast('error', 'AI Formatting Error', err.message || 'Original note was kept intact.');
      }
    } finally {
      setAiFormatting(false);
    }
  }, [
    editor,
    title,
    setTitle,
    tags,
    color,
    starred,
    pageId,
    bookId,
    folderId,
    savePage,
    triggerSave,
    showToast,
    setUploadedImages,
  ]);

  const handleKeepSuggestion = useCallback((suggestion) => {
    if (!editor) return;

    if (suggestion.type === 'code') {
      const cleanCode = suggestion.content.replace(/^```[a-z]*\n?/, '').replace(/```$/, '');
      editor.chain().focus().insertContent([
        { type: 'paragraph', content: [{ type: 'text', marks: [{ type: 'code' }], text: cleanCode }] }
      ]).run();
    } else {
      editor.chain().focus().insertContent([
        {
          type: 'blockquote',
          content: [{ type: 'paragraph', content: [{ type: 'text', text: `${suggestion.title}: ${suggestion.content}` }] }]
        }
      ]).run();
    }

    setAiSuggestions(prev => prev.filter(s => s.id !== suggestion.id));
    if (showToast) {
      showToast('success', `Added "${suggestion.title}" to note!`);
    }
  }, [editor, showToast]);

  const handleDiscardSuggestion = useCallback((suggestionId) => {
    setAiSuggestions(prev => prev.filter(s => s.id !== suggestionId));
  }, []);

  const handleUndoAI = useCallback(() => {
    if (undoBackup && editor) {
      editor.commands.setContent(undoBackup);
      setUndoBackup(null);
      setAiSuggestions([]);
      if (triggerSave) {
        triggerSave(JSON.stringify(undoBackup), tags, title, color, starred);
      }
      if (showToast) {
        showToast('success', 'Reverted back to your original note.');
      }
    }
  }, [undoBackup, editor, triggerSave, tags, title, color, starred, showToast]);

  return {
    aiFormatting,
    undoBackup,
    setUndoBackup,
    aiSuggestions,
    setAiSuggestions,
    handleAIFormat,
    handleKeepSuggestion,
    handleDiscardSuggestion,
    handleUndoAI,
  };
}

export default usePageAI;
