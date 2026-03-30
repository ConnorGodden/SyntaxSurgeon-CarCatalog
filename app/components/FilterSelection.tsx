'use client';

import { useEffect, useRef, type ReactElement } from "react";
import type { Car } from "../../types/car";
import { CONDITION_OPTIONS } from "./AddListingForm";

type FilterKey =
  | "make"
  | "year"
  | "body"
  | "transmission"
  | "condition"
  | "color"
  | "deal_rating";

type FilterConfig = {
  key: FilterKey;
  label: string;
  icon: (className?: string) => ReactElement;
};

export const FILTER_CONFIGS: FilterConfig[] = [
  {
    key: "make",
    label: "Make",
    icon: (className = "h-5 w-5") => (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M4 16.5V12l2.4-4.6A2 2 0 0 1 8.2 6.3h7.6a2 2 0 0 1 1.8 1.1L20 12v4.5" />
        <path d="M4 13h16" />
        <circle cx="7.5" cy="16.5" r="1.5" />
        <circle cx="16.5" cy="16.5" r="1.5" />
      </svg>
    ),
  },
  {
    key: "year",
    label: "Year",
    icon: (className = "h-5 w-5") => (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="4" y="5" width="16" height="15" rx="2.5" />
        <path d="M8 3.5v3M16 3.5v3M4 9.5h16" />
        <path d="M8 13h3M8 16h6" />
      </svg>
    ),
  },
  {
    key: "body",
    label: "Body",
    icon: (className = "h-5 w-5") => (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M3.5 14.5h17l-1.5-4.2a2 2 0 0 0-1.88-1.33H8.1a2 2 0 0 0-1.8 1.12L3.5 14.5Z" />
        <path d="M5 14.5v2a1.5 1.5 0 0 0 1.5 1.5h11A1.5 1.5 0 0 0 19 16.5v-2" />
        <circle cx="7.5" cy="18" r="1" />
        <circle cx="16.5" cy="18" r="1" />
      </svg>
    ),
  },
  {
    key: "transmission",
    label: "Transmission",
    icon: (className = "h-5 w-5") => (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="8" cy="6" r="2" />
        <circle cx="16" cy="6" r="2" />
        <circle cx="8" cy="12" r="2" />
        <circle cx="16" cy="12" r="2" />
        <path d="M8 8v2m0 4v4m8-10v10m-8-6h8" />
      </svg>
    ),
  },
  {
    key: "condition",
    label: "Condition",
    icon: (className = "h-5 w-5") => (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 3.5 18.5 6v5.5c0 4.1-2.6 7.2-6.5 9-3.9-1.8-6.5-4.9-6.5-9V6L12 3.5Z" />
        <path d="m9.5 12 1.7 1.7 3.3-3.7" />
      </svg>
    ),
  },
  {
    key: "color",
    label: "Color",
    icon: (className = "h-5 w-5") => (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 4c2.7 0 5 2.2 5 5 0 1.3-.4 2.2-1 3.1-.9 1.3-2.1 2.3-3.1 3.7-.5.7-.9 1.6-.9 2.7a2 2 0 0 1-4 0c0-2.7 1.7-4.5 3.1-6.1C12.4 11.1 13 10.2 13 9A1 1 0 0 0 11 9c0 .6-.4 1-1 1s-1-.4-1-1c0-2.8 2.3-5 5-5Z" />
        <path d="M16 6.5a4.5 4.5 0 0 1 0 9" />
      </svg>
    ),
  },
  {
    key: "deal_rating",
    label: "Deal Rating",
    icon: (className = "h-5 w-5") => (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="m12 4 2.3 4.7 5.2.8-3.8 3.7.9 5.3-4.6-2.4-4.6 2.4.9-5.3L4.5 9.5l5.2-.8L12 4Z" />
      </svg>
    ),
  },
];

export function getFilterLabel(key: string) {
  return FILTER_CONFIGS.find((config) => config.key === key)?.label ?? key.replace("_", " ");
}

