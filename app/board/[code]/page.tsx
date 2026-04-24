import { getBoard } from '../../lib/board'
import KanbanBoard from '../../components/KanbanBoard'
import Link from 'next/link'

interface BoardPageProps {
  params: Promise<{ code: string }>
}

export default async function BoardPage(props: BoardPageProps) {
  const params = await props.params
  const code = params.code

  const result = await getBoard(code)

  if (!result) {
    return (
      <div className="flex flex-col h-screen items-center justify-center bg-background text-center p-8 gap-4">
        <h1 className="text-3xl font-bold text-foreground">Board not found</h1>
        <p className="text-lg opacity-80 mb-4 text-foreground">Code: {code}</p>
        <Link
          href="/"
          className="px-6 py-3 font-bold bg-foreground text-background rounded-xl hover:opacity-90 transition-opacity"
        >
          Back to Home
        </Link>
      </div>
    )
  }

  return <KanbanBoard initialCode={code} initialBoardData={result.data} />
}
