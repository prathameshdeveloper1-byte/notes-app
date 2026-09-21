'use client';

import React from 'react';
import {
  Bold, Italic, Underline as UnderlineIcon, Highlighter,
  Heading1, Heading2, Heading3, List, ListOrdered, CheckSquare,
  Code, Quote, Table as TableIcon
} from 'lucide-react';
import { cn } from '../../lib/utils';

const ToolbarBtn = ({ onClick, active, title, children }) => (
  <button
    type="button"
    onMouseDown={(e) => { e.preventDefault(); onClick(); }}
    title={title}
    className={cn(
      'p-1.5 rounded-lg transition-colors',
      active
        ? 'bg-ink-800 text-white dark:bg-paper-200 dark:text-ink-900'
        : 'text-ink-500 dark:text-ink-400 hover:bg-paper-100 dark:hover:bg-ink-800'
    )}
  >
    {children}
  </button>
);

const Divider = () => <div className="w-px h-4 bg-paper-200 dark:bg-ink-700 mx-1" />;

export default function EditorToolbar({ editor }) {
  if (!editor) return null;

  return (
    <div className="flex items-center flex-wrap gap-0.5 px-6 sm:px-10 py-2 border-b border-paper-200 dark:border-ink-800 bg-white/70 dark:bg-ink-900/70 backdrop-blur-sm sticky top-0 z-10">
      <ToolbarBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold">
        <Bold size={14} />
      </ToolbarBtn>
      <ToolbarBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic">
        <Italic size={14} />
      </ToolbarBtn>
      <ToolbarBtn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Underline">
        <UnderlineIcon size={14} />
      </ToolbarBtn>
      <ToolbarBtn onClick={() => editor.chain().focus().toggleHighlight().run()} active={editor.isActive('highlight')} title="Highlight">
        <Highlighter size={14} />
      </ToolbarBtn>

      <Divider />

      <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })} title="H1">
        <Heading1 size={14} />
      </ToolbarBtn>
      <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="H2">
        <Heading2 size={14} />
      </ToolbarBtn>
      <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="H3">
        <Heading3 size={14} />
      </ToolbarBtn>

      <Divider />

      <ToolbarBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Bullet list">
        <List size={14} />
      </ToolbarBtn>
      <ToolbarBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Ordered list">
        <ListOrdered size={14} />
      </ToolbarBtn>
      <ToolbarBtn onClick={() => editor.chain().focus().toggleTaskList().run()} active={editor.isActive('taskList')} title="Task list">
        <CheckSquare size={14} />
      </ToolbarBtn>

      <Divider />

      <ToolbarBtn onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive('code')} title="Inline code">
        <Code size={14} />
      </ToolbarBtn>
      <ToolbarBtn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Definition / Callout Box">
        <Quote size={14} />
      </ToolbarBtn>

      <Divider />

      <ToolbarBtn
        onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
        active={editor.isActive('table')}
        title="Insert Table (3x3)"
      >
        <TableIcon size={14} />
      </ToolbarBtn>

      {editor.isActive('table') && (
        <div className="flex items-center gap-1 pl-2 border-l border-paper-300 dark:border-ink-700">
          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().addRowAfter().run(); }}
            className="px-2 py-0.5 rounded bg-paper-200 dark:bg-ink-800 hover:bg-paper-300 text-ink-700 dark:text-paper-200 text-[11px] font-medium transition"
            title="Add row below"
          >
            + Row
          </button>
          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().deleteRow().run(); }}
            className="px-2 py-0.5 rounded bg-paper-200 dark:bg-ink-800 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 text-[11px] font-medium transition"
            title="Delete row"
          >
            - Row
          </button>
          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().addColumnAfter().run(); }}
            className="px-2 py-0.5 rounded bg-paper-200 dark:bg-ink-800 hover:bg-paper-300 text-ink-700 dark:text-paper-200 text-[11px] font-medium transition"
            title="Add column right"
          >
            + Col
          </button>
          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().deleteColumn().run(); }}
            className="px-2 py-0.5 rounded bg-paper-200 dark:bg-ink-800 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 text-[11px] font-medium transition"
            title="Delete column"
          >
            - Col
          </button>
          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().deleteTable().run(); }}
            className="px-2 py-0.5 rounded bg-red-100 dark:bg-red-950/60 hover:bg-red-200 text-red-600 text-[11px] font-medium transition"
            title="Delete table"
          >
            Del Table
          </button>
        </div>
      )}
    </div>
  );
}