export function getFilterDisplayValue(key: string, value: string) {
  if (key === "condition") {
    return CONDITION_OPTIONS.find((option) => option.value === value)?.label ?? value;
  }

  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

function getUniqueValues(cars: Car[], option: keyof Car) {
  return Array.from(new Set(cars.map((car) => String(car[option]))));
}

export default function FilterSelection({
  cars,
  selections,
  onSelectionChange,
  collapsed = false,
  onRequestExpand,
  requestedFilterKey,
  onFilterOpenHandled,
}: {
  cars: Car[];
  selections: Record<string, string>;
  onSelectionChange: (next: Record<string, string>) => void;
  collapsed?: boolean;
  onRequestExpand?: (filterKey?: FilterKey) => void;
  requestedFilterKey?: FilterKey | null;
  onFilterOpenHandled?: () => void;
}) {
  const activeFilters = FILTER_CONFIGS.filter((config) => selections[config.key]);
  const selectRefs = useRef<Partial<Record<FilterKey, HTMLSelectElement | null>>>({});

  useEffect(() => {
    if (collapsed || !requestedFilterKey) {
      return;
    }

    const select = selectRefs.current[requestedFilterKey];
    if (!select) {
      return;
    }

    select.focus();

    const picker = select as HTMLSelectElement & { showPicker?: () => void };
    if (typeof picker.showPicker === "function") {
      picker.showPicker();
    } else {
      select.click();
      select.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
    }

    onFilterOpenHandled?.();
  }, [collapsed, requestedFilterKey, onFilterOpenHandled]);

  if (collapsed) {
    return (
      <div className="flex h-full w-full flex-col items-center">
        <div className="mb-1 flex flex-col items-center gap-1">
          {activeFilters.length > 0 && (
            <div className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300">
              {activeFilters.length} active
            </div>
          )}
        </div>

        <div className="flex w-full flex-1 flex-col justify-between gap-2 py-2">
          {FILTER_CONFIGS.map((config) => {
            const value = selections[config.key];
            const isActive = Boolean(value);

            return (
              <div key={config.key} className="group relative flex-1">
                <button
                  type="button"
                  title={config.label}
                  onClick={() => onRequestExpand?.(config.key)}
                  className={`relative flex h-full min-h-12 w-full items-center justify-center rounded-2xl border transition duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 dark:focus-visible:ring-zinc-600 dark:focus-visible:ring-offset-zinc-950 ${
                    isActive
                      ? "border-emerald-300 bg-emerald-50 text-emerald-700 shadow-sm dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                      : "border-zinc-200 bg-white/90 text-zinc-600 hover:border-zinc-300 hover:bg-white dark:border-zinc-800 dark:bg-zinc-950/80 dark:text-zinc-300 dark:hover:border-zinc-700 dark:hover:bg-zinc-950"
                  }`}
                  aria-label={`${config.label}${isActive ? `: ${getFilterDisplayValue(config.key, value)}` : ""}`}
                >
                  {config.icon("h-6 w-6")}
                  {isActive ? (
                    <>
                      <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-zinc-950" />
                      <span className="absolute bottom-1.5 right-1.5 rounded-full bg-emerald-600 px-1.5 py-0.5 text-[9px] font-bold leading-none text-white dark:bg-emerald-400 dark:text-zinc-950">
                        1
                      </span>
                    </>
                  ) : null}
                </button>

                <div className="pointer-events-none absolute left-[calc(100%+0.65rem)] top-1/2 z-20 -translate-y-1/2 whitespace-nowrap rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-700 opacity-0 shadow-lg transition group-hover:opacity-100 group-focus-within:opacity-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200">
                  {config.label}
                  {isActive && (
                    <span className="ml-2 text-zinc-500 dark:text-zinc-400">
                      {getFilterDisplayValue(config.key, value)}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {activeFilters.length > 0 && (
          <button
            type="button"
            className="mt-3 w-full rounded-2xl border border-zinc-200 bg-white/90 px-2 py-2 text-xs font-semibold text-zinc-700 shadow-sm transition hover:bg-zinc-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 dark:border-zinc-800 dark:bg-zinc-950/80 dark:text-zinc-200 dark:hover:bg-zinc-900 dark:focus-visible:ring-zinc-600 dark:focus-visible:ring-offset-zinc-950"
            onClick={() => onSelectionChange({})}
          >
            Clear all
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900/70">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-zinc-500">Filters</p>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Narrow the catalogue by specs, condition, and rating.
            </p>
          </div>
          {activeFilters.length > 0 && (
            <div className="rounded-full border border-zinc-200 bg-white px-2.5 py-1 text-xs font-semibold text-zinc-600 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300">
              {activeFilters.length} active
            </div>
          )}
        </div>
      </div>

      {FILTER_CONFIGS.map((config) => (
        <div key={config.key} className="w-full">
          <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {config.label}
          </label>
          <select
            ref={(element) => {
              selectRefs.current[config.key] = element;
            }}
            value={selections[config.key] ?? ""}
            onChange={(event) => onSelectionChange({ ...selections, [config.key]: event.target.value })}
            className="w-full cursor-pointer rounded-lg border border-zinc-200 px-4 py-2 text-sm outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:focus:border-zinc-600"
          >
            <option value="">All</option>
            {config.key === "condition"
              ? CONDITION_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))
              : getUniqueValues(cars, config.key)
                  .filter((value) => value)
                  .sort((a, b) => {
                    const numA = Number(a);
                    const numB = Number(b);

                    return !Number.isNaN(numA) && !Number.isNaN(numB) ? numA - numB : a.localeCompare(b);
                  })
                  .map((value) => (
                    <option key={value} value={value}>
                      {getFilterDisplayValue(config.key, value)}
                    </option>
                  ))}
          </select>
        </div>
      ))}

      <button
        type="button"
        className="mt-2 w-full cursor-pointer rounded-lg border border-zinc-200 px-4 py-2 text-sm outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:focus:border-zinc-600"
        onClick={() => onSelectionChange({})}
      >
        Clear Filters
      </button>
    </div>
  );
}
