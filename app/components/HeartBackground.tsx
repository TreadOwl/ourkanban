'use client'

import Image from 'next/image'
import { useMemo } from 'react'

const HEART_SIZE = 18
const GAP = 22
const CELL = HEART_SIZE + GAP // 40px per cell

export default function HeartBackground({ className }: { className?: string }) {
  const hearts = useMemo(() => {
    const cols = 50
    const rows = 35
    return Array.from({ length: rows * cols }, (_, i) => (
      <Image
        key={i}
        src="/heart.gif"
        alt=""
        width={HEART_SIZE}
        height={HEART_SIZE}
        draggable={false}
        priority
        style={{ display: 'block' }}
      />
    ))
  }, [])

  return (
    <div
      className={className}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
        opacity: 0.33,
      }}
      aria-hidden="true"
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(50, ${HEART_SIZE}px)`,
          gap: `${GAP}px`,
          position: 'absolute',
          top: `-${CELL}px`,
          left: `-${CELL}px`,
          animation: 'heart-diagonal 2s linear infinite',
        }}
      >
        {hearts}
      </div>
    </div>
  )
}
