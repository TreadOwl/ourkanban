import { DropPreview, Task } from '../types/kanban'
import { getOrderedColumnTasks } from './kanban-order'

const TASK_ID_PREFIX = 'task-'
const COLUMN_ID_PREFIX = 'column-'
const TASK_GAP = 12

export type DragSnapshot = {
  activeIsBelowTarget: boolean
  activeHeight: number
  sourceId: string | null
  targetId: string | null
}

export type DragEndSnapshot = DragSnapshot & {
  canceled: boolean
}

type DropDestination = {
  columnId: string
  index: number
  taskId: string
}

function getTaskIdFromDragId(id: string) {
  return id.startsWith(TASK_ID_PREFIX) ? id.slice(TASK_ID_PREFIX.length) : null
}

function getColumnIdFromDropId(id: string) {
  return id.startsWith(COLUMN_ID_PREFIX) ? id.slice(COLUMN_ID_PREFIX.length) : null
}

export function getDropDestination(
  tasks: Task[],
  snapshot: DragSnapshot,
  options: {
    includeDraggedTaskWhenAppending?: boolean
    validColumnIds?: Set<string>
  } = {},
): DropDestination | null {
  const taskId = snapshot.sourceId ? getTaskIdFromDragId(snapshot.sourceId) : null
  if (!taskId || !snapshot.targetId) return null

  const targetColumnId = getColumnIdFromDropId(snapshot.targetId)
  if (targetColumnId) {
    if (options.validColumnIds && !options.validColumnIds.has(targetColumnId)) return null

    const targetColumnTasks = getOrderedColumnTasks(tasks, targetColumnId)
    const index = options.includeDraggedTaskWhenAppending
      ? targetColumnTasks.length
      : targetColumnTasks.filter((task) => task.id !== taskId).length

    return { taskId, columnId: targetColumnId, index }
  }

  const targetTaskId = getTaskIdFromDragId(snapshot.targetId)
  if (!targetTaskId || targetTaskId === taskId) return null

  const draggedTask = tasks.find((task) => task.id === taskId)
  const targetTask = tasks.find((task) => task.id === targetTaskId)
  if (!draggedTask || !targetTask) return null

  const targetColumnTasks = getOrderedColumnTasks(tasks, targetTask.columnId)
  const draggedIndex = targetColumnTasks.findIndex((task) => task.id === taskId)
  const targetIndex = targetColumnTasks.findIndex((task) => task.id === targetTaskId)
  if (targetIndex === -1) return null

  const indexAfterHover = targetIndex + (snapshot.activeIsBelowTarget ? 1 : 0)
  const index =
    draggedTask.columnId === targetTask.columnId &&
    draggedIndex !== -1 &&
    draggedIndex < indexAfterHover
      ? indexAfterHover - 1
      : indexAfterHover

  return { taskId, columnId: targetTask.columnId, index }
}

export function getDropPreview(tasks: Task[], snapshot: DragSnapshot): DropPreview | null {
  if (snapshot.activeHeight <= 0) return null

  const destination = getDropDestination(tasks, snapshot, {
    includeDraggedTaskWhenAppending: true,
  })
  if (!destination) return null

  const activeTask = tasks.find((task) => task.id === destination.taskId)
  if (!activeTask) return null

  const sourceIndex = getOrderedColumnTasks(tasks, activeTask.columnId).findIndex(
    (task) => task.id === destination.taskId,
  )
  if (sourceIndex === -1) return null

  return {
    activeTaskId: destination.taskId,
    sourceColumnId: activeTask.columnId,
    sourceIndex,
    targetColumnId: destination.columnId,
    insertIndex: destination.index,
    offset: snapshot.activeHeight + TASK_GAP,
  }
}

export function isSameDropPreview(a: DropPreview | null, b: DropPreview | null) {
  if (a === b) return true
  if (!a || !b) return false

  return (
    a.activeTaskId === b.activeTaskId &&
    a.sourceColumnId === b.sourceColumnId &&
    a.sourceIndex === b.sourceIndex &&
    a.targetColumnId === b.targetColumnId &&
    a.insertIndex === b.insertIndex &&
    a.offset === b.offset
  )
}
