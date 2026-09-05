"use client";

import { useMemo } from "react";
import { DragDropContext, type DropResult } from "@hello-pangea/dnd";
import { LayoutGrid } from "lucide-react";
import { AuthGuard } from "@/components/AuthGuard";
import { EmptyState } from "@/components/EmptyState";
import { BoardHeader } from "@/components/board/BoardHeader";
import { ColumnCard } from "@/components/board/ColumnCard";
import { AddColumnForm } from "@/components/board/AddColumnForm";
import { useBoardQuery } from "@/hooks/useBoards";
import { useMoveTask } from "@/hooks/useTasks";
import { useAuth } from "@/context/AuthContext";
import { extractErrorMessage } from "@/lib/axios";

function BoardView({ boardId }: { boardId: number }) {
  const { user } = useAuth();
  const { data, isLoading, isError, error } = useBoardQuery(boardId);
  const moveTask = useMoveTask(boardId);

  const board = data?.data;

  const members = useMemo(() => {
    if (!board) return [];
    return [board.owner, ...board.members.map((m) => m.user)];
  }, [board]);

  function handleDragEnd(result: DropResult) {
    const { source, destination, draggableId } = result;

    if (!destination) return;

    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    moveTask.mutate(
      {
        taskId: Number(draggableId),
        sourceColumnId: Number(source.droppableId),
        destinationColumnId: Number(destination.droppableId),
        destinationIndex: destination.index,
      },
      {
        onError: (err) =>
          console.log(extractErrorMessage(err, "Could not move the task")),
      },
    );
  }

  if (isLoading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="h-72 w-72 shrink-0 animate-pulse rounded-2xl border border-ink-700 bg-ink-800/60"
          />
        ))}
      </div>
    );
  }

  if (isError || !board) {
    return (
      <EmptyState
        icon={LayoutGrid}
        title="Board not found"
        description={extractErrorMessage(
          error,
          "This board doesn't exist, or you don't have access to it.",
        )}
      />
    );
  }

  return (
    <div>
      <BoardHeader board={board} currentUserId={user!.id} />

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex items-start gap-4 overflow-x-auto pb-4">
          {board.columns.map((column, index) => (
            <ColumnCard
              key={column.id}
              column={column}
              boardId={board.id}
              members={members}
              index={index}
            />
          ))}
          <AddColumnForm boardId={board.id} />
        </div>
      </DragDropContext>
    </div>
  );
}

export default function BoardDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const boardId = Number(params.id);

  return (
    <AuthGuard>
      <BoardView boardId={boardId} />
    </AuthGuard>
  );
}
