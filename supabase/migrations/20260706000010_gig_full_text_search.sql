-- Epic 3: Database Search Engine Optimization & Full-Text Indexing

-- 1. Enable Trigram extension securely
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. Add generated search vector column for full-text search
ALTER TABLE public.gigs ADD COLUMN IF NOT EXISTS search_vector TSVECTOR GENERATED ALWAYS AS (
  to_tsvector('english', COALESCE(title, '')) || 
  to_tsvector('english', COALESCE(description, ''))
) STORED;

-- 3. Create GIN index on search vector
CREATE INDEX IF NOT EXISTS idx_gigs_search_vector ON public.gigs USING GIN(search_vector);

-- 4. Create GIN trigram index on title for fuzzy matches and suggestions
CREATE INDEX IF NOT EXISTS idx_gigs_title_trgm ON public.gigs USING GIN(title gin_trgm_ops);
