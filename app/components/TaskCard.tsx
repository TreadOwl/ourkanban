'use client'

import { useDraggable, useDroppable } from '@dnd-kit/react'
import { Task } from '../types/kanban'
import { Trash2 } from 'lucide-react'

interface TaskCardProps {
  task: Task
  onDelete?: (taskId: string) => void
  isGhost?: boolean
  isOverlay?: boolean
}

export default function TaskCard({ task, onDelete, isGhost, isOverlay }: TaskCardProps) {
  const { ref: dragRef } = useDraggable({
    id: `task-${task.id}`,
    data: task,
    disabled: isOverlay,
  })
  const { ref: dropRef } = useDroppable({
    id: `task-${task.id}`,
    data: task,
    disabled: isOverlay || isGhost,
  })

  return (
    <div
      ref={(el) => {
        dragRef(el)
        dropRef(el)
      }}
      className={`relative p-4 rounded-xl border-2 transition-colors bg-card text-foreground ${
        isGhost
          ? 'opacity-33 border-dashed border-foreground cursor-default'
          : isOverlay
            ? 'opacity-66 shadow-xl rotate-1 border-transparent cursor-grabbing'
            : 'group cursor-grab active:cursor-grabbing border-transparent hover:border-foreground'
      }`}
    >
      {!isGhost && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDelete?.(task.id)
          }}
          className="absolute top-2 right-2 p-1 rounded-md hover:opacity-70 transition-opacity text-foreground"
          aria-label="Delete task"
        >
          <Trash2 size={16} />
        </button>
      )}
      <h3 className="font-semibold mb-1 text-lg pr-6">{task.title}</h3>
    </div>
  )
}
