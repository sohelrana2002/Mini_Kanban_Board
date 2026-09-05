"use client";

import { ChangeEvent, useState, type FormEvent } from "react";
import Link from "next/link";
import { LayoutGrid, LogIn } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const [loginForm, setLoginForm] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleOnChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;

    setLoginForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await login(loginForm.email, loginForm.password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isAuthenticated) return router.replace("/boards");

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-950 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-amber-400 text-ink-950">
            <LayoutGrid size={22} strokeWidth={2.5} />
          </span>
          <h1 className="font-display text-2xl font-semibold text-mist-100">
            Welcome back
          </h1>
          <p className="mt-1.5 text-sm text-mist-500">
            Sign in to get to your boards.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-ink-600 bg-ink-800 p-6 shadow-panel"
        >
          {error && (
            <div className="mb-4 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-400">
              {error}
            </div>
          )}

          <label className="mb-4 block">
            <span className="mb-1.5 block text-sm font-medium text-mist-300">
              Email
            </span>
            <input
              type="email"
              required
              value={loginForm.email}
              name="email"
              onChange={handleOnChange}
              placeholder="you@example.com"
              className="w-full rounded-lg border border-ink-500 bg-ink-900 px-3.5 py-2.5 text-sm text-mist-100 placeholder-mist-700 outline-none transition focus:border-amber-400/60"
            />
          </label>

          <label className="mb-6 block">
            <span className="mb-1.5 block text-sm font-medium text-mist-300">
              Password
            </span>
            <input
              type="password"
              required
              value={loginForm.password}
              name="password"
              onChange={handleOnChange}
              placeholder="••••••••"
              className="w-full rounded-lg border border-ink-500 bg-ink-900 px-3.5 py-2.5 text-sm text-mist-100 placeholder-mist-700 outline-none transition focus:border-amber-400/60"
            />
          </label>

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-amber-400 py-2.5 text-sm font-semibold text-ink-950 transition hover:bg-amber-500 disabled:opacity-60"
          >
            <LogIn size={16} />
            {isSubmitting ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-mist-500">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="font-medium text-amber-400 hover:underline"
          >
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
