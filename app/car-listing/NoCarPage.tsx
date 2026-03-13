'use client';

import Link from "next/link";

export default function NoCarPage() {
    return (
        <main className="min-h-screen bg-zinc-100 p-8 dark:bg-zinc-950">
            <div className="mx-auto max-w-3xl rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
                <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">No car selected</h1>
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
                    Please open a listing from the catalog page.
                </p>
                <Link
                    href="/"
                    className="mt-5 inline-block rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
                >
                    Back to catalog
                </Link>
            </div>
        </main>
    )
}