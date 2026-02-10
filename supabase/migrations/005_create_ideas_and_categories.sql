-- ============================================
-- PROJ-2: Idea Submission
-- Migration: Create ideas + categories tables
-- ============================================

-- ============================================
-- 1. Categories table (basic structure, Admin-UI comes in PROJ-5)
-- ============================================
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read categories (for dropdown)
CREATE POLICY "Authenticated users can read categories"
  ON categories FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Only admins can manage categories
CREATE POLICY "Admins can insert categories"
  ON categories FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update categories"
  ON categories FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete categories"
  ON categories FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- 2. Insert default categories
-- ============================================
INSERT INTO categories (name) VALUES
  ('Feature'),
  ('Bugfix'),
  ('Verbesserung');

-- ============================================
-- 3. Ideas table
-- ============================================
CREATE TABLE ideas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL CHECK (char_length(title) <= 100),
  description TEXT NOT NULL CHECK (char_length(description) <= 2000),
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'Offen' CHECK (status IN ('Offen', 'In Bearbeitung', 'Erledigt', 'Abgelehnt')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE ideas ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read all ideas
CREATE POLICY "Authenticated users can read ideas"
  ON ideas FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Authenticated users can create ideas
CREATE POLICY "Authenticated users can create ideas"
  ON ideas FOR INSERT
  WITH CHECK (auth.uid() = author_id);

-- Only the author can update their own idea
CREATE POLICY "Authors can update own ideas"
  ON ideas FOR UPDATE
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

-- Only the author can delete their own idea
CREATE POLICY "Authors can delete own ideas"
  ON ideas FOR DELETE
  USING (auth.uid() = author_id);

-- ============================================
-- 4. Indexes for performance
-- ============================================
CREATE INDEX idx_ideas_author_id ON ideas(author_id);
CREATE INDEX idx_ideas_category_id ON ideas(category_id);
CREATE INDEX idx_ideas_status ON ideas(status);
CREATE INDEX idx_ideas_created_at ON ideas(created_at DESC);

-- ============================================
-- 5. Updated_at trigger for ideas
-- ============================================
CREATE TRIGGER ideas_updated_at
  BEFORE UPDATE ON ideas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
