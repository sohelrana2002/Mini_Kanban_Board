# API Design — Mini Kanban Board

## 1. General

| Item             | Value                                                                                           |
| ---------------- | ----------------------------------------------------------------------------------------------- |
| Style            | REST over HTTP, JSON bodies                                                                     |
| Base URL (local) | `http://localhost:5000/api`                                                                     |
| Auth             | `Authorization: Bearer <JWT>` (token from `POST /auth/login`, valid 7 days)                     |
| Content type     | `Content-Type: application/json`                                                                |
| IDs              | Integers                                                                                        |
| Public endpoints | `POST /auth/register`, `POST /auth/login`, `GET /health`, `GET /` (server root, outside `/api`) |

### 1.1 Response envelope

Success:

```json
{
  "success": true,
  "message": "Human readable message",
  "...": "endpoint specific fields"
}
```

Read endpoints return payload under `data`. Write endpoints return a small summary such as `id`, `boardId`, `columnId` or `taskId`.

Error:

```json
{
  "success": false,
  "message": "What went wrong"
}
```

### 1.2 Status codes

| Code | Meaning in this API                                                               |
| ---- | --------------------------------------------------------------------------------- |
| 200  | OK                                                                                |
| 201  | Created                                                                           |
| 400  | Bad input (missing title, invalid id/position, duplicate member, duplicate email) |
| 401  | Missing/invalid token, or wrong login credentials                                 |
| 403  | Authenticated but no access to the resource, or owner-only action                 |
| 404  | Resource not found (or, for boards/columns, not accessible to the caller)         |
| 500  | Unexpected server error                                                           |

### 1.3 Pagination and search

List endpoints accept `page` (default 1), `limit` (default 10) and `search` (case-insensitive "contains" on title) and return:

```json
"pagination": {
    "total": 25,
    "page": 1,
    "limit": 10,
    "totalPages": 3
}
```

### 1.4 Access rules

- **Has access** = board owner or board member.
- **Owner only**: rename board, delete board, share board, remove member.
- Column/task endpoints apply the access check to the parent board.

---

## 2. Auth

### POST `/auth/register`

Create an account.

Body

```json
{
  "email": "sohel@test.com",
  "password": "123456",
  "name": "Sohel Rana"
}
```

`201`

```json
{
  "success": true,
  "message": "User created successfully",
  "user": {
    "id": 1,
    "email": "sohel@test.com",
    "name": "Sohel Rana"
  }
}
```

Errors: `400` "User already exists"; `500`.

### POST `/auth/login`

Body

```json
{
  "email": "sohel@test.com",
  "password": "123456"
}
```

`200`

```json
{
  "success": true,
  "message": "User login successfully",
  "token": "<jwt>",
  "user": {
    "id": 1,
    "email": "sohel@test.com",
    "name": "Sohel Rana"
  }
}
```

Errors: `401` "Invalid credentials" (same message for unknown email and wrong password).

JWT payload: `{ id, email, iat, exp }`, signed with `JWT_SECRET`.

---

## 3. Boards

### POST `/boards`

Create a board. Body: `{ "title": "Website Redesign" }`
`201`: `{ "success": true, "message": "Board created successfully", "id": 12 }`

### GET `/boards`

List boards the user owns or is a member of, newest first, each with owner, members, columns and tasks.

| Query    | Type   | Default | Description                       |
| -------- | ------ | ------- | --------------------------------- |
| `search` | string | none    | Title contains (case-insensitive) |
| `page`   | int    | 1       | Page number                       |
| `limit`  | int    | 10      | Items per page                    |

`200`

```json
{
  "success": true,
  "message": "Fetch all boards successfully",
  "data": {
    "boards": [
      {
        "id": 12,
        "title": "Website Redesign",
        "createdAt": "...",
        "updatedAt": "...",
        "ownerId": 1,
        "owner": {
          "id": 1,
          "name": "Sohel Rana",
          "email": "sohel@test.com"
        },
        "members": [
          {
            "id": 3,
            "boardId": 12,
            "userId": 2,
            "user": { "id": 2, "name": "...", "email": "..." }
          }
        ],
        "columns": [
          {
            "id": 5,
            "title": "To Do",
            "order": 0,
            "boardId": 12,
            "tasks": []
          }
        ]
      }
    ],
    "pagination": {
      "total": 1,
      "page": 1,
      "limit": 10,
      "totalPages": 1
    }
  }
}
```

