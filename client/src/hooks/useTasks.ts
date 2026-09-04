import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createTask,
  deleteTask,
  moveTask,
  updateTask,
  type CreateTaskPayload,
  type MoveTaskPayload,
  type UpdateTaskPayload,
} from "@/lib/services/task.service";
import { boardKeys } from "./useBoards";
import type { ApiEnvelope, Board, Task } from "@/types";
import { toast } from "react-toastify";

export function useCreateTask(boardId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateTaskPayload) => createTask(payload),
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: boardKeys.detail(boardId) });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message);
    },
  });
}

export function useUpdateTask(boardId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      taskId,
      payload,
    }: {
      taskId: number;
      payload: UpdateTaskPayload;
    }) => updateTask(taskId, payload),
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: boardKeys.detail(boardId) });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message);
    },
  });
}

export function useDeleteTask(boardId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (taskId: number) => deleteTask(taskId),
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: boardKeys.detail(boardId) });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message);
    },
  });
}

interface MoveTaskArgs {
  taskId: number;
  sourceColumnId: number;
  destinationColumnId: number;
  destinationIndex: number;
}

/** Reorders a board's columns/tasks in place, mirroring the backend's position logic. */
function reorderBoard(
  board: Board,
  {
    taskId,
    sourceColumnId,
    destinationColumnId,
    destinationIndex,
  }: MoveTaskArgs,
): Board {
  const columns = board.columns.map((column) => ({
    ...column,
    tasks: [...column.tasks],
  }));

  const sourceColumn = columns.find((c) => c.id === sourceColumnId);
  const destColumn = columns.find((c) => c.id === destinationColumnId);
  if (!sourceColumn || !destColumn) return board;

  const taskIndex = sourceColumn.tasks.findIndex((t) => t.id === taskId);
  if (taskIndex === -1) return board;

  const [movedTask] = sourceColumn.tasks.splice(taskIndex, 1);
  const updatedTask: Task = { ...movedTask, columnId: destinationColumnId };
  destColumn.tasks.splice(destinationIndex, 0, updatedTask);

  // Re-derive contiguous positions to match the server's expectations.
  sourceColumn.tasks = sourceColumn.tasks.map((task, index) => ({
    ...task,
    position: index,
  }));
  destColumn.tasks = destColumn.tasks.map((task, index) => ({
    ...task,
    position: index,
  }));

  return { ...board, columns };
}

export function useMoveTask(boardId: number) {
  const queryClient = useQueryClient();
  const queryKey = boardKeys.detail(boardId);

  return useMutation({
    mutationFn: (args: MoveTaskArgs) =>
      moveTask(args.taskId, {
        targetColumnId: args.destinationColumnId,
        newPosition: args.destinationIndex,
      } satisfies MoveTaskPayload),
    onMutate: async (args: MoveTaskArgs) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<ApiEnvelope<Board>>(queryKey);

      if (previous?.data) {
        queryClient.setQueryData<ApiEnvelope<Board>>(queryKey, {
          ...previous,
          data: reorderBoard(previous.data, args),
        });
      }

      return { previous };
    },
    onError: (_err, _args, context) => {
      // Roll back the optimistic reorder; the caller decides whether to toast.
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
}
