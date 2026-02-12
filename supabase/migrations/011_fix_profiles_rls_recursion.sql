-- ============================================
-- Fix: Infinite recursion in profiles RLS policies
--
-- Problem: "Admins can read all profiles" policy queries the profiles
-- table itself, causing infinite recursion when PostgreSQL evaluates
-- all SELECT policies (OR logic).
--
-- Solution: Create a SECURITY DEFINER function is_admin() that
-- bypasses RLS to check the role, then use it in all admin policies.
-- ============================================

-- 1. Create helper function (SECURITY DEFINER bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (SELECT auth.uid()) AND role = 'admin'
  );
$$;

-- 2. Fix the recursive profiles policy
DROP POLICY IF EXISTS "Admins can read all profiles" ON public.profiles;
CREATE POLICY "Admins can read all profiles"
  ON public.profiles FOR SELECT
  USING (public.is_admin());

-- 3. Fix invitations policies that reference profiles
DROP POLICY IF EXISTS "Admins can read invitations" ON public.invitations;
CREATE POLICY "Admins can read invitations"
  ON public.invitations FOR SELECT
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can create invitations" ON public.invitations;
CREATE POLICY "Admins can create invitations"
  ON public.invitations FOR INSERT
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete invitations" ON public.invitations;
CREATE POLICY "Admins can delete invitations"
  ON public.invitations FOR DELETE
  USING (public.is_admin());

-- 4. Fix categories policies that reference profiles
DROP POLICY IF EXISTS "Admins can insert categories" ON public.categories;
CREATE POLICY "Admins can insert categories"
  ON public.categories FOR INSERT
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can update categories" ON public.categories;
CREATE POLICY "Admins can update categories"
  ON public.categories FOR UPDATE
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete categories" ON public.categories;
CREATE POLICY "Admins can delete categories"
  ON public.categories FOR DELETE
  USING (public.is_admin());
