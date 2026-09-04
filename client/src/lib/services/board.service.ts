import { api } from "@/lib/axios";
import { buildQueryString } from "@/lib/query-string";
import type { ApiEnvelope, Board, BoardsListData } from "@/types";

export interface GetBoardsParams {
  search?: string;
  page?: number;
  limit?: number;
}

export async function getBoards(params: GetBoardsParams = {}) {
  const query = buildQueryString({
    search: params.search,
    page: params.page,
    limit: params.limit,
  });

  const { data } = await api.get<ApiEnvelope<BoardsListData>>(
    `/boards${query}`,
  );
  return data;
}

export async function getBoardById(id: number | string) {
  const { data } = await api.get<ApiEnvelope<Board>>(`/boards/${id}`);

  return data;
}

export async function createBoard(title: string) {
  const { data } = await api.post<{
    success: boolean;
    message: string;
    id: number;
  }>("/boards", { title });

  return data;
}

export async function updateBoardTitle(boardId: number, title: string) {
  const { data } = await api.patch<{ success: boolean; message: string }>(
    `/boards/${boardId}/title`,
    { title },
  );

  return data;
}

export async function shareBoard(boardId: number, userEmail: string) {
  const { data } = await api.post<{ success: boolean; message: string }>(
    `/boards/${boardId}/share`,
    { userEmail },
  );

  return data;
}

export async function deleteBoard(boardId: number) {
  const { data } = await api.delete<{ success: boolean; message: string }>(
    `/boards/${boardId}/delete`,
  );

  return data;
}

export async function removeBoardMember(boardId: number, memberId: number) {
  const { data } = await api.delete<{ success: boolean; message: string }>(
    `/boards/${boardId}/members/${memberId}`,
  );

  return data;
}
