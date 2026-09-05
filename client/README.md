# Kanban Board — Frontend

Next.js 14 (App Router) + TypeScript + Tailwind CSS client for the Mini
Kanban Board backend (Express + Prisma + PostgreSQL). Supports auth, board
CRUD + sharing, and drag-and-drop task movement with optimistic updates.

---

## 1. Tech stack

| Concern           | Choice                                                                                   |
| ----------------- | ---------------------------------------------------------------------------------------- |
| Framework         | Next.js 14, App Router, client components (`"use client"`)                               |
| Language          | TypeScript                                                                               |
| Styling           | Tailwind CSS (dark, custom `ink`/`amber` theme, `Sora` + `Inter` fonts)                  |
| Server state      | TanStack Query — caching, invalidation, optimistic mutations                             |
| Client/auth state | React Context API (`AuthContext`)                                                        |
| Drag-and-drop     | `@hello-pangea/dnd`                                                                      |
| HTTP client       | Axios, with a request interceptor (Bearer token) and response interceptor (401 handling) |
| Notifications     | `react-toastify`                                                                         |
| URL state         | `URLSearchParams` — board search + pagination live in the URL                            |

---

## 2. Project structure

```
client/
├── src/
│   ├── app/
│   │   ├── layout.tsx                 # Root layout — fonts + <Providers>
│   │   ├── providers.tsx              # QueryClientProvider, ToastContainer, AuthProvider, RQ devtools
│   │   ├── page.tsx                   # "/" — redirects to /boards or /login based on auth state
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx         # Login form
│   │   │   └── register/page.tsx      # Registration form
│   │   ├── boards/
│   │   │   ├── page.tsx               # Dashboard — list of boards, search + pagination
│   │   │   └── [id]/page.tsx          # Single board — columns, tasks, drag-and-drop
│   │   └── globals.css
│   ├── components/
│   │   ├── AuthGuard.tsx              # Wraps protected pages, redirects unauthenticated users
│   │   ├── Avatar.tsx                 # User initials/avatar bubble
│   │   ├── BoardCard.tsx              # Card for a board in the dashboard grid
│   │   ├── ConfirmDialog.tsx          # Generic "are you sure?" modal
│   │   ├── CreateBoardModal.tsx       # Modal to create a new board
│   │   ├── EmptyState.tsx             # Empty-list placeholder
│   │   ├── Modal.tsx                  # Base modal primitive
│   │   ├── Navbar.tsx                 # Top nav — user menu, logout
│   │   ├── Pagination.tsx             # Page controls, syncs with URL query
│   │   └── board/
│   │       ├── AddColumnForm.tsx      # Inline "+ add column" form
│   │       ├── BoardHeader.tsx        # Board title, share button, member avatars
│   │       ├── ColumnCard.tsx         # A column + its draggable task list
│   │       ├── EditBoardTitle.tsx     # Inline board-title editor
│   │       ├── EditColumn.tsx         # Inline column-title editor / delete menu
│   │       ├── ShareBoardModal.tsx    # Share-by-email modal, member removal
│   │       ├── TaskCard.tsx           # Draggable task card
│   │       └── TaskModal.tsx          # Create/edit task (title, description, assignee)
│   ├── context/
│   │   └── AuthContext.tsx            # Session state: user, token, login/register/logout
│   ├── hooks/
│   │   ├── useBoards.ts               # Query + mutation hooks for boards (list/detail/create/share/delete/...)
│   │   ├── useColumns.ts              # Mutation hooks for columns (create/update/delete)
│   │   └── useTasks.ts                # Mutation hooks for tasks + optimistic moveTask
│   ├── lib/
│   │   ├── axios.ts                   # Configured axios instance + interceptors + extractErrorMessage
│   │   ├── query-string.ts            # Builds `?search=&page=&limit=` strings
│   │   └── services/                  # One file per REST resource — auth/board/column/task
│   └── types/
│       └── index.ts                   # Types mirroring the backend's response shapes
├── Dockerfile
├── .dockerignore
├── .env.example
└── package.json
```

---

## 3. Pages / routing

| Route          | File                           | Notes                                                             |
| -------------- | ------------------------------ | ----------------------------------------------------------------- |
| `/`            | `app/page.tsx`                 | No UI — redirects to `/boards` (if authenticated) or `/login`     |
| `/login`       | `app/(auth)/login/page.tsx`    | Email + password → `AuthContext.login`                            |
| `/register`    | `app/(auth)/register/page.tsx` | Email + password + name → registers then auto-logs in             |
| `/boards`      | `app/boards/page.tsx`          | Dashboard: search + paginated grid of boards the user owns/shares |
| `/boards/[id]` | `app/boards/[id]/page.tsx`     | Board view: columns with drag-and-drop tasks, share/rename/delete |

