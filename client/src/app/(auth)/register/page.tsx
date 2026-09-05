"use client";

import { ChangeEvent, useState, type FormEvent } from "react";
import Link from "next/link";
import { UserPlus } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const { register, isAuthenticated } = useAuth();
  const [userForm, setUserForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleOnChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setUserForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    setError(null);
    setIsSubmitting(true);

    try {
      await register(userForm.email, userForm.password, userForm.name);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isAuthenticated) router.replace("/boards");

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-950 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <h1 className="font-display text-2xl font-semibold text-mist-100">
            Create your account
          </h1>
          <p className="mt-1.5 text-sm text-mist-500">
            Start organizing work with your team.
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
              Name
            </span>
            <input
              type="text"
              required
              value={userForm.name}
              onChange={handleOnChange}
              placeholder="Your name"
              name="name"
              className="w-full rounded-lg border border-ink-500 bg-ink-900 px-3.5 py-2.5 text-sm text-mist-100 placeholder-mist-700 outline-none transition focus:border-amber-400/60"
            />
          </label>

          <label className="mb-4 block">
            <span className="mb-1.5 block text-sm font-medium text-mist-300">
              Email
            </span>
            <input
              type="email"
              required
              value={userForm.email}
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
              minLength={6}
              value={userForm.password}
              name="password"
              onChange={handleOnChange}
              placeholder="At least 6 characters"
              className="w-full rounded-lg border border-ink-500 bg-ink-900 px-3.5 py-2.5 text-sm text-mist-100 placeholder-mist-700 outline-none transition focus:border-amber-400/60"
            />
          </label>

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-amber-400 py-2.5 text-sm font-semibold text-ink-950 transition hover:bg-amber-500 disabled:opacity-60"
          >
            <UserPlus size={16} />
            {isSubmitting ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-mist-500">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-amber-400 hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
