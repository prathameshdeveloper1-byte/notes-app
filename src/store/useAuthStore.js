import { create } from 'zustand';
import { createClient } from '../lib/supabase/client';

const supabase = createClient();

const useAuthStore = create((set) => ({
  user: null,
  loading: true,

  checkUser: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user || null;
      set({ user, loading: false });

      if (user?.user_metadata?.preferences) {
        const prefs = user.user_metadata.preferences;
        import('./useUIStore').then((m) => {
          const store = m.default.getState();
          if (typeof prefs.twoPageSpread === 'boolean') {
            store.setTwoPageSpread(prefs.twoPageSpread, false);
          }
          if (typeof prefs.soundEnabled === 'boolean') {
            store.setSoundEnabled(prefs.soundEnabled, false);
          }
        }).catch(() => {});
      }

      supabase.auth.onAuthStateChange((_event, session) => {
        const u = session?.user || null;
        set({ user: u, loading: false });
        if (u?.user_metadata?.preferences) {
          const prefs = u.user_metadata.preferences;
          import('./useUIStore').then((m) => {
            const store = m.default.getState();
            if (typeof prefs.twoPageSpread === 'boolean') {
              store.setTwoPageSpread(prefs.twoPageSpread, false);
            }
            if (typeof prefs.soundEnabled === 'boolean') {
              store.setSoundEnabled(prefs.soundEnabled, false);
            }
          }).catch(() => {});
        }
      });
    } catch (err) {
      console.error('Error checking auth:', err);
      set({ user: null, loading: false });
    }
  },

  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    set({ user: data.user });
    return data;
  },

  signUp: async (email, password) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    set({ user: data.user });
    return data;
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null });
  },
}));

export default useAuthStore;