When nothing matches, `200` with an empty `boards` array and `message: "No boards found for this user"`.

### GET `/boards/:id`

Full board with owner, members, ordered columns and ordered tasks (each task includes `assignee`).
`200`: `{ "success": true, "message": "Individual board fetch successfully", "data": { ...board } }`
Errors: `404` "Board not found" (also when the caller has no access).

### PATCH `/boards/:boardId/title` (owner only)

Body: `{ "title": "New title" }` (trimmed; must not be empty)
`200`: `{ "success": true, "message": "Board title updated successfully", "boardId": 12 }`
Errors: `400` "Title is required"; `403` "You are not the owner of this board"; `404` "Board not found".

### POST `/boards/:id/share` (owner only)

Body: `{ "userEmail": "fahim@test.com" }`
`200`: `{ "success": true, "message": "Board shared with fahim@test.com" }`
Errors: `404` "Board not found or you are not the owner" / "User not found"; `400` "User already exist to this board".

### DELETE `/boards/:id/delete` (owner only)

Deletes the board, its columns, tasks and memberships in one transaction.
`200`: `{ "success": true, "message": "Board deleted successfully", "boardId": "12" }`
Errors: `404` "Board not found or you are not the owner".

### DELETE `/boards/:boardId/members/:memberId` (owner only)

`:memberId` is the **user id** of the member (not the `BoardMember` row id).
`200`: `{ "success": true, "message": "Member removed from the board successfully", "memberId": 2 }`
Errors: `400` "Board ID and Member ID required" / "Cannot remove the board owner"; `403` "Only the board owner can remove members"; `404` "Board not found" / "User is not a member of this board".

---

## 4. Columns

### POST `/columns`

Body: `{ "title": "In Progress", "boardId": 12 }` — appended after the last column.
`201`: `{ "success": true, "message": "Column created successfully", "columnId": 7 }`
Errors: `403` "Don't have access to create column".

### GET `/columns`

| Query                     | Description                |
| ------------------------- | -------------------------- |
| `boardId`                 | Only columns of this board |
| `search`, `page`, `limit` | As in 1.3                  |

`200`: `data: { columns: [ { ...column, board: { id, title, ownerId }, tasks: [ { ...task, assignee } ] } ], pagination }`
Only columns of boards the caller can access are returned. Sorted by `boardId`, then `order`.

### GET `/columns/:columnId`

`200`: `{ "success": true, "message": "Column fetched successfully", "data": { "column": { ... } } }`
Errors: `400` "Invalid column ID"; `404` "Column not found or you don't have access".

### PATCH `/columns/:columnId/update`

Body: `{ "title": "Review" }`
`200`: `{ "success": true, "message": "Column updated successfully", "columnId": 7 }`
Errors: `400` "Invalid column ID" / "Title is required"; `404` "Column not found or you don't have access to update it".

### DELETE `/columns/:columnId/delete`

Deletes the column and all its tasks in one transaction.
`200`: `{ "success": true, "message": "Successfully deleted Column", "columnId": 7 }`
Errors: `404` "Column not found or you don't have access to delete it".

---

## 5. Tasks

### POST `/tasks`

Body: `{ "title": "Design login page", "description": "Match Figma", "columnId": 5 }`
The task is appended to the column and **assigned to the creator** initially.
`201`: `{ "success": true, "message": "Created task successfully", "taskId": 41 }`
Errors: `404` "Column not found"; `403` "Don't have access to create task".

### GET `/tasks`

| Query                     | Description                                                      |
| ------------------------- | ---------------------------------------------------------------- |
| `columnId`                | Only tasks of this column (caller must have access to its board) |
| `search`, `page`, `limit` | As in 1.3 (search on task title)                                 |

Without `columnId`, tasks from all accessible boards are returned.
`200`: `data: { tasks: [ { ...task, column: { id, title, boardId }, assignee } ], pagination }`
Errors: `404` "Column not found"; `403` "You don't have access to this column's board".

### GET `/tasks/:taskId`

`200`: `{ "success": true, "message": "Task fetched successfully", "data": { ...task, "column": { ..., "board": { "title": "..." } }, "assignee": { ... } } }`
Errors: `400` "Invalid task ID"; `404` "Task not found"; `403` "You don't have access to this task's board".

