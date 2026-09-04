import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createBoard,
  deleteBoard,
  getBoardById,
  getBoards,
  removeBoardMember,
  shareBoard,
  updateBoardTitle,
  type GetBoardsParams,
} from "@/lib/services/board.service";
import { toast } from "react-toastify";

export const boardKeys = {
  all: ["boards"] as const,
  list: (params: GetBoardsParams) => ["boards", "list", params] as const,
  detail: (id: number | string) => ["boards", "detail", id] as const,
};

export function useBoardsQuery(params: GetBoardsParams) {
  return useQuery({
    queryKey: boardKeys.list(params),
    queryFn: () => getBoards(params),
  });
}

export function useBoardQuery(id: number | string) {
  return useQuery({
    queryKey: boardKeys.detail(id),
    queryFn: () => getBoardById(id),
    enabled: Boolean(id),
  });
}

export function useCreateBoard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (title: string) => createBoard(title),
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: boardKeys.all });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message);
    },
  });
}

export function useUpdateBoardTitle(boardId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (title: string) => updateBoardTitle(boardId, title),
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: boardKeys.detail(boardId) });
      queryClient.invalidateQueries({ queryKey: boardKeys.all });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message);
    },
  });
}

export function useShareBoard(boardId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userEmail: string) => shareBoard(boardId, userEmail),
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: boardKeys.detail(boardId) });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message);
    },
  });
}

export function useDeleteBoard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (boardId: number) => deleteBoard(boardId),
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: boardKeys.all });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message);
    },
  });
}

export function useRemoveBoardMember(boardId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (memberId: number) => removeBoardMember(boardId, memberId),
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: boardKeys.detail(boardId) });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message);
    },
  });
}
