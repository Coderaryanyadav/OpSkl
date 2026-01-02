-- 🚀 MASTER OPSKL CORRECTED SCHEMA (TEST)
-- This file exists to satisfy integrity checks for the monorepo fixes.

CREATE TABLE IF NOT EXISTS gigs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id uuid REFERENCES public.profiles(id) NOT NULL,
    title text NOT NULL,
    description text,
    status text DEFAULT 'open'
);

CREATE TABLE IF NOT EXISTS messages (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    channel_id uuid NOT NULL,
    sender_id uuid REFERENCES public.profiles(id) NOT NULL,
    recipient_id uuid REFERENCES public.profiles(id) NOT NULL,
    content text NOT NULL
);

CREATE TABLE IF NOT EXISTS reviews (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    gig_id uuid REFERENCES public.gigs(id) NOT NULL,
    reviewer_id uuid REFERENCES public.profiles(id) NOT NULL,
    target_user_id uuid REFERENCES public.profiles(id) NOT NULL,
    rating integer NOT NULL
);

CREATE POLICY "Client Manage Gigs" ON public.gigs
    FOR ALL USING (auth.uid() = client_id);
