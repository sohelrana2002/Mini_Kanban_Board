"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Trash2, UserPlus, X, Pencil } from "lucide-react";
import type { Board } from "@/types";
import { Avatar } from "../Avatar";
import { ShareBoardModal } from "./ShareBoardModal";
import { ConfirmDialog } from "../ConfirmDialog";
import { useDeleteBoard, useRemoveBoardMember } from "@/hooks/useBoards";
import { extractErrorMessage } from "@/lib/axios";
import Link from "next/link";
import { toast } from "react-toastify";
import { EditBoardTitle } from "./EditBoardTitle";

export function BoardHeader({
  board,
  currentUserId,
}: {
  board: Board;
  currentUserId: number;
}) {
  const router = useRouter();
  const isOwner = board.ownerId === currentUserId;

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const deleteBoard = useDeleteBoard();
  const removeMember = useRemoveBoardMember(board.id);

  function handleDeleteBoard() {
    deleteBoard.mutate(board.id, {
      onSuccess: () => router.push("/boards"),
      onError: (err) =>
        console.log(extractErrorMessage(err, "Could not delete the board")),
    });
  }

  const people = [
    { ...board.owner, isOwner: true, memberRecordId: null as number | null },
    ...board.members.map((m) => ({
      ...m.user,
      isOwner: false,
      memberRecordId: m.userId,
    })),
  ];

  return (
    <div className="mb-6">
      <Link
        href="/boards"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-mist-500 transition hover:text-mist-300"
      >
        <ArrowLeft size={15} />
        All boards
      </Link>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className={`font-display text-2xl font-semibold text-mist-100`}>
            {board.title}
          </h1>

          <p className="mt-1 text-sm text-mist-500">
            Owned by {board.owner.name || board.owner.email}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex -space-x-2">
            {people.map((person) => (
              <div key={person.id} className="group relative">
                <div className="ring-2 ring-ink-950 rounded-full">
                  <Avatar
                    label={person.name || person.email}
                    seed={person.id}
                    size="md"
                  />
                </div>
                {isOwner && !person.isOwner && person.memberRecordId && (
                  <button
                    onClick={() =>
                      removeMember.mutate(person.memberRecordId as number, {
                        onError: (err) =>
                          console.log(
                            extractErrorMessage(err, "Could not remove member"),
                          ),
                      })
                    }
                    aria-label={`Remove ${person.name || person.email}`}
                    className="absolute -right-1 -top-1 hidden h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-white group-hover:flex"
                  >
                    <X size={10} strokeWidth={3} />
                  </button>
                )}
              </div>
            ))}
          </div>

          {isOwner && (
            <>
              <button
                onClick={() => setIsShareOpen(true)}
                className="flex items-center gap-1.5 rounded-lg border border-ink-600 px-3 py-2 text-sm text-mist-300 transition hover:border-amber-400/40 hover:text-amber-400"
              >
                <UserPlus size={15} />
                <span className="hidden sm:inline">Share</span>
              </button>
              <button
                onClick={() => setIsDeleteOpen(true)}
                className="flex items-center gap-1.5 rounded-lg border border-ink-600 px-3 py-2 text-sm text-mist-500 transition hover:border-rose-400/40 hover:text-rose-400"
                aria-label="Delete board"
              >
                <Trash2 size={15} />
              </button>
              <button
                onClick={() => setIsEditingTitle(true)}
                className="flex items-center gap-1.5 rounded-lg border border-ink-600 px-3 py-2 text-sm text-mist-500 transition hover:border-rose-400/40 hover:text-rose-400"
                aria-label="Edit board"
              >
                <Pencil size={15} />
              </button>
            </>
          )}
        </div>
      </div>

      {isOwner && (
        <ShareBoardModal
          isOpen={isShareOpen}
          onClose={() => setIsShareOpen(false)}
          boardId={board.id}
        />
      )}

      {isOwner && (
        <EditBoardTitle
          isOpen={isEditingTitle}
          onClose={() => setIsEditingTitle(false)}
          boardId={board.id}
          boardTitle={board.title}
        />
      )}

      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteBoard}
        title="Delete this board?"
        description={`"${board.title}" and everything in it will be permanently deleted for all members.`}
        confirmLabel="Delete board"
        isLoading={deleteBoard.isPending}
      />
    </div>
  );
}
