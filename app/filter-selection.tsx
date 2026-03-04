'use client';

import { Car } from "../types/car";

export default function FilterSelection({
    cars,
    selections,
    onSelectionChange,
}: {
    cars: Car[];
    selections: Record<string, string>;
    onSelectionChange: (next: Record<string, string>) => void;
}) {
    const filterOptions = ["make", "model", "year", "rating"];
    const uniqueValues = (option: string) => Array.from(new Set(cars.map(car => car[option as keyof Car])));

    return (
        <div className="mb-6 flex w-full max-w-2xl flex-wrap gap-4">
            {filterOptions.map((option) => (
                <div key={option} className="min-w-48 flex-1">
                    <label className="block mb-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                        {option.charAt(0).toUpperCase() + option.slice(1)}
                    </label>
                    <select
                        value={selections[option] ?? ""}
                        onChange={(e) => onSelectionChange({ ...selections, [option]: e.target.value })}
                        className="w-full rounded-lg border border-zinc-200 px-4 py-2 text-sm outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:focus:border-zinc-600"
                    >
                        <option value="">All</option>
                        {uniqueValues(option).map((value) => (
                            <option key={value} value={value}>
                                {value}
                            </option>
                        ))}
                    </select>
                </div>
            ))}
        </div>
    );
}