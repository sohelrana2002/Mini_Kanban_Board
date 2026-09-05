# Kanban Board — Backend

Express + TypeScript + Prisma + PostgreSQL API for the Mini Kanban Board
application. Provides authentication, board/column/task CRUD, board sharing
with access control, and a conflict-free task-move (drag-and-drop) endpoint.

---

## 1. Tech stack

| Layer            | Choice                                                                   |
| ---------------- | ------------------------------------------------------------------------ |
| Runtime          | Node.js (TypeScript, `ts-node-dev` in dev, compiled with `tsc` for prod) |
| Web framework    | Express 4                                                                |
| ORM              | Prisma 5                                                                 |
| Database         | PostgreSQL                                                               |
| Auth             | JWT (`jsonwebtoken`), 7-day expiry, Bearer token                         |
| Password hashing | `bcryptjs` (10 salt rounds)                                              |
| Cross-origin     | `cors`, restricted to `http://localhost:3000`                            |

---

## 2. Project structure

```
server/
├── server.ts                 # Entry point — imports the app and starts listening
├── src/
│   ├── index.ts              # Express app setup: middleware, route mounting, health check
│   ├── config/
│   │   └── prisma.ts         # Prisma client singleton (reads DATABASE_URL)
│   ├── middlewares/
│   │   ├── auth.ts           # JWT verification — attaches req.user
│   │   └── errorHandler.ts   # Catch-all error handler (500 JSON response)
│   ├── utils/
│   │   ├── jwt.ts            # generateToken / verifyToken
│   │   └── bcrypt.ts         # hashPassword / comparePassword
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   ├── board.routes.ts
│   │   ├── column.routes.ts
│   │   └── task.routes.ts
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   ├── board.controller.ts
│   │   ├── column.controller.ts
│   │   └── task.controller.ts
│   └── prisma/
│       ├── schema.prisma     # Data model
│       └── seed.ts           # Demo data (7 users, 2 boards, columns, tasks)
├── Dockerfile
├── .dockerignore
├── .env.example
└── package.json
```

Every request flows: **route → `auth` middleware (except `/auth/*`) →
controller → Prisma → PostgreSQL**, with a global `errorHandler` catching
anything uncaught.

---

## 3. Database schema (`src/prisma/schema.prisma`)

```
User          — id, email (unique), password (hashed), name?, createdAt
Board         — id, title, ownerId → User, createdAt, updatedAt
BoardMember   — id, boardId → Board, userId → User   (@@unique([boardId, userId]))
Column        — id, title, order (Int), boardId → Board
Task          — id, title, description?, position (Int), columnId → Column, assigneeId? → User
```

- **Board ↔ User** is modeled two ways: `Board.ownerId` (single owner) and
  `BoardMember` (many-to-many share list). A user has access to a board if
  they are the owner **or** have a `BoardMember` row for it.
- **`order`** (Column) and **`position`** (Task) are plain integers, kept
  dense (`0..n-1`) per parent (per board for columns, per column for tasks).
  There is no gap-based/float-based ordering — reordering is done by shifting
  the integers of everything between the old and new index (see §6).

---

## 4. Authentication

- `POST /api/auth/register` — hashes the password with bcrypt, creates the
  `User`, returns the created user (no token — the client logs in right
  after registering).
- `POST /api/auth/login` — verifies email + password, returns `{ token, user }`.
  `token` is a JWT signed with `JWT_SECRET`, payload `{ id, email }`, 7-day
  expiry.
- All other routes require `Authorization: Bearer <token>`. The `auth`
  middleware (`src/middlewares/auth.ts`) verifies the token and attaches
  `req.user = { id, email }`; a missing/invalid token returns `401`.

---

## 5. API reference

Base path: `/api`. All responses follow the envelope
`{ success: boolean, message: string, data?/... }`.
Endpoints marked 🔒 require a valid Bearer token.

### Auth

| Method | Path             | Body                         | Success response                                    |
| ------ | ---------------- | ---------------------------- | --------------------------------------------------- |
| POST   | `/auth/register` | `{ email, password, name? }` | `201` `{ success, message, user: {id,email,name} }` |
| POST   | `/auth/login`    | `{ email, password }`        | `200` `{ success, message, token, user }`           |

### Boards

| Method | Path                                 | 🔒  | Body / Query            | Access rule            | Success response                                                                                               |
| ------ | ------------------------------------ | --- | ----------------------- | ---------------------- | -------------------------------------------------------------------------------------------------------------- |
| POST   | `/boards`                            | 🔒  | `{ title }`             | any authenticated user | `201` `{ success, message, id }`                                                                               |
| GET    | `/boards`                            | 🔒  | `?search=&page=&limit=` | owner or member        | `200` `{ data: { boards[], pagination } }`                                                                     |
| GET    | `/boards/:id`                        | 🔒  | —                       | owner or member        | `200` `{ data: board }` (includes owner, members, columns→tasks)                                               |
| PATCH  | `/boards/:boardId/title`             | 🔒  | `{ title }`             | **owner only**         | `200` `{ success, message, boardId }`                                                                          |
| POST   | `/boards/:id/share`                  | 🔒  | `{ userEmail }`         | **owner only**         | `200` `{ success, message }` — 404 if target user/board not found, 400 if already a member                     |
| DELETE | `/boards/:id/delete`                 | 🔒  | —                       | **owner only**         | `200` `{ success, message, boardId }` — cascades: deletes all tasks → columns → the board (single transaction) |
| DELETE | `/boards/:boardId/members/:memberId` | 🔒  | —                       | **owner only**         | `200` `{ success, message, memberId }` — 400 if trying to remove the owner, 404 if not a member                |

### Columns

| Method | Path                        | 🔒  | Body / Query                     | Access rule                                | Success response                                                                      |
| ------ | --------------------------- | --- | -------------------------------- | ------------------------------------------ | ------------------------------------------------------------------------------------- |
| POST   | `/columns`                  | 🔒  | `{ title, boardId }`             | owner or member of `boardId`               | `201` `{ success, message, columnId }` — `order` = last column's order + 1            |
| GET    | `/columns`                  | 🔒  | `?boardId=&search=&page=&limit=` | only columns of boards the user can access | `200` `{ data: { columns[], pagination } }`                                           |
| GET    | `/columns/:columnId`        | 🔒  | —                                | owner or member of the column's board      | `200` `{ data: { column } }`                                                          |
| PATCH  | `/columns/:columnId/update` | 🔒  | `{ title }`                      | owner or member                            | `200` `{ success, message, columnId }`                                                |
| DELETE | `/columns/:columnId/delete` | 🔒  | —                                | owner or member                            | `200` `{ success, message, columnId }` — cascades: deletes its tasks, then the column |

### Tasks

| Method | Path                  | 🔒  | Body / Query                            | Access rule                                      | Success response                                                                                                   |
| ------ | --------------------- | --- | --------------------------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| POST   | `/tasks`              | 🔒  | `{ title, description?, columnId }`     | owner or member of the column's board            | `201` `{ success, message, taskId }` — `position` = last task in column + 1; `assigneeId` defaults to the creator  |
| GET    | `/tasks`              | 🔒  | `?columnId=&search=&page=&limit=`       | only tasks in boards the user can access         | `200` `{ data: { tasks[], pagination } }`                                                                          |
| GET    | `/tasks/:taskId`      | 🔒  | —                                       | owner or member of the task's board              | `200` `{ data: task }`                                                                                             |
| PATCH  | `/tasks/:taskId`      | 🔒  | `{ title?, description?, assigneeId? }` | owner or member                                  | `200` `{ success, message, taskId }` — if `assigneeId` given, it must be the board's owner or a member, else `400` |
| DELETE | `/tasks/:taskId`      | 🔒  | —                                       | owner or member                                  | `200` `{ success, message, taskId }`                                                                               |
| PUT    | `/tasks/:taskId/move` | 🔒  | `{ targetColumnId, newPosition }`       | owner/member of **both** source and target board | `200` `{ success, message, taskId }` — see ordering logic below                                                    |

---

## 6. Task ordering / move logic (`moveTask`, `task.controller.ts`)

Two cases, both executed inside a single `prisma.$transaction`:

**a) Same column (reorder):**

- Validates `0 <= newPosition < <task count in column>`.
- If moving **down** (`oldPos < newPos`): every task with
  `oldPos < position <= newPos` gets `position -= 1`.
- If moving **up** (`oldPos > newPos`): every task with
  `newPos <= position < oldPos` gets `position += 1`.
- The moved task is then set to `position = newPos`.

**b) Different column (move across):**

- Validates `0 <= newPosition <= <task count in target column>`.
- Every task in the **source** column with `position > oldPos` gets
  `position -= 1` (closes the gap left behind).
- Every task in the **target** column with `position >= newPosition` gets
  `position += 1` (makes room).
- The moved task is updated to the new `columnId` and `position = newPosition`.

This keeps positions dense and gap-free after every move, with no read-modify-write
race between the shift and the final update since both happen in the same
transaction.

---

## 7. Environment variables (`.env`)

```
PORT=5000
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/kanban_db?schema=public"
JWT_SECRET="replace-with-a-long-random-secret-string"
```

Copy `.env.example` to `.env` and fill these in — `.env` is git-ignored.

---

## 8. Running locally (without Docker)

```bash
npm install
cp .env.example .env
# edit .env — point DATABASE_URL at your Postgres instance, set JWT_SECRET

npx prisma migrate dev --name init   # creates tables
npx prisma db seed                    # optional — demo data, all passwords: 123456

npm run dev        # ts-node-dev, http://localhost:5000
```

Other scripts:

- `npm run build` → compiles to `dist/` via `tsc`
- `npm start` → runs the compiled `dist/server.js` (production)

## 9. Running with Docker

From the repo root (not this folder):

```bash
docker compose up --build
```

The `server` service automatically runs `prisma migrate deploy` on
container start, then serves on `http://localhost:5000`. Seed manually if
needed:

```bash
docker compose exec server npx prisma db seed
```

---

## 10. Security notes

- Passwords: bcrypt, 10 rounds — never stored or returned in plaintext.
- JWT secret and DB URL are read only from environment variables — no
  credentials are hardcoded in source.
- CORS is restricted to a single allowed origin (`http://localhost:3000`);
  update `allowedOrigins` in `src/index.ts` for other frontend origins
  (e.g. a deployed URL).
- Every mutating endpoint re-checks board ownership/membership server-side —
  the frontend never has to be trusted for authorization.
