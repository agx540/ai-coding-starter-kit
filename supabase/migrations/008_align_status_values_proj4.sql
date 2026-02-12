-- ============================================
-- PROJ-4: Idea Board
-- Migration: Align status enum values with UI
--
-- Current DB values:  'Offen', 'In Bearbeitung', 'Erledigt', 'Abgelehnt'
-- Required values:    'Offen', 'Geplant', 'In Arbeit', 'Erledigt'
-- ============================================

-- 1. Temporarily disable the immutable columns trigger
--    (it prevents status changes, but we need to migrate status values)
ALTER TABLE public.ideas DISABLE TRIGGER ideas_protect_immutable_columns;

-- 2. Migrate existing status values
UPDATE public.ideas SET status = 'In Arbeit' WHERE status = 'In Bearbeitung';
UPDATE public.ideas SET status = 'Offen' WHERE status = 'Abgelehnt';

-- 3. Replace the CHECK constraint with new values
ALTER TABLE public.ideas DROP CONSTRAINT IF EXISTS ideas_status_check;
ALTER TABLE public.ideas ADD CONSTRAINT ideas_status_check
  CHECK (status IN ('Offen', 'Geplant', 'In Arbeit', 'Erledigt'));

-- 4. Re-enable the immutable columns trigger
ALTER TABLE public.ideas ENABLE TRIGGER ideas_protect_immutable_columns;

-- 5. Enable Supabase Realtime for ideas and votes tables
--    Required for live updates on the Idea Board (PROJ-4)
--    Use idempotent check to avoid error if already added
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'ideas'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.ideas;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'votes'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.votes;
  END IF;
END $$;
