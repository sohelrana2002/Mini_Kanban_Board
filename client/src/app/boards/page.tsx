"use client";

import { Suspense, useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LayoutGrid, Plus, Search } from "lucide-react";
import { AuthGuard } from "@/components/AuthGuard";
import { BoardCard } from "@/components/BoardCard";
import { CreateBoardModal } from "@/components/CreateBoardModal";
import { EmptyState } from "@/components/EmptyState";
import { Pagination } from "@/components/Pagination";
import { useBoardsQuery } from "@/hooks/useBoards";

const LIMIT = 9;

function BoardsDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const page = Number(searchParams.get("page") || "1");
  const search = searchParams.get("search") || "";

  const [searchInput, setSearchInput] = useState(search);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Keep the local input in sync if the URL changes from elsewhere (e.g. back button).
  useEffect(() => setSearchInput(search), [search]);

  const { data, isLoading, isError } = useBoardsQuery({
    search,
    page,
    limit: LIMIT,
  });

  // Builds the next URL from the current query params using URLSearchParams,
  // so search text and page number both live in the address bar.
  function updateQuery(next: { search?: string; page?: number }) {
    const params = new URLSearchParams(searchParams.toString());

    if (next.search !== undefined) {
      if (next.search) params.set("search", next.search);
      else params.delete("search");
      params.set("page", "1");
    }

    if (next.page !== undefined) {
      params.set("page", String(next.page));
    }

    router.push(`/boards?${params.toString()}`);
  }

  function handleOnChange(event: React.ChangeEvent<HTMLInputElement>) {
    const value = event.target.value;
    setSearchInput(value);

    // Clear old timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // set new timeout
    timeoutRef.current = setTimeout(() => {
      updateQuery({ search: value.trim() });
    }, 500);
  }

  // Component unmount clear timer
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const boards = data?.data?.boards ?? [];
  const pagination = data?.data?.pagination;

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-mist-100">
            Your boards
          </h1>
          <p className="mt-1 text-sm text-mist-500">
            Boards you own or collaborate on.
          </p>
        </div>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center justify-center gap-2 rounded-lg bg-amber-400 px-4 py-2.5 text-sm font-semibold text-ink-950 transition hover:bg-amber-500"
        >
          <Plus size={16} />
          New board
        </button>
      </div>

      <div className="mb-6">
        <div className="relative max-w-sm">
          <Search
            size={16}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-mist-700"
          />
          <input
            type="search"
            value={searchInput}
            onChange={handleOnChange}
            placeholder="Search boards…"
            className="w-full rounded-lg border border-ink-500 bg-ink-800 py-2.5 pl-10 pr-3.5 text-sm text-mist-100 placeholder-mist-700 outline-none transition focus:border-amber-400/60"
          />
        </div>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-40 animate-pulse rounded-2xl border border-ink-700 bg-ink-800/60"
            />
          ))}
        </div>
      )}

      {isError && (
        <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-400">
          Couldn&apos;t load your boards. Try refreshing the page.
        </div>
      )}

      {!isLoading && !isError && boards.length === 0 && (
        <EmptyState
          icon={LayoutGrid}
          title={search ? "No boards match your search" : "No boards yet"}
          description={
            search
              ? "Try a different search term, or clear the search to see all boards."
              : "Create your first board to start organizing tasks with your team."
          }
          action={
            !search && (
              <button
                onClick={() => setIsCreateOpen(true)}
                className="rounded-lg bg-amber-400 px-4 py-2 text-sm font-semibold text-ink-950 transition hover:bg-amber-500"
              >
                Create a board
              </button>
            )
          }
        />
      )}

      {!isLoading && !isError && boards.length > 0 && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {boards.map((board) => (
              <BoardCard key={board.id} board={board} />
            ))}
          </div>
          {pagination && (
            <div className="mt-6">
              <Pagination
                pagination={pagination}
                onPageChange={(nextPage) => updateQuery({ page: nextPage })}
              />
            </div>
          )}
        </>
      )}

      <CreateBoardModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      />
    </div>
  );
}

export default function BoardsPage() {
  return (
    <AuthGuard>
      <Suspense fallback={null}>
        <BoardsDashboard />
      </Suspense>
    </AuthGuard>
  );
}
