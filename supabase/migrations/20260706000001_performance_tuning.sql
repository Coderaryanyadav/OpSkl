-- Index foreign keys and attributes commonly joined in queries and RLS policies

-- public.worker_profiles
CREATE INDEX IF NOT EXISTS idx_worker_profiles_user_id ON public.worker_profiles(user_id);

-- public.worker_skills
CREATE INDEX IF NOT EXISTS idx_worker_skills_worker_id ON public.worker_skills(worker_id);
CREATE INDEX IF NOT EXISTS idx_worker_skills_skill_id ON public.worker_skills(skill_id);

-- public.locations
CREATE INDEX IF NOT EXISTS idx_locations_user_id_primary ON public.locations(user_id, is_primary);

-- public.gigs
CREATE INDEX IF NOT EXISTS idx_gigs_location_id ON public.gigs(location_id);
CREATE INDEX IF NOT EXISTS idx_gigs_assigned_worker_id ON public.gigs(assigned_worker_id);
CREATE INDEX IF NOT EXISTS idx_gigs_skill_id ON public.gigs(skill_id);

-- public.gig_bids
CREATE INDEX IF NOT EXISTS idx_gig_bids_gig_id ON public.gig_bids(gig_id);
CREATE INDEX IF NOT EXISTS idx_gig_bids_worker_id ON public.gig_bids(worker_id);

-- public.wallets
CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON public.wallets(user_id);

-- public.transactions
CREATE INDEX IF NOT EXISTS idx_transactions_from_user_id ON public.transactions(from_user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_to_user_id ON public.transactions(to_user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_gig_id ON public.transactions(gig_id);

-- public.reviews
CREATE INDEX IF NOT EXISTS idx_reviews_gig_id ON public.reviews(gig_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer_id ON public.reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewee_id ON public.reviews(reviewee_id);

-- public.messages
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON public.messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_gig_id ON public.messages(gig_id);
