'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { VoteButton } from '@/components/vote-button'

type IdeaCardProps = {
  id: string
  title: string
  description: string
  status: string
  category: string | null
  authorEmail: string
  createdAt: string
  voteCount: number
}

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

export function IdeaCard({
  id,
  title,
  description,
  status,
  category,
  authorEmail,
  createdAt,
  voteCount,
}: IdeaCardProps) {
  const date = new Date(createdAt).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })

  return (
    <Card className="flex transition-shadow hover:shadow-md">
      <div className="flex items-center border-r px-3">
        <VoteButton ideaId={id} initialVoteCount={voteCount} />
      </div>
      <Link href={`/ideas/${id}`} className="min-w-0 flex-1">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-base leading-snug">{title}</CardTitle>
            <div className="flex shrink-0 gap-1.5">
              <Badge className={statusColor(status)}>{status}</Badge>
              {category && (
                <Badge variant="outline" className="text-xs">
                  {category}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="line-clamp-2 text-sm text-gray-600">{description}</p>
          <p className="mt-3 text-xs text-gray-400">
            {authorEmail} &middot; {date}
          </p>
        </CardContent>
      </Link>
    </Card>
  )
}
