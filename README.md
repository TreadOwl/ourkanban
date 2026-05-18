# Shareable Kanban Board

A codeshare-style kanban board — no accounts, no login. Generate a board, get a 6-character code, share it, and start organizing. Explicit save keeps you in control of when state persists.

---

## Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router, React Server Components) |
| Language | TypeScript |
| Runtime | Bun |
| Styling | Tailwind CSS v4 (CSS variable tokens) |
| Drag & Drop | `@dnd-kit/react` v0.4 |
| Backend | Supabase (PostgreSQL + JSONB) |
| Notifications | Sonner |
| Icons | lucide-react |
| ID Generation | nanoid (custom alphabet) |

### Why `@dnd-kit/react` and not `@dnd-kit/core`?

These are separate packages with incompatible APIs. `@dnd-kit/react` v0.4 is the newer, hook-based rewrite. `DragDropProvider` accepts `onDragStart`, `onDragOver`, `onDragEnd` directly as props; events expose `operation.source` and `operation.target`. The older `@dnd-kit/core` API (sensors, monitors, `DndContext`) does not apply here.

### Why Supabase?

The entire board state — columns and tasks — is stored as a single JSONB blob in one row. Reads and writes are atomic single-row operations. No relational tables, no JOINs. Supabase gives direct PostgreSQL access with a REST API and client library that works cleanly inside Next.js Server Actions.

---

## Architecture

```
app/
  page.tsx                  # Home: create board or enter code
  board/[code]/
    page.tsx                # Server component: fetches board, renders KanbanBoard
    loading.tsx             # Suspense fallback
  components/
    KanbanBoard.tsx         # All board state + DnD logic
    Column.tsx              # Column UI + AppendZone droppable
    TaskCard.tsx            # Draggable + droppable task card
    HeartBackground.tsx     # Animated background layer
  lib/
    board.ts                # Server actions: createBoard, getBoard, updateBoard
    utils.ts                # cn() — clsx + tailwind-merge
  types/
    kanban.ts               # Column, Task types
```

**Data model:**
- `Column { id: string, title: string }` — ID is kebab-cased from the title at creation and never changes. Renaming updates only `title`.
- `Task { id: string, columnId: string, title: string, index: number }` — `index` controls render order within a column (0-based, always gap-free). Recomputed by `reorderTasks()` after every drag operation.

**Drag and drop:**
- Each `TaskCard` is both draggable (`useDraggable`) and droppable (`useDroppable`) with ID `task-{id}`. Dropping onto a task inserts the dragged card *before* it.
- Each column has an `AppendZone` component below its task list, droppable with ID `end-{columnId}`. Dropping there appends to the bottom.
- Columns themselves are never droppable — overlapping droppables cause collision jitter. The `AppendZone` is spatially isolated to avoid this.
- A `DragOverlay` renders a floating clone of the card while dragging. The original card renders as a ghost (faded, dashed border) in its original position.
- `reorderTasks()` is a pure function that handles same-column reorder, cross-column insert-before, and append — always producing sequential indexes.

**Persistence:** No auto-save. "Save Changes" calls `updateBoard()` which overwrites the JSONB blob atomically. The 6-character board code uses a custom nanoid alphabet (uppercase + digits, no ambiguous chars).

---

## Getting Started

### 1. Prerequisites

- [Bun](https://bun.sh) v1.0+
- A [Supabase](https://supabase.com) project (free tier is sufficient)

### 2. Database Setup

In your Supabase project, open the **SQL Editor** and run:

```sql
create table boards (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  data jsonb,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create index idx_boards_code on boards(code);
```

This creates the single table the app uses. The `data` column holds the entire board as a JSONB object: `{ columns: [...], tasks: [...] }`.

### 3. Environment Variables

Create `.env` at the repository root:

```env
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your-anon-public-key
```

Both values are in your Supabase dashboard under **Project Settings → API**:
- `SUPABASE_URL` → "Project URL"
- `SUPABASE_ANON_KEY` → "anon public" key under "Project API keys"

These are the only required environment variables. The anon key is safe to expose to the browser — Supabase Row Level Security policies (if configured) control access.

### 4. Install and Run

```bash
bun install
bun dev
```

The dev server starts at `http://localhost:3000`.

### 5. Other Commands

```bash
bun build        # Production build
bun lint         # ESLint (Next.js core-web-vitals + TypeScript)
bun format       # Prettier (no semicolons, single quotes, 100-char width)
bun typecheck    # tsc --noEmit
bun clean        # rm -rf node_modules .next
```
