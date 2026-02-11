'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { useAuth } from '@/components/auth-provider'
import { Header } from '@/components/header'
import { IdeaCard } from '@/components/idea-card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus, Lightbulb, AlertCircle } from 'lucide-react'

type IdeaRow = {
  id: string
  title: string
  description: string
  status: string
  created_at: string
  category: { name: string } | null
  author: { email: string } | null
  votes: { count: number }[]
}

export default function Home() {
  const { user, isLoading: authLoading } = useAuth()
  const [ideas, setIdeas] = useState<IdeaRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (authLoading || !user) return

    const supabase = createClient()
    supabase
      .from('ideas')
      .select('id, title, description, status, created_at, category:categories(name), author:profiles(email), votes(count)')
      .order('created_at', { ascending: false })
      .then(({ data, error: queryError }) => {
        if (queryError) {
          setError('Ideen konnten nicht geladen werden.')
        } else if (data) {
          setIdeas(data as unknown as IdeaRow[])
        }
        setIsLoading(false)
      })
  }, [authLoading, user])

  if (authLoading) {
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
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Ideen-Board</h2>
          <Button asChild>
            <Link href="/ideas/new">
              <Plus className="mr-1 h-4 w-4" />
              Neue Idee
            </Link>
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-white p-12 text-center">
            <AlertCircle className="mb-4 h-12 w-12 text-red-300" />
            <h3 className="text-lg font-medium text-gray-900">Fehler</h3>
            <p className="mt-1 text-sm text-gray-500">{error}</p>
          </div>
        ) : ideas.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-white p-12 text-center">
            <Lightbulb className="mb-4 h-12 w-12 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900">
              Noch keine Ideen
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Sei der Erste und reiche eine Idee ein!
            </p>
            <Button className="mt-4" asChild>
              <Link href="/ideas/new">
                <Plus className="mr-1 h-4 w-4" />
                Erste Idee einreichen
              </Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {ideas.map((idea) => (
              <IdeaCard
                key={idea.id}
                id={idea.id}
                title={idea.title}
                description={idea.description}
                status={idea.status}
                category={idea.category?.name ?? null}
                authorEmail={idea.author?.email ?? 'Unbekannt'}
                createdAt={idea.created_at}
                voteCount={idea.votes?.[0]?.count ?? 0}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
