'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useAuth } from '@/components/auth-provider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

type Category = {
  id: string
  name: string
}

type IdeaFormProps = {
  mode: 'create' | 'edit'
  ideaId?: string
  initialData?: {
    title: string
    description: string
    category_id: string | null
  }
}

export function IdeaForm({ mode, ideaId, initialData }: IdeaFormProps) {
  const router = useRouter()
  const { user } = useAuth()
  const [title, setTitle] = useState(initialData?.title ?? '')
  const [description, setDescription] = useState(initialData?.description ?? '')
  const [categoryId, setCategoryId] = useState<string>(initialData?.category_id ?? '')
  const [categories, setCategories] = useState<Category[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<{ title?: string; description?: string }>({})

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('categories')
      .select('id, name')
      .order('name')
      .then(({ data }) => {
        if (data) setCategories(data)
      })
  }, [])

  function validate(): boolean {
    const newErrors: { title?: string; description?: string } = {}

    if (!title.trim()) {
      newErrors.title = 'Titel ist erforderlich.'
    } else if (title.length > 100) {
      newErrors.title = 'Titel darf maximal 100 Zeichen lang sein.'
    }

    if (!description.trim()) {
      newErrors.description = 'Beschreibung ist erforderlich.'
    } else if (description.length > 2000) {
      newErrors.description = 'Beschreibung darf maximal 2000 Zeichen lang sein.'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate() || !user) return

    setIsSubmitting(true)

    const supabase = createClient()
    const ideaData = {
      title: title.trim(),
      description: description.trim(),
      category_id: categoryId && categoryId !== 'none' ? categoryId : null,
    }

    if (mode === 'create') {
      const { error } = await supabase
        .from('ideas')
        .insert({ ...ideaData, author_id: user.id })

      if (error) {
        toast.error('Fehler beim Einreichen der Idee.')
        setIsSubmitting(false)
        return
      }

      toast.success('Idee erfolgreich eingereicht!')
      router.push('/')
    } else {
      const { error } = await supabase
        .from('ideas')
        .update(ideaData)
        .eq('id', ideaId!)

      if (error) {
        toast.error('Fehler beim Speichern der Änderungen.')
        setIsSubmitting(false)
        return
      }

      toast.success('Idee erfolgreich aktualisiert!')
      router.push(`/ideas/${ideaId}`)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {mode === 'create' ? 'Neue Idee einreichen' : 'Idee bearbeiten'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="title">Titel *</Label>
              <span className="text-xs text-gray-500">
                {title.length}/100
              </span>
            </div>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
              placeholder="Kurzer, aussagekräftiger Titel"
            />
            {errors.title && (
              <p className="text-sm text-red-600">{errors.title}</p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="description">Beschreibung *</Label>
              <span className="text-xs text-gray-500">
                {description.length}/2000
              </span>
            </div>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={2000}
              rows={6}
              placeholder="Beschreibe deine Idee im Detail..."
            />
            {errors.description && (
              <p className="text-sm text-red-600">{errors.description}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Kategorie (optional)</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger>
                <SelectValue placeholder="Kategorie wählen..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Keine Kategorie</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-3">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? mode === 'create'
                  ? 'Wird eingereicht...'
                  : 'Wird gespeichert...'
                : mode === 'create'
                  ? 'Einreichen'
                  : 'Speichern'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Abbrechen
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
