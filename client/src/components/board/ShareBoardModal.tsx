"use client";

import { useState, type FormEvent } from "react";
import { Modal } from "../Modal";
import { useShareBoard } from "@/hooks/useBoards";
import { extractErrorMessage } from "@/lib/axios";

export function ShareBoardModal({
  isOpen,
  onClose,
  boardId,
}: {
  isOpen: boolean;
  onClose: () => void;
  boardId: number;
}) {
  const [email, setEmail] = useState("");
  const shareBoard = useShareBoard(boardId);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    try {
      await shareBoard.mutateAsync(email.trim());
      setEmail("");
      onClose();
    } catch (err) {
      console.log(extractErrorMessage(err, "Could not share the board"));
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Share board">
      <form onSubmit={handleSubmit}>
        <label className="mb-6 block">
          <span className="mb-1.5 block text-sm font-medium text-mist-300">
            Invite by email
          </span>
          <input
            type="email"
            required
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="teammate@example.com"
            className="w-full rounded-lg border border-ink-500 bg-ink-900 px-3.5 py-2.5 text-sm text-mist-100 placeholder-mist-700 outline-none transition focus:border-amber-400/60"
          />
          <span className="mt-1.5 block text-xs text-mist-700">
            They must already have an account on this app.
          </span>
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
            disabled={shareBoard.isPending}
            className="rounded-lg bg-amber-400 px-4 py-2 text-sm font-semibold text-ink-950 transition hover:bg-amber-500 disabled:opacity-60"
          >
            {shareBoard.isPending ? "Sharing…" : "Share board"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
