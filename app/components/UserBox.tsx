'use client';

import { useEffect, useState } from "react";
import Link from "next/link";


export default function UserBox({ onShowProfileChange }: { onShowProfileChange: (show: boolean) => void }) {

    return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => onShowProfileChange(false)}
          >
            <div
              className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl dark:bg-zinc-950"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-900 text-lg font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900">
                    MC
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-zinc-500">Profile</p>
                    <h2 className="text-2xl font-semibold">Matthew Carter</h2>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">Car Catalogue Admin</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onShowProfileChange(false)}
                  className="rounded-full border border-zinc-200 px-3 py-1 text-sm hover:bg-zinc-100 dark:border-zinc-800 dark:hover:bg-zinc-900"
                >
                  Close
                </button>
              </div>

              <div className="mt-6 grid gap-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/70">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Email</p>
                  <p className="mt-1 text-sm">matthew.carter@carcatalogue.dev</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Role</p>
                  <p className="mt-1 text-sm">Inventory Manager</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Focus</p>
                  <p className="mt-1 text-sm">Managing listings, pricing quality, and catalogue updates.</p>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <Link
                  href="/admin"
                  onClick={() => onShowProfileChange(false)}
                  className="flex-1 rounded-lg bg-zinc-900 px-4 py-2 text-center text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                >
                  Admin Dashboard
                </Link>
                <button
                  type="button"
                  onClick={() => onShowProfileChange(false)}
                  className="flex-1 rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
                >
                  Close
                </button>
              </div>
            </div>
          </div>)
}