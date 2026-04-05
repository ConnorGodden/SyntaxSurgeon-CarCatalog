"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { SessionUser } from "../../types/user";

type Mode = "login" | "signup";

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "CC";
}

function formatRole(role: SessionUser["role"]): string {
  return role.charAt(0).toUpperCase() + role.slice(1);
}

export default function AuthPage({ initialUser }: { initialUser: SessionUser | null }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<Mode>(searchParams.get("mode") === "signup" ? "signup" : "login");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [signupForm, setSignupForm] = useState({ fullName: "", email: "", password: "" });

  const handleLogout = async () => {
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (!response.ok) {
        throw new Error("Logout failed.");
      }
      router.refresh();
    } catch (logoutError) {
      setError(logoutError instanceof Error ? logoutError.message : "Logout failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (nextMode: Mode) => {
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/auth/${nextMode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nextMode === "login" ? loginForm : signupForm),
      });

      const payload = await response.json();
      if (!response.ok || !payload.ok) {
        throw new Error(payload.error || `Failed to ${nextMode}.`);
      }

      router.push("/catalog");
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : `Failed to ${nextMode}.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-zinc-100/70 px-6 py-10 dark:bg-zinc-950">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/catalog"
          className="cursor-pointer inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800 transition"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden="true">
            <path fillRule="evenodd" d="M17 10a.75.75 0 0 1-.75.75H5.612l4.158 3.96a.75.75 0 1 1-1.04 1.08l-5.5-5.25a.75.75 0 0 1 0-1.08l5.5-5.25a.75.75 0 1 1 1.04 1.08L5.612 9.25H16.25A.75.75 0 0 1 17 10Z" clipRule="evenodd" />
          </svg>
          Back to Catalogue
        </Link>
      </div>
      <div className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-6xl items-center justify-center">
        <div className="grid w-full gap-8 overflow-hidden rounded-[2rem] border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-950 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="flex flex-col justify-start bg-zinc-900 px-8 py-12 text-white dark:bg-zinc-950">
            <div className="mx-auto w-full max-w-xl pt-6">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white shadow-[0_16px_40px_rgba(0,0,0,0.35)]">
                  <Image
                    src="/favicon.ico"
                    alt="Garage logo"
                    width={34}
                    height={34}
                    className="h-8 w-8 object-contain"
                  />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.34em] text-zinc-500">Garage</p>
                  <p className="mt-1 text-2xl font-semibold text-zinc-100">Car Catalogue</p>
                </div>
              </div>
              <h1 className="mt-10 max-w-xl text-4xl font-semibold leading-tight">
                Browse smarter, manage listings faster, and keep every account tied to real inventory.
              </h1>
              <p className="mt-4 max-w-lg text-sm leading-6 text-zinc-300">
                Sign in to add listings and manage your account, or create a new consumer account to get started.
              </p>
            </div>

          </section>

          <section className="px-8 py-10">
            {initialUser ? (
              <div className="mx-auto flex max-w-md flex-col justify-center">
                <div className="rounded-3xl border border-zinc-200 bg-zinc-50 p-6 dark:border-zinc-800 dark:bg-zinc-900/70">
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-900 text-lg font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900">
                      {getInitials(initialUser.fullName)}
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-zinc-500">Current Session</p>
                      <h2 className="text-2xl font-semibold">{initialUser.fullName}</h2>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        {initialUser.email} · {formatRole(initialUser.role)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 flex gap-3">
                    <button
                      type="button"
                      onClick={() => router.push("/catalog")}
                      className="cursor-pointer rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                    >
                      Continue to Catalogue
                    </button>
                    <button
                      type="button"
                      onClick={handleLogout}
                      disabled={isSubmitting}
                      className="cursor-pointer rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:hover:bg-zinc-800"
                    >
                      Log Out
                    </button>
                  </div>
                </div>
                {error && (
                  <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
                    {error}
                  </p>
                )}
              </div>
            ) : (
              <div className="mx-auto flex max-w-md flex-col items-center">
                <div className="mb-5 flex w-full justify-center">
                  <div className="inline-flex w-full max-w-sm rounded-full border border-zinc-200 bg-zinc-100 p-1 dark:border-zinc-800 dark:bg-zinc-900">
                    <button
                      type="button"
                      onClick={() => setMode("login")}
                      className={`flex-1 rounded-full px-4 py-2.5 text-sm font-medium transition ${
                        mode === "login"
                          ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                          : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                      }`}
                    >
                      Login
                    </button>
                    <button
                      type="button"
                      onClick={() => setMode("signup")}
                      className={`flex-1 rounded-full px-4 py-2.5 text-sm font-medium transition ${
                        mode === "signup"
                          ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                          : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                      }`}
                    >
                      Sign Up
                    </button>
                  </div>
                </div>

                <div className="w-full rounded-3xl border border-zinc-200 bg-zinc-50 p-6 dark:border-zinc-800 dark:bg-zinc-900/60">
                  <h2 className="text-2xl font-semibold">{mode === "login" ? "Welcome back" : "Create your account"}</h2>
                  <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                    {mode === "login"
                      ? "Use your email and password to continue."
                      : "New signups are created as consumer accounts by default."}
                  </p>

                  <form
                    className="mt-6 space-y-4"
                    onSubmit={(event) => {
                      event.preventDefault();
                      void handleSubmit(mode);
                    }}
                  >
                    {mode === "signup" && (
                      <div>
                        <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Full name</label>
                        <input
                          type="text"
                          value={signupForm.fullName}
                          onChange={(event) => setSignupForm((current) => ({ ...current, fullName: event.target.value }))}
                          className="w-full rounded-lg border border-zinc-200 px-4 py-2 text-sm outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:focus:border-zinc-600"
                          required
                        />
                      </div>
                    )}

                    <div>
                      <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Email</label>
                      <input
                        type="email"
                        value={mode === "login" ? loginForm.email : signupForm.email}
                        onChange={(event) =>
                          mode === "login"
                            ? setLoginForm((current) => ({ ...current, email: event.target.value }))
                            : setSignupForm((current) => ({ ...current, email: event.target.value }))
                        }
                        className="w-full rounded-lg border border-zinc-200 px-4 py-2 text-sm outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:focus:border-zinc-600"
                        required
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Password</label>
                      <input
                        type="password"
                        value={mode === "login" ? loginForm.password : signupForm.password}
                        onChange={(event) =>
                          mode === "login"
                            ? setLoginForm((current) => ({ ...current, password: event.target.value }))
                            : setSignupForm((current) => ({ ...current, password: event.target.value }))
                        }
                        className="w-full rounded-lg border border-zinc-200 px-4 py-2 text-sm outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:focus:border-zinc-600"
                        required
                      />
                    </div>

                    {error && (
                      <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
                        {error}
                      </p>
                    )}

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full cursor-pointer rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                    >
                      {isSubmitting ? "Please wait..." : mode === "login" ? "Login" : "Create Account"}
                    </button>
                  </form>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

