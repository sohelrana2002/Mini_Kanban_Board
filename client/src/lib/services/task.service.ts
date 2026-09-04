import { api } from "@/lib/axios";

export interface CreateTaskPayload {
  title: string;
  description?: string;
  columnId: number;
}

export interface UpdateTaskPayload {
  title?: string;
  description?: string;
  assigneeId?: number | null;
}

export interface MoveTaskPayload {
  targetColumnId: number;
  newPosition: number;
}

export async function createTask(payload: CreateTaskPayload) {
  const { data } = await api.post<{
    success: boolean;
    message: string;
    taskId: number;
  }>("/tasks", payload);
  return data;
}

export async function updateTask(
  taskId: number,
  payload: UpdateTaskPayload,
) {
  const { data } = await api.patch<{ success: boolean; message: string }>(
    `/tasks/${taskId}`,
    payload,
  );
  return data;
}

export async function deleteTask(taskId: number) {
  const { data } = await api.delete<{ success: boolean; message: string }>(
    `/tasks/${taskId}`,
  );
  return data;
}

export async function moveTask(taskId: number, payload: MoveTaskPayload) {
  const { data } = await api.put<{ success: boolean; message: string }>(
    `/tasks/${taskId}/move`,
    payload,
  );
  return data;
}
