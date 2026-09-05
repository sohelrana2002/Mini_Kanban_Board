"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Trash2 } from "lucide-react";
import { Modal } from "../Modal";
import { ConfirmDialog } from "../ConfirmDialog";
import { useCreateTask, useDeleteTask, useUpdateTask } from "@/hooks/useTasks";
import { extractErrorMessage } from "@/lib/axios";
import type { ApiUser, Task } from "@/types";

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  boardId: number;
  columnId: number;
  members: ApiUser[];
  task?: Task | null;
}

export function TaskModal({
  isOpen,
  onClose,
  boardId,
  columnId,
  members,
  task,
}: TaskModalProps) {
  const isEditing = Boolean(task);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assigneeId, setAssigneeId] = useState<string>("");
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);

  const createTask = useCreateTask(boardId);
  const updateTask = useUpdateTask(boardId);
  const deleteTask = useDeleteTask(boardId);

  useEffect(() => {
    if (isOpen) {
      setTitle(task?.title ?? "");
      setDescription(task?.description ?? "");
      setAssigneeId(task?.assigneeId ? String(task.assigneeId) : "");
    }
  }, [isOpen, task]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    try {
      if (isEditing && task) {
        await updateTask.mutateAsync({
          taskId: task.id,
          payload: {
            title: title.trim(),
            description,
            assigneeId: assigneeId ? Number(assigneeId) : null,
          },
        });
      } else {
        await createTask.mutateAsync({
          title: title.trim(),
          description,
          columnId,
        });
      }
      onClose();
    } catch (err) {
      console.log(extractErrorMessage(err, "Could not save the task"));
    }
  }

  async function handleDelete() {
    if (!task) return;
    try {
      await deleteTask.mutateAsync(task.id);
      setIsConfirmDeleteOpen(false);
      onClose();
    } catch (err) {
      setIsConfirmDeleteOpen(false);
      console.log(extractErrorMessage(err, "Could not delete the task"));
    }
  }

  const isSaving = createTask.isPending || updateTask.isPending;

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={isEditing ? "Edit task" : "New task"}
        widthClass="max-w-lg"
      >
        <form onSubmit={handleSubmit}>
          <label className="mb-4 block">
            <span className="mb-1.5 block text-sm font-medium text-mist-300">
              Title
            </span>
            <input
              autoFocus
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              className="w-full rounded-lg border border-ink-500 bg-ink-900 px-3.5 py-2.5 text-sm text-mist-100 placeholder-mist-700 outline-none transition focus:border-amber-400/60"
            />
          </label>

          <label className="mb-4 block">
            <span className="mb-1.5 block text-sm font-medium text-mist-300">
              Description
            </span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add more detail (optional)"
              rows={4}
              className="w-full resize-none rounded-lg border border-ink-500 bg-ink-900 px-3.5 py-2.5 text-sm text-mist-100 placeholder-mist-700 outline-none transition focus:border-amber-400/60"
            />
          </label>

          <label className="mb-6 block">
            <span className="mb-1.5 block text-sm font-medium text-mist-300">
              Assignee
            </span>
            <select
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
              className="w-full rounded-lg border border-ink-500 bg-ink-900 px-3.5 py-2.5 text-sm text-mist-100 outline-none transition focus:border-amber-400/60"
            >
              <option value="">Unassigned</option>
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name || member.email}
                </option>
              ))}
            </select>
          </label>

          <div className="flex items-center justify-between">
            <div>
              {isEditing && (
                <button
                  type="button"
                  onClick={() => setIsConfirmDeleteOpen(true)}
                  className="flex items-center gap-1.5 rounded-lg border border-ink-600 px-3 py-2 text-sm text-rose-400 transition hover:bg-rose-500/10"
                >
                  <Trash2 size={15} />
                  Delete
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-ink-600 px-4 py-2 text-sm font-medium text-mist-300 transition hover:bg-ink-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="rounded-lg bg-amber-400 px-4 py-2 text-sm font-semibold text-ink-950 transition hover:bg-amber-500 disabled:opacity-60"
              >
                {isSaving ? "Saving…" : isEditing ? "Save changes" : "Add task"}
              </button>
            </div>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={isConfirmDeleteOpen}
        onClose={() => setIsConfirmDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete task?"
        description={`"${task?.title}" will be permanently removed from this board.`}
        confirmLabel="Delete task"
        isLoading={deleteTask.isPending}
      />
    </>
  );
}
