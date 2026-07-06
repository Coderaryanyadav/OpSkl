import { create } from 'zustand';
import { supabase } from '../services/supabase';

export interface Profile {
  id: string;
  email: string;
  phone?: string;
  full_name: string;
  user_type: 'worker' | 'client' | 'both';
  avatar_url?: string;
  bio?: string;
  is_suspended: boolean;
}

interface AuthState {
  session: any | null;
  user: any | null;
  profile: Profile | null;
  loading: boolean;
  userRole: 'worker' | 'client'; // Current active role
  initialize: () => Promise<void>;
  signOut: () => Promise<void>;
  setRole: (role: 'worker' | 'client') => void;
  refreshProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  user: null,
  profile: null,
  loading: true,
  userRole: 'client',

  initialize: async () => {
    set({ loading: true });
    
    // 1. Get initial session
    const { data: { session } } = await supabase.auth.getSession();
    
    // 2. Setup auth state listener
    supabase.auth.onAuthStateChange(async (_event, currentSession) => {
      if (currentSession) {
        set({ session: currentSession, user: currentSession.user });
        await get().refreshProfile();
      } else {
        set({ session: null, user: null, profile: null, loading: false });
      }
    });

    if (session) {
      set({ session, user: session.user });
      await get().refreshProfile();
    } else {
      set({ loading: false });
    }
  },

  signOut: async () => {
    set({ loading: true });
    await supabase.auth.signOut();
    set({ session: null, user: null, profile: null, userRole: 'client', loading: false });
  },

  setRole: (role) => {
    set({ userRole: role });
  },

  refreshProfile: async () => {
    const { user } = get();
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      set({ 
        profile: data, 
        userRole: data.user_type === 'worker' ? 'worker' : 'client',
        loading: false 
      });
    } catch (_e) {
      set({ loading: false });
    }
  },
}));