### PATCH `/tasks/:taskId`

Partial update. Body (all optional): `{ "title": "...", "description": "...", "assigneeId": 2 }`.
`assigneeId` must be the board owner or a member; send `null` to unassign.
`200`: `{ "success": true, "message": "Task updated successfully", "taskId": 41 }`
Errors: `400` "Invalid task ID" / "Assignee must be a member or owner of the board"; `404` "Task not found"; `403` "You don't have access to update this task".

### DELETE `/tasks/:taskId`

`200`: `{ "success": true, "message": "Deleted task successfully", "taskId": "41" }`
Errors: `404` "Task not found"; `403` "Don't have access to delete task".

### PUT `/tasks/:taskId/move`

Move within a column or to another column.

Body

```json
{ "targetColumnId": 6, "newPosition": 0 }
```

| Case             | Valid `newPosition`                                                       |
| ---------------- | ------------------------------------------------------------------------- |
| Same column      | `0` to `n-1` (n = tasks in the column)                                    |
| Different column | `0` to `m` (m = tasks currently in the target column; `m` means "append") |

`200`: `{ "success": true, "message": "Task moved successfully", "taskId": "41" }`
Errors: `400` "Invalid position"; `403` "Don't access to move task" / "Don't access to target board"; `404` "Task not found" / "Target column not found".
All position updates happen in one transaction (algorithm: _System Architecture §5.4_).

---

## 6. Health

| Method | Path          | Response                                             |
| ------ | ------------- | ---------------------------------------------------- |
| GET    | `/`           | `{ "status": "OK", "message": "Server is Live" }`    |
| GET    | `/api/health` | `{ "status": "OK", "message": "Server is running" }` |

---

## 7. Endpoint Summary

| #   | Method | Path                                 | Auth | Role         |
| --- | ------ | ------------------------------------ | ---- | ------------ |
| 1   | POST   | `/auth/register`                     | No   | Any          |
| 2   | POST   | `/auth/login`                        | No   | Any          |
| 3   | POST   | `/boards`                            | Yes  | Any user     |
| 4   | GET    | `/boards`                            | Yes  | Owner/member |
| 5   | GET    | `/boards/:id`                        | Yes  | Owner/member |
| 6   | PATCH  | `/boards/:boardId/title`             | Yes  | Owner        |
| 7   | POST   | `/boards/:id/share`                  | Yes  | Owner        |
| 8   | DELETE | `/boards/:id/delete`                 | Yes  | Owner        |
| 9   | DELETE | `/boards/:boardId/members/:memberId` | Yes  | Owner        |
| 10  | POST   | `/columns`                           | Yes  | Owner/member |
| 11  | GET    | `/columns`                           | Yes  | Owner/member |
| 12  | GET    | `/columns/:columnId`                 | Yes  | Owner/member |
| 13  | PATCH  | `/columns/:columnId/update`          | Yes  | Owner/member |
| 14  | DELETE | `/columns/:columnId/delete`          | Yes  | Owner/member |
| 15  | POST   | `/tasks`                             | Yes  | Owner/member |
| 16  | GET    | `/tasks`                             | Yes  | Owner/member |
| 17  | GET    | `/tasks/:taskId`                     | Yes  | Owner/member |
| 18  | PATCH  | `/tasks/:taskId`                     | Yes  | Owner/member |
| 19  | DELETE | `/tasks/:taskId`                     | Yes  | Owner/member |
| 20  | PUT    | `/tasks/:taskId/move`                | Yes  | Owner/member |
| 21  | GET    | `/health`                            | No   | Any          |

## 8. Design Notes and Possible Improvements

- Paths such as `/boards/:id/delete` and `/columns/:columnId/update` embed the verb; a stricter REST style would use `DELETE /boards/:id` and `PATCH /columns/:columnId`. Kept as-is to match the implementation.
- Request bodies are only lightly validated (missing `title`, invalid ids/positions). Adding schema validation (e.g. Zod) would return consistent `400`s, for example for missing `email`/`password` on register.
- Errors thrown outside controller `try/catch` blocks are handled by the global handler as `500`.
- Consider versioning (`/api/v1`) and rate limiting on `/auth/*`.
