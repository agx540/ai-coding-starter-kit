'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth-provider'
import { Header } from '@/components/header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { Mail, RefreshCw, Trash2, Copy, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

type Invitation = {
  id: string
  token: string
  email: string | null
  created_at: string
  expires_at: string
  redeemed_by: string | null
  redeemed_at: string | null
}

type InvitationStatus = 'pending' | 'accepted' | 'expired'

function getStatus(inv: Invitation): InvitationStatus {
  if (inv.redeemed_by) return 'accepted'
  if (new Date(inv.expires_at) < new Date()) return 'expired'
  return 'pending'
}

function StatusBadge({ status }: { status: InvitationStatus }) {
  switch (status) {
    case 'pending':
      return <Badge variant="outline" className="border-yellow-300 bg-yellow-50 text-yellow-700">Ausstehend</Badge>
    case 'accepted':
      return <Badge variant="outline" className="border-green-300 bg-green-50 text-green-700">Angenommen</Badge>
    case 'expired':
      return <Badge variant="outline" className="border-red-300 bg-red-50 text-red-700">Abgelaufen</Badge>
  }
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function AdminInvitationsPage() {
  const { user, isAdmin, isLoading: authLoading } = useAuth()
  const router = useRouter()

  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [formError, setFormError] = useState('')
  const [resendingId, setResendingId] = useState<string | null>(null)

  const fetchInvitations = useCallback(async () => {
    const res = await fetch('/api/invitations')
    if (res.ok) {
      const data = await res.json()
      setInvitations(data.invitations)
    }
    setIsLoading(false)
  }, [])

  useEffect(() => {
    if (authLoading) return
    if (!user || !isAdmin) {
      router.push('/')
      return
    }
    fetchInvitations()
  }, [user, isAdmin, authLoading, router, fetchInvitations])

  const handleSendInvitation = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')

    if (!email.trim()) {
      setFormError('Bitte gib eine Email-Adresse ein.')
      return
    }

    setIsSending(true)

    try {
      const res = await fetch('/api/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })

      const data = await res.json()

      if (!res.ok) {
        setFormError(data.error || 'Einladung konnte nicht erstellt werden.')
        setIsSending(false)
        return
      }

      toast.success(`Einladung an ${email} erstellt!`)
      setEmail('')
      setIsSending(false)
      fetchInvitations()
    } catch {
      setFormError('Einladung konnte nicht erstellt werden.')
      setIsSending(false)
    }
  }

  const handleResend = async (id: string) => {
    setResendingId(id)
    try {
      const res = await fetch(`/api/invitations/${id}`, {
        method: 'POST',
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Erneut senden fehlgeschlagen.')
        setResendingId(null)
        return
      }

      toast.success('Einladung erneut gesendet!')
      setResendingId(null)
      fetchInvitations()
    } catch {
      toast.error('Erneut senden fehlgeschlagen.')
      setResendingId(null)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/invitations/${id}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error || 'Löschen fehlgeschlagen.')
        return
      }

      toast.success('Einladung gelöscht.')
      fetchInvitations()
    } catch {
      toast.error('Löschen fehlgeschlagen.')
    }
  }

  const copyInviteLink = (token: string) => {
    const url = `${window.location.origin}/register?token=${token}`
    navigator.clipboard.writeText(url)
    toast.success('Einladungslink kopiert!')
  }

  if (authLoading || (!user && !authLoading)) {
    return (
      <>
        <Header />
        <main className="mx-auto max-w-5xl px-4 py-8">
          <Skeleton className="h-8 w-64 mb-6" />
          <Skeleton className="h-40 w-full mb-6" />
          <Skeleton className="h-64 w-full" />
        </main>
      </>
    )
  }

  return (
    <>
      <Header />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Zurück zum Board
          </Link>
          <h2 className="text-2xl font-bold">Einladungen verwalten</h2>
          <p className="text-gray-500 mt-1">
            Lade neue Nutzer per Email zum Voting Board ein.
          </p>
        </div>

        {/* Invitation Form */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg">Neue Einladung</CardTitle>
            <CardDescription>
              Gib die Email-Adresse des Nutzers ein, den du einladen möchtest.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSendInvitation} className="flex gap-3 items-end">
              <div className="flex-1 space-y-2">
                <Label htmlFor="invite-email">Email-Adresse</Label>
                <Input
                  id="invite-email"
                  type="email"
                  placeholder="nutzer@beispiel.de"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    setFormError('')
                  }}
                  required
                  autoComplete="off"
                />
              </div>
              <Button type="submit" disabled={isSending}>
                <Mail className="mr-2 h-4 w-4" />
                {isSending ? 'Wird gesendet...' : 'Einladung senden'}
              </Button>
            </form>
            {formError && (
              <div className="mt-3 rounded-md bg-red-50 p-3 text-sm text-red-600">
                {formError}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Invitations List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Gesendete Einladungen</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : invitations.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Mail className="mx-auto h-10 w-10 mb-3 text-gray-300" />
                <p>Noch keine Einladungen versendet.</p>
                <p className="text-sm mt-1">Nutze das Formular oben, um jemanden einzuladen.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Gesendet am</TableHead>
                    <TableHead className="text-right">Aktionen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invitations.map((inv) => {
                    const status = getStatus(inv)
                    return (
                      <TableRow key={inv.id}>
                        <TableCell className="font-medium">
                          {inv.email || <span className="text-gray-400 italic">Keine Email</span>}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={status} />
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {formatDate(inv.created_at)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {status === 'pending' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyInviteLink(inv.token)}
                                title="Link kopieren"
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                            )}
                            {status === 'expired' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleResend(inv.id)}
                                disabled={resendingId === inv.id}
                              >
                                <RefreshCw className={`mr-1 h-4 w-4 ${resendingId === inv.id ? 'animate-spin' : ''}`} />
                                {resendingId === inv.id ? 'Sende...' : 'Erneut senden'}
                              </Button>
                            )}
                            {status !== 'accepted' && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Einladung löschen?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Die Einladung an {inv.email || 'diesen Nutzer'} wird unwiderruflich gelöscht.
                                      Der Einladungslink wird ungültig.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDelete(inv.id)}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      Löschen
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </>
  )
}
