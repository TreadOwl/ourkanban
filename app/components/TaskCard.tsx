'use client'

import { useCallback } from 'react'
import { useDraggable, useDroppable } from '@dnd-kit/react'
import { Task } from '../types/kanban'
import { Trash2 } from 'lucide-react'

interface TaskCardProps {
  task: Task
  index: number
  onDelete: (taskId: string) => void
  previewOffset: number
}

export default function TaskCard({ task, index, onDelete, previewOffset }: TaskCardProps) {
  const { ref: draggableRef, isDragging } = useDraggable({
    id: `task-${task.id}`,
    data: { task, index },
  })
  const { ref: droppableRef, isDropTarget } = useDroppable({
    id: `task-${task.id}`,
    data: { task, index },
    disabled: isDragging,
  })
  const ref = useCallback(
    (element: Element | null) => {
      draggableRef(element)
      droppableRef(element)
    },
    [draggableRef, droppableRef],
  )
  const draggingClassName = isDragging ? 'opacity-50' : 'opacity-100'
  const borderClassName = isDropTarget ? 'border-foreground' : 'border-transparent'
  const previewStyle = previewOffset ? { transform: `translateY(${previewOffset}px)` } : undefined

  return (
    <div
      ref={ref}
      style={previewStyle}
      className={`group relative p-4 rounded-xl cursor-grab active:cursor-grabbing border-2 hover:border-foreground transition-[border-color,opacity,transform] duration-150 ease-out bg-card text-foreground ${draggingClassName} ${borderClassName}`}
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
