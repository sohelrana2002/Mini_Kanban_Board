"use client";

import { useState, type FormEvent } from "react";
import { Plus, X } from "lucide-react";
import { useCreateColumn } from "@/hooks/useColumns";
import { extractErrorMessage } from "@/lib/axios";

export function AddColumnForm({ boardId }: { boardId: number }) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const createColumn = useCreateColumn(boardId);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const trimmed = title.trim();
    if (!trimmed) return;

    createColumn.mutate(trimmed, {
      onSuccess: () => {
        setTitle("");
        setIsOpen(false);
      },
      onError: (err) =>
        console.log(extractErrorMessage(err, "Could not create the column")),
    });
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex h-fit w-72 shrink-0 items-center justify-center gap-2 rounded-2xl border border-dashed border-ink-500 py-4 text-sm text-mist-500 transition hover:border-amber-400/40 hover:text-amber-400"
      >
        <Plus size={16} />
        Add column
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="h-fit w-72 shrink-0 rounded-2xl border border-ink-600 bg-ink-800 p-3"
    >
      <input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => e.key === "Escape" && setIsOpen(false)}
        placeholder="Column name"
        className="w-full rounded-lg border border-ink-500 bg-ink-900 px-3 py-2 text-sm text-mist-100 placeholder-mist-700 outline-none focus:border-amber-400/60"
      />
      <div className="mt-2 flex gap-2">
        <button
          type="submit"
          disabled={createColumn.isPending}
          className="flex-1 rounded-lg bg-amber-400 py-1.5 text-sm font-semibold text-ink-950 transition hover:bg-amber-500 disabled:opacity-60"
        >
          Add
        </button>
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="flex items-center justify-center rounded-lg border border-ink-600 px-2.5 text-mist-500 transition hover:bg-ink-700"
          aria-label="Cancel"
        >
          <X size={15} />
        </button>
      </div>
    </form>
  );
}
