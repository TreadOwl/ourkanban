'use client'

import { useDraggable } from '@dnd-kit/react'
import { Task } from '../types/kanban'
import { Trash2 } from 'lucide-react'

interface TaskCardProps {
  task: Task
  onDelete: (taskId: string) => void
}

export default function TaskCard({ task, onDelete }: TaskCardProps) {
  const { ref, isDragging } = useDraggable({
    id: `task-${task.id}`,
    data: task,
  })

  return (
    <div
      ref={ref}
      className={`group relative p-4 rounded-xl cursor-grab active:cursor-grabbing border-2 border-transparent hover:border-foreground transition-colors bg-card text-foreground ${
        isDragging ? 'opacity-50' : 'opacity-100'
      }`}
    >
      <button
        onClick={(e) => {
          e.stopPropagation()
          onDelete(task.id)
        }}
        className="absolute top-2 right-2 p-1 rounded-md hover:opacity-70 transition-opacity text-foreground"
        aria-label="Delete task"
      >
        <Trash2 size={16} />
      </button>
      <h3 className="font-semibold mb-1 text-lg pr-6">{task.title}</h3>
    </div>
  )
}
