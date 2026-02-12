import { createAdminClient } from '@/lib/supabase-admin'
import { NextResponse } from 'next/server'

// POST /api/register/validate-token - Validate token and return associated email
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const { token } = body

  if (!token || typeof token !== 'string') {
    return NextResponse.json({ error: 'Token ist erforderlich.' }, { status: 400 })
  }

  const admin = createAdminClient()

  const { data: validation, error } = await admin
    .rpc('validate_invitation_token', { p_token: token.trim() })

  if (error || !validation) {
    return NextResponse.json({ error: 'Token-Validierung fehlgeschlagen.' }, { status: 500 })
  }

  if (!validation.valid) {
    const errorMessages: Record<string, string> = {
      not_found: 'Ungültiger Einladungscode.',
      already_redeemed: 'Dieser Einladungscode wurde bereits verwendet.',
      expired: 'Dieser Einladungscode ist abgelaufen. Bitte kontaktiere den Admin.',
    }
    return NextResponse.json(
      { error: errorMessages[validation.error as string] ?? 'Ungültiger Einladungscode.' },
      { status: 400 }
    )
  }

  return NextResponse.json({ email: validation.email || null })
}
