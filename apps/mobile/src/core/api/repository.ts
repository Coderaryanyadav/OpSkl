import { supabase } from './supabase';
import { PostgrestResponse, PostgrestSingleResponse } from '@supabase/supabase-js';

/**
 * 🏛️ REPOSITORY PATTERN
 * Centralized data access layer with strict normalization,
 * comprehensive typing, and robust error surfacing.
 */

export type RepositoryResponse<T> = {
    data: T | null;
    error: {
        message: string;
        code?: string;
        details?: string;
    } | null;
};

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
    static async getProfile(userId: string): Promise<RepositoryResponse<any>> {
        const res = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();
        return this.wrap(res);
    }

    static async updateProfile(userId: string, updates: any): Promise<RepositoryResponse<any>> {
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
    static async getGigs(filters: { status?: string; category?: string } = {}): Promise<RepositoryResponse<any[]>> {
        let query = supabase.from('gigs').select('*, client:profiles(*)');

        if (filters.status) query = query.eq('status', filters.status);
        if (filters.category) query = query.eq('category', filters.category);

        const res = await query.order('created_at', { ascending: false });
        return this.wrap(res);
    }

    static async getGigDetails(gigId: string): Promise<RepositoryResponse<any>> {
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
    static async applyToGig(gigId: string, workerId: string, message?: string): Promise<RepositoryResponse<any>> {
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
    static async getWalletBalance(userId: string): Promise<RepositoryResponse<any>> {
        const res = await supabase
            .from('wallets')
            .select('*')
            .eq('user_id', userId)
            .single();
        return this.wrap(res);
    }

    static async getTransactions(userId: string): Promise<RepositoryResponse<any[]>> {
        // Checking for 'transactions' or 'wallet_transactions' table based on schema summary
        const res = await supabase
            .from('transactions') // Normalized to match SQL schema summary
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
        return this.wrap(res);
    }

    /**
     * 💬 COMMUNICATION OPERATIONS
     */
    static async getChatRooms(userId: string): Promise<RepositoryResponse<any[]>> {
        const res = await supabase
            .from('chat_rooms')
            .select('*, chat_participants!inner(*)')
            .eq('chat_participants.user_id', userId)
            .order('updated_at', { ascending: false });
        return this.wrap(res);
    }

    static async getMessages(roomId: string, limit = 50): Promise<RepositoryResponse<any[]>> {
        const res = await supabase
            .from('messages')
            .select('*, sender:profiles(*)')
            .eq('room_id', roomId)
            .order('created_at', { ascending: true })
            .limit(limit);
        return this.wrap(res);
    }
}
