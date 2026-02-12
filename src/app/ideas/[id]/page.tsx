'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { useAuth } from '@/components/auth-provider'
import { Header } from '@/components/header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
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
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { VoteButton } from '@/components/vote-button'

function statusColor(status: string): string {
  switch (status) {
    case 'Offen':
      return 'border-transparent bg-gray-100 text-gray-700 hover:bg-gray-200'
    case 'Geplant':
      return 'border-transparent bg-blue-100 text-blue-700 hover:bg-blue-200'
    case 'In Arbeit':
      return 'border-transparent bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
    case 'Erledigt':
      return 'border-transparent bg-green-100 text-green-700 hover:bg-green-200'
    default:
      return 'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80'
  }
}

type Idea = {
  id: string
  title: string
  description: string
  status: string
  created_at: string
  updated_at: string
  author_id: string
  category: { name: string } | null
  author: { email: string } | null
  votes: { count: number }[]
}

export default function IdeaDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [idea, setIdea] = useState<Idea | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)

  const ideaId = params.id as string
  const isAuthor = user?.id === idea?.author_id

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('ideas')
      .select('*, category:categories(name), author:profiles(email), votes.count()')
      .eq('id', ideaId)
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          toast.error('Idee nicht gefunden.')
          router.push('/')
          return
        }
        setIdea(data as unknown as Idea)
        setIsLoading(false)
      })
  }, [ideaId, router])

  async function handleDelete() {
    setIsDeleting(true)
    const supabase = createClient()
    const { error } = await supabase.from('ideas').delete().eq('id', ideaId)

    if (error) {
      toast.error('Fehler beim Löschen der Idee.')
      setIsDeleting(false)
      return
    }

    toast.success('Idee wurde gelöscht.')
    router.push('/')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="mx-auto max-w-3xl px-4 py-8">
          <Skeleton className="h-6 w-24 mb-6" />
          <Skeleton className="h-[300px] w-full" />
        </main>
      </div>
    )
  }

  if (!idea) return null

  const createdAt = new Date(idea.created_at).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  const wasEdited = idea.updated_at !== idea.created_at
  const updatedAt = wasEdited
    ? new Date(idea.updated_at).toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Zurück zum Board
        </Link>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <VoteButton
                  ideaId={idea.id}
                  initialVoteCount={idea.votes?.[0]?.count ?? 0}
                  size="lg"
                />
                <div className="space-y-2">
                  <CardTitle className="text-xl">{idea.title}</CardTitle>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className={statusColor(idea.status)}>{idea.status}</Badge>
                    {idea.category && (
                      <Badge variant="outline">{idea.category.name}</Badge>
                    )}
                  </div>
                </div>
              </div>
              {isAuthor && (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/ideas/${ideaId}/edit`}>
                      <Pencil className="mr-1 h-4 w-4" />
                      Bearbeiten
                    </Link>
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm">
                        <Trash2 className="mr-1 h-4 w-4" />
                        Löschen
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Idee wirklich löschen?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          Diese Aktion kann nicht rückgängig gemacht werden. Die
                          Idee und alle zugehörigen Votes werden dauerhaft
                          gelöscht.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDelete}
                          disabled={isDeleting}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          {isDeleting ? 'Wird gelöscht...' : 'Endgültig löschen'}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="whitespace-pre-wrap text-gray-700">
              {idea.description}
            </p>
            <div className="border-t pt-4 text-sm text-gray-500">
              <p>
                Eingereicht von{' '}
                <span className="font-medium text-gray-700">
                  {idea.author?.email ?? 'Unbekannt'}
                </span>{' '}
                am {createdAt}
              </p>
              {updatedAt && (
                <p className="mt-1">Zuletzt bearbeitet am {updatedAt}</p>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
