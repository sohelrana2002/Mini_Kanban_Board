"use client";

import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";
import { createPortal } from "react-dom";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  widthClass?: string;
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  widthClass = "max-w-md",
}: ModalProps) {
  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <button
        aria-label="Close dialog"
        className="absolute inset-0 bg-ink-950/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`relative w-full ${widthClass} rounded-2xl border border-ink-600 bg-ink-800 p-6 shadow-panel`}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-mist-100">
            {title}
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1.5 text-mist-500 transition hover:bg-ink-700 hover:text-mist-100"
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}
