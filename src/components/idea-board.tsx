'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { IdeaCard } from '@/components/idea-card'
import { FilterBar, type SortOption } from '@/components/filter-bar'
import { Button } from '@/components/ui/button'
import { Lightbulb, Plus, SearchX } from 'lucide-react'

export type IdeaRow = {
  id: string
  title: string
  description: string
  status: string
  created_at: string
  category: { name: string } | null
  author: { email: string } | null
  votes: { count: number }[]
}

const PAGE_SIZE = 20

type IdeaBoardProps = {
  initialIdeas: IdeaRow[]
}

export function IdeaBoard({ initialIdeas }: IdeaBoardProps) {
  const [ideas, setIdeas] = useState<IdeaRow[]>(initialIdeas)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<SortOption>('votes')
  const [currentPage, setCurrentPage] = useState(1)

  const handleCategoryChange = useCallback((category: string | null) => {
    setSelectedCategory(category)
    setCurrentPage(1)
  }, [])

  const handleStatusChange = useCallback((status: string | null) => {
    setSelectedStatus(status)
    setCurrentPage(1)
  }, [])

  const handleSortChange = useCallback((sort: SortOption) => {
    setSortBy(sort)
    setCurrentPage(1)
  }, [])

  // Filter & Sort
  const filteredAndSorted = useMemo(() => {
    let result = [...ideas]

    if (selectedCategory) {
      result = result.filter(
        (idea) => idea.category?.name === selectedCategory
      )
    }

    if (selectedStatus) {
      result = result.filter((idea) => idea.status === selectedStatus)
    }

    result.sort((a, b) => {
      if (sortBy === 'votes') {
        return (b.votes?.[0]?.count ?? 0) - (a.votes?.[0]?.count ?? 0)
      }
      if (sortBy === 'newest') {
        return (
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
      }
      return (
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      )
    })

    return result
  }, [ideas, selectedCategory, selectedStatus, sortBy])

  // Pagination
  const totalPages = Math.max(
    1,
    Math.ceil(filteredAndSorted.length / PAGE_SIZE)
  )
  const paginatedIdeas = filteredAndSorted.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  )

  // Supabase Realtime
  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel('idea-board')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'ideas' },
        async (payload) => {
          const { data } = await supabase
            .from('ideas')
            .select(
              'id, title, description, status, created_at, category:categories(name), author:profiles(email), votes.count()'
            )
            .eq('id', payload.new.id)
            .single()
          if (data) {
            setIdeas((prev) => [data as unknown as IdeaRow, ...prev])
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'ideas' },
        async (payload) => {
          const { data } = await supabase
            .from('ideas')
            .select(
              'id, title, description, status, created_at, category:categories(name), author:profiles(email), votes.count()'
            )
            .eq('id', payload.new.id)
            .single()
          if (data) {
            setIdeas((prev) =>
              prev.map((idea) =>
                idea.id === payload.new.id
                  ? (data as unknown as IdeaRow)
                  : idea
              )
            )
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'ideas' },
        (payload) => {
          setIdeas((prev) =>
            prev.filter((idea) => idea.id !== payload.old.id)
          )
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'votes' },
        (payload) => {
          setIdeas((prev) =>
            prev.map((idea) =>
              idea.id === payload.new.idea_id
                ? {
                    ...idea,
                    votes: [{ count: (idea.votes?.[0]?.count ?? 0) + 1 }],
                  }
                : idea
            )
          )
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const filterBar = (
    <FilterBar
      selectedCategory={selectedCategory}
      selectedStatus={selectedStatus}
      sortBy={sortBy}
      onCategoryChange={handleCategoryChange}
      onStatusChange={handleStatusChange}
      onSortChange={handleSortChange}
    />
  )

  // No ideas at all → Empty State with CTA
  if (ideas.length === 0) {
    return (
      <div>
        {filterBar}
        <div className="mt-8 flex flex-col items-center justify-center rounded-lg border border-dashed bg-white p-12 text-center">
          <Lightbulb className="mb-4 h-12 w-12 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900">
            Noch keine Ideen — sei der Erste!
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Reiche die erste Idee ein und starte die Diskussion.
          </p>
          <Button className="mt-4" asChild>
            <Link href="/ideas/new">
              <Plus className="mr-1 h-4 w-4" />
              Erste Idee einreichen
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  // Filter returns no results
  if (filteredAndSorted.length === 0) {
    return (
      <div>
        {filterBar}
        <div className="mt-8 flex flex-col items-center justify-center rounded-lg border border-dashed bg-white p-12 text-center">
          <SearchX className="mb-4 h-12 w-12 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900">
            Keine Ideen gefunden
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Keine Ideen in dieser Kategorie/Status.
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => {
              setSelectedCategory(null)
              setSelectedStatus(null)
              setCurrentPage(1)
            }}
          >
            Filter zurücksetzen
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div>
      {filterBar}

      <div className="mt-6 space-y-3">
        {paginatedIdeas.map((idea) => (
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

      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => p - 1)}
          >
            Zurück
          </Button>
          <span className="text-sm text-gray-500">
            Seite {currentPage} von {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => p + 1)}
          >
            Weiter
          </Button>
        </div>
      )}
    </div>
  )
}
