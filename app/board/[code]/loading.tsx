import HeartBackground from '../../components/HeartBackground'

export default function Loading() {
  return (
    <div
      className="flex h-screen items-center justify-center"
      style={{ background: 'linear-gradient(to bottom, var(--background) 66%, var(--card) 100%)' }}
    >
      <HeartBackground />
      <p className="relative z-10 text-4xl font-bold text-foreground animate-pulse">Loading...</p>
    </div>
  )
}
