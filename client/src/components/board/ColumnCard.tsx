"use client";

import { useState } from "react";
import { Droppable } from "@hello-pangea/dnd";
import { Plus, Trash2, Pencil } from "lucide-react";
import type { ApiUser, Column, Task } from "@/types";
import { TaskCard } from "./TaskCard";
import { TaskModal } from "./TaskModal";
import { ConfirmDialog } from "../ConfirmDialog";
import { useDeleteColumn, useUpdateColumn } from "@/hooks/useColumns";
import { extractErrorMessage } from "@/lib/axios";
import { EditColumnTitle } from "./EditColumn";

const ACCENTS = [
  "bg-amber-400",
  "bg-teal-400",
  "bg-rose-400",
  "bg-violet-400",
  "bg-sky-400",
];

export function ColumnCard({
  column,
  boardId,
  members,
  index,
}: {
  column: Column;
  boardId: number;
  members: ApiUser[];
  index: number;
}) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const deleteColumn = useDeleteColumn(boardId);
  const accent = ACCENTS[index % ACCENTS.length];

  function openCreateTask() {
    setActiveTask(null);
    setIsTaskModalOpen(true);
  }

  function openEditTask(task: Task) {
    setActiveTask(task);
    setIsTaskModalOpen(true);
  }

  return (
    <div className="flex w-72 shrink-0 flex-col rounded-2xl border border-ink-600 bg-ink-800/70">
      <div className="flex items-center justify-between gap-2 px-3.5 pt-3.5">
        <div className="flex min-w-0 items-center gap-2">
          <span className={`h-2 w-2 shrink-0 rounded-full ${accent}`} />
          <h1 className="truncate text-left text-sm font-semibold">
            {column.title}
          </h1>

          <span className="shrink-0 rounded-full bg-ink-700 px-1.5 py-0.5 text-[11px] font-medium text-mist-500">
            {column.tasks.length}
          </span>
        </div>

        <div className="relative shrink-0 flex items-center gap-1">
          <button
            onClick={() => setIsEditingTitle(true)}
            className="flex items-center gap-1.5 rounded-lg border border-ink-600 px-3 py-2 text-sm text-mist-500 transition hover:border-green-400/40 hover:text-green-400"
            aria-label="Edit column"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={() => {
              setIsConfirmDeleteOpen(true);
            }}
            className="flex items-center gap-1.5 rounded-lg border border-ink-600 px-3 py-2 text-sm text-mist-500 transition hover:border-rose-400/40 hover:text-rose-400"
            aria-label="Delete board"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <Droppable droppableId={String(column.id)} type="TASK">
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`min-h-[60px] flex-1 px-3.5 py-3 transition ${
              snapshot.isDraggingOver ? "bg-ink-700/40" : ""
            }`}
          >
            {column.tasks.map((task, taskIndex) => (
              <TaskCard
                key={task.id}
                task={task}
                index={taskIndex}
                onClick={() => openEditTask(task)}
              />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>

      <div className="p-3 pt-0">
        <button
          onClick={openCreateTask}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-ink-500 py-2 text-sm text-mist-500 transition hover:border-amber-400/40 hover:text-amber-400"
        >
          <Plus size={15} />
          Add task
        </button>
      </div>

      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        boardId={boardId}
        columnId={column.id}
        members={members}
        task={activeTask}
      />

      <ConfirmDialog
        isOpen={isConfirmDeleteOpen}
        onClose={() => setIsConfirmDeleteOpen(false)}
        onConfirm={() => {
          deleteColumn.mutate(column.id, {
            onError: (err) =>
              console.log(
                extractErrorMessage(err, "Could not delete the column"),
              ),
          });
          setIsConfirmDeleteOpen(false);
        }}
        title="Delete column?"
        description={`"${column.title}" and all ${column.tasks.length} of its tasks will be removed.`}
        confirmLabel="Delete column"
        isLoading={deleteColumn.isPending}
      />

      {isEditingTitle && (
        <EditColumnTitle
          isOpen={isEditingTitle}
          onClose={() => setIsEditingTitle(false)}
          boardId={boardId}
          columnTitle={column.title}
          columnId={column.id}
        />
      )}
    </div>
  );
}
