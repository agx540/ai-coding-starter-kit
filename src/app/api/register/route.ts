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

  // 2. Validate token FIRST (before creating user)
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

  // 3. Create user via Admin API (bypasses email rate limits + skips confirmation email)
  //    This is appropriate for invitation-based registration — the user was already invited.
  const { data: createData, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (createError) {
    if (createError.message.includes('already been registered') || createError.message.includes('already exists')) {
      return NextResponse.json(
        { error: 'Diese Email-Adresse ist bereits registriert.' },
        { status: 409 }
      )
    }
    return NextResponse.json(
      { error: 'Registrierung fehlgeschlagen. Bitte versuche es erneut.', detail: createError.message },
      { status: 500 }
    )
  }

  if (!createData.user) {
    return NextResponse.json(
      { error: 'Registrierung fehlgeschlagen. Bitte versuche es erneut.' },
      { status: 500 }
    )
  }

  // 4. Atomically redeem invitation
  const { data: redemption, error: redeemError } = await admin
    .rpc('redeem_invitation', {
      p_token: token.trim(),
      p_user_id: createData.user.id,
    })

  if (redeemError || !redemption?.success) {
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

  // 5. Return user (client will need to sign in separately)
  return NextResponse.json({
    user: createData.user,
    session: null,
  }, { status: 201 })
}
