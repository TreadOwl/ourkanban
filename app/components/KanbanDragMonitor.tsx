'use client'

import { useCallback, useEffect, useMemo, useRef } from 'react'
import { DragEndEvent, DragMoveEvent, useDragDropMonitor } from '@dnd-kit/react'
import { DragEndSnapshot, DragSnapshot } from '../lib/kanban-dnd'

function getDragSnapshot(event: DragMoveEvent | DragEndEvent): DragSnapshot {
  const { operation } = event
  const activeY = operation.shape?.current.center.y ?? operation.position.current.y
  const targetY = operation.target?.shape?.center.y ?? null

  return {
    activeHeight: operation.shape?.current.boundingRectangle.height ?? 0,
    activeIsBelowTarget: targetY == null ? false : activeY > targetY,
    sourceId: operation.source?.id == null ? null : String(operation.source.id),
    targetId: operation.target?.id == null ? null : String(operation.target.id),
  }
}

export default function KanbanDragMonitor({
  onDragEnd,
  onDragMove,
}: {
  onDragEnd: (snapshot: DragEndSnapshot) => void
  onDragMove: (snapshot: DragSnapshot) => void
}) {
  const frameRef = useRef<number | null>(null)
  const dragSnapshotRef = useRef<DragSnapshot | null>(null)

  const flushDragMove = useCallback(() => {
    frameRef.current = null
    if (dragSnapshotRef.current) onDragMove(dragSnapshotRef.current)
  }, [onDragMove])

  const scheduleDragMove = useCallback(
    (snapshot: DragSnapshot) => {
      dragSnapshotRef.current = snapshot

      if (frameRef.current == null) {
        frameRef.current = window.requestAnimationFrame(flushDragMove)
      }
    },
    [flushDragMove],
  )

  useEffect(() => {
    return () => {
      if (frameRef.current != null) {
        window.cancelAnimationFrame(frameRef.current)
      }
    }
  }, [])

  const handlers = useMemo(
    () => ({
      onDragMove(event: DragMoveEvent) {
        scheduleDragMove(getDragSnapshot(event))
      },
      onDragEnd(event: DragEndEvent) {
        if (frameRef.current != null) {
          window.cancelAnimationFrame(frameRef.current)
          frameRef.current = null
        }

        const snapshot = { ...getDragSnapshot(event), canceled: event.canceled }
        window.setTimeout(() => onDragEnd(snapshot), 0)
      },
    }),
    [onDragEnd, scheduleDragMove],
  )

  useDragDropMonitor(handlers)

  return null
}
