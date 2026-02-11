'use client'

import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const CATEGORIES = ['Alle', 'Feature', 'Bugfix', 'Verbesserung'] as const
const STATUSES = ['Alle', 'Offen', 'Geplant', 'In Arbeit', 'Erledigt'] as const

const SORT_OPTIONS = [
  { value: 'votes', label: 'Meiste Votes' },
  { value: 'newest', label: 'Neueste zuerst' },
  { value: 'oldest', label: 'Älteste zuerst' },
] as const

export type SortOption = (typeof SORT_OPTIONS)[number]['value']

type FilterBarProps = {
  selectedCategory: string | null
  selectedStatus: string | null
  sortBy: SortOption
  onCategoryChange: (category: string | null) => void
  onStatusChange: (status: string | null) => void
  onSortChange: (sort: SortOption) => void
}

export function FilterBar({
  selectedCategory,
  selectedStatus,
  sortBy,
  onCategoryChange,
  onStatusChange,
  onSortChange,
}: FilterBarProps) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="shrink-0 text-sm font-medium text-gray-500">
          Kategorie:
        </span>
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((cat) => {
            const isActive =
              cat === 'Alle'
                ? selectedCategory === null
                : selectedCategory === cat
            return (
              <Button
                key={cat}
                variant={isActive ? 'default' : 'outline'}
                size="sm"
                className="h-7 text-xs"
                onClick={() => onCategoryChange(cat === 'Alle' ? null : cat)}
              >
                {cat}
              </Button>
            )
          })}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="shrink-0 text-sm font-medium text-gray-500">
          Status:
        </span>
        <div className="flex flex-wrap gap-1.5">
          {STATUSES.map((status) => {
            const isActive =
              status === 'Alle'
                ? selectedStatus === null
                : selectedStatus === status
            return (
              <Button
                key={status}
                variant={isActive ? 'default' : 'outline'}
                size="sm"
                className="h-7 text-xs"
                onClick={() =>
                  onStatusChange(status === 'Alle' ? null : status)
                }
              >
                {status}
              </Button>
            )
          })}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="shrink-0 text-sm font-medium text-gray-500">
          Sortierung:
        </span>
        <Select
          value={sortBy}
          onValueChange={(v) => onSortChange(v as SortOption)}
        >
          <SelectTrigger className="h-8 w-48 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
