'use client'

import { Header } from '@/components/header'
import { IdeaForm } from '@/components/idea-form'

export default function NewIdeaPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="mx-auto max-w-2xl px-4 py-8">
        <IdeaForm mode="create" />
      </main>
    </div>
  )
}
