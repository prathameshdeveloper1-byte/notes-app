import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getPageTextForAI, extractTopicsFromChapter } from '../lib/topicExtractor';
import { saveFolderTopics } from '../lib/supabase/queries';
import {
  getTopicsFromIndexedDB,
  saveTopicsToIndexedDB,
  removeTopicsFromIndexedDB,
} from '../lib/clientDB';

const useTopicStore = create(
  persist(
    (set, get) => ({
      // AI-generated topics cached by folderId
      aiTopicsByFolder: {},
      // Metadata (provider, model, updatedAt) by folderId
      metadataByFolder: {},
      // Loading states by folderId
      generatingByFolder: {},
      // Currently focused / jumping topic
      activeTopic: null,

      setActiveTopic: (topic) => set({ activeTopic: topic }),

      // Hydrate topics from DB (Supabase or IndexedDB) or extract from notes directly
      initFolderTopicsFromDB: async (folderId, fallbackTopics = [], bookPages = []) => {
        if (!folderId) return;
        const current = get().aiTopicsByFolder[folderId];
        if (Array.isArray(current) && current.length > 0) {
          return current;
        }

        // 1. Try from folder record passed from Supabase
        if (Array.isArray(fallbackTopics) && fallbackTopics.length > 0) {
          set((state) => ({
            aiTopicsByFolder: {
              ...state.aiTopicsByFolder,
              [folderId]: fallbackTopics,
            },
          }));
          return fallbackTopics;
        }

        // 2. Try from native IndexedDB
        try {
          const entry = await getTopicsFromIndexedDB(folderId);
          if (entry && Array.isArray(entry.topics) && entry.topics.length > 0) {
            set((state) => ({
              aiTopicsByFolder: {
                ...state.aiTopicsByFolder,
                [folderId]: entry.topics,
              },
              metadataByFolder: {
                ...state.metadataByFolder,
                [folderId]: {
                  updatedAt: entry.updatedAt,
                  provider: entry.metadata?.provider || 'db',
                  model: entry.metadata?.model || '',
                },
              },
            }));
            return entry.topics;
          }
        } catch (e) {
          console.warn('IndexedDB read error for chapterTopics:', e);
        }

        // 3. Instant fallback: extract actual topics directly from notes
        if (bookPages && bookPages.length > 0) {
          const localTopics = extractTopicsFromChapter(folderId, bookPages);
          if (localTopics.length > 0) {
            set((state) => ({
              aiTopicsByFolder: {
                ...state.aiTopicsByFolder,
                [folderId]: localTopics,
              },
              metadataByFolder: {
                ...state.metadataByFolder,
                [folderId]: {
                  updatedAt: Date.now(),
                  provider: 'notes',
                  model: 'actual',
                },
              },
            }));
            saveTopicsToIndexedDB(folderId, localTopics);
            return localTopics;
          }
        }

        return [];
      },

      // Generate AI topics for a chapter using ultra-fast Groq LPU (400ms-1.5s)
      // And automatically saves permanently into the Database (Supabase + IndexedDB)
      generateChapterTopics: async (folderId, folderTitle, bookPages = []) => {
        if (!folderId) return [];

        const chapterPages = bookPages
          .filter((p) => p.folderId === folderId)
          .map((p) => ({
            id: p.id,
            title: p.title || 'Untitled Note',
            text: getPageTextForAI(p),
          }))
          .filter((p) => p.text.trim().length > 0);

        if (chapterPages.length === 0) {
          return [];
        }

        set((state) => ({
          generatingByFolder: { ...state.generatingByFolder, [folderId]: true },
        }));

        try {
          const res = await fetch('/api/ai/chapter-topics', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              folderId,
              folderTitle,
              pages: chapterPages,
            }),
          });

          const data = await res.json();
          if (!res.ok) {
            throw new Error(data.error || 'Failed to generate topics');
          }

          const topics = Array.isArray(data.topics) ? data.topics : [];
          const now = Date.now();
          const metadata = {
            provider: data.provider || 'groq',
            model: data.model || 'openai/gpt-oss-120b',
            updatedAt: now,
          };

          // Update in-memory & localStorage store
          set((state) => ({
            aiTopicsByFolder: {
              ...state.aiTopicsByFolder,
              [folderId]: topics,
            },
            metadataByFolder: {
              ...state.metadataByFolder,
              [folderId]: metadata,
            },
            generatingByFolder: {
              ...state.generatingByFolder,
              [folderId]: false,
            },
          }));

          // ── Persist to Database 1: Native IndexedDB client DB ──
          await saveTopicsToIndexedDB(folderId, topics, metadata);

          // ── Persist to Database 2: Supabase cloud DB ──────
          try {
            await saveFolderTopics(folderId, topics);
          } catch (supaErr) {
            console.warn('Supabase saveFolderTopics error:', supaErr);
          }

          return topics;
        } catch (err) {
          console.error('generateChapterTopics error:', err);
          set((state) => ({
            generatingByFolder: {
              ...state.generatingByFolder,
              [folderId]: false,
            },
          }));
          throw err;
        }
      },

      // Get high-quality AI topics for a chapter
      getChapterTopics: (folderId) => {
        const state = get();
        return state.aiTopicsByFolder[folderId] || [];
      },

      // Get metadata (provider, model, updatedAt) for a chapter's topics
      getTopicMetadata: (folderId) => {
        const state = get();
        return state.metadataByFolder[folderId] || null;
      },

      // Check if AI topics have been generated or loaded from DB for this folder
      hasGeneratedTopics: (folderId) => {
        const state = get();
        return (
          Array.isArray(state.aiTopicsByFolder[folderId]) &&
          state.aiTopicsByFolder[folderId].length > 0
        );
      },

      // Clear AI topics cache for a chapter if user wants to re-generate from scratch
      clearChapterTopics: async (folderId) => {
        set((state) => {
          const nextTopics = { ...state.aiTopicsByFolder };
          const nextMeta = { ...state.metadataByFolder };
          delete nextTopics[folderId];
          delete nextMeta[folderId];
          return { aiTopicsByFolder: nextTopics, metadataByFolder: nextMeta };
        });

        await removeTopicsFromIndexedDB(folderId);
      },
    }),
    {
      name: 'book-notes-chapter-ai-topics-v3',
      partialize: (s) => ({
        aiTopicsByFolder: s.aiTopicsByFolder,
        metadataByFolder: s.metadataByFolder,
      }),
    }
  )
);

export default useTopicStore;
