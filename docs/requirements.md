# Requirements Specification — Mini Kanban Board

| Field   | Value             |
| ------- | ----------------- |
| Project | Mini Kanban Board |
| Version | 1.0.0             |
| Author  | Sohel Rana        |
| Status  | Implemented (MVP) |

## 1. Introduction

### 1.1 Purpose

Mini Kanban Board is a full-stack web application for organising work visually. Users create boards, split them into columns (for example _To Do / In Progress / Done_), and manage tasks as cards that can be dragged between columns. Boards can be shared with other registered users for collaboration.

### 1.2 Scope

In scope: user authentication, board / column / task management, board sharing, task assignment, drag-and-drop ordering, search and pagination of boards.

Out of scope for v1.0: real-time sync between users, comments, attachments, labels, due dates, notifications, role levels beyond owner/member, password reset, email verification.

### 1.3 Definitions

| Term   | Meaning                                           |
| ------ | ------------------------------------------------- |
| Board  | A workspace owned by one user, containing columns |
| Column | A named stage on a board; ordered by `order`      |
| Task   | A card inside a column; ordered by `position`     |
| Owner  | The user who created the board                    |
| Member | A user the board has been shared with             |

## 2. User Roles

| Role         | Description                     | Permissions                                                                              |
| ------------ | ------------------------------- | ---------------------------------------------------------------------------------------- |
| Visitor      | Not logged in                   | Register, log in                                                                         |
| Board Member | Board has been shared with them | View board; create/rename/delete columns; create/update/delete/move tasks; assign tasks  |
| Board Owner  | Created the board               | Everything a member can do, plus rename board, delete board, share board, remove members |

## 3. Functional Requirements

### 3.1 Authentication

| ID        | Requirement                                                                                 |
| --------- | ------------------------------------------------------------------------------------------- |
| FR-AUTH-1 | A visitor can register with email, password and (optional) name.                            |
| FR-AUTH-2 | Email must be unique; duplicate registration is rejected.                                   |
| FR-AUTH-3 | A user can log in with email and password and receives a JWT valid for 7 days.              |
| FR-AUTH-4 | Passwords are stored only as bcrypt hashes.                                                 |
| FR-AUTH-5 | All endpoints except register, login and health require a valid Bearer token.               |
| FR-AUTH-6 | After registering, the user is logged in automatically.                                     |
| FR-AUTH-7 | On any 401 response (except login) the client clears the session and redirects to `/login`. |
| FR-AUTH-8 | A user can log out, which clears the stored session.                                        |

### 3.2 Boards

| ID       | Requirement                                                                                      |
| -------- | ------------------------------------------------------------------------------------------------ |
| FR-BRD-1 | A user can create a board with a title.                                                          |
| FR-BRD-2 | A user can list boards they own or that are shared with them.                                    |
| FR-BRD-3 | The board list supports title search (case-insensitive) and pagination (`page`, `limit`).        |
| FR-BRD-4 | A user can open a board and see its owner, members, columns and tasks (with assignees), ordered. |
| FR-BRD-5 | Only the owner can rename a board; the title cannot be empty.                                    |
| FR-BRD-6 | Only the owner can delete a board; its columns, tasks and memberships are deleted with it.       |
| FR-BRD-7 | Users without access to a board receive "not found" when requesting it.                          |

### 3.3 Board Sharing

| ID       | Requirement                                                            |
| -------- | ---------------------------------------------------------------------- |
| FR-SHR-1 | The owner can share a board with another registered user by email.     |
| FR-SHR-2 | Sharing fails if the email is unknown or the user is already a member. |
| FR-SHR-3 | The owner can remove a member; the owner themself cannot be removed.   |
| FR-SHR-4 | A shared board appears in the member's board list.                     |

### 3.4 Columns

| ID       | Requirement                                                                                |
| -------- | ------------------------------------------------------------------------------------------ |
| FR-COL-1 | Owner or member can create a column on a board; it is appended after the last column.      |
| FR-COL-2 | Owner or member can rename a column; title is required.                                    |
| FR-COL-3 | Owner or member can delete a column; its tasks are deleted with it.                        |
| FR-COL-4 | Columns can be listed (filter by `boardId`, search by title, paginated) and fetched by id. |

### 3.5 Tasks

| ID       | Requirement                                                                                                                                   |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| FR-TSK-1 | Owner or member can create a task (title, optional description) in a column; it is appended at the end and initially assigned to its creator. |
| FR-TSK-2 | Owner or member can edit title, description and assignee.                                                                                     |
| FR-TSK-3 | The assignee must be the board's owner or one of its members.                                                                                 |
| FR-TSK-4 | Owner or member can delete a task.                                                                                                            |
| FR-TSK-5 | Tasks can be listed (filter by `columnId`, search by title, paginated) and fetched by id.                                                     |
| FR-TSK-6 | Tasks can be moved within a column or to another column at a given position via drag and drop.                                                |
| FR-TSK-7 | After a move, positions in the affected columns remain dense (`0..n-1`) with no gaps or duplicates.                                           |
| FR-TSK-8 | The UI updates immediately on drop (optimistic update) and reconciles with the server.                                                        |

## 4. Non-Functional Requirements

| ID    | Category        | Requirement                                                                                                              |
| ----- | --------------- | ------------------------------------------------------------------------------------------------------------------------ |
| NFR-1 | Security        | Passwords hashed with bcrypt (10 salt rounds); JWT signed with a secret from the environment.                            |
| NFR-2 | Security        | Every board-scoped operation verifies owner/member access server-side.                                                   |
| NFR-3 | Security        | CORS restricted to an allow-list of origins (localhost, deployed frontends, Codespaces).                                 |
| NFR-4 | Data integrity  | Multi-step writes (move task, delete board, delete column) run in a database transaction.                                |
| NFR-5 | Performance     | List endpoints are paginated; counts and rows are fetched in parallel.                                                   |
| NFR-6 | Usability       | Responsive UI, toast feedback for every action, loading spinners, empty states, confirm dialogs for destructive actions. |
| NFR-7 | Portability     | Whole stack runs with a single `docker compose up --build`.                                                              |
| NFR-8 | Maintainability | TypeScript on client and server; layered backend (routes → controllers → Prisma).                                        |
| NFR-9 | Reliability     | Schema changes are versioned with Prisma migrations, applied automatically on server start in Docker.                    |

## 5. User Stories

1. As a visitor, I want to register and log in so that my boards are private to me.
2. As a user, I want to create a board so that I can organise a project.
3. As a user, I want to add columns so that I can model my workflow.
4. As a user, I want to add tasks and drag them between columns so that I can show progress.
5. As an owner, I want to share a board by email so that teammates can collaborate.
6. As an owner, I want to remove a member so that I can control who has access.
7. As a user, I want to assign a task to a teammate so that responsibility is clear.
8. As a user, I want to search my boards so that I can find one quickly.

## 6. Assumptions and Constraints

- Users are identified by unique email addresses.
- Owner and member have the same rights on columns and tasks; only owner-level actions differ (see Section 2).
- One owner per board; ownership cannot be transferred.
- PostgreSQL 16 and Node.js 18.18+ (20 recommended) are available.

## 7. Acceptance Criteria (summary)

- A new user can register, is redirected to `/boards`, and can create a board with columns and tasks.
- Dragging a task to another column or index persists after a page refresh, with positions `0..n-1`.
- A user who is not owner/member of a board cannot read or modify it (404/403).
- A non-owner calling rename, share, delete or remove-member receives 403/404 and nothing changes.
- `docker compose up --build` brings up database, API (port 5000) and client (port 3000) without manual steps.
