# Shareable Kanban Board

A lightweight, high-performance, real-time shareable Kanban board built for instant collaboration.

Skip the friction of traditional login systems. Generate a secure 6-character code, share it with your team, and start moving tasks immediately. With a seamless drag-and-drop interface and explicit state-saving architecture, organizing tasks has never been more fluid.

## ✨ Features

- **Frictionless Board Generation:** No accounts required. Instantiate a board instantly and retrieve a unique 6-character alphanumeric ID using `nanoid`.
- **Frictionless Sharing:** Copy your board link directly from the dashboard and drop it in Slack or Discord. Anyone with the link is instantly in!
- **Modern Drag and Drop:** Built using the incredibly fast, modern `@dnd-kit/react` collision engine ensuring smooth kinetic pointer interactions across desktop and mobile browsers.
- **Dynamic Structural Control:**
  - Create and append **New Columns** dynamically matching an automatic kebab-case ID generator.
  - Safely **Rename Columns** inline without breaking existing nested tasks logic.
  - Delete entire columns with cascading protections that safely scrub orphaned ghost-tasks under the hood.
- **Aesthetic UI:** Designed with pure vanilla CSS and Tailwind variables focusing on a light, easy on the eyes, clean palette. Animated with `framer-motion` for buttery smooth transitions.

---

## 🛠️ Stack Architecture

- **Framework:** Next.js (App Router)
- **Styling:** Tailwind CSS + Vanilla CSS Tokens
- **State & Physics:** React 19 + `@dnd-kit/react`
- **Animations:** Framer Motion
- **Database Backend:** Supabase (PostgreSQL)

### 🌟 Why Supabase?

Supabase was chosen as the backend for its simplicity and excellent **PostgreSQL JSONB** support:

- **JSONB Flexibility:** We store the entire board state (columns and tasks) directly as a single JSONB object, avoiding complex relational tables and JOINs.
- **Fast Reads/Writes:** Saving or loading a board acts as a single, atomic database operation.
- **Backend-as-a-Service:** Instant setup with out-of-the-box REST API bindings allows us to focus entirely on building the frontend UI and drag-and-drop mechanics.

---

## 🚀 Getting Started

### 1. Requirements

Ensure you have `bun` or `npm` installed.

### 2. Environment Variables

You must connect a Supabase project. Head to [Supabase](https://supabase.com), create an empty generic project, and spawn a `boards` table utilizing a `code` (String/Text) and `data` (JSONB) column mapping.
Put the following code in the Supabase SQL Editor:

```sql
-- Enable UUID generation (only needed once per database)
create extension if not exists "pgcrypto";

-- Create the boards table
create table boards (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  data jsonb,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create an index on the code column
create index idx_boards_code on boards(code);
```

Create a `.env` file at the root of your local directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_publishable_key
```

### 3. Running the Server

Firstly, install dependencies:

```bash
npm install
# or
bun install
```

Then, run the server:

```bash
npm dev
# or
bun dev
```

Navigate to `http://localhost:3000` to instantiate your first board!
