'use client'

import { useEffect, useState, use } from 'react'
import { getBoard } from '../../lib/board'
import KanbanBoard from '../../components/KanbanBoard'
import Link from 'next/link'
import { toast } from 'sonner'
import { Column, Task } from '../../types/kanban'

interface BoardPageProps {
  params: Promise<{ code: string }>
}

export default function BoardPage(props: BoardPageProps) {
  const params = use(props.params)
  const code = params.code

  const [isLoading, setIsLoading] = useState(true)
  const [boardData, setBoardData] = useState<{ columns: Column[]; tasks: Task[] } | null>(null)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    let active = true

    async function load() {
      try {
        const result = await getBoard(code)
        if (!active) return

        if (!result) {
          setNotFound(true)
        } else {
          setBoardData(result.data)
          toast.success('Board loaded!')
        }
      } catch (err) {
        console.error(err)
        if (active) setNotFound(true)
      } finally {
        if (active) setIsLoading(false)
      }
    }

    load()

    return () => {
      active = false
    }
  }, [code])

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-xl font-bold animate-pulse text-foreground">Loading Board...</div>
      </div>
    )
  }

  if (notFound || !boardData) {
    return (
      <div className="flex flex-col h-screen items-center justify-center bg-background text-center p-8 gap-4">
        <h1 className="text-3xl font-bold text-foreground">Board not found</h1>
        <p className="text-lg opacity-80 mb-4 text-foreground">Code: {code}</p>
        <Link
          href="/"
          className="px-6 py-3 font-bold bg-foreground text-background rounded-xl hover:opacity-90 transition-opacity"
        >
          Back to Home
        </Link>
      </div>
    )
  }

  return <KanbanBoard initialCode={code} initialBoardData={boardData} />
}
