'use client';

import { useEffect, useState } from "react";
import Link from "next/link";
import type { SessionUser } from "../../types/user";
import { getInitials } from "../../utils/formatters";

function formatRole(role: SessionUser["role"]): string {
  return role.charAt(0).toUpperCase() + role.slice(1);
}

export default function UserBox({
  user,
  onShowProfileChange,
  onLogout,
  loggingOut = false,
}: {
  user: SessionUser;
  onShowProfileChange: (show: boolean) => void;
  onLogout: () => void;
  loggingOut?: boolean;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={() => onShowProfileChange(false)}
    >
      <div
        className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl dark:bg-zinc-950"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-900 text-lg font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900">
              {getInitials(user.fullName)}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-zinc-500">Profile</p>
              <h2 className="text-2xl font-semibold">{user.fullName}</h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">{formatRole(user.role)}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onShowProfileChange(false)}
            className="cursor-pointer rounded-full border border-zinc-200 px-3 py-1 text-sm hover:bg-zinc-100 dark:border-zinc-800 dark:hover:bg-zinc-900"
          >
            Close
          </button>
        </div>

        <div className="mt-6 grid gap-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/70">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Email</p>
            <p className="mt-1 text-sm">{user.email}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Role</p>
            <p className="mt-1 text-sm">{formatRole(user.role)}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Account Id</p>
            <p className="mt-1 break-all text-sm">{user.id}</p>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/70">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Session</p>
          <div className="mt-3 flex items-center justify-between gap-4">
            <p className="text-sm text-zinc-600 dark:text-zinc-300">Sign out and return to the catalogue.</p>
            <button
              type="button"
              onClick={onLogout}
              disabled={loggingOut}
              className="cursor-pointer rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loggingOut ? "Logging out..." : "Log Out"}
            </button>
          </div>
        </div>

        {user.role === "admin" && (
          <div className="mt-6 flex gap-3">
            <Link
              href="/admin"
              onClick={() => onShowProfileChange(false)}
              className="flex-1 rounded-lg bg-zinc-900 px-4 py-2 text-center text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              Admin Dashboard
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
