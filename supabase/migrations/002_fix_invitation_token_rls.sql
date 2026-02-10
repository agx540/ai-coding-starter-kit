-- ============================================
-- PROJ-1: Fix BUG-6 - Invitation Tokens publicly readable
-- Migration: Restrict invitation RLS + add secure validation function
-- ============================================

-- ============================================
-- 1. Remove overly permissive SELECT policy
--    OLD: USING (true) allowed anyone to read ALL invitation data
-- ============================================
DROP POLICY IF EXISTS "Anyone can validate invitation token" ON invitations;

-- ============================================
-- 2. Add admin-only SELECT policy
--    Admins can read invitations (needed for /api/invitations)
-- ============================================
CREATE POLICY "Admins can read invitations"
  ON invitations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- 3. Secure token validation function (SECURITY DEFINER)
--    Bypasses RLS to validate a token without exposing table data.
--    Returns JSON with validation result only - never the token itself.
-- ============================================
CREATE OR REPLACE FUNCTION validate_invitation_token(p_token TEXT)
RETURNS JSON AS $$
DECLARE
  v_invitation RECORD;
BEGIN
  SELECT id, expires_at, redeemed_by
  INTO v_invitation
  FROM invitations
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

  RETURN json_build_object('valid', true, 'invitation_id', v_invitation.id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
