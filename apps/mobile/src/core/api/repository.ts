import { supabase } from './supabase';
import { PostgrestResponse, PostgrestSingleResponse, RealtimeChannel } from '@supabase/supabase-js';
import { 
    Profile,
    Application,
    Wallet,
    Transaction,
    RepositoryResponse,
    PortfolioItem // Import from @types which re-exports from profile/types
} from '@types';
import { Gig, Review, Deliverable, EscrowTransaction, Dispute, GigFilters, SavedSearch, Milestone } from '@features/gig-discovery/types';

/**
 * 🏛️ REPOSITORY PATTERN (FAANG EDITION)
 * Centralized data access layer with strict normalization,
 * comprehensive typing, and robust error surfacing.
 */

export class Repository {
    /**
     * 📦 STORAGE OPERATIONS
     */
    static async uploadFile(bucket: string, path: string, fileUri: string): Promise<RepositoryResponse<string>> {
        try {
            const formData = new FormData();
            const filename = path.split('/').pop() || 'upload.jpg';
            const ext = filename.split('.').pop();
            
            formData.append('file', {
                uri: fileUri,
                name: filename,
                type: `image/${ext === 'png' ? 'png' : 'jpeg'}`
            } as any);

            const { data, error } = await supabase.storage.from(bucket).upload(path, formData);

            if (error) {
                return { data: null, error: { message: error.message, code: (error as any).status?.toString() || '500' } };
            }

            const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(data.path);
            return { data: publicUrl, error: null };
        } catch (err: any) {
            return { data: null, error: { message: err.message, code: 'STORAGE_ERROR' } };
        }
    }

