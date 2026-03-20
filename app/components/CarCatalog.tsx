"use client";

import { useEffect, useState, useMemo } from "react";
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
  const [showAddForm, setShowAddForm] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [activeCar, setActiveCar] = useState<Car | null>(null);
  const [savedListings, setSavedListings] = useState<Car[]>([]);
  const [showSavedListings, setShowSavedListings] = useState(false);

  const USER_LISTINGS_KEY = "user_listings_v1";
  const SAVED_LISTINGS_KEY = "saved_listings_v1";

  const normalizeVin = (vin: unknown): string => {
    if (typeof vin !== "string") return "";
    const trimmed = vin.trim();
    if (!trimmed) return "";
    if (trimmed.toLowerCase() === "undefined" || trimmed.toLowerCase() === "null") return "";
    return trimmed;
  };

  const dedupeByVin = (list: Car[]) => {
    const seen = new Set<string>();
    const result: Car[] = [];
    for (const car of list) {
      const vin = normalizeVin(car?.vin);
      if (!vin || seen.has(vin)) continue;
      seen.add(vin);
      result.push({ ...car, vin });
    }
    return result;
  };

  const loadUserListings = (): Car[] => {
    try {
      const raw = localStorage.getItem(USER_LISTINGS_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as unknown;
      if (!Array.isArray(parsed)) return [];
      return dedupeByVin(parsed as Car[]);
    } catch {
      return [];
    }
  };

  const persistUserListings = (next: Car[]) => {
    try {
      localStorage.setItem(USER_LISTINGS_KEY, JSON.stringify(dedupeByVin(next)));
    } catch {
      // ignore
    }
  };

  const loadSavedListings = (): Car[] => {
    try {
      const raw = localStorage.getItem(SAVED_LISTINGS_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as unknown;
      if (!Array.isArray(parsed)) return [];
      return dedupeByVin(parsed as Car[]);
    } catch {
      return [];
    }
  };

  const persistSavedListings = (next: Car[]) => {
    try {
      localStorage.setItem(SAVED_LISTINGS_KEY, JSON.stringify(dedupeByVin(next)));
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    setSavedListings(loadSavedListings());
    fetch("/cars.csv")
      .then((res) => res.text())
      .then((text) => {
        const csvCars = parseCsv(text);
        const userListings = loadUserListings();
        const userListingVins = new Set(userListings.map((c) => normalizeVin(c.vin)));
        const merged = [
          ...userListings,
          ...csvCars.filter((c) => {
            const v = normalizeVin(c.vin);
            return v && !userListingVins.has(v);
          }),
        ];
        setCars(merged);
      });
  }, []);

  const handleAddListing = (car: Car) => {
    const vin = normalizeVin(car.vin);
    const nextCar = { ...car, vin };
    setCars((prev) => [nextCar, ...prev]);
    const nextUserListings = [nextCar, ...loadUserListings().filter((c) => normalizeVin(c.vin) !== vin)];
    persistUserListings(nextUserListings);
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

  const visibleCars = useMemo(() => cleanSelection(filtered, selections), [filtered, selections]);
  const visibleSavedListings = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = cleanSelection(savedListings, selections);
    if (!q) return base;
    return base.filter((car) => {
      const haystack = `${car.make} ${car.model} ${car.deal_rating} ${car.year} ${car.body}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [savedListings, selections, query]);

  const handleSaveListing = (car: Car) => {
    const vin = normalizeVin(car.vin);
    if (!vin) return;
    const nextSaved = [{ ...car, vin }, ...savedListings.filter((c) => normalizeVin(c.vin) !== vin)];
    setSavedListings(nextSaved);
    persistSavedListings(nextSaved);
  };

  const handleRemoveSavedListing = (vin: string) => {
    const nextSaved = savedListings.filter((car) => normalizeVin(car.vin) !== vin);
    setSavedListings(nextSaved);
    persistSavedListings(nextSaved);
  };

  const isCarSaved = (car: Car) => {
    const vin = normalizeVin(car.vin);
    return !!vin && savedListings.some((saved) => normalizeVin(saved.vin) === vin);
  };

  return (
    <div className="flex h-screen w-full bg-zinc-100/70 dark:bg-zinc-950">
      <aside
        className={`flex shrink-0 flex-col border-r border-zinc-200 bg-white/95 p-4 transition-all duration-300 dark:border-zinc-800 dark:bg-zinc-950/95 ${sidebarCollapsed ? "w-24" : "w-80"
          }`}
      >
        <button
          type="button"
          onClick={() => setSidebarCollapsed((prev) => !prev)}
          className={`flex items-center gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 px-3 py-3 text-left transition hover:border-zinc-300 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700 dark:hover:bg-zinc-900/80 ${sidebarCollapsed ? "justify-center" : ""
            }`}
          aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900">
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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
          className={`mt-4 flex items-center rounded-2xl border border-zinc-200 bg-zinc-50 px-3 py-3 transition hover:border-zinc-300 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700 dark:hover:bg-zinc-900/80 ${sidebarCollapsed ? "justify-center" : "gap-3"
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

      {showProfile && (<UserBox onShowProfileChange={setShowProfile} />)}

      <div className="flex flex-1 flex-col overflow-hidden p-8">
        <div className="flex items-center justify-between mb-4 shrink-0">
          <h1 className="text-3xl font-bold">{showSavedListings ? "Saved Listings" : "View our Catalog of Cars"}</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setShowSavedListings((prev) => !prev)}
              className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
            >
              {showSavedListings ? "Back to Catalog" : `Saved Listings (${savedListings.length})`}
            </button>
            <button
              onClick={() => setShowAddForm(true)}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              Add New Listing
            </button>
          </div>
        </div>

        {showAddForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white dark:bg-zinc-950 rounded-xl shadow-xl max-w-lg w-full p-6">
              <AddListingForm onSubmit={handleAddListing} onCancel={() => setShowAddForm(false)} />
            </div>
          </div>
        )}

        {activeCar && (
          <CarDetailsModal
            car={activeCar}
            onClose={() => setActiveCar(null)}
            onSave={handleSaveListing}
            isSaved={isCarSaved(activeCar)}
          />
        )}

        <div className="mb-6">
          <input
            type="text"
            placeholder={showSavedListings ? "Search saved listings..." : "Search cars..."}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 rounded-lg border border-zinc-200 px-4 py-2 text-sm outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:focus:border-zinc-600"
          />
        </div>

        <div className="overflow-y-auto flex-1">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {(showSavedListings ? visibleSavedListings : visibleCars).map((car, i) => (
              <div key={car.vin || i} className="relative">
                <button
                  type="button"
                  onClick={() => setActiveCar(car)}
                  className="w-full text-left cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 dark:focus-visible:ring-zinc-600 dark:focus-visible:ring-offset-zinc-950 rounded-lg"
                >
                  <CarCard car={car} />
                </button>
                {showSavedListings && (
                  <button
                    type="button"
                    onClick={() => handleRemoveSavedListing(normalizeVin(car.vin))}
                    className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full border border-rose-200 bg-white/95 px-3 py-1.5 text-xs font-semibold text-rose-700 shadow-sm transition hover:bg-rose-50 dark:border-rose-700/60 dark:bg-zinc-900/95 dark:text-rose-300 dark:hover:bg-rose-950/30"
                    aria-label="Remove saved listing"
                  >
                    <span aria-hidden="true">✕</span>
                    Remove
                  </button>
                )}
              </div>
            ))}
            {showSavedListings && visibleSavedListings.length === 0 && (
              <div className="col-span-full rounded-xl border border-dashed border-zinc-300 p-8 text-center text-zinc-600 dark:border-zinc-700 dark:text-zinc-300">
                No saved listings yet. Open any car and click "Save Listing".
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
