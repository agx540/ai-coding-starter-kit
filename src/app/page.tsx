import Link from 'next/link'
import { createClient } from '@/lib/supabase-server'
import { Header } from '@/components/header'
import { IdeaBoard, type IdeaRow } from '@/components/idea-board'
import { Button } from '@/components/ui/button'
import { Plus, AlertCircle } from 'lucide-react'

export default async function Home() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('ideas')
    .select(
      'id, title, description, status, created_at, category:categories(name), author:profiles(email), votes.count()'
    )
    .order('created_at', { ascending: false })

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

        {error ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-white p-12 text-center">
            <AlertCircle className="mb-4 h-12 w-12 text-red-300" />
            <h3 className="text-lg font-medium text-gray-900">Fehler</h3>
            <p className="mt-1 text-sm text-gray-500">
              Ideen konnten nicht geladen werden.
            </p>
          </div>
        ) : (
          <IdeaBoard
            initialIdeas={(data as unknown as IdeaRow[]) ?? []}
          />
        )}
      </main>
    </div>
  )
}
