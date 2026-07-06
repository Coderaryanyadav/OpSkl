import { create } from 'zustand';
import { supabase } from '../services/supabase';

export interface Gig {
  id: string;
  title: string;
  description: string;
  budget_type: 'fixed' | 'hourly';
  budget_amount: number;
  status: 'draft' | 'open' | 'in_progress' | 'completed' | 'cancelled' | 'disputed';
  created_at: string;
  client_id: string;
  skill_id: string;
  location_id?: string;
  category: string;
}

interface GigState {
  gigs: Gig[];
  myGigs: Gig[];
  loading: boolean;
  fetchAvailableGigs: (skillFilter?: string) => Promise<void>;
  fetchMyGigs: (userId: string, role: 'worker' | 'client') => Promise<void>;
  createGig: (gigData: Omit<Gig, 'id' | 'created_at' | 'client_id' | 'status'>, userId: string) => Promise<boolean>;
  submitBid: (gigId: string, workerId: string, amount: number, duration: number, coverLetter: string) => Promise<boolean>;
}

export const useGigStore = create<GigState>((set) => ({
  gigs: [],
  myGigs: [],
  loading: false,

  fetchAvailableGigs: async (skillFilter) => {
    set({ loading: true });
    try {
      let query = supabase
        .from('gigs')
        .select('*')
        .eq('status', 'open');

      if (skillFilter) {
        query = query.eq('skill_id', skillFilter);
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      set({ gigs: data || [], loading: false });
    } catch (_e) {
      set({ loading: false });
    }
  },

  fetchMyGigs: async (userId, role) => {
    set({ loading: true });
    try {
      let query = supabase.from('gigs').select('*');

      if (role === 'client') {
        query = query.eq('client_id', userId);
      } else {
        // Query bids to find gigs assigned to worker
        query = query.eq('assigned_worker_id', userId);
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      set({ myGigs: data || [], loading: false });
    } catch (_e) {
      set({ loading: false });
    }
  },

  createGig: async (gigData, userId) => {
    set({ loading: true });
    try {
      const { error } = await supabase.from('gigs').insert({
        ...gigData,
        client_id: userId,
        status: 'open',
      });
      if (error) throw error;
      set({ loading: false });
      return true;
    } catch (_e) {
      set({ loading: false });
      return false;
    }
  },

  submitBid: async (gigId, workerId, amount, duration, coverLetter) => {
    set({ loading: true });
    try {
      const { error } = await supabase.from('gig_bids').insert({
        gig_id: gigId,
        worker_id: workerId,
        proposed_amount: amount,
        proposed_duration: duration,
        cover_letter: coverLetter,
        status: 'pending',
      });
      if (error) throw error;
      set({ loading: false });
      return true;
    } catch (_e) {
      set({ loading: false });
      return false;
    }
  },
}));
