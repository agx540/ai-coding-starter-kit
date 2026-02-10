import { createClient } from '@supabase/supabase-js'

// Admin client using service_role key — bypasses RLS.
// ONLY use in server-side API routes for privileged operations
// (rate limiting, invitation management, etc.)
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}