    /**
     * Normalized response wrapper for all Supabase calls.
     */
    private static wrap<T>(response: PostgrestResponse<T> | PostgrestSingleResponse<T>): RepositoryResponse<T> {
        if (response.error) {
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
     * 🛡️ SECURE IDENTITY PROTOCOL
     */
    static async verifyIdentity(userId: string, idFront: string, idBack: string, selfie: string): Promise<RepositoryResponse<any>> {
        // In production, this triggers an enterprise KYC API (Digio/Authbridge)
        // For Alpha sync, we trigger a secure RPC that validates the payload and elevates clearance.
        const res = await supabase.rpc('secure_kyc_elevation', {
            target_user_id: userId,
            id_front_uri: idFront,
            id_back_uri: idBack,
            selfie_uri: selfie
        });
        return this.wrap(res);
    }

    /**
     * 📍 GEO-SPATIAL & FIELD DISCOVERY
     */
    static async getGigsInRadius(lat: number, lng: number, radiusKm: number = 20): Promise<RepositoryResponse<Gig[]>> {
        // Utilizing PostGIS functionality via RPC for precision geo-fencing
        const res = await supabase.rpc('get_gigs_in_radius', {
            target_lat: lat,
            target_long: lng,
            radius_meters: radiusKm * 1000
        });
        return this.wrap(res);
    }

    /**
     * 🛡️ FIELD SAFETY & SOS
     */
    static async triggerEmergencySOS(userId: string, lat: number, lng: number): Promise<RepositoryResponse<any>> {
        const res = await supabase
            .from('emergency_alerts')
            .insert({
                user_id: userId,
                location: `POINT(${lng} ${lat})`,
                status: 'active',
                timestamp: new Date().toISOString()
            });
        return this.wrap(res);
    }

    /**
     * 💎 TRUST NODE (SOCIAL PROOF)
     */
    static async vouchForUser(vouchedById: string, targetUserId: string): Promise<RepositoryResponse<any>> {
        const res = await supabase
            .from('vouches')
            .upsert({
                vouched_by: vouchedById,
                target_user: targetUserId,
                timestamp: new Date().toISOString()
            }, { onConflict: 'vouched_by,target_user' });
        return this.wrap(res);
    }

    /**
     * 💰 FINANCIAL LEDGER (ESCROW HARD-LINK)
     */
    static async indexEscrowPayment(gigId: string, transactionId: string, amountCents: number, metadata: any = {}): Promise<RepositoryResponse<any>> {
        const res = await supabase
            .from('escrow_ledger')
            .insert({
                gig_id: gigId,
                transaction_id: transactionId,
                amount_cents: amountCents,
                metadata
            });
        return this.wrap(res);
    }

    /**
     * 🛡️ SECURITY & SRE LOGGING (AUDIT TRAIL)
     */
    static async logSecurityEvent(eventName: string, properties: any = {}, deviceInfo: any = {}): Promise<RepositoryResponse<any>> {
        const { data: { user } } = await supabase.auth.getUser();
        const res = await supabase
            .from('analytics_events')
            .insert({
                event_name: eventName,
                properties,
                device_info: deviceInfo,
                user_id: user?.id || null
            });
        return this.wrap(res);
    }
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
            .select('*, client:profiles(*), applications(*, talent:profiles(*))')
            .eq('id', gigId)
            .single();
        return this.wrap(res);
    }

    static async createGig(gig: any): Promise<RepositoryResponse<Gig>> {
        const res = await supabase.from('gigs').insert(gig).select().single();
        return this.wrap(res);
    }

    static async updateGig(gigId: string, updates: any): Promise<RepositoryResponse<Gig>> {
        const res = await supabase.from('gigs').update(updates).eq('id', gigId).select().single();
        return this.wrap(res);
    }

    /**
     * 📝 APPLICATION OPERATIONS
     */
    static async applyToGig(gigId: string, talentId: string, message?: string): Promise<RepositoryResponse<Application>> {
        const res = await supabase
            .from('applications')
            .insert({
                gig_id: gigId,
                talent_id: talentId,
                status: 'pending',
                message: message || ''
            })
            .select()
            .single();
        return this.wrap(res);
    }

    static async getApplicants(gigId: string): Promise<RepositoryResponse<any[]>> {
        const res = await supabase
            .from('applications')
            .select('*, profiles:talent_id(*)')
            .eq('gig_id', gigId)
            .order('created_at', { ascending: false });
        return this.wrap(res as any);
    }

    static async updateApplicationStatus(id: string, status: string): Promise<RepositoryResponse<void>> {
        const res = await supabase.from('applications').update({ status }).eq('id', id);
        return this.wrap(res as any);
    }

    static async getTalentApplications(talentId: string): Promise<RepositoryResponse<any[]>> {
        const res = await supabase
            .from('applications')
            .select('*, gigs(*)').eq('talent_id', talentId).order('created_at', { ascending: false });
        return this.wrap(res as any);
    }

    static subscribeToTalentApplications(talentId: string, callback: () => void): RealtimeChannel {
        return supabase.channel(`talent-apps-${talentId}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'applications',
                filter: `talent_id=eq.${talentId}`
            }, callback)
            .subscribe();
    }

    /**
     * 💰 FINANCIAL OPERATIONS
     */
    static async getWalletBalance(userId: string): Promise<RepositoryResponse<Wallet>> {
        const res = await supabase.from('wallets').select('*').eq('user_id', userId).single();
        return this.wrap(res);
    }

    static async getTransactions(userId: string): Promise<RepositoryResponse<Transaction[]>> {
        const res = await supabase
            .from('transactions')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
        return this.wrap(res as any);
    }

    /**
     * 🛡️ ESCROW & RPC OPERATIONS
     */
    static async getEscrowStatus(gigId: string): Promise<RepositoryResponse<EscrowTransaction>> {
        const res = await supabase.from('escrow_transactions').select('*').eq('gig_id', gigId).single();
        return this.wrap(res);
    }

    static async createEscrow(escrow: Partial<EscrowTransaction>): Promise<RepositoryResponse<EscrowTransaction>> {
        const res = await supabase.from('escrow_transactions').insert(escrow).select().single();
        return this.wrap(res);
    }

    static async releaseEscrow(gigId: string): Promise<RepositoryResponse<void>> {
        const res = await supabase.rpc('release_escrow', { p_gig_id: gigId });
        return this.wrap(res as any);
    }

    static async releaseMilestone(milestoneId: string): Promise<RepositoryResponse<void>> {
        const res = await supabase.rpc('release_milestone', { p_milestone_id: milestoneId });
        return this.wrap(res as any);
    }

    /**
     * 🚩 MILESTONES & DELIVERABLES
     */
    static async createMilestone(milestone: Partial<Milestone>): Promise<RepositoryResponse<Milestone>> {
        const res = await supabase.from('milestones').insert(milestone).select().single();
        return this.wrap(res);
    }
    
    static async getMilestones(gigId: string): Promise<RepositoryResponse<Milestone[]>> {
        const res = await supabase.from('milestones').select('*').eq('gig_id', gigId).order('created_at', { ascending: true });
        return this.wrap(res as any);
    }

    static async updateMilestoneStatus(id: string, status: Milestone['status']): Promise<RepositoryResponse<void>> {
        const res = await supabase.from('milestones').update({ status }).eq('id', id);
        return this.wrap(res as any);
    }

    static async submitDeliverable(deliverable: Partial<Deliverable>): Promise<RepositoryResponse<Deliverable>> {
        const res = await supabase.from('deliverables').insert(deliverable).select().single();
        return this.wrap(res);
    }

    static async getDeliverables(gigId: string): Promise<RepositoryResponse<Deliverable[]>> {
        const res = await supabase.from('deliverables').select('*').eq('gig_id', gigId).order('created_at', { ascending: false });
        return this.wrap(res as any);
    }

    /**
     * 🛡️ TRUST & SAFETY
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

    static async createDispute(dispute: Partial<Dispute>): Promise<RepositoryResponse<Dispute>> {
        const res = await supabase.from('disputes').insert(dispute).select().single();
        return this.wrap(res);
    }

    static async getDisputes(): Promise<RepositoryResponse<any[]>> {
        const res = await supabase
            .from('disputes')
            .select('*, gig:gigs(title), initiator:profiles!initiator_id(full_name), defendant:profiles!defendant_id(full_name)')
            .order('created_at', { ascending: false });
        return this.wrap(res as any);
    }

    static async resolveDispute(id: string): Promise<RepositoryResponse<void>> {
        const res = await supabase.from('disputes').update({ status: 'resolved' }).eq('id', id);
        return this.wrap(res as any);
    }

    /**
     * ❤️ FAVORITES & PORTFOLIO
     */
    static async toggleFavorite(clientId: string, talentId: string): Promise<RepositoryResponse<void>> {
        const { data } = await supabase.from('favorite_talents').select('id').eq('client_id', clientId).eq('talent_id', talentId).single();
        if (data) {
            const res = await supabase.from('favorite_talents').delete().eq('id', data.id);
            return this.wrap(res as any);
        } else {
            const res = await supabase.from('favorite_talents').insert({ client_id: clientId, talent_id: talentId });
            return this.wrap(res as any);
        }
    }

    static async isFavorite(clientId: string, talentId: string): Promise<boolean> {
        const { data } = await supabase.from('favorite_talents').select('id').eq('client_id', clientId).eq('talent_id', talentId).single();
        return !!data;
    }

    static async getFavorites(clientId: string): Promise<RepositoryResponse<Profile[]>> {
        const res = await supabase.from('favorite_talents').select('talent:profiles(*)').eq('client_id', clientId);
        if (res.data) {
            const profiles = (res.data as any).map((item: any) => item.talent);
            return { data: profiles, error: null };
        }
        return this.wrap(res as any);
    }

    static async addPortfolioItem(item: Partial<PortfolioItem>): Promise<RepositoryResponse<PortfolioItem>> {
        const res = await supabase.from('portfolio_items').insert(item).select().single();
        return this.wrap(res);
    }

    /**
     * 💾 SAVED SEARCHES
     */
    static async saveSearch(userId: string, title: string, filters: GigFilters, queryText?: string): Promise<RepositoryResponse<SavedSearch>> {
        const res = await supabase.from('saved_searches').insert({
            user_id: userId,
            title,
            filters,
            query_text: queryText
        }).select().single();
        return this.wrap(res);
    }

    static async getSavedSearches(userId: string): Promise<RepositoryResponse<SavedSearch[]>> {
        const res = await supabase.from('saved_searches').select('*').eq('user_id', userId).order('created_at', { ascending: false });
        return this.wrap(res as any);
    }

    static async deleteSavedSearch(id: string): Promise<RepositoryResponse<void>> {
        const res = await supabase.from('saved_searches').delete().eq('id', id);
        return this.wrap(res as any);
    }

    /**
     * 🛰️ COMMUNICATIONS & CHAT
     */
    static async createChatRoom(gigId: string, type: string = 'assignment'): Promise<RepositoryResponse<any>> {
        const res = await supabase.from('chat_rooms').upsert({ gig_id: gigId, type }).select().single();
        return this.wrap(res);
    }
    /**
     * 🔔 NOTIFICATIONS
     */
    static async getNotifications(userId: string): Promise<RepositoryResponse<any[]>> {
        const res = await supabase.from('notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false });
        return this.wrap(res as any);
    }

    static async markNotificationRead(id: string): Promise<RepositoryResponse<void>> {
        const res = await supabase.from('notifications').update({ read: true }).eq('id', id);
        return this.wrap(res as any);
    }

    /**
     * 🛡️ EMERGENCY PROTOCOLS
     */
    static async getTrustedContacts(userId: string): Promise<RepositoryResponse<any[]>> {
        const res = await supabase.from('trusted_contacts').select('*').eq('user_id', userId).order('created_at', { ascending: false });
        return this.wrap(res as any);
    }

    static async addTrustedContact(contact: any): Promise<RepositoryResponse<any>> {
        const res = await supabase.from('trusted_contacts').insert(contact).select().single();
        return this.wrap(res);
    }

    static async deleteTrustedContact(id: string): Promise<RepositoryResponse<void>> {
        const res = await supabase.from('trusted_contacts').delete().eq('id', id);
        return this.wrap(res as any);
    }

    /**
     * 📊 ANALYTICS
     */
    static async getClientGigStats(clientId: string): Promise<RepositoryResponse<{ posted: number, active: number, completed: number }>> {
        const { data: gigs, error } = await supabase.from('gigs').select('status').eq('client_id', clientId);
        if (error) return this.wrap({ error } as any);

        const stats = {
            posted: gigs.length,
            active: gigs.filter(g => g.status === 'active' || g.status === 'open').length,
            completed: gigs.filter(g => g.status === 'completed').length
        };
        return { data: stats, error: null };
    }

    static async getAllEscrowTransactions(limit: number = 50): Promise<RepositoryResponse<any[]>> {
        const res = await supabase
            .from('escrow_transactions')
            .select('*, client:profiles!client_id(full_name), talent:profiles!talent_id(full_name)')
            .order('created_at', { ascending: false })
            .limit(limit);
        return this.wrap(res as any);
    }
}
