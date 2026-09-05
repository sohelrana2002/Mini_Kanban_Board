# Mini Kanban Board

A full-stack Kanban board with board sharing, role-aware access control, and
drag-and-drop task reordering across columns.

**Stack**

- Frontend: Next.js 14 (App Router) + TypeScript + Tailwind CSS + TanStack Query + `@hello-pangea/dnd`
- Backend: Node.js + Express + TypeScript
- Database: PostgreSQL + Prisma ORM
- Auth: JWT (Bearer token)

```
.
├── client/            # Next.js frontend
├── server/            # Express + Prisma backend
└── docker-compose.yml
```

---

## Option A — Run everything with Docker (recommended)

**Prerequisites:** Docker + Docker Compose

```bash
docker compose up --build
```

This starts three services:

- `postgres` — PostgreSQL 16 on `localhost:5432`
- `server` — runs `prisma migrate deploy` automatically, then starts on `http://localhost:5000`
- `client` — Next.js app on `http://localhost:3000`

Optional: seed demo data (2 boards, 7 users, columns, tasks) once the containers are up:

```bash
docker compose exec server npx prisma db seed
```

Then log in at `http://localhost:3000/login` with a seeded user, e.g.
`sohel@test.com` / `123456`.

To reset the database volume: `docker compose down -v`.

---

## Option B — Run locally without Docker

**Prerequisites:** Node.js 18.18+ (20 recommended), a running PostgreSQL instance

### 1. Backend

```bash
cd server
npm install
cp .env.example .env
# edit .env — set PORT, DATABASE_URL to your local Postgres instance, and JWT_SECRET
npx prisma migrate dev --name init
npx prisma db seed        # optional — seeds demo users/boards (password: 123456)
npm run dev                # http://localhost:5000
```

### 2. Frontend

```bash
cd client
npm install
cp .env.example .env.local
# edit .env.local if the backend isn't on http://localhost:5000/api
npm run dev                # http://localhost:3000
```

---

## Environment variables

**`server/.env`**

| Variable       | Example                                                                 | Notes                               |
| -------------- | ----------------------------------------------------------------------- | ----------------------------------- |
| `PORT`         | `5000`                                                                  | Backend port                        |
| `DATABASE_URL` | `postgresql://postgres:postgres@localhost:5432/kanban_db?schema=public` | Standard Postgres connection string |
| `JWT_SECRET`   | any long random string                                                  | Used to sign/verify auth tokens     |

**`client/.env.local`**

| Variable              | Example                     | Notes                                  |
| --------------------- | --------------------------- | -------------------------------------- |
| `NEXT_PUBLIC_API_URL` | `http://localhost:5000/api` | No trailing slash; must include `/api` |

> Neither `.env` file is committed — see `.env.example` in each folder for the
> exact keys required.

---

## API overview

All routes except `/auth/*` and `/health` require `Authorization: Bearer <token>`.
Every board/column/task mutation checks that the requesting user is either the
board's owner or a `BoardMember` before allowing the read/write.

| Method | Endpoint                                 | Description                                                                       |
| ------ | ---------------------------------------- | --------------------------------------------------------------------------------- |
| POST   | `/api/auth/register`                     | Register a new user                                                               |
| POST   | `/api/auth/login`                        | Log in, returns a JWT                                                             |
| GET    | `/api/boards`                            | List boards owned by or shared with the user (search + pagination)                |
| POST   | `/api/boards`                            | Create a board                                                                    |
| GET    | `/api/boards/:id`                        | Get a board with its columns/tasks (access-checked)                               |
| PATCH  | `/api/boards/:boardId/title`             | Rename a board (owner only)                                                       |
| POST   | `/api/boards/:id/share`                  | Share a board with another user by email (owner only)                             |
| DELETE | `/api/boards/:id/delete`                 | Delete a board and its columns/tasks (owner only)                                 |
| DELETE | `/api/boards/:boardId/members/:memberId` | Remove a member from a board (owner only)                                         |
| POST   | `/api/columns`                           | Create a column                                                                   |
| PATCH  | `/api/columns/:columnId/update`          | Rename a column                                                                   |
| DELETE | `/api/columns/:columnId/delete`          | Delete a column and its tasks                                                     |
| POST   | `/api/tasks`                             | Create a task                                                                     |
| PATCH  | `/api/tasks/:taskId`                     | Update a task's title/description/assignee                                        |
| DELETE | `/api/tasks/:taskId`                     | Delete a task                                                                     |
| PUT    | `/api/tasks/:taskId/move`                | Move a task — reorder within a column, or move to another column at `newPosition` |

### Task ordering

Each task has an integer `position`, unique-ordered within its column. Moving a
task shifts the `position` of every task between the old and new index by ±1
inside a single Prisma transaction, so ordering stays dense (`0..n-1`) and
conflict-free — both for same-column reordering and cross-column moves.

---

## Notes for reviewers

- Passwords are hashed with bcrypt; tokens are signed JWTs valid for 7 days.
- CORS is restricted to `http://localhost:3000` in `server/src/index.ts`.
- `server/.env.example` and `client/.env.example` contain placeholder values only.
