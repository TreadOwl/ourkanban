'use client'

import { useState, useMemo } from 'react'
import {
  DragDropProvider,
  DragOverlay,
  DragEndEvent,
  DragStartEvent,
  DragOverEvent,
} from '@dnd-kit/react'
import { Column as ColumnType, Task } from '../types/kanban'
import Column from './Column'
import TaskCard from './TaskCard'
import { updateBoard } from '../lib/board'
import { toast } from 'sonner'
import { customAlphabet } from 'nanoid'
import Link from 'next/link'
import HeartBackground from './HeartBackground'

const nanoid = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 8)

function reorderTasks(
  tasks: Task[],
  movingId: string,
  targetColumnId: string,
  insertBeforeId: string | null,
): Task[] {
  const movingTask = tasks.find((t) => t.id === movingId)
  if (!movingTask) return tasks

  const sourceColumnId = movingTask.columnId
  const rest = tasks.filter((t) => t.id !== movingId)

  const destSorted = rest
    .filter((t) => t.columnId === targetColumnId)
    .sort((a, b) => a.index - b.index)

  const insertAt = insertBeforeId ? destSorted.findIndex((t) => t.id === insertBeforeId) : -1
  destSorted.splice(insertAt === -1 ? destSorted.length : insertAt, 0, {
    ...movingTask,
    columnId: targetColumnId,
  })

  const reindexedDest = destSorted.map((t, i) => ({ ...t, index: i }))

  const reindexedSource =
    sourceColumnId !== targetColumnId
      ? rest
          .filter((t) => t.columnId === sourceColumnId)
          .sort((a, b) => a.index - b.index)
          .map((t, i) => ({ ...t, index: i }))
      : []

  const others = rest.filter((t) => t.columnId !== targetColumnId && t.columnId !== sourceColumnId)

  return [...others, ...reindexedDest, ...reindexedSource]
}

export default function KanbanBoard({
  initialCode,
  initialBoardData,
}: {
  initialCode: string
  initialBoardData: { columns: ColumnType[]; tasks: Task[] }
}) {
  const [columns, setColumns] = useState<ColumnType[]>(initialBoardData.columns)
  const [tasks, setTasks] = useState<Task[]>(initialBoardData.tasks)
  const [isSaving, setIsSaving] = useState(false)

  const [isAddingColumn, setIsAddingColumn] = useState(false)
  const [newColumnTitle, setNewColumnTitle] = useState('')
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [overTaskId, setOverTaskId] = useState<string | null>(null)
  const [overEndColumnId, setOverEndColumnId] = useState<string | null>(null)

  const handleAddTask = (columnId: string, title: string) => {
    const newTask: Task = {
      id: nanoid(),
      columnId,
      title,
      index: tasks.filter((t) => t.columnId === columnId).length,
    }
    setTasks((prev) => [...prev, newTask])
  }

  const handleDeleteTask = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId))
  }

  const handleRenameColumn = (columnId: string, newTitle: string) => {
    setColumns((prev) =>
      prev.map((col) => (col.id === columnId ? { ...col, title: newTitle } : col)),
    )
  }

  const handleDeleteColumn = (columnId: string) => {
    setColumns((prev) => prev.filter((col) => col.id !== columnId))
    setTasks((prev) => prev.filter((task) => task.columnId !== columnId))
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
      await updateBoard(initialCode, { columns, tasks })
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

  const tasksByColumn = useMemo(() => {
    const map = new Map<string, Task[]>()
    for (const col of columns) map.set(col.id, [])
    for (const task of tasks) map.get(task.columnId)?.push(task)
    for (const arr of map.values()) arr.sort((a, b) => a.index - b.index)
    return map
  }, [tasks, columns])

  const handleDragStart = (event: DragStartEvent) => {
    const id = String(event.operation.source?.id ?? '').replace('task-', '')
    setActiveTask(tasks.find((t) => t.id === id) ?? null)
  }

  const handleDragOver = (event: DragOverEvent) => {
    const targetId = String(event.operation.target?.id ?? '')
    const newOverTaskId = targetId.startsWith('task-') ? targetId.replace('task-', '') : null
    const newOverEndColId = targetId.startsWith('end-') ? targetId.replace('end-', '') : null
    if (newOverTaskId === overTaskId && newOverEndColId === overEndColumnId) return
    setOverTaskId(newOverTaskId)
    setOverEndColumnId(newOverEndColId)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { operation, canceled } = event
    const draggingTask = activeTask
    setActiveTask(null)
    setOverTaskId(null)
    setOverEndColumnId(null)

    if (canceled || !draggingTask) return

    const targetId = String(operation.target?.id ?? '')

    if (targetId.startsWith('task-')) {
      const insertBeforeId = targetId.replace('task-', '')
      if (insertBeforeId === draggingTask.id) return
      setTasks((prev) => {
        const targetTask = prev.find((t) => t.id === insertBeforeId)
        if (!targetTask) return prev
        return reorderTasks(prev, draggingTask.id, targetTask.columnId, insertBeforeId)
      })
    } else if (targetId.startsWith('end-')) {
      const colId = targetId.replace('end-', '')
      setTasks((prev) => reorderTasks(prev, draggingTask.id, colId, null))
    }
  }

  return (
    <DragDropProvider
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div
        className="flex flex-col min-h-screen"
        style={{
          background: 'linear-gradient(to bottom, var(--background) 66%, var(--card) 100%)',
        }}
      >
        <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between p-5 sm:px-12 bg-card border-b-2 border-foreground">
          <div className="flex items-center gap-4 mb-3 sm:mb-0">
            <Link
              href="/"
              className="font-bold text-foreground text-xl mt-3 rounded-md hover:underline"
            >
              Our Kanban
            </Link>
            <button
              onClick={handleCopyCode}
              className="px-3 py-2 text-sm font-semibold border-2 border-foreground text-foreground rounded-md hover:bg-foreground hover:text-background transition-colors"
            >
              Copy Code
            </button>
            <button
              onClick={handleCopyLink}
              className="px-3 py-2 text-sm font-semibold border-2 border-foreground text-foreground rounded-md hover:bg-foreground hover:text-background transition-colors"
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
              tasks={tasksByColumn.get(column.id) ?? []}
              activeTaskId={activeTask?.id}
              insertBeforeTaskId={overTaskId}
              isAppendTarget={overEndColumnId === column.id}
              onAddTask={handleAddTask}
              onDeleteTask={handleDeleteTask}
              onRenameColumn={handleRenameColumn}
              onDeleteColumn={handleDeleteColumn}
            />
          ))}

          {/* Add Column Wrapper */}
          <div className="w-[348px] shrink-0">
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
                className="w-full h-full min-h-[122px] rounded-2xl border-2 border-dashed border-foreground bg-transparent text-foreground opacity-70 hover:opacity-100 hover:bg-card transition-all font-bold text-lg flex items-center justify-center"
              >
                + Add Column
              </button>
            )}
          </div>
        </div>
      </div>
      <DragOverlay>
        {(source) => {
          const task = source.data as Task
          if (!task?.id) return null
          return <TaskCard task={task} isOverlay />
        }}
      </DragOverlay>
    </DragDropProvider>
  )
}
