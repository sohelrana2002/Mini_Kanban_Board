"use client";

import Link from "next/link";
import { LayoutGrid, LogOut } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Avatar } from "./Avatar";
import { useState } from "react";
import { ConfirmDialog } from "./ConfirmDialog";

export function Navbar() {
  const { user, logout } = useAuth();
  const [isLogoutOpen, setIsLogoutOpen] = useState<boolean>(false);

  return (
    <header className="sticky top-0 z-30 border-b border-ink-700 bg-ink-950/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/boards" className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-400 text-ink-950">
            <LayoutGrid size={17} strokeWidth={2.5} />
          </span>
          <span className="font-display text-lg font-semibold tracking-tight text-mist-100">
            Kanban
          </span>
        </Link>

        {user && (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2.5">
              <Avatar
                label={user.name || user.email}
                seed={user.id}
                size="sm"
              />
              <span className="hidden text-sm text-mist-300 sm:block">
                {user.name || user.email}
              </span>
            </div>
            <button
              onClick={() => setIsLogoutOpen(true)}
              className="flex items-center gap-1.5 rounded-lg border border-ink-600 px-3 py-1.5 text-sm text-mist-500 transition hover:border-rose-400/40 hover:text-rose-400"
            >
              <LogOut size={15} />
              <span className="hidden sm:inline">Log out</span>
            </button>
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={isLogoutOpen}
        onClose={() => setIsLogoutOpen(false)}
        onConfirm={logout}
        title="Logout from account?"
        description="Are you sure you want to logout? You will need to login again to access your boards and tasks"
        confirmLabel="Logout"
      />
    </header>
  );
}
