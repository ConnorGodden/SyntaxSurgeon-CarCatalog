'use client';

import { Car } from "../../types/car";
import { CONDITION_OPTIONS } from "./AddListingForm";

export default function FilterSelection({
    cars,
    selections,
    onSelectionChange,
}: {
    cars: Car[];
    selections: Record<string, string>;
    onSelectionChange: (next: Record<string, string>) => void;
}) {
    const filterOptions = ["make", "year", "body", "transmission", "condition", "color", "deal_rating", ""] as const;
    const uniqueValues = (option: keyof Car) => Array.from(new Set(cars.map((car) => String(car[option]))));


    const clearFilters = () => {
        onSelectionChange({});
    }
    return (
        <div className="flex flex-col gap-4 w-full">
            {filterOptions.map((option) => (
                option && (
                    <div key={option} className="w-full">
                        <label className="block mb-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                            {(option.charAt(0).toUpperCase() + option.slice(1)).replace("_", " ")}
                        </label>
                        <select
                            value={selections[option] ?? ""}
                            onChange={(e) => onSelectionChange({ ...selections, [option]: e.target.value })}
                            className="w-full rounded-lg border border-zinc-200 px-4 py-2 text-sm outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:focus:border-zinc-600"
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
            <button className="mt-2 cursor-pointer w-full rounded-lg border border-zinc-200 px-4 py-2 text-sm outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:focus:border-zinc-600" onClick={() => onSelectionChange({})}>
                Clear Filters
            </button>
        </div>
    );
}
