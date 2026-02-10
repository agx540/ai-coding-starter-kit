'use client'

import { useAuth } from '@/components/auth-provider'
import { Header } from '@/components/header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export default function Home() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="border-b bg-white">
          <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
        </div>
        <main className="mx-auto max-w-5xl px-4 py-8">
          <Skeleton className="h-8 w-64 mb-6" />
          <Skeleton className="h-40 w-full" />
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <h2 className="mb-6 text-2xl font-semibold">Dashboard</h2>
        <Card>
          <CardHeader>
            <CardTitle>Willkommen beim Voting Board</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              Eingeloggt als{' '}
              <span className="font-medium text-gray-900">{user?.email}</span>
            </p>
            <p className="mt-2 text-sm text-gray-500">
              Das Voting Board wird in den nächsten Features implementiert.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
