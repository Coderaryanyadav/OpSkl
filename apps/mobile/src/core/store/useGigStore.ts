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

    // My Gigs (Client/Talent Dashboard)
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
            const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
            
            set((state) => { 
                state.searchLoading = true; 
                state.searchError = null; 
                state.searchResult = []; 
            });
            
            try {
                let analysis = { category: null, keywords: query };

                // 🧠 SEMANTIC ANALYSIS (GEMINI POWERED)
                if (GEMINI_API_KEY) {
                    try {
                        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                contents: [{
                                    parts: [{
                                        text: `Analyze this search query for a gig-economy platform: "${query}". 
                                        Valid categories: Social, Creative, Technical, Design, Visuals, Intel, Logistics, Signal.
                                        Return a JSON object with: { "category": string | null, "keywords": string }. 
                                        Keywords should be the most important search terms. Return ONLY JSON.`
                                    }]
                                }]
                            })
                        });
                        const data = await response.json();
                        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
                        const cleanedJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
                        analysis = JSON.parse(cleanedJson);
                    } catch (aiError) {
                        if (__DEV__) console.error(aiError);
                        console.error('AI description error:', aiError);
                    }
                }

                // 🔎 DATABASE EXECUTION
                const { data, error } = await Repository.getGigs({
                    title: analysis.keywords,
                    category: analysis.category || undefined,
                    status: 'open'
                });

                if (error) throw error;

                set((state) => {
                    state.searchResult = (data as Gig[]) || [];
                    state.searchLoading = false;
                });

            } catch (error) {
            if (__DEV__) console.error(error);
                console.error('Gig search error:', error);
                set(state => {
                    state.searchError = "Search frequency unstable. Check connection.";
                    state.searchLoading = false;
                });
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
