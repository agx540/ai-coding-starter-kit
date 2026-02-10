'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

type IdeaCardProps = {
  id: string
  title: string
  description: string
  status: string
  category: string | null
  authorEmail: string
  createdAt: string
}

export function IdeaCard({
  id,
  title,
  description,
  status,
  category,
  authorEmail,
  createdAt,
}: IdeaCardProps) {
  const date = new Date(createdAt).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })

  return (
    <Link href={`/ideas/${id}`}>
      <Card className="transition-shadow hover:shadow-md">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-base leading-snug">{title}</CardTitle>
            <div className="flex shrink-0 gap-1.5">
              <Badge variant="secondary" className="text-xs">
                {status}
              </Badge>
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
      </Card>
    </Link>
  )
}
