'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBoard } from './lib/board'
import { toast } from 'sonner'
import HeartBackground from './components/HeartBackground'

export default function Home() {
  const router = useRouter()
  const [code, setCode] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  const handleStartNew = async () => {
    try {
      setIsCreating(true)
      const newCode = await createBoard()
      router.push(`/board/${newCode}`)
    } catch (err) {
      console.error(err)
      setIsCreating(false)
      toast.error('Failed to create board. Check console/network tab.')
    }
  }

  const handleEnterCode = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    router.push(`/board/${code}`)
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center bg-background">
      <HeartBackground />
      <div className="relative max-w-md w-full bg-card p-8 rounded-2xl border-2 border-foreground">
        <h1 className="text-3xl font-bold mb-8 tracking-wide text-foreground">Our Kanban</h1>

        {/* Start New */}
        <div className="mb-8 border-b-2 border-b-foreground pb-8">
          <h2 className="text-xl font-semibold mb-4 text-foreground">Create a New Board</h2>
          <button
            onClick={handleStartNew}
            disabled={isCreating}
            className="w-full py-3 px-4 rounded-xl font-bold bg-foreground text-background transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {isCreating ? 'Creating...' : 'Start New Board'}
          </button>
        </div>

        {/* Enter Code */}
        <div>
          <h2 className="text-xl font-semibold mb-4 text-foreground">Join Existing Board</h2>
          <form onSubmit={handleEnterCode} className="flex flex-col gap-4">
            <input
              type="text"
              placeholder="Enter Board Code"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              maxLength={6}
              className="w-full p-4 rounded-xl border-2 border-foreground bg-transparent placeholder-opacity-60 font-mono text-center tracking-widest outline-none focus:ring-2 focus:ring-foreground text-foreground"
            />
            <button
              type="submit"
              disabled={code.trim().length !== 6}
              className="w-full py-3 px-4 rounded-xl font-bold bg-transparent border-2 border-foreground text-foreground transition-opacity hover:bg-foreground hover:text-background disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-foreground"
            >
              Enter Code
            </button>
          </form>
        </div>
      </div>
      <div className="mt-8 text-center animate-bounce text-xl">
        Don&apos;t forget to <span className="font-bold">&ldquo;Save Changes&rdquo;</span>
      </div>
    </div>
  )
}
