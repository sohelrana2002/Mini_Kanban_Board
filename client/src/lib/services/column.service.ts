import { api } from "@/lib/axios";

export async function createColumn(boardId: number, title: string) {
  const { data } = await api.post<{
    success: boolean;
    message: string;
    columnId: number;
  }>("/columns", { title, boardId });
  return data;
}

export async function updateColumn(columnId: number, title: string) {
  const { data } = await api.patch<{ success: boolean; message: string }>(
    `/columns/${columnId}/update`,
    { title },
  );
  return data;
}

export async function deleteColumn(columnId: number) {
  const { data } = await api.delete<{ success: boolean; message: string }>(
    `/columns/${columnId}/delete`,
  );
  return data;
}
