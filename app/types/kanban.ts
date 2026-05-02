export type Id = string

export type Column = {
  id: Id
  title: string
}

export type Task = {
  id: Id
  columnId: Id
  title: string
  index: number
}

export type DropPreview = {
  activeTaskId: Id
  sourceColumnId: Id
  sourceIndex: number
  targetColumnId: Id
  insertIndex: number
  offset: number
}
