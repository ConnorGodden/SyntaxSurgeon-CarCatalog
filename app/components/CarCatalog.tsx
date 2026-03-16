"use client";

import { useEffect, useMemo, useState } from "react";
import { Car, parseCsv } from "../../types/car";
import { cleanSelection } from "../../types/filter";
import CarCard from "./CarCard";
import FilterSelection from "./FilterSelection";
import AddListingForm from "./AddListingForm";
import UserBox from "./UserBox";
import CarDetailsModal from "./CarDetailsModal";

export default function CarCatalog() {
  const [cars, setCars] = useState<Car[]>([]);
  const [query, setQuery] = useState("");
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [sortBy, setSortBy] = useState<"" | "price" | "mileage" | "year" | "newest">("");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [showAddForm, setShowAddForm] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [activeCar, setActiveCar] = useState<Car | null>(null);

  const LOCAL_STORAGE_KEY = "user_listings_v1";

  const normalizeVin = (vin: unknown): string => {
    if (typeof vin !== "string") return "";
    const trimmed = vin.trim();
    if (!trimmed) return "";
    if (trimmed.toLowerCase() === "undefined" || trimmed.toLowerCase() === "null") return "";
    return trimmed;
  };

  const loadSavedListings = (): Car[] => {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as unknown;
      if (!Array.isArray(parsed)) return [];
      return (parsed as Car[]).filter((car) => normalizeVin(car?.vin));
    } catch {
      return [];
    }
  };

  const persistSavedListings = (next: Car[]) => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Ignore storage failures in private mode or when quota is exceeded.
    }
  };

  useEffect(() => {
    fetch("/cars.csv")
      .then((res) => res.text())
      .then((text) => {
        const csvCars = parseCsv(text);
        const saved = loadSavedListings();
        const savedVins = new Set(saved.map((car) => normalizeVin(car.vin)));
        const merged = [
          ...saved,
          ...csvCars.filter((car) => {
            const vin = normalizeVin(car.vin);
            return vin && !savedVins.has(vin);
          }),
        ];
        setCars(merged);
      });
  }, []);

  const handleAddListing = (car: Car) => {
    const vin = normalizeVin(car.vin);
    const nextCar = { ...car, vin };
    setCars((prev) => [nextCar, ...prev]);
    const nextSaved = [
      nextCar,
      ...loadSavedListings().filter((savedCar) => normalizeVin(savedCar.vin) && normalizeVin(savedCar.vin) !== vin),
    ];
    persistSavedListings(nextSaved);
    setShowAddForm(false);
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return cars;

    return cars.filter((car) => {
      const haystack = `${car.make} ${car.model} ${car.deal_rating} ${car.year} ${car.body}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [cars, query]);

  const visibleCars = useMemo(() => {
    const base = cleanSelection(filtered, selections);
    if (!sortBy) return base;

    const sortValue = (car: Car) => {
      if (sortBy === "price") return car.sellingprice;
      if (sortBy === "mileage") return car.odometer;
      if (sortBy === "year") return car.year;
      if (sortBy === "newest") {
        const ts = Date.parse(car.saledate);
        return Number.isNaN(ts) ? 0 : ts;
      }
      return 0;
    };

    const sorted = [...base].sort((a, b) => sortValue(a) - sortValue(b));
    return sortDirection === "desc" ? sorted.reverse() : sorted;
  }, [filtered, selections, sortBy, sortDirection]);

  return (
    <div className="flex h-screen w-full bg-zinc-100/70 dark:bg-zinc-950">
      <aside
        className={`flex shrink-0 flex-col border-r border-zinc-200 bg-white/95 p-4 transition-all duration-300 dark:border-zinc-800 dark:bg-zinc-950/95 ${
          sidebarCollapsed ? "w-24" : "w-80"
        }`}
      >
        <button
          type="button"
          onClick={() => setSidebarCollapsed((prev) => !prev)}
          className={`flex cursor-pointer items-center gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 px-3 py-3 text-left transition hover:border-zinc-300 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700 dark:hover:bg-zinc-900/80 ${
            sidebarCollapsed ? "justify-center" : ""
          }`}
          aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900">
            <svg
              viewBox="0 0 24 24"
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M3 13h3l2-5 3 8 2-4h8" />
              <circle cx="7.5" cy="17.5" r="1.5" fill="currentColor" stroke="none" />
              <circle cx="17.5" cy="17.5" r="1.5" fill="currentColor" stroke="none" />
            </svg>
          </span>
          {!sidebarCollapsed && (
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-zinc-500">Garage</p>
              <h2 className="truncate text-lg font-semibold text-zinc-950 dark:text-zinc-50">Car Catalogue</h2>
            </div>
          )}
        </button>

        <div className="mt-4 min-h-0 flex-1 overflow-y-auto">
          <FilterSelection
            cars={cars}
            selections={selections}
            onSelectionChange={setSelections}
            collapsed={sidebarCollapsed}
          />
        </div>

        <button
          type="button"
          onClick={() => setShowProfile(true)}
          className={`mt-4 flex cursor-pointer items-center rounded-2xl border border-zinc-200 bg-zinc-50 px-3 py-3 transition hover:border-zinc-300 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700 dark:hover:bg-zinc-900/80 ${
            sidebarCollapsed ? "justify-center" : "gap-3"
          }`}
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-sm font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900">
            MC
          </span>
          {!sidebarCollapsed && (
            <div className="min-w-0 text-left">
              <p className="truncate text-sm font-semibold text-zinc-950 dark:text-zinc-50">My Profile</p>
              <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">View account details</p>
            </div>
          )}
        </button>
      </aside>

      {showProfile && <UserBox onShowProfileChange={setShowProfile} />}

      <div className="flex flex-1 flex-col overflow-hidden p-8">
        <div className="mb-4 flex shrink-0 items-center justify-between">
          <h1 className="text-3xl font-bold">View our Catalog of Cars</h1>
          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            className="cursor-pointer rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Add New Listing
          </button>
        </div>

        {showAddForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl dark:bg-zinc-950">
              <AddListingForm onSubmit={handleAddListing} onCancel={() => setShowAddForm(false)} />
            </div>
          </div>
        )}

        {activeCar && <CarDetailsModal car={activeCar} onClose={() => setActiveCar(null)} />}

        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <input
            type="text"
            placeholder="Search cars..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 rounded-lg border border-zinc-200 px-4 py-2 text-sm outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:focus:border-zinc-600"
          />

          <div className="flex items-center gap-2">
            <label htmlFor="sort" className="sr-only">
              Sort results
            </label>
            <select
              id="sort"
              value={sortBy}
              onChange={(e) => {
                const next = e.target.value as "" | "price" | "mileage" | "year" | "newest";
                setSortBy(next);
                setSortDirection(next === "newest" ? "desc" : "asc");
              }}
              className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:focus:border-zinc-600"
            >
              <option value="">Sort</option>
              <option value="price">Price</option>
              <option value="mileage">Mileage</option>
              <option value="year">Year</option>
              <option value="newest">Newest</option>
            </select>
            {sortBy && (
              <button
                type="button"
                onClick={() => setSortDirection((curr) => (curr === "asc" ? "desc" : "asc"))}
                className="cursor-pointer rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800"
                aria-label={sortDirection === "asc" ? "Sort descending" : "Sort ascending"}
              >
                {sortDirection === "asc" ? "↑" : "↓"}
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {visibleCars.map((car, i) => (
              <button
                type="button"
                key={car.vin || i}
                onClick={() => setActiveCar(car)}
                className="rounded-lg text-left cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 dark:focus-visible:ring-zinc-600 dark:focus-visible:ring-offset-zinc-950"
              >
                <CarCard car={car} />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
