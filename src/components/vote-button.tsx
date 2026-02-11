'use client'

import { useRef, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useAuth } from '@/components/auth-provider'
import { Button } from '@/components/ui/button'
import { ChevronUp } from 'lucide-react'
import { toast } from 'sonner'

type VoteButtonProps = {
  ideaId: string
  initialVoteCount: number
  size?: 'sm' | 'lg'
}

export function VoteButton({
  ideaId,
  initialVoteCount,
  size = 'sm',
}: VoteButtonProps) {
  const { user } = useAuth()
  const [voteCount, setVoteCount] = useState(initialVoteCount)
  const lastClickRef = useRef(0)

  async function handleVote(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()

    // Debounce: 300ms
    const now = Date.now()
    if (now - lastClickRef.current < 300) return
    lastClickRef.current = now

    // Optimistic update
    setVoteCount((prev) => prev + 1)

    const supabase = createClient()
    const { error } = await supabase.from('votes').insert({
      idea_id: ideaId,
      user_id: user!.id,
    })

    if (error) {
      // Rollback
      setVoteCount((prev) => prev - 1)

      if (error.code === '23503') {
        toast.error('Idee existiert nicht mehr.')
      } else if (error.code === '42501') {
        toast.error('Bitte melde dich an, um zu voten.')
      } else {
        toast.error('Fehler beim Voten. Bitte versuche es erneut.')
      }
    }
  }

  const isSmall = size === 'sm'

  return (
    <div className="flex flex-col items-center">
      <Button
        variant="ghost"
        size="icon"
        className={isSmall ? 'h-7 w-7' : 'h-9 w-9'}
        onClick={handleVote}
        aria-label="Upvote"
      >
        <ChevronUp className={isSmall ? 'h-4 w-4' : 'h-5 w-5'} />
      </Button>
      <span
        className={`font-semibold tabular-nums leading-none ${isSmall ? 'text-sm' : 'text-lg'}`}
      >
        {voteCount}
      </span>
    </div>
  )
}
