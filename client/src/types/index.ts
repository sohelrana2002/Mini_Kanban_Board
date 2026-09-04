export interface ApiUser {
  id: number;
  email: string;
  name: string | null;
}

export interface BoardMember {
  id: number;
  boardId: number;
  userId: number;
  user: ApiUser;
}

export interface Task {
  id: number;
  title: string;
  description: string | null;
  position: number;
  columnId: number;
  assigneeId: number | null;
  assignee?: ApiUser | null;
  column?: { id: number; title: string; boardId: number };
}

export interface Column {
  id: number;
  title: string;
  order: number;
  boardId: number;
  tasks: Task[];
  board?: { id: number; title: string; ownerId: number };
}

export interface Board {
  id: number;
  title: string;
  createdAt: string;
  updatedAt: string;
  ownerId: number;
  owner: ApiUser;
  members: BoardMember[];
  columns: Column[];
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data?: T;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  token: string;
  user: ApiUser;
}

export interface BoardsListData {
  boards: Board[];
  pagination: Pagination;
}
