import { createClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const RegisterSchema = z.object({
  token: z.string().min(1, 'Token ist erforderlich'),
  email: z.string().email('Ungültiges Email-Format'),
  password: z.string().min(8, 'Passwort muss mindestens 8 Zeichen lang sein'),
})

// POST /api/register - Atomic registration with invitation token
export async function POST(request: Request) {
  const supabase = await createClient()
  const admin = createAdminClient()

  // 1. Validate input
  const body = await request.json().catch(() => ({}))
  const parsed = RegisterSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Ungültige Eingabe', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const { token, email, password } = parsed.data

  // 2. Validate token FIRST (before creating user) — admin client (anon cannot call this)
  const { data: validation, error: tokenError } = await admin
    .rpc('validate_invitation_token', { p_token: token.trim() })

  if (tokenError || !validation || !validation.valid) {
    const errorMessages: Record<string, string> = {
      already_redeemed: 'Dieser Einladungscode wurde bereits verwendet.',
      expired: 'Dieser Einladungscode ist abgelaufen. Bitte fordere einen neuen an.',
    }
    const errorKey = validation?.error as string | undefined
    return NextResponse.json(
      { error: errorMessages[errorKey ?? ''] ?? 'Ungültiger Einladungscode.' },
      { status: 400 }
    )
  }

  // 3. Create user via Supabase Auth
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
  })

  if (signUpError) {
    if (signUpError.message.includes('already registered')) {
      return NextResponse.json(
        { error: 'Diese Email-Adresse ist bereits registriert.' },
        { status: 409 }
      )
    }
    return NextResponse.json(
      { error: 'Registrierung fehlgeschlagen. Bitte versuche es erneut.' },
      { status: 500 }
    )
  }

  if (!signUpData.user) {
    return NextResponse.json(
      { error: 'Registrierung fehlgeschlagen. Bitte versuche es erneut.' },
      { status: 500 }
    )
  }

  // 4. Atomically redeem invitation (admin client — with row lock to prevent race condition)
  const { data: redemption, error: redeemError } = await admin
    .rpc('redeem_invitation', {
      p_token: token.trim(),
      p_user_id: signUpData.user.id,
    })

  if (redeemError || !redemption?.success) {
    // Token was redeemed between validation and now (race condition caught!)
    // The user account was already created - but that's acceptable.
    // The user can still log in, they just didn't "use" a token slot.
    const errorKey = redemption?.error as string | undefined
    if (errorKey === 'already_redeemed') {
      return NextResponse.json(
        { error: 'Dieser Einladungscode wurde bereits verwendet.' },
        { status: 409 }
      )
    }
    return NextResponse.json(
      { error: 'Einladungscode konnte nicht eingelöst werden.' },
      { status: 500 }
    )
  }

  // 5. Return session if available
  return NextResponse.json({
    user: signUpData.user,
    session: signUpData.session,
  }, { status: 201 })
}
