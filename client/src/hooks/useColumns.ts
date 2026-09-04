import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createColumn,
  deleteColumn,
  updateColumn,
} from "@/lib/services/column.service";
import { boardKeys } from "./useBoards";
import { toast } from "react-toastify";

export function useCreateColumn(boardId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (title: string) => createColumn(boardId, title),
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: boardKeys.detail(boardId) });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message);
    },
  });
}

export function useUpdateColumn(boardId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ columnId, title }: { columnId: number; title: string }) =>
      updateColumn(columnId, title),
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: boardKeys.detail(boardId) });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message);
    },
  });
}

export function useDeleteColumn(boardId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (columnId: number) => deleteColumn(columnId),
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: boardKeys.detail(boardId) });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message);
    },
  });
}
