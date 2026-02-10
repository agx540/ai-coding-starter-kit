'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

function RegisterForm() {
  const searchParams = useSearchParams()
  const tokenFromUrl = searchParams.get('token') ?? ''

  const [token, setToken] = useState(tokenFromUrl)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!token.trim()) {
      setError('Bitte gib deinen Einladungscode ein.')
      return
    }

    if (password.length < 8) {
      setError('Das Passwort muss mindestens 8 Zeichen lang sein.')
      return
    }

    if (password !== confirmPassword) {
      setError('Die Passwörter stimmen nicht überein.')
      return
    }

    setIsLoading(true)

    const supabase = createClient()

    // Validate invitation token
    const { data: invitation, error: tokenError } = await supabase
      .from('invitations')
      .select('id, expires_at, redeemed_by')
      .eq('token', token.trim())
      .single()

    if (tokenError || !invitation) {
      setError('Ungültiger Einladungscode.')
      setIsLoading(false)
      return
    }

    if (invitation.redeemed_by) {
      setError('Dieser Einladungscode wurde bereits verwendet.')
      setIsLoading(false)
      return
    }

    if (new Date(invitation.expires_at) < new Date()) {
      setError(
        'Dieser Einladungscode ist abgelaufen. Bitte fordere einen neuen an.'
      )
      setIsLoading(false)
      return
    }

    // Sign up
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    })

    if (signUpError) {
      if (signUpError.message.includes('already registered')) {
        setError('Diese Email-Adresse ist bereits registriert.')
      } else {
        setError('Registrierung fehlgeschlagen. Bitte versuche es erneut.')
      }
      setIsLoading(false)
      return
    }

    // Mark invitation as redeemed
    if (data.user) {
      await supabase
        .from('invitations')
        .update({ redeemed_by: data.user.id })
        .eq('id', invitation.id)
    }

    if (data.session) {
      window.location.href = '/'
    } else {
      setError('Registrierung fehlgeschlagen. Bitte versuche es erneut.')
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Konto erstellen</CardTitle>
        <CardDescription>
          Registriere dich mit deinem Einladungscode
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="token">Einladungscode</Label>
            <Input
              id="token"
              type="text"
              placeholder="Dein Einladungscode"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="name@beispiel.de"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Passwort</Label>
            <Input
              id="password"
              type="password"
              placeholder="Mindestens 8 Zeichen"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Passwort bestätigen</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Wird registriert...' : 'Registrieren'}
          </Button>
          <span className="text-center text-sm text-gray-500">
            Bereits ein Konto?{' '}
            <Link href="/login" className="text-blue-600 hover:underline">
              Einloggen
            </Link>
          </span>
        </CardFooter>
      </form>
    </Card>
  )
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <Card>
          <CardHeader className="text-center">
            <Skeleton className="mx-auto h-8 w-48" />
            <Skeleton className="mx-auto h-4 w-64 mt-2" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      }
    >
      <RegisterForm />
    </Suspense>
  )
}
