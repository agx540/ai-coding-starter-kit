-- Migration: Login Rate Limiting
-- BUG-4 Fix: Implements server-side rate limiting for login attempts
-- Spec: 5 attempts per minute, then 1-minute lockout

-- Table to track failed login attempts
CREATE TABLE login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  ip_address TEXT,
  attempted_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for efficient lookups by email + time window
CREATE INDEX idx_login_attempts_email_time ON login_attempts(email, attempted_at DESC);

-- Enable RLS with NO policies = no direct access from client
-- All access goes through SECURITY DEFINER functions
ALTER TABLE login_attempts ENABLE ROW LEVEL SECURITY;

-- RPC: Check if login is rate-limited for a given email
CREATE OR REPLACE FUNCTION check_login_rate_limit(p_email TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  attempt_count INTEGER;
  max_attempts INTEGER := 5;
  window_seconds INTEGER := 60;
BEGIN
  SELECT COUNT(*) INTO attempt_count
  FROM login_attempts
  WHERE email = LOWER(TRIM(p_email))
    AND attempted_at > NOW() - (window_seconds || ' seconds')::INTERVAL;

  IF attempt_count >= max_attempts THEN
    RETURN json_build_object(
      'allowed', false,
      'remaining_attempts', 0,
      'retry_after_seconds', window_seconds
    );
  END IF;

  RETURN json_build_object(
    'allowed', true,
    'remaining_attempts', max_attempts - attempt_count
  );
END;
$$;

-- RPC: Record a failed login attempt + cleanup old entries
CREATE OR REPLACE FUNCTION record_failed_login(p_email TEXT, p_ip TEXT DEFAULT NULL)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO login_attempts (email, ip_address)
  VALUES (LOWER(TRIM(p_email)), p_ip);

  -- Cleanup: delete attempts older than 1 hour to prevent table bloat
  DELETE FROM login_attempts
  WHERE attempted_at < NOW() - INTERVAL '1 hour';
END;
$$;

-- RPC: Clear attempts on successful login
CREATE OR REPLACE FUNCTION clear_login_attempts(p_email TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM login_attempts
  WHERE email = LOWER(TRIM(p_email));
END;
$$;
