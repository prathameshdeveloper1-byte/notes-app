import { createBook, createFolder, createPage, updatePage } from './supabase/queries';

export async function createSampleNotebook() {
  // 1. Create Sample Book
  const bookId = await createBook({
    title: '📓 Welcome to Book Notes',
    coverColor: '#1e3a5f',
  });

  // 2. Create Chapter 1
  const chapter1Id = await createFolder({
    bookId,
    title: 'Getting Started',
  });

  // Page 1: Welcome & Quick Tour
  const page1Id = await createPage({
    bookId,
    folderId: chapter1Id,
    title: 'Quick Tour & Features',
  });

  await updatePage(page1Id, {
    tags: ['tour', 'guide', 'starter'],
    starred: true,
    contentJSON: JSON.stringify({
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 1 },
          content: [{ type: 'text', text: 'Welcome to your Digital Student Notebook' }],
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'Book Notes is crafted to give you the tactile, focused feeling of writing in a real paper notebook, combined with modern note-taking superpowers.',
            },
          ],
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: '✨ Core Features at a Glance' }],
        },
        {
          type: 'taskList',
          content: [
            {
              type: 'taskItem',
              attrs: { checked: true },
              content: [
                {
                  type: 'paragraph',
                  content: [
                    { type: 'text', marks: [{ type: 'bold' }], text: 'Authentic Notebook Aesthetic: ' },
                    { type: 'text', text: 'Ruled lines, red margin guideline, and classic serif typography.' },
                  ],
                },
              ],
            },
            {
              type: 'taskItem',
              attrs: { checked: true },
              content: [
                {
                  type: 'paragraph',
                  content: [
                    { type: 'text', marks: [{ type: 'bold' }], text: 'Public Share Links: ' },
                    { type: 'text', text: 'Click "Share Note" to share clean read-only links with classmates.' },
                  ],
                },
              ],
            },
            {
              type: 'taskItem',
              attrs: { checked: false },
              content: [
                {
                  type: 'paragraph',
                  content: [
                    { type: 'text', marks: [{ type: 'bold' }], text: 'Daily Habit Streaks: ' },
                    { type: 'text', text: 'Keep writing every day to maintain your streak flame 🔥.' },
                  ],
                },
              ],
            },
            {
              type: 'taskItem',
              attrs: { checked: false },
              content: [
                {
                  type: 'paragraph',
                  content: [
                    { type: 'text', marks: [{ type: 'bold' }], text: 'Distraction-Free Focus Mode: ' },
                    { type: 'text', text: 'Toggle Focus Mode (F) to hide all sidebars and just write.' },
                  ],
                },
              ],
            },
          ],
        },
        {
          type: 'blockquote',
          content: [
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  text: 'Pro Tip: Press "?" on your keyboard anywhere to see all available keyboard shortcuts!',
                },
              ],
            },
          ],
        },
      ],
    }),
  });

  // Page 2: Study Notes Sample
  const page2Id = await createPage({
    bookId,
    folderId: chapter1Id,
    title: 'Sample Chemistry & Math Notes',
  });

  await updatePage(page2Id, {
    tags: ['chemistry', 'equations'],
    contentJSON: JSON.stringify({
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 1 },
          content: [{ type: 'text', text: 'Thermodynamics & Reaction Kinetics' }],
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'The Gibbs free energy equation describes spontaneity at constant temperature and pressure:',
            },
          ],
        },
        {
          type: 'codeBlock',
          attrs: { language: 'latex' },
          content: [{ type: 'text', text: 'ΔG = ΔH - TΔS\nWhere:\nΔG < 0  => Spontaneous\nΔG = 0  => Equilibrium\nΔG > 0  => Non-spontaneous' }],
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Key Concepts to Remember' }],
        },
        {
          type: 'bulletList',
          content: [
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [
                    { type: 'text', marks: [{ type: 'bold' }], text: 'Enthalpy (ΔH): ' },
                    { type: 'text', text: 'Heat content change in the system.' },
                  ],
                },
              ],
            },
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [
                    { type: 'text', marks: [{ type: 'bold' }], text: 'Entropy (ΔS): ' },
                    { type: 'text', text: 'Measure of microscopic disorder or randomness.' },
                  ],
                },
              ],
            },
          ],
        },
      ],
    }),
  });

  // 3. Create Chapter 2
  const chapter2Id = await createFolder({
    bookId,
    title: 'Research & Ideas',
  });

  const page3Id = await createPage({
    bookId,
    folderId: chapter2Id,
    title: 'Brainstorming & Project Outline',
  });

  await updatePage(page3Id, {
    tags: ['ideas', 'project'],
    contentJSON: JSON.stringify({
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 1 },
          content: [{ type: 'text', text: 'Final Semester Capstone Project' }],
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'Brainstorming topics and key milestones for the upcoming project review.',
            },
          ],
        },
      ],
    }),
  });

  return { bookId, folderId: chapter1Id, pageId: page1Id };
}
