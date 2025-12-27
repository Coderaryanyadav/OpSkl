-- 🏗️ OPSKL V2 SCHEMA UPDATE (TRUST & SAFETY)
-- RUN THIS IN SUPABASE SQL EDITOR TO ENABLE CRITICAL FEATURES

-- 1. REVIEWS & RATINGS (Trust Signal)
create table public.reviews (
  id uuid default gen_random_uuid() primary key,
  gig_id uuid references public.gigs(id) not null,
  reviewer_id uuid references public.profiles(id) not null,
  target_id uuid references public.profiles(id) not null,
  rating integer check (rating >= 1 and rating <= 5) not null,
  comment text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. PORTFOLIO ITEMS (Worker Showcase)
create table public.portfolio_items (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) not null,
  title text not null,
  description text,
  image_url text not null,
  link_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. DELIVERABLES (Work Submission)
create type deliverable_status as enum ('submitted', 'accepted', 'rejected');

create table public.deliverables (
  id uuid default gen_random_uuid() primary key,
  gig_id uuid references public.gigs(id) not null,
  worker_id uuid references public.profiles(id) not null,
  file_url text not null,
  description text,
  status deliverable_status default 'submitted',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. ESCROW TRANSACTIONS (Payment Protection)
create type escrow_status as enum ('held', 'released', 'refunded', 'disputed');

create table public.escrow_transactions (
  id uuid default gen_random_uuid() primary key,
  gig_id uuid references public.gigs(id) not null,
  client_id uuid references public.profiles(id) not null,
  worker_id uuid references public.profiles(id) not null,
  amount_cents integer not null,
  status escrow_status default 'held',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  released_at timestamp with time zone
);

-- RLS POLICIES FOR NEW TABLES

-- Reviews: Public read, Authenticated create
alter table public.reviews enable row level security;
create policy "Reviews are public" on public.reviews for select using (true);
create policy "Users can create reviews" on public.reviews for insert with check (auth.uid() = reviewer_id);

-- Portfolio: Public read, Owner write
alter table public.portfolio_items enable row level security;
create policy "Portfolio is public" on public.portfolio_items for select using (true);
create policy "Users manage own portfolio" on public.portfolio_items for all using (auth.uid() = user_id);

-- Deliverables: Participants read, Worker create
alter table public.deliverables enable row level security;
create policy "Deliverables visible to gig participants" on public.deliverables for select using (
  exists (select 1 from public.gigs where id = deliverables.gig_id and (client_id = auth.uid() or auth.uid() = deliverables.worker_id))
);
create policy "Workers submit deliverables" on public.deliverables for insert with check (auth.uid() = worker_id);

-- Escrow: Participants read (System managed writes via Edge Functions generally, but allowing basic flow for MVP)
alter table public.escrow_transactions enable row level security;
create policy "Escrow visible to participants" on public.escrow_transactions for select using (
  auth.uid() = client_id or auth.uid() = worker_id
);

-- Add aggregations to Profile for fast lookup
alter table public.profiles add column if not exists avg_rating numeric(3,2) default 0.0;
alter table public.profiles add column if not exists review_count integer default 0;
