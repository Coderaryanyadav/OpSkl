export type UserRole = 'talent' | 'client';
export type VerificationStatus = 'unverified' | 'pending' | 'verified' | 'rejected';

export interface Profile {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    bio: string | null;
    headline: string | null;
    website: string | null;
    hourly_rate: number | null;
    total_count: number;
    current_streak: number;
    is_ghost_mode: boolean;
    active_role: UserRole;
    verification_status: VerificationStatus;
    trust_score: number;
    created_at: string;
    updated_at: string;
    avg_rating?: number;
    review_count?: number;
    portfolio?: PortfolioItem[];
}

export interface PortfolioItem {
    id: string;
    user_id: string;
    title: string;
    description: string | null;
    image_url: string;
    link_url: string | null;
    created_at: string;
}

export interface Wallet {
    id: string;
    user_id: string;
    balance: number;
    currency: string;
    updated_at: string;
}

export interface Transaction {
    id: string;
    user_id: string;
    amount: number;
    type: 'credit' | 'debit';
    description: string;
    created_at: string;
}
