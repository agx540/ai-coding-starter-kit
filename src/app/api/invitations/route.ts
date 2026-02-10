import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const CreateInvitationSchema = z.object({
  expires_in_days: z.number().min(1).max(30).optional().default(7),
})

// GET /api/invitations - List all invitations (admin only)
export async function GET() {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
  }

  // Check admin role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Nur Admins können Einladungen verwalten' }, { status: 403 })
  }

  const { data: invitations, error } = await supabase
    .from('invitations')
    .select('id, token, created_at, expires_at, redeemed_by, redeemed_at')
    .eq('created_by', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ invitations })
}

// POST /api/invitations - Create a new invitation (admin only)
export async function POST(request: Request) {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
  }

  // Check admin role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Nur Admins können Einladungen erstellen' }, { status: 403 })
  }

  // Validate input
  const body = await request.json().catch(() => ({}))
  const parsed = CreateInvitationSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Ungültige Eingabe', details: parsed.error.flatten() }, { status: 400 })
  }

  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + parsed.data.expires_in_days)

  const { data: invitation, error } = await supabase
    .from('invitations')
    .insert({
      created_by: user.id,
      expires_at: expiresAt.toISOString(),
    })
    .select('id, token, created_at, expires_at')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ invitation }, { status: 201 })
}