`AuthGuard` wraps the protected routes and bounces unauthenticated users to
`/login`; the axios response interceptor also force-redirects to `/login` on
any `401` (except from the login call itself) and clears the stored session.

---

## 4. State management

- **`AuthContext`** (`context/AuthContext.tsx`) — holds `user`, `token`,
  `isLoading`, `isAuthenticated`. Persists `kanban_token` / `kanban_user` to
  `localStorage` and hydrates on mount. Exposes `login`, `register`, `logout`.
- **TanStack Query** — all server data (boards, columns, tasks) goes through
  query hooks with a shared `boardKeys` factory (`hooks/useBoards.ts`) so
  mutations know exactly which cache entries to invalidate.
- **`useMoveTask`** (`hooks/useTasks.ts`) is the most involved hook: on drag
  end it optimistically re-derives the entire board's column/task arrays
  client-side (`reorderBoard`, mirroring the backend's contiguous-position
  logic) via `onMutate`, rolls back via `onError` if the API call fails, and
  reconciles with the server via `onSettled` → `invalidateQueries`.

---

## 5. API integration (`lib/axios.ts`)

```ts
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
```

- **Request interceptor** — reads `kanban_token` from `localStorage` and
  attaches `Authorization: Bearer <token>` to every request.
- **Response interceptor** — on any `401` (other than from `/auth/login`
  itself), clears the stored session and redirects to `/login`.
- **`extractErrorMessage(error, fallback)`** — pulls `message` out of the
  backend's `{ success, message }` error envelope for toasts.

### Services → backend routes

| Service file        | Calls                                                                                                                                                           |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `auth.service.ts`   | `POST /auth/register`, `POST /auth/login`                                                                                                                       |
| `board.service.ts`  | `GET/POST /boards`, `GET /boards/:id`, `PATCH /boards/:id/title`, `POST /boards/:id/share`, `DELETE /boards/:id/delete`, `DELETE /boards/:id/members/:memberId` |
| `column.service.ts` | `POST /columns`, `PATCH /columns/:id/update`, `DELETE /columns/:id/delete`                                                                                      |
| `task.service.ts`   | `POST /tasks`, `PATCH /tasks/:id`, `DELETE /tasks/:id`, `PUT /tasks/:id/move`                                                                                   |

This frontend was built directly against the backend's response shapes — the
`{ success, message, data }` envelope, the `pagination` object, and the
`moveTask` payload of `{ targetColumnId, newPosition }` all match exactly, so
no adapter/mapping layer is needed.

---

## 6. Environment variables

**`.env.local`**

```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

No trailing slash; must include the `/api` prefix (matches the backend's
`app.use("/api/...")` mounting). This is a `NEXT_PUBLIC_*` variable, so it is
baked into the client bundle at **build** time, not read at runtime.

---

## 7. Running locally (without Docker)

```bash
npm install
cp .env.example .env.local
# edit .env.local if the backend isn't on http://localhost:5000
npm run dev          # http://localhost:3000
```

Other scripts: `npm run build` (production build), `npm start` (serve the
build), `npm run lint`.

## 8. Running with Docker

From the repo root:

```bash
docker compose up --build
```

`NEXT_PUBLIC_API_URL` is passed as a build arg (see root `docker-compose.yml`)
so it's correctly baked into the build inside the container.

---

## 9. Using the app

1. Go to `/register` to create an account, or log in with a seeded user
   (e.g. `sohel@test.com` / `123456`, if the backend was seeded).
2. From **Your boards**, create a board or open one you already have access to.
3. Inside a board:
   - **+ Add column** to create a workflow column.
   - Click a column's title to rename it inline; use the `⋯` menu to delete it.
   - **+ Add task** to create a task (title, description, assignee).
   - Click a task card to edit or delete it.
   - Drag a task within a column to reorder it, or across columns — calls
     `PUT /tasks/:taskId/move` and updates the UI optimistically.
   - Board owners can **Share** the board by another user's email, rename the
     title, remove members, or delete the board.
4. The board list supports search + pagination, both reflected in the URL
   (`/boards?search=...&page=...`), so links are shareable and the back
   button behaves correctly.
