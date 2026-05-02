import { Task } from '../types/kanban'

function compareTaskOrder(a: Task, b: Task) {
  const aIndex = Number.isFinite(a.index) ? a.index : Number.MAX_SAFE_INTEGER
  const bIndex = Number.isFinite(b.index) ? b.index : Number.MAX_SAFE_INTEGER

  return aIndex - bIndex
}

function sortTasksByIndex(tasks: Task[]) {
  return [...tasks].sort(compareTaskOrder)
}

function getTasksByColumn(tasks: Task[]) {
  const tasksByColumn = new Map<string, Task[]>()

  for (const task of tasks) {
    const columnTasks = tasksByColumn.get(task.columnId) ?? []
    columnTasks.push(task)
    tasksByColumn.set(task.columnId, columnTasks)
  }

  for (const [columnId, columnTasks] of tasksByColumn) {
    tasksByColumn.set(columnId, sortTasksByIndex(columnTasks))
  }

  return tasksByColumn
}

function getReindexedTasksById(tasksByColumn: Map<string, Task[]>) {
  const reindexedTasks = new Map<string, Task>()

  for (const [columnId, columnTasks] of tasksByColumn) {
    columnTasks.forEach((task, index) => {
      reindexedTasks.set(task.id, { ...task, columnId, index })
    })
  }

  return reindexedTasks
}

export function getOrderedColumnTasks(tasks: Task[], columnId: string) {
  return sortTasksByIndex(tasks.filter((task) => task.columnId === columnId))
}

export function normalizeTaskIndexes(tasks: Task[]) {
  const reindexedTasks = getReindexedTasksById(getTasksByColumn(tasks))
  return tasks.map((task) => reindexedTasks.get(task.id) ?? task)
}

export function moveTaskToIndex(
  tasks: Task[],
  taskId: string,
  destinationColumnId: string,
  destinationIndex: number,
) {
  const taskToMove = tasks.find((task) => task.id === taskId)
  if (!taskToMove) return normalizeTaskIndexes(tasks)

  const tasksByColumn = getTasksByColumn(tasks.filter((task) => task.id !== taskId))
  const destinationTasks = tasksByColumn.get(destinationColumnId) ?? []
  const insertIndex = Math.max(0, Math.min(destinationIndex, destinationTasks.length))

  destinationTasks.splice(insertIndex, 0, { ...taskToMove, columnId: destinationColumnId })
  tasksByColumn.set(destinationColumnId, destinationTasks)

  const reindexedTasks = getReindexedTasksById(tasksByColumn)
  return tasks.map((task) => reindexedTasks.get(task.id) ?? task)
}
