import HeartBackground from '../../components/HeartBackground'

export default function Loading() {
  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <HeartBackground />
      <p className="relative z-10 text-4xl font-bold text-foreground animate-pulse">Loading...</p>
    </div>
  )
}
