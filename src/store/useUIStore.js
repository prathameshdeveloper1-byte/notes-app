import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useUIStore = create(
  persist(
    (set, get) => ({
      // View
      viewMode: 'grid', // 'grid' | 'book'
      setViewMode: (mode) => set({ viewMode: mode }),

      // Dark mode
      darkMode: false,
      toggleDarkMode: () => {
        const next = !get().darkMode;
        set({ darkMode: next });
        if (next) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      },

      // Focus mode
      focusMode: false,
      toggleFocusMode: () => set((s) => ({ focusMode: !s.focusMode })),

      // Search overlay
      searchOpen: false,
      setSearchOpen: (v) => set({ searchOpen: v }),

      // Navigation
      activeBookId: null,
      activeFolderId: null,
      activePageId: null,
      setActiveBook: (id) => set({ activeBookId: id, activeFolderId: null, activePageId: null }),
      setActiveFolder: (id) => set({ activeFolderId: id, activePageId: null }),
      setActivePage: (id) => set({ activePageId: id }),

      // Book view page index
      bookViewPageIndex: 0,
      setBookViewPageIndex: (i) => set({ bookViewPageIndex: i }),
    }),
    {
      name: 'book-notes-ui',
      partialize: (s) => ({ darkMode: s.darkMode, viewMode: s.viewMode }),
    }
  )
);

export default useUIStore;
