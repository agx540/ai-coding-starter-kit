import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { z } from 'zod'

const LoginSchema = z.object({
  email: z.string().email('Ungültiges Email-Format'),
  password: z.string().min(1, 'Passwort ist erforderlich'),
})

// POST /api/login - Login with rate limiting (BUG-4 fix)
export async function POST(request: Request) {
  const supabase = await createClient()

  // 1. Validate input
  const body = await request.json().catch(() => ({}))
  const parsed = LoginSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Ungültige Eingabe' },
      { status: 400 }
    )
  }

  const { email, password } = parsed.data

  // 2. Get client IP for logging
  const headerStore = await headers()
  const ip = headerStore.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null

  // 3. Check rate limit
  const { data: rateLimit, error: rateLimitError } = await supabase
    .rpc('check_login_rate_limit', { p_email: email })

  if (rateLimitError) {
    return NextResponse.json(
      { error: 'Login vorübergehend nicht möglich. Bitte versuche es später erneut.' },
      { status: 500 }
    )
  }

  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        error: 'Zu viele fehlgeschlagene Anmeldeversuche. Bitte warte eine Minute.',
        retry_after_seconds: rateLimit.retry_after_seconds,
      },
      { status: 429 }
    )
  }

  // 4. Attempt login
  const { data, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (authError || !data.session) {
    // Record failed attempt
    await supabase.rpc('record_failed_login', { p_email: email, p_ip: ip })

    const remaining = (rateLimit.remaining_attempts ?? 1) - 1
    return NextResponse.json(
      {
        error: 'Email oder Passwort ist falsch.',
        remaining_attempts: remaining,
      },
      { status: 401 }
    )
  }

  // 5. Success — clear failed attempts
  await supabase.rpc('clear_login_attempts', { p_email: email })

  return NextResponse.json({ success: true })
}
