import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

// Helper: verify admin role
async function verifyAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') return null
  return user
}

// POST /api/invitations/[id]/resend - Resend an expired invitation (admin only)
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const user = await verifyAdmin(supabase)
  if (!user) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 403 })
  }

  // Fetch the existing invitation
  const { data: existing, error: fetchError } = await supabase
    .from('invitations')
    .select('id, email, redeemed_by, expires_at')
    .eq('id', id)
    .single()

  if (fetchError || !existing) {
    return NextResponse.json({ error: 'Einladung nicht gefunden' }, { status: 404 })
  }

  if (existing.redeemed_by) {
    return NextResponse.json({ error: 'Diese Einladung wurde bereits eingelöst.' }, { status: 400 })
  }

  // Delete old invitation and create new one with same email
  const { error: deleteError } = await supabase
    .from('invitations')
    .delete()
    .eq('id', id)

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 })
  }

  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7)

  const { data: invitation, error: createError } = await supabase
    .from('invitations')
    .insert({
      email: existing.email,
      created_by: user.id,
      expires_at: expiresAt.toISOString(),
    })
    .select('id, token, email, created_at, expires_at')
    .single()

  if (createError) {
    return NextResponse.json({ error: createError.message }, { status: 500 })
  }

  return NextResponse.json({ invitation }, { status: 201 })
}

// DELETE /api/invitations/[id] - Delete an invitation (admin only)
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const user = await verifyAdmin(supabase)
  if (!user) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 403 })
  }

  const { error } = await supabase
    .from('invitations')
    .delete()
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
