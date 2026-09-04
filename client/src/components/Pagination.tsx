"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Pagination as PaginationType } from "@/types";

export function Pagination({
  pagination,
  onPageChange,
}: {
  pagination: PaginationType;
  onPageChange: (page: number) => void;
}) {
  const { page, totalPages, total, limit } = pagination;

  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  return (
    <div className="flex items-center justify-between border-t border-ink-700 pt-4 text-sm text-mist-500">
      <span>
        Showing{" "}
        <span className="text-mist-300">
          {start}-{end}
        </span>{" "}
        of <span className="text-mist-300">{total}</span>
      </span>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-ink-600 text-mist-300 transition hover:border-amber-400/50 hover:text-amber-400 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-ink-600 disabled:hover:text-mist-300"
          aria-label="Previous page"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="px-2 text-mist-300">
          {page} / {totalPages}
        </span>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-ink-600 text-mist-300 transition hover:border-amber-400/50 hover:text-amber-400 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-ink-600 disabled:hover:text-mist-300"
          aria-label="Next page"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
