import { create } from 'zustand';
import { createClient } from '../lib/supabase/client';

const supabase = createClient();

const useAuthStore = create((set) => ({
  user: null,
  loading: true,

  checkUser: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      set({ user: session?.user || null, loading: false });

      supabase.auth.onAuthStateChange((_event, session) => {
        set({ user: session?.user || null, loading: false });
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
