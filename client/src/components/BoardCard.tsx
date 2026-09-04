"use client";

import Link from "next/link";
import { Columns3, ListChecks, Users } from "lucide-react";
import type { Board } from "@/types";
import { Avatar } from "./Avatar";

const ACCENTS = [
  "from-amber-400/15",
  "from-teal-400/15",
  "from-rose-400/15",
  "from-violet-400/15",
  "from-sky-400/15",
];

export function BoardCard({ board }: { board: Board }) {
  const taskCount = board.columns.reduce((sum, c) => sum + c.tasks.length, 0);
  const accent = ACCENTS[board.id % ACCENTS.length];
  const people = [board.owner, ...board.members.map((m) => m.user)];

  return (
    <Link
      href={`/boards/${board.id}`}
      className={`group relative flex flex-col overflow-hidden rounded-2xl border border-ink-600 bg-ink-800 p-5 shadow-panel transition hover:border-ink-400`}
    >
      <div
        className={`pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b ${accent} to-transparent`}
      />
      <div className="relative">
        <h3 className="font-display text-base font-semibold text-mist-100 group-hover:text-amber-400 transition line-clamp-1">
          {board.title}
        </h3>
        <p className="mt-1 text-xs text-mist-700">
          Owned by {board.owner.name || board.owner.email}
        </p>

        <div className="mt-5 flex items-center gap-4 text-xs text-mist-500">
          <span className="flex items-center gap-1.5">
            <Columns3 size={14} />
            {board.columns.length} columns
          </span>
          <span className="flex items-center gap-1.5">
            <ListChecks size={14} />
            {taskCount} tasks
          </span>
          <span className="flex items-center gap-1.5">
            <Users size={14} />
            {people.length}
          </span>
        </div>

        <div className="mt-4 flex -space-x-2">
          {people.slice(0, 4).map((person) => (
            <div key={person.id} className="ring-2 ring-ink-800 rounded-full">
              <Avatar label={person.name || person.email} seed={person.id} />
            </div>
          ))}
          {people.length > 4 && (
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-ink-700 text-[11px] font-medium text-mist-500 ring-2 ring-ink-800">
              +{people.length - 4}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
