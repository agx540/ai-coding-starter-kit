-- ============================================
-- PROJ-3: Voting System
-- Migration: Create votes table
-- ============================================

CREATE TABLE votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id UUID NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read votes (for counting)
CREATE POLICY "Authenticated users can read votes"
  ON votes FOR SELECT
  USING ((SELECT auth.uid()) IS NOT NULL);

-- Authenticated users can create votes (with their own user_id)
CREATE POLICY "Authenticated users can create votes"
  ON votes FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- No UPDATE or DELETE policies (votes are immutable)

-- Performance indexes
CREATE INDEX idx_votes_idea_id ON votes(idea_id);
CREATE INDEX idx_votes_user_id ON votes(user_id);
