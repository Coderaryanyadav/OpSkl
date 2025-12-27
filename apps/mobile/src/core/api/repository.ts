import { supabase } from './supabase';
import { PostgrestResponse, PostgrestSingleResponse } from '@supabase/supabase-js';
import { 
    Profile,
    Application,
    Wallet,
    Transaction,
    RepositoryResponse,
    PortfolioItem // Import from @types which re-exports from profile/types
} from '@types';
import { Gig, Review, Deliverable, EscrowTransaction, Dispute, GigFilters } from '@features/gig-discovery/types';



/**
 * 🏛️ REPOSITORY PATTERN (FAANG EDITION)
 * Centralized data access layer with strict normalization,
 * comprehensive typing, and robust error surfacing.
 */

export class Repository {
    /**
     * Normalized response wrapper for all Supabase calls.
     */
    private static wrap<T>(response: PostgrestResponse<T> | PostgrestSingleResponse<T>): RepositoryResponse<T> {
        if (response.error) {
            console.error(`[Repository Error] ${response.error.code}: ${response.error.message}`);
            return {
                data: null,
                error: {
                    message: response.error.message,
                    code: response.error.code,
                    details: response.error.details,
                },
            };
        }
        return { data: response.data as T, error: null };
    }

    /**
     * 👥 PROFILE OPERATIONS
     */
    static async getProfile(userId: string): Promise<RepositoryResponse<Profile>> {
        const res = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();
        return this.wrap(res);
    }

    static async updateProfile(userId: string, updates: Partial<Profile>): Promise<RepositoryResponse<Profile>> {
        const res = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', userId)
            .select()
            .single();
        return this.wrap(res);
    }

    /**
     * 🛠️ GIG OPERATIONS
     */
    static async getGigs(filters: GigFilters = {}): Promise<RepositoryResponse<Gig[]>> {
        let query = supabase.from('gigs').select('*, client:profiles(*)');

        if (filters.status) query = query.eq('status', filters.status);
        if (filters.category) query = query.eq('category', filters.category);
        if (filters.title) query = query.ilike('title', `%${filters.title}%`);
        if (filters.urgency) query = query.eq('urgency_level', filters.urgency);
        if (filters.minBudget) query = query.gte('budget', filters.minBudget);
        if (filters.maxBudget) query = query.lte('budget', filters.maxBudget);

        const res = await query.order('created_at', { ascending: false });
        return this.wrap(res);
    }

    static async getGigDetails(gigId: string): Promise<RepositoryResponse<Gig>> {
        const res = await supabase
            .from('gigs')
            .select('*, client:profiles(*), applications(*, worker:profiles(*))')
            .eq('id', gigId)
            .single();
        return this.wrap(res);
    }

    /**
     * 📝 APPLICATION OPERATIONS
     */
    static async applyToGig(gigId: string, workerId: string, message?: string): Promise<RepositoryResponse<Application>> {
        const res = await supabase
            .from('applications')
            .insert({
                gig_id: gigId,
                worker_id: workerId,
                status: 'pending',
                message: message || ''
            })
            .select()
            .single();
        return this.wrap(res);
    }

    /**
     * 💰 FINANCIAL OPERATIONS
     */
    static async getWalletBalance(userId: string): Promise<RepositoryResponse<Wallet>> {
        const res = await supabase
            .from('wallets')
            .select('*')
            .eq('user_id', userId)
            .single();
        return this.wrap(res);
    }

    static async getTransactions(userId: string): Promise<RepositoryResponse<Transaction[]>> {
        const res = await supabase
            .from('transactions')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
        return this.wrap(res);
    }

    /**
     * 🛡️ TRUST & SAFETY OPERATIONS
     */
    static async createReview(review: Partial<Review>): Promise<RepositoryResponse<Review>> {
        const res = await supabase.from('reviews').insert(review).select().single();
        return this.wrap(res);
    }

    static async getReviews(targetId: string): Promise<RepositoryResponse<Review[]>> {
        const res = await supabase
            .from('reviews')
            .select('*, reviewer:profiles(*)')
            .eq('target_id', targetId)
            .order('created_at', { ascending: false });
        return this.wrap(res);
    }

    static async addPortfolioItem(item: Partial<PortfolioItem>): Promise<RepositoryResponse<PortfolioItem>> {
        const res = await supabase.from('portfolio_items').insert(item).select().single();
        return this.wrap(res);
    }

    static async submitDeliverable(deliverable: Partial<Deliverable>): Promise<RepositoryResponse<Deliverable>> {
        const res = await supabase.from('deliverables').insert(deliverable).select().single();
        return this.wrap(res);
    }

    static async createEscrow(escrow: Partial<EscrowTransaction>): Promise<RepositoryResponse<EscrowTransaction>> {
        const res = await supabase.from('escrow_transactions').insert(escrow).select().single();
        return this.wrap(res);
    }

    static async createDispute(dispute: Partial<Dispute>): Promise<RepositoryResponse<Dispute>> {
        const res = await supabase.from('disputes').insert(dispute).select().single();
        return this.wrap(res);
    }


    /**
     * ❤️ FAVORITES OPERATIONS
     */
    static async toggleFavorite(clientId: string, workerId: string): Promise<RepositoryResponse<void>> {
        // Check if exists
        const { data } = await supabase
            .from('favorite_workers')
            .select('id')
            .eq('client_id', clientId)
            .eq('worker_id', workerId)
            .single();

        if (data) {
            // Remove
            const res = await supabase.from('favorite_workers').delete().eq('id', data.id);
            return this.wrap(res as any);
        } else {
            // Add
            const res = await supabase
                .from('favorite_workers')
                .insert({ client_id: clientId, worker_id: workerId });
            return this.wrap(res as any);
        }
    }

    static async getFavorites(clientId: string): Promise<RepositoryResponse<Profile[]>> {
        const res = await supabase
            .from('favorite_workers')
            .select('worker:profiles(*)')
            .eq('client_id', clientId);
            
        // Map the structure to return clean Profile array
        if (res.data) {
            const profiles = (res.data as any).map((item: any) => item.worker);
            return { data: profiles, error: null };
        }
        return this.wrap(res as any);
    }

    static async isFavorite(clientId: string, workerId: string): Promise<boolean> {
        const { data } = await supabase
            .from('favorite_workers')
            .select('id')
            .eq('client_id', clientId)
            .eq('worker_id', workerId)
            .single();        
        return !!data;
    }

    /**
     * 💬 COMMUNICATION OPERATIONS
     */
}
