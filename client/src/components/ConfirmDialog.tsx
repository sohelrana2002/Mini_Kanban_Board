"use client";

import { Modal } from "./Modal";

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirm",
  isDangerous = true,
  isLoading = false,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  isDangerous?: boolean;
  isLoading?: boolean;
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} widthClass="max-w-sm">
      <p className="text-sm text-mist-500">{description}</p>
      <div className="mt-6 flex justify-end gap-2">
        <button
          onClick={onClose}
          className="rounded-lg border border-ink-600 px-4 py-2 text-sm font-medium text-mist-300 transition hover:bg-ink-700"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={isLoading}
          className={`rounded-lg px-4 py-2 text-sm font-semibold transition disabled:opacity-60 ${
            isDangerous
              ? "bg-rose-500/90 text-white hover:bg-rose-500"
              : "bg-amber-400 text-ink-950 hover:bg-amber-500"
          }`}
        >
          {isLoading ? "Working…" : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
