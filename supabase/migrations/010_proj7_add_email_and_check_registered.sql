-- ============================================
-- PROJ-7: Admin User-Einladung per Email
-- Migration: Add email column + check_email_registered function
-- ============================================

-- ============================================
-- 1. BUG-1: Add email column to invitations table
-- ============================================
ALTER TABLE public.invitations ADD COLUMN IF NOT EXISTS email TEXT;

-- Index for duplicate-check queries (pending invitation for same email)
CREATE INDEX IF NOT EXISTS idx_invitations_email ON public.invitations(email);

-- ============================================
-- 2. BUG-2: Create check_email_registered function
--    Checks auth.users to see if an email is already registered.
--    SECURITY DEFINER to access auth.users from service_role context.
-- ============================================
CREATE OR REPLACE FUNCTION public.check_email_registered(p_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM auth.users
    WHERE LOWER(email) = LOWER(TRIM(p_email))
  );
END;
$$;

-- Only service_role can call this (used by server-side admin client)
REVOKE EXECUTE ON FUNCTION public.check_email_registered(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_email_registered(text) TO service_role;

-- ============================================
-- 3. BUG-4: Update validate_invitation_token to return email
--    Original (Migration 002) only returns invitation_id.
--    Now also SELECTs and returns the email field so the
--    registration page can prefill it.
-- ============================================
CREATE OR REPLACE FUNCTION public.validate_invitation_token(p_token TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_invitation RECORD;
BEGIN
  SELECT id, email, expires_at, redeemed_by
  INTO v_invitation
  FROM public.invitations
  WHERE token = p_token;

  IF NOT FOUND THEN
    RETURN json_build_object('valid', false, 'error', 'not_found');
  END IF;

  IF v_invitation.redeemed_by IS NOT NULL THEN
    RETURN json_build_object('valid', false, 'error', 'already_redeemed');
  END IF;

  IF v_invitation.expires_at < NOW() THEN
    RETURN json_build_object('valid', false, 'error', 'expired');
  END IF;

  RETURN json_build_object('valid', true, 'invitation_id', v_invitation.id, 'email', v_invitation.email);
END;
$$;
