-- ============================================
-- Security Fixes for PROJ-1 and PROJ-2
-- ============================================

-- ============================================
-- 1. PROJ-1 BUG-12: Revoke anon/public access to SECURITY DEFINER functions
-- ============================================
REVOKE EXECUTE ON FUNCTION public.clear_login_attempts(text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.record_failed_login(text, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.check_login_rate_limit(text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_invitation_token(text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.redeem_invitation(text, uuid) FROM PUBLIC, anon, authenticated;

-- Grant to service_role only (used by server-side API routes via admin client)
GRANT EXECUTE ON FUNCTION public.clear_login_attempts(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.record_failed_login(text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.check_login_rate_limit(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.validate_invitation_token(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.redeem_invitation(text, uuid) TO service_role;

-- ============================================
-- 2. PROJ-1 BUG-13 + PROJ-2 BUG-6: Set search_path on all functions
-- ============================================
ALTER FUNCTION public.clear_login_attempts(text) SET search_path = '';
ALTER FUNCTION public.record_failed_login(text, text) SET search_path = '';
ALTER FUNCTION public.check_login_rate_limit(text) SET search_path = '';
ALTER FUNCTION public.validate_invitation_token(text) SET search_path = '';
ALTER FUNCTION public.redeem_invitation(text, uuid) SET search_path = '';
ALTER FUNCTION public.update_updated_at() SET search_path = '';
ALTER FUNCTION public.handle_new_user() SET search_path = '';

-- ============================================
-- 3. PROJ-2 BUG-4 + BUG-5: Protect immutable columns on ideas table
-- Prevent authors from changing: status, author_id, created_at
-- ============================================
CREATE OR REPLACE FUNCTION public.protect_ideas_immutable_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  -- Prevent status change (only admins should change status, via PROJ-6)
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    RAISE EXCEPTION 'Status kann nur von Admins geändert werden.';
  END IF;

  -- Prevent author_id change
  IF NEW.author_id IS DISTINCT FROM OLD.author_id THEN
    RAISE EXCEPTION 'Autor kann nicht geändert werden.';
  END IF;

  -- Prevent created_at change
  IF NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'Erstellungsdatum kann nicht geändert werden.';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER ideas_protect_immutable_columns
  BEFORE UPDATE ON public.ideas
  FOR EACH ROW EXECUTE FUNCTION public.protect_ideas_immutable_columns();

-- ============================================
-- 4. PROJ-2 BUG-7: Update RLS policies to use (SELECT auth.uid())
-- Drop and recreate all policies on ideas and categories tables
-- ============================================

-- Ideas policies
DROP POLICY IF EXISTS "Authenticated users can read ideas" ON public.ideas;
DROP POLICY IF EXISTS "Authenticated users can create ideas" ON public.ideas;
DROP POLICY IF EXISTS "Authors can update own ideas" ON public.ideas;
DROP POLICY IF EXISTS "Authors can delete own ideas" ON public.ideas;

CREATE POLICY "Authenticated users can read ideas"
  ON public.ideas FOR SELECT
  USING ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "Authenticated users can create ideas"
  ON public.ideas FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = author_id);

CREATE POLICY "Authors can update own ideas"
  ON public.ideas FOR UPDATE
  USING ((SELECT auth.uid()) = author_id)
  WITH CHECK ((SELECT auth.uid()) = author_id);

CREATE POLICY "Authors can delete own ideas"
  ON public.ideas FOR DELETE
  USING ((SELECT auth.uid()) = author_id);

-- Categories policies
DROP POLICY IF EXISTS "Authenticated users can read categories" ON public.categories;
DROP POLICY IF EXISTS "Admins can insert categories" ON public.categories;
DROP POLICY IF EXISTS "Admins can update categories" ON public.categories;
DROP POLICY IF EXISTS "Admins can delete categories" ON public.categories;

CREATE POLICY "Authenticated users can read categories"
  ON public.categories FOR SELECT
  USING ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "Admins can insert categories"
  ON public.categories FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update categories"
  ON public.categories FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete categories"
  ON public.categories FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND role = 'admin'
    )
  );
