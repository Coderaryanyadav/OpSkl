import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { Gig, GigFilters } from '@features/gig-discovery/types';
import { Repository } from '@api/repository';
import { supabase } from '@api/supabase';

interface GigState {
    // Feed (Home Stream)
    gigs: Gig[];
    feedLoading: boolean;
    feedError: string | null;
    
    // Search (Discovery)
    searchResult: Gig[] | null;
    searchLoading: boolean;
    searchError: string | null;

    // My Gigs (Client/Worker Dashboard)
    myGigs: Gig[];
    myGigsLoading: boolean;
    myGigsError: string | null;

    // Actions
    fetchGigs: (filters?: GigFilters) => Promise<void>;
    fetchMyGigs: (clientId: string) => Promise<void>;
    searchGigsAI: (query: string) => Promise<void>;
    clearSearch: () => void;
    addGig: (gig: Gig) => void;
    updateGig: (gig: Gig) => void;
    
    // Deprecated (Keep for legacy temporarily, maps to feed)
    loading: boolean; 
    error: string | null;
}

export const useGigStore = create<GigState>()(
    immer((set) => ({
        // Feed
        gigs: [],
        feedLoading: false,
        feedError: null,
        
        // Search
        searchResult: null,
        searchLoading: false,
        searchError: null,

        // My Gigs
        myGigs: [],
        myGigsLoading: false,
        myGigsError: null,

        // Legacy compatibility
        loading: false,
        error: null,

        fetchGigs: async (filters?: GigFilters) => {
            set((state) => { 
                state.feedLoading = true; 
                state.loading = true; // Legacy
                state.feedError = null; 
            });
            try {
                const { data, error } = await Repository.getGigs(filters);
                if (error) throw new Error(error.message);
                set((state) => {
                    state.gigs = (data as Gig[]) || [];
                    state.feedLoading = false;
                    state.loading = false; // Legacy
                });
            } catch (err: any) {
                set((state) => {
                    state.feedError = err.message;
                    state.error = err.message; // Legacy
                    state.feedLoading = false;
                    state.loading = false; // Legacy
                });
            }
        },

        fetchMyGigs: async (clientId: string) => {
            set((state) => { state.myGigsLoading = true; state.myGigsError = null; });
            try {
                const { data, error } = await supabase
                    .from('gigs')
                    .select('*, applications(count)')
                    .eq('client_id', clientId)
                    .order('created_at', { ascending: false });

                if (error) throw error;
                set((state) => {
                    state.myGigs = (data as Gig[]) || [];
                    state.myGigsLoading = false;
                });
            } catch (err: any) {
                set((state) => {
                    state.myGigsError = err.message;
                    state.myGigsLoading = false;
                });
            }
        },

        searchGigsAI: async (query: string) => {
            set((state) => { 
                state.searchLoading = true; 
                state.searchError = null; 
                state.searchResult = []; // Clear previous
            });
            
            try {
                // 🔒 SECURE: Key stays on server. Call Edge Function.
                const { data, error } = await supabase.functions.invoke('search-gigs', {
                    body: { query }
                });

                if (error) throw error;
                if (!data.success) throw new Error(data.error || 'AI Search Failed');

                set((state) => {
                    state.searchResult = (data.gigs as Gig[]) || [];
                    state.searchLoading = false;
                });

            } catch (err: any) {
                console.warn('[GigStore] AI Search Function failed, falling back to basic:', err.message);
                
                // Fallback to basic text search
                try {
                     const { data } = await Repository.getGigs({ title: query, status: 'open' });
                     set(state => {
                         state.searchResult = (data as Gig[]) || [];
                         state.searchLoading = false;
                     });
                } catch (fallbackErr: any) {
                    set(state => {
                        state.searchError = "Search unavailable. Secure lines down.";
                        state.searchLoading = false;
                    });
                }
            }
        },

        clearSearch: () => {
            set((state) => {
                state.searchResult = null;
                state.searchLoading = false;
                state.searchError = null;
            });
        },

        addGig: (gig: Gig) => {
            set((state) => {
                state.myGigs.unshift(gig);
                state.gigs.unshift(gig);
            });
        },

        updateGig: (updatedGig: Gig) => {
            set((state) => {
                const gIndex = state.gigs.findIndex((g) => g.id === updatedGig.id);
                if (gIndex !== -1) state.gigs[gIndex] = { ...state.gigs[gIndex], ...updatedGig };
                
                const mIndex = state.myGigs.findIndex((g) => g.id === updatedGig.id);
                if (mIndex !== -1) state.myGigs[mIndex] = { ...state.myGigs[mIndex], ...updatedGig };
                
                // Also update search results if present
                if (state.searchResult) {
                    const sIndex = state.searchResult.findIndex((g) => g.id === updatedGig.id);
                    if (sIndex !== -1) state.searchResult[sIndex] = { ...state.searchResult[sIndex], ...updatedGig };
                }
            });
        },
    }))
);
