export type GigStatus = 'open' | 'active' | 'completed' | 'cancelled';

export interface Gig {
    id: string;
    title: string;
    description: string;
    category: string;
    location: string;
    budget: number;
    pay_amount_cents: number;
    duration_minutes: number;
    urgency_level: 'low' | 'medium' | 'high';
    status: GigStatus;
    client_id: string;
    assigned_worker_id?: string;
    created_at: string;
    client?: any; // Break circular dependency
    applications?: Application[];
}

export type ApplicationStatus = 'pending' | 'approved' | 'rejected' | 'completed';

export interface Application {
    id: string;
    gig_id: string;
    worker_id: string;
    status: ApplicationStatus;
    message: string | null;
    created_at: string;
    worker?: any; // Break circular dependency
    gig?: Gig;
}

export interface GigFilters {
    status?: GigStatus;
    category?: string;
    clientId?: string;
    workerId?: string;
    title?: string;
    minBudget?: number;
    maxBudget?: number;
    urgency?: 'low' | 'medium' | 'high';
}

export interface Review {
    id: string;
    gig_id: string;
    reviewer_id: string;
    target_id: string;
    rating: number;
    comment: string | null;
    created_at: string;
    reviewer?: any; // Break circular dependency
}

export interface Deliverable {
    id: string;
    gig_id: string;
    worker_id: string;
    file_url: string;
    description: string | null;
    status: 'submitted' | 'accepted' | 'rejected';
    created_at: string;
}

export interface EscrowTransaction {
    id: string;
    gig_id: string;
    client_id: string;
    worker_id: string;
    amount_cents: number;
    status: 'held' | 'released' | 'refunded' | 'disputed';
    created_at: string;
    released_at?: string;
}

export interface Dispute {
    id: string;
    gig_id: string;
    initiator_id: string;
    defendant_id: string;
    reason: string;
    description: string;
    status: 'open' | 'under_review' | 'resolved' | 'dismissed';
    resolution_notes?: string;
    created_at: string;
}
