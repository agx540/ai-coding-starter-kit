-- ============================================
-- Fix: Rate limiting functions with search_path = ''
--
-- Migration 006 set search_path = '' on all functions for security,
-- but the rate limiting functions (from migration 004) reference
-- login_attempts without the public. prefix, causing them to fail.
-- ============================================

-- Fix check_login_rate_limit
CREATE OR REPLACE FUNCTION public.check_login_rate_limit(p_email TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  attempt_count INTEGER;
  max_attempts INTEGER := 5;
  window_seconds INTEGER := 60;
BEGIN
  SELECT COUNT(*) INTO attempt_count
  FROM public.login_attempts
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

-- Fix record_failed_login
CREATE OR REPLACE FUNCTION public.record_failed_login(p_email TEXT, p_ip TEXT DEFAULT NULL)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.login_attempts (email, ip_address)
  VALUES (LOWER(TRIM(p_email)), p_ip);

  DELETE FROM public.login_attempts
  WHERE attempted_at < NOW() - INTERVAL '1 hour';
END;
$$;

-- Fix clear_login_attempts
CREATE OR REPLACE FUNCTION public.clear_login_attempts(p_email TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  DELETE FROM public.login_attempts
  WHERE email = LOWER(TRIM(p_email));
END;
$$;
