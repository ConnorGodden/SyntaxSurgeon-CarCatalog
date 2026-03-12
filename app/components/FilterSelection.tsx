'use client';

import { Car } from "../../types/car";
import { CONDITION_OPTIONS } from "./AddListingForm";

export default function FilterSelection({
    cars,
    selections,
    onSelectionChange,
    collapsed = false,
}: {
    cars: Car[];
    selections: Record<string, string>;
    onSelectionChange: (next: Record<string, string>) => void;
    collapsed?: boolean;
}) {
    const filterOptions = ["make", "year", "body", "transmission", "condition", "color", "deal_rating", ""] as const;
    const uniqueValues = (option: keyof Car) => Array.from(new Set(cars.map((car) => String(car[option]))));


    return (
        <div className="flex flex-col gap-4 w-full">
            {!collapsed && (
                <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900/70">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-zinc-500">Filters</p>
                    <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">Narrow the catalogue by specs, condition, and rating.</p>
                </div>
            )}
            {filterOptions.map((option) => (
                option && (
                    <div key={option} className="w-full">
                        <label className={`block mb-1 font-medium text-zinc-700 dark:text-zinc-300 ${collapsed ? "text-[11px] text-center uppercase tracking-[0.2em]" : "text-sm"}`}>
                            {(option.charAt(0).toUpperCase() + option.slice(1)).replace("_", " ")}
                        </label>
                        <select
                            value={selections[option] ?? ""}
                            onChange={(e) => onSelectionChange({ ...selections, [option]: e.target.value })}
                            className={`w-full rounded-lg border border-zinc-200 py-2 text-sm outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:focus:border-zinc-600 ${collapsed ? "px-2 text-center" : "px-4"}`}
                        >
                            <option value="">All</option>
                            {option === "condition"
                                ? CONDITION_OPTIONS.map((opt) => (
                                      <option key={opt.value} value={opt.value}>
                                          {opt.label}
                                      </option>
                                  ))
                                : uniqueValues(option)
                                      .filter((value) => value)
                                      .sort((a, b) => {
                                          const numA = Number(a);
                                          const numB = Number(b);
                                          return !isNaN(numA) && !isNaN(numB) 
                                              ? numA - numB 
                                              : a.localeCompare(b);
                                      })
                                      .map((value) => (
                                          <option key={value} value={value}>
                                              {value.charAt(0).toUpperCase() + value.slice(1).toLowerCase()}
                                          </option>
                                      ))}   
                        </select>
                    </div>
                )
            ))}
            <button
                className={`mt-2 cursor-pointer w-full rounded-lg border border-zinc-200 py-2 text-sm outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:focus:border-zinc-600 ${collapsed ? "px-2" : "px-4"}`}
                onClick={() => onSelectionChange({})}
            >
                {collapsed ? "Clear" : "Clear Filters"}
            </button>
        </div>
    );
}
