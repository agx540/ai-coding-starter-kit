'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useAuth } from '@/components/auth-provider'
import { Header } from '@/components/header'
import { IdeaForm } from '@/components/idea-form'
import { Skeleton } from '@/components/ui/skeleton'

export default function EditIdeaPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [idea, setIdea] = useState<{
    title: string
    description: string
    category_id: string | null
    author_id: string
  } | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const ideaId = params.id as string

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('ideas')
      .select('title, description, category_id, author_id')
      .eq('id', ideaId)
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          router.push('/')
          return
        }
        setIdea(data)
        setIsLoading(false)
      })
  }, [ideaId, router])

  useEffect(() => {
    if (idea && user && idea.author_id !== user.id) {
      router.push(`/ideas/${ideaId}`)
    }
  }, [idea, user, ideaId, router])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="mx-auto max-w-2xl px-4 py-8">
          <Skeleton className="h-[400px] w-full" />
        </main>
      </div>
    )
  }

  if (!idea) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="mx-auto max-w-2xl px-4 py-8">
        <IdeaForm
          mode="edit"
          ideaId={ideaId}
          initialData={{
            title: idea.title,
            description: idea.description,
            category_id: idea.category_id,
          }}
        />
      </main>
    </div>
  )
}
