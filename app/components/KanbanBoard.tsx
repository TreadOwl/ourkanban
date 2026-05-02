'use client'

import { useCallback, useMemo, useState } from 'react'
import { DragDropProvider } from '@dnd-kit/react'
import type { Column as ColumnType, DropPreview, Task } from '../types/kanban'
import Column from './Column'
import KanbanDragMonitor from './KanbanDragMonitor'
import { getDropDestination, getDropPreview, isSameDropPreview } from '../lib/kanban-dnd'
import type { DragEndSnapshot, DragSnapshot } from '../lib/kanban-dnd'
import { getOrderedColumnTasks, moveTaskToIndex, normalizeTaskIndexes } from '../lib/kanban-order'
import { updateBoard } from '../lib/board'
import { toast } from 'sonner'
import { customAlphabet } from 'nanoid'
import Link from 'next/link'
import HeartBackground from './HeartBackground'

const nanoid = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 8)

export default function KanbanBoard({
  initialCode,
  initialBoardData,
}: {
  initialCode: string
  initialBoardData: { columns: ColumnType[]; tasks: Task[] }
}) {
  const [columns, setColumns] = useState<ColumnType[]>(initialBoardData.columns)
  const [tasks, setTasks] = useState<Task[]>(() => normalizeTaskIndexes(initialBoardData.tasks))
  const [dropPreview, setDropPreview] = useState<DropPreview | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const [isAddingColumn, setIsAddingColumn] = useState(false)
  const [newColumnTitle, setNewColumnTitle] = useState('')
  const columnIds = useMemo(() => new Set(columns.map((column) => column.id)), [columns])

  const handleAddTask = (columnId: string, title: string) => {
    const newTaskId = nanoid()
    setTasks((prev) => {
      const newTask: Task = {
        id: newTaskId,
        columnId,
        title,
        index: getOrderedColumnTasks(prev, columnId).length,
      }

      return normalizeTaskIndexes([...prev, newTask])
    })
  }

  const handleDeleteTask = (taskId: string) => {
    setTasks((prev) => normalizeTaskIndexes(prev.filter((t) => t.id !== taskId)))
  }

  const handleRenameColumn = (columnId: string, newTitle: string) => {
    setColumns((prev) =>
      prev.map((col) => (col.id === columnId ? { ...col, title: newTitle } : col)),
    )
  }

  const handleDeleteColumn = (columnId: string) => {
    setColumns((prev) => prev.filter((col) => col.id !== columnId))
    setTasks((prev) => normalizeTaskIndexes(prev.filter((task) => task.columnId !== columnId)))
  }

  const submitNewColumn = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = newColumnTitle.trim()
    if (!trimmed) return

    const id = trimmed
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')

    if (columns.find((c) => c.id === id)) {
      toast.error('A column with a functionally identical name already exists.')
      return
    }

    setColumns((prev) => [...prev, { id, title: trimmed }])
    setNewColumnTitle('')
    setIsAddingColumn(false)
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const normalizedTasks = normalizeTaskIndexes(tasks)
      setTasks(normalizedTasks)
      await updateBoard(initialCode, { columns, tasks: normalizedTasks })
      toast.success('Changes saved!')
    } catch (err) {
      console.error('Save error:', err)
      toast.error('Failed to save changes.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCopyCode = () => {
    navigator.clipboard.writeText(initialCode)
    toast.success('Code copied to clipboard!')
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/board/${initialCode}`)
    toast.success('Link copied to clipboard!')
  }

  const handleDragMove = useCallback(
    (snapshot: DragSnapshot) => {
      const nextPreview = getDropPreview(tasks, snapshot)
      setDropPreview((currentPreview) =>
        isSameDropPreview(currentPreview, nextPreview) ? currentPreview : nextPreview,
      )
    },
    [tasks],
  )

  const handleDragEnd = useCallback(
    (snapshot: DragEndSnapshot) => {
      setDropPreview(null)

      if (snapshot.canceled) return

      setTasks((prevTasks) => {
        const destination = getDropDestination(prevTasks, snapshot, { validColumnIds: columnIds })

        return destination
          ? moveTaskToIndex(prevTasks, destination.taskId, destination.columnId, destination.index)
          : normalizeTaskIndexes(prevTasks)
      })
    },
    [columnIds],
  )

  return (
    <DragDropProvider>
      <KanbanDragMonitor onDragEnd={handleDragEnd} onDragMove={handleDragMove} />
      <div className="flex flex-col min-h-screen bg-background">
        <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between p-5 sm:px-12 bg-card border-b-2 border-foreground">
          <div className="flex items-center gap-4 mb-3 sm:mb-0">
            <Link href="/" className="font-bold text-foreground text-lg">
              Kanban Board
            </Link>
            <button
              onClick={handleCopyCode}
              className="px-3 py-1 text-sm font-semibold border-2 border-foreground text-foreground rounded-md hover:bg-foreground hover:text-background transition-colors"
            >
              Copy Code
            </button>
            <button
              onClick={handleCopyLink}
              className="px-3 py-1 text-sm font-semibold border-2 border-foreground text-foreground rounded-md hover:bg-foreground hover:text-background transition-colors"
            >
              Copy Link
            </button>
          </div>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-3 font-bold bg-foreground text-background rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        <div className="flex flex-col sm:flex-row h-full w-full overflow-y-auto sm:overflow-x-auto gap-4 p-2 sm:p-8 flex-1 items-center sm:items-start">
          <HeartBackground />
          {columns.map((column) => (
            <Column
              key={column.id}
              column={column}
              tasks={getOrderedColumnTasks(tasks, column.id)}
              dropPreview={dropPreview}
              onAddTask={handleAddTask}
              onDeleteTask={handleDeleteTask}
              onRenameColumn={handleRenameColumn}
              onDeleteColumn={handleDeleteColumn}
            />
          ))}

          <div className="w-87 shrink-0">
            {isAddingColumn ? (
              <form
                onSubmit={submitNewColumn}
                className="flex flex-col gap-2 p-4 rounded-2xl border-2 border-foreground bg-card"
              >
                <input
                  type="text"
                  autoFocus
                  placeholder="Column name..."
                  value={newColumnTitle}
                  onChange={(e) => setNewColumnTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') setIsAddingColumn(false)
                  }}
                  className="w-full p-3 rounded-xl border-2 border-foreground bg-background text-foreground placeholder-opacity-50 outline-none focus:ring-2 focus:ring-foreground"
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={!newColumnTitle.trim()}
                    className="flex-1 py-3 rounded-xl font-bold bg-foreground text-background disabled:opacity-50 hover:opacity-90 transition-opacity"
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAddingColumn(false)}
                    className="flex-1 py-3 rounded-xl font-bold border-2 border-foreground text-foreground hover:bg-foreground hover:text-background transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <button
                onClick={() => setIsAddingColumn(true)}
                className="w-full h-full min-h-30.5 rounded-2xl border-2 border-dashed border-foreground bg-transparent text-foreground opacity-70 hover:opacity-100 hover:bg-card transition-all font-bold text-lg flex items-center justify-center"
              >
                + Add Column
              </button>
            )}
          </div>
        </div>
      </div>
    </DragDropProvider>
  )
}
