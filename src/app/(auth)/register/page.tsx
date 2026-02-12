'use client'

import { Suspense, useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
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
  const [emailFromToken, setEmailFromToken] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isValidatingToken, setIsValidatingToken] = useState(false)

  // When token is present, validate it and prefill email
  useEffect(() => {
    if (!tokenFromUrl) return

    const validateToken = async () => {
      setIsValidatingToken(true)
      try {
        const res = await fetch('/api/register/validate-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: tokenFromUrl }),
        })
        const data = await res.json()
        if (res.ok && data.email) {
          setEmail(data.email)
          setEmailFromToken(true)
        } else if (!res.ok) {
          setError(data.error || 'Ungültiger Einladungscode.')
        }
      } catch {
        // Token validation failed silently - user can still enter email manually
      }
      setIsValidatingToken(false)
    }

    validateToken()
  }, [tokenFromUrl])

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

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: token.trim(), email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Registrierung fehlgeschlagen. Bitte versuche es erneut.')
        setIsLoading(false)
        return
      }

      // Registration successful — redirect to login
      window.location.href = '/login?registered=true'
    } catch {
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
              readOnly={!!tokenFromUrl}
              className={tokenFromUrl ? 'bg-gray-50' : ''}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            {isValidatingToken ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <Input
                id="email"
                type="email"
                placeholder="name@beispiel.de"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                readOnly={emailFromToken}
                className={emailFromToken ? 'bg-gray-50' : ''}
                autoComplete="email"
              />
            )}
            {emailFromToken && (
              <p className="text-xs text-gray-500">
                Email-Adresse aus der Einladung vorausgefüllt.
              </p>
            )}
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
          <Button type="submit" className="w-full" disabled={isLoading || isValidatingToken}>
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
