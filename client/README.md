# Kanban Board — Frontend

Next.js 14 (App Router) + TypeScript + Tailwind CSS + TanStack Query frontend for the
Mini Kanban Board backend (Express + Prisma + PostgreSQL).

## Stack

- **Next.js 14** (App Router, client components)
- **TypeScript**
- **Tailwind CSS** — dark, custom theme
- **TanStack Query** — server state, caching, optimistic drag-and-drop updates
- **React Context API** — auth session (`AuthContext`) and toast notifications (`ToastContext`)
- **@hello-pangea/dnd** — drag-and-drop task movement
- **Axios** — HTTP client with a Bearer-token interceptor
- **URLSearchParams** — used for building every query string (`search`, `page`, `limit`)
  and for keeping the board search + pagination state in sync with the URL

## Prerequisites

- Node.js 18.18+ (Node 20 recommended)
- The backend server (from `server.zip`) running and reachable, with its own
  PostgreSQL database migrated and (optionally) seeded

## 1. Backend setup (quick reference)

```bash
cd server
npm install
cp .env.example .env
# edit .env: set PORT, DATABASE_URL (postgresql://user:pass@localhost:5432/kanban), JWT_SECRET
npx prisma migrate dev --name init
npx prisma db seed        # optional: seeds demo users (password: 123456)
npm run dev                # runs on http://localhost:5000
```

## 2. Frontend setup

```bash
cd kanban-frontend
npm install
cp .env.example .env.local
# edit .env.local if your backend isn't on http://localhost:5000
npm run dev                # runs on http://localhost:3000
```

### Environment variables

`.env.example`:

```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

Copy this to `.env.local` and point it at wherever the backend is running
(no trailing slash, must include the `/api` prefix — it matches the backend's
`app.use("/api/...")` mounting).

## 3. Using the app

1. Go to `/register` to create an account, or use a seeded user
   (e.g. `sohel@test.com` / `123456`) if you ran the seed script.
2. From **Your boards**, create a board, or open one you already have access to.
3. Inside a board:
   - Click **+ Add column** to create a workflow column.
   - Click a column's title to rename it inline; use the `⋯` menu to delete it.
   - Click **+ Add task** to create a task (title, description, assignee).
   - Click any task card to edit or delete it.
   - Drag a task within a column to reorder it, or drag it across columns —
     this calls the backend's `PUT /tasks/:taskId/move` endpoint and updates
     the UI optimistically.
   - Board owners can **Share** the board with another registered user's email,
     rename the board title, remove members, or delete the board entirely.
4. The board list supports search and pagination — both are reflected in the
   URL (`/boards?search=...&page=...`) via `URLSearchParams`, so links are
   shareable and the back button works as expected.

## Project structure

```
src/
  app/
    login/, register/           – auth pages
    boards/page.tsx              – dashboard (search + pagination)
    boards/[id]/page.tsx         – kanban board view
    providers.tsx                – QueryClientProvider + Auth/Toast providers
  components/
    board/                       – ColumnCard, TaskCard, TaskModal, BoardHeader, ...
    Modal.tsx, Avatar.tsx, Pagination.tsx, ConfirmDialog.tsx, ...
  context/
    AuthContext.tsx               – session state (Context API)
    ToastContext.tsx               – notifications (Context API)
  hooks/
    useBoards.ts, useColumns.ts, useTasks.ts  – TanStack Query hooks
  lib/
    axios.ts                      – API client + auth header + 401 handling
    query-string.ts                – URLSearchParams query-string builder
    services/                      – one file per resource (auth/board/column/task)
  types/
    index.ts                       – types mirroring the backend's response shapes
```

## Notes on the API contract

This frontend was built directly against the provided backend's controllers, so
response shapes (including the `{ success, message, data }` envelope, pagination
object, and the `moveTask` payload of `{ targetColumnId, newPosition }`) match
exactly — no adapter layer is needed.
