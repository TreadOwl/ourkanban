'use client'

import { useState, useRef, useEffect, Fragment } from 'react'
import { useDroppable } from '@dnd-kit/react'
import { Column as ColumnType, Task } from '../types/kanban'
import TaskCard from './TaskCard'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { cn } from '../lib/utils'

function AppendZone({ columnId, isEmpty }: { columnId: string; isEmpty: boolean }) {
  const { ref, isDropTarget } = useDroppable({ id: `end-${columnId}` })
  return (
    <div ref={ref} className={cn('mt-2 rounded-xl transition-colors', isEmpty ? 'min-h-[80px]' : 'min-h-[40px]')}>
      {isDropTarget && !isEmpty && <div className="h-1 mt-1 rounded-full bg-foreground mx-1" />}
    </div>
  )
}

interface ColumnProps {
  column: ColumnType
  tasks: Task[]
  activeTaskId?: string
  insertBeforeTaskId?: string | null
  isAppendTarget?: boolean
  onAddTask: (columnId: string, title: string) => void
  onDeleteTask: (taskId: string) => void
  onRenameColumn: (columnId: string, newTitle: string) => void
  onDeleteColumn: (columnId: string) => void
}

export default function Column({
  column,
  tasks,
  activeTaskId,
  insertBeforeTaskId,
  isAppendTarget,
  onAddTask,
  onDeleteTask,
  onRenameColumn,
  onDeleteColumn,
}: ColumnProps) {
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [isAdding, setIsAdding] = useState(false)

  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [editTitleValue, setEditTitleValue] = useState(column.title)
  const titleInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus()
      titleInputRef.current.select()
    }
  }, [isEditingTitle])

  const submitTitleEdit = () => {
    const trimmed = editTitleValue.trim()
    if (trimmed && trimmed !== column.title) {
      onRenameColumn(column.id, trimmed)
    } else {
      setEditTitleValue(column.title)
    }
    setIsEditingTitle(false)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = newTaskTitle.trim()
    if (!trimmed) return
    onAddTask(column.id, trimmed)
    setNewTaskTitle('')
    setIsAdding(false)
  }

  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false)

  const isInsertingHere = !!insertBeforeTaskId && tasks.some((t) => t.id === insertBeforeTaskId)
  const isOver = isInsertingHere || !!isAppendTarget

  return (
    <div
      className={cn(
        'relative flex flex-col w-96 shrink-0 p-4 rounded-2xl transition-colors border-2 bg-transparent text-foreground',
        isOver ? 'border-foreground' : 'border-transparent',
      )}
    >
      {/* Delete Confirmation Modal */}
      {isConfirmingDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="flex flex-col gap-4 p-8 rounded-2xl border-2 border-foreground bg-card shadow-2xl w-full max-w-sm">
            <p className="font-bold text-center text-2xl text-foreground">Delete Column?</p>
            <p className="text-center font-medium opacity-80 mb-2">
              All tasks inside &ldquo;{column.title}&rdquo; will be permanently lost.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setIsConfirmingDelete(false)}
                className="flex-1 py-3 rounded-xl font-bold border-2 border-foreground text-foreground hover:bg-foreground hover:text-background transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => onDeleteColumn(column.id)}
                className="flex-1 py-3 rounded-xl font-bold bg-foreground text-background hover:opacity-70 transition-opacity"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-3 px-2 group">
        {isEditingTitle ? (
          <input
            ref={titleInputRef}
            type="text"
            value={editTitleValue}
            onChange={(e) => setEditTitleValue(e.target.value)}
            onBlur={submitTitleEdit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submitTitleEdit()
              if (e.key === 'Escape') {
                setEditTitleValue(column.title)
                setIsEditingTitle(false)
              }
            }}
            className="text-xl font-bold tracking-wide bg-transparent border-b-2 border-foreground outline-none w-full mr-4"
          />
        ) : (
          <div
            className="flex items-center gap-3 cursor-pointer flex-1"
            onClick={() => setIsEditingTitle(true)}
          >
            <h2 className="text-xl mt-1 font-bold tracking-wide">{column.title}</h2>
            <Pencil size={16} className="group-hover:opacity-70 transition-opacity mb-2" />
          </div>
        )}
        <div className="flex gap-2">
          <button
            onClick={() => setIsConfirmingDelete(true)}
            className="flex items-center justify-center w-8 h-8 rounded-full border-2 border-foreground text-foreground font-bold shrink-0 hover:bg-foreground hover:text-background transition-colors"
          >
            <Trash2 size={16} />
          </button>
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-foreground text-background font-bold shrink-0">
            {tasks.length}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {tasks.map((task) => (
          <Fragment key={task.id}>
            {insertBeforeTaskId === task.id && (
              <div className="h-1 rounded-full bg-foreground mx-1" />
            )}
            <TaskCard task={task} onDelete={onDeleteTask} isGhost={activeTaskId === task.id} />
          </Fragment>
        ))}
      </div>

      <AppendZone columnId={column.id} isEmpty={tasks.length === 0} />

      {/* Add Task */}
      {isAdding ? (
        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
          <input
            type="text"
            autoFocus
            placeholder="Task title..."
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') setIsAdding(false)
            }}
            className="w-full p-3 rounded-xl border-2 border-foreground bg-card text-foreground placeholder-opacity-50 outline-none focus:ring-2 focus:ring-foreground"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={!newTaskTitle.trim()}
              className="flex-1 py-2 rounded-xl font-bold bg-foreground text-background disabled:opacity-50 hover:opacity-90 transition-opacity"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="flex-1 py-2 rounded-xl font-bold border-2 border-foreground text-foreground hover:bg-foreground hover:text-background transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center justify-center gap-2 w-full py-2 rounded-xl border-2 border-dashed border-foreground text-foreground opacity-60 hover:opacity-100 transition-opacity"
        >
          <Plus size={16} />
          Add Task
        </button>
      )}
    </div>
  )
}
