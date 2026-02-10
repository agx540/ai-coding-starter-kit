-- ============================================
-- PROJ-1: Fix BUG-1 - Race Condition bei Token-Einlösung
-- Migration: Atomare Token-Validierung + Redemption
-- ============================================

-- Replaces the two-step process (validate_invitation_token + separate UPDATE)
-- with a single atomic function that validates AND redeems in one transaction.
-- Uses row-level locking (FOR UPDATE) to prevent race conditions.

CREATE OR REPLACE FUNCTION redeem_invitation(p_token TEXT, p_user_id UUID)
RETURNS JSON AS $$
DECLARE
  v_invitation RECORD;
BEGIN
  -- Lock the row to prevent concurrent redemption (FOR UPDATE)
  SELECT id, expires_at, redeemed_by
  INTO v_invitation
  FROM invitations
  WHERE token = p_token
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'not_found');
  END IF;

  IF v_invitation.redeemed_by IS NOT NULL THEN
    RETURN json_build_object('success', false, 'error', 'already_redeemed');
  END IF;

  IF v_invitation.expires_at < NOW() THEN
    RETURN json_build_object('success', false, 'error', 'expired');
  END IF;

  -- Atomically mark as redeemed
  UPDATE invitations
  SET redeemed_by = p_user_id,
      redeemed_at = NOW()
  WHERE id = v_invitation.id;

  RETURN json_build_object('success', true, 'invitation_id', v_invitation.id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
