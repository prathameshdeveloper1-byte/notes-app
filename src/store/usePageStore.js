import { create } from 'zustand';
import {
  getPagesByFolder,
  getPagesByBook,
  getPage,
  createPage,
  updatePage,
  deletePage,
  reorderPages,
  getRecentPages,
} from '../lib/supabase/queries';

const usePageStore = create((set, get) => ({
  pages: [],
  bookPages: [],
  recentPages: [],
  loading: false,
  saving: false,

  fetchPages: async (folderId) => {
    if (!folderId) return;
    set({ loading: true });
    try {
      const pages = await getPagesByFolder(folderId);
      set({ pages, loading: false });
    } catch (err) {
      console.error('Failed to fetch pages:', err);
      set({ loading: false });
    }
  },

  fetchBookPages: async (bookId) => {
    if (!bookId) return;
    try {
      const pages = await getPagesByBook(bookId);
      set({ bookPages: pages });
    } catch (err) {
      console.error('Failed to fetch book pages:', err);
    }
  },

  fetchRecentPages: async () => {
    try {
      const recent = await getRecentPages(5);
      set({ recentPages: recent });
    } catch (err) {
      console.error('Failed to fetch recent pages:', err);
    }
  },

  fetchPage: async (pageId) => {
    if (!pageId) return null;
    try {
      const page = await getPage(pageId);
      if (page) {
        set((state) => {
          const existsInPages = state.pages.some(p => p.id === page.id);
          const existsInBookPages = state.bookPages.some(p => p.id === page.id);
          return {
            pages: existsInPages ? state.pages.map(p => p.id === page.id ? page : p) : [...state.pages, page],
            bookPages: existsInBookPages ? state.bookPages.map(p => p.id === page.id ? page : p) : [...state.bookPages, page],
          };
        });
        return page;
      }
    } catch (err) {
      console.error('Failed to fetch page:', err);
    }
    return null;
  },

  addPage: async ({ bookId, folderId, title }) => {
    const id = await createPage({ bookId, folderId, title });
    await get().fetchPages(folderId);
    await get().fetchBookPages(bookId);
    return id;
  },

  savePage: async (id, changes, bookId, folderId) => {
    set({ saving: true });
    try {
      await updatePage(id, changes);
    } catch (err) {
      console.error('Failed to save page to Supabase:', err);
    } finally {
      set({ saving: false });
    }
    if (folderId) await get().fetchPages(folderId);
    if (bookId) await get().fetchBookPages(bookId);
  },

  deletePage: async (id, bookId, folderId) => {
    await deletePage(id);
    if (folderId) await get().fetchPages(folderId);
    if (bookId) await get().fetchBookPages(bookId);
  },

  reorder: async (folderId, orderedIds, bookId) => {
    const sorted = orderedIds.map((id, i) => {
      const p = get().pages.find(p => p.id === id);
      return { ...p, orderIndex: i };
    });
    set({ pages: sorted });
    await reorderPages(folderId, orderedIds);
    if (bookId) await get().fetchBookPages(bookId);
  },

  toggleStar: async (id, bookId, folderId) => {
    const page = get().pages.find(p => p.id === id) ||
                 get().bookPages.find(p => p.id === id);
    if (!page) return;
    await updatePage(id, { starred: !page.starred });
    if (folderId) await get().fetchPages(folderId);
    if (bookId) await get().fetchBookPages(bookId);
  },
}));

export default usePageStore;
