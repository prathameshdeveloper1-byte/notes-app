# Book Notes App 📚

A full-featured, offline-first personal notes application designed around the physical book metaphor: **Books → Folders (Chapters) → Pages (Notes)**.

Built with **Next.js 14 (App Router)**, **Supabase (PostgreSQL + Storage + Auth)**, **Tiptap**, **Tailwind CSS**, and **Framer Motion**, ready for **Vercel** deployment.

## ✨ Features
- **Bookshelf Home**: Create and organize books with custom cover colors.
- **Chapters (Folders)**: Drag-and-drop chapter reordering via `@dnd-kit`.
- **Auto-generated Table of Contents**: Grouping all pages by chapter with direct jump links.
- **Dual View Modes**:
  - **Grid View**: Google Keep style card masonry with tags, colors, and preview snippets.
  - **Book View**: Page-by-page reader with smooth Framer Motion page-turn animations.
- **Rich Text Editor (Tiptap)**: Headings, checklists, code blocks, formatting, and 800ms autosave.
- **Image Paste & Upload**: Paste or drop screenshots directly into notes — stored in Supabase Storage (`page-images`) and rendered via CDN.
- **Fuzzy Search (Fuse.js)**: Press `Ctrl + K` to search titles, tags, and content across the entire book.
- **Multi-User Privacy**: Secured with Supabase Auth and PostgreSQL Row-Level Security (RLS).
- **PDF & Markdown Export**: One-click book PDF export with cover and table of contents, or export single pages as Markdown.

## 🚀 Setup & Installation
1. Clone the repository and install dependencies:
   ```bash
   npm install
   ```
2. Run `supabase-schema.sql` in your [Supabase SQL Editor](https://supabase.com/dashboard).
3. Create `.env.local` with your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```
4. Start development server:
   ```bash
   npm run dev
   ```
5. Open [http://localhost:3000](http://localhost:3000) in your browser.
