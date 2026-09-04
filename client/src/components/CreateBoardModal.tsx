"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "./Modal";
import { useCreateBoard } from "@/hooks/useBoards";
import { extractErrorMessage } from "@/lib/axios";

export function CreateBoardModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [title, setTitle] = useState("");
  const createBoard = useCreateBoard();
  const router = useRouter();

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    try {
      const result = await createBoard.mutateAsync(title.trim());
      setTitle("");
      onClose();
      router.push(`/boards/${result.id}`);
    } catch (err) {
      console.log(extractErrorMessage(err, "Could not create the board"));
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New board">
      <form onSubmit={handleSubmit}>
        <label className="mb-6 block">
          <span className="mb-1.5 block text-sm font-medium text-mist-300">
            Board title
          </span>
          <input
            autoFocus
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Product Launch Q4"
            className="w-full rounded-lg border border-ink-500 bg-ink-900 px-3.5 py-2.5 text-sm text-mist-100 placeholder-mist-700 outline-none transition focus:border-amber-400/60"
          />
        </label>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-ink-600 px-4 py-2 text-sm font-medium text-mist-300 transition hover:bg-ink-700"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={createBoard.isPending}
            className="rounded-lg bg-amber-400 px-4 py-2 text-sm font-semibold text-ink-950 transition hover:bg-amber-500 disabled:opacity-60"
          >
            {createBoard.isPending ? "Creating…" : "Create board"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
