"use client";

import { LayoutGrid } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export function Footer() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading || !isAuthenticated) return null;

  return (
    <footer className="border-t border-ink-700 bg-ink-950/85">
      <div className="mx-auto max-w-6xl flex items-center justify-center px-6 py-5 text-sm text-mist-500 sm:flex-row">
        <p>
          &copy; {new Date().getFullYear()} Sohel Rana. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
