"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Modal } from "../Modal";
import { useUpdateBoardTitle } from "@/hooks/useBoards";
import { extractErrorMessage } from "@/lib/axios";

export function EditBoardTitle({
  isOpen,
  onClose,
  boardId,
  boardTitle,
}: {
  isOpen: boolean;
  onClose: () => void;
  boardId: number;
  boardTitle: string;
}) {
  const [titleDraft, setTitleDraft] = useState(boardTitle);
  const updateTitle = useUpdateBoardTitle(boardId);

  useEffect(() => {
    setTitleDraft(boardTitle);
  }, [boardTitle]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    try {
      await updateTitle.mutateAsync(titleDraft.trim());
      setTitleDraft("");
      onClose();
    } catch (err) {
      console.log(extractErrorMessage(err, "Could not update the board"));
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit board">
      <form onSubmit={handleSubmit}>
        <label className="mb-6 block">
          <span className="mb-1.5 block text-sm font-medium text-mist-300">
            Board Title
          </span>
          <input
            type="text"
            required
            autoFocus
            value={titleDraft}
            onChange={(e) => setTitleDraft(e.target.value)}
            placeholder="Team Alpha"
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
            disabled={updateTitle.isPending}
            className="rounded-lg bg-amber-400 px-4 py-2 text-sm font-semibold text-ink-950 transition hover:bg-amber-500 disabled:opacity-60"
          >
            {updateTitle.isPending ? "Updating…" : "Update title"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
