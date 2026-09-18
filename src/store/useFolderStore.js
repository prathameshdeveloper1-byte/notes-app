import { create } from 'zustand';
import {
  getFoldersByBook,
  createFolder,
  updateFolder,
  deleteFolder,
  reorderFolders,
} from '../lib/supabase/queries';

const useFolderStore = create((set, get) => ({
  folders: [],
  loading: false,

  fetchFolders: async (bookId) => {
    if (!bookId) return;
    set({ loading: true });
    try {
      const folders = await getFoldersByBook(bookId);
      set({ folders, loading: false });
    } catch (err) {
      console.error('Failed to fetch folders:', err);
      set({ loading: false });
    }
  },

  addFolder: async ({ bookId, title }) => {
    const id = await createFolder({ bookId, title });
    await get().fetchFolders(bookId);
    return id;
  },

  renameFolder: async (id, title, bookId) => {
    await updateFolder(id, { title });
    await get().fetchFolders(bookId);
  },

  removeFolder: async (id, bookId) => {
    await deleteFolder(id);
    await get().fetchFolders(bookId);
  },

  reorder: async (bookId, orderedIds) => {
    const sorted = orderedIds.map((id, i) => {
      const f = get().folders.find(f => f.id === id);
      return { ...f, orderIndex: i };
    });
    set({ folders: sorted });
    await reorderFolders(bookId, orderedIds);
  },
}));

export default useFolderStore;
