import { create } from 'zustand';
import { getAllBooks, createBook, updateBook, deleteBook } from '../lib/supabase/queries';

const useBookStore = create((set, get) => ({
  books: [],
  loading: false,

  fetchBooks: async () => {
    set({ loading: true });
    try {
      const books = await getAllBooks();
      set({ books, loading: false });
    } catch (err) {
      console.error('Failed to fetch books:', err);
      set({ loading: false });
    }
  },

  addBook: async ({ title, coverColor }) => {
    const id = await createBook({ title, coverColor });
    await get().fetchBooks();
    return id;
  },

  editBook: async (id, changes) => {
    await updateBook(id, changes);
    await get().fetchBooks();
  },

  removeBook: async (id) => {
    await deleteBook(id);
    await get().fetchBooks();
  },
}));

export default useBookStore;
