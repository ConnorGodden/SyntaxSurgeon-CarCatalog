"use client";

import { useEffect, useState, useMemo } from "react";
import { Car, parseCsv } from "../../types/car";
import FilterSelection from "./FilterSelection";
import { cleanSelection } from "../../types/filter";
import CarCard from "./CarCard";
import AddListingForm from "./AddListingForm";


export default function CarCatalog() {
  const [cars, setCars] = useState<Car[]>([]);
  const [query, setQuery] = useState("");
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  useEffect(() => {
    fetch("/cars.csv")
      .then((res) => res.text())
      .then((text) => setCars(parseCsv(text)));
  }, []);

  const handleAddListing = (car: Car) => {
    setCars((prev) => [car, ...prev]);
    setShowAddForm(false);
  };

  // useMemo, the filtering is skipped unless an actual input is changed (if cars or query is changed)
  const filtered = useMemo(() => {
    // We take the user's query and set it lowercase to standardize their query
    const q = query.trim().toLowerCase();
    // If the query is empty, just return the full list (normal state)
    if (!q) return cars;
    // This returns cars that include the query across common searchable fields.
    return cars.filter((car) => {
      const haystack = `${car.make} ${car.model} ${car.deal_rating} ${car.year} ${car.body}`.toLowerCase();
      return haystack.includes(q)
    })
  }, [cars, query])

  return (
    <div className="flex h-screen w-full bg-zinc-100/70 dark:bg-zinc-950">
      {/* Left sidebar: filters */}
      <aside
        className={`flex shrink-0 flex-col border-r border-zinc-200 bg-white/95 p-4 transition-all duration-300 dark:border-zinc-800 dark:bg-zinc-950/95 ${
          sidebarCollapsed ? "w-24" : "w-80"
        }`}
      >
        <button
          type="button"
          onClick={() => setSidebarCollapsed((prev) => !prev)}
          className={`flex items-center gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 px-3 py-3 text-left transition hover:border-zinc-300 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700 dark:hover:bg-zinc-900/80 ${
            sidebarCollapsed ? "justify-center" : ""
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
          className={`mt-4 flex items-center rounded-2xl border border-zinc-200 bg-zinc-50 px-3 py-3 transition hover:border-zinc-300 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700 dark:hover:bg-zinc-900/80 ${
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

      {/* Right: catalog */}
      <div className="flex flex-1 flex-col overflow-hidden p-8">
        <div className="flex items-center justify-between mb-4 shrink-0">
          <h1 className="text-3xl font-bold">View our Catalog of Cars</h1>
          <button
            onClick={() => setShowAddForm(true)}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Add New Listing
          </button>
        </div>

        {showAddForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white dark:bg-zinc-950 rounded-xl shadow-xl max-w-lg w-full p-6">
              <AddListingForm onSubmit={handleAddListing} onCancel={() => setShowAddForm(false)} />
            </div>
          </div>
        )}

        {showProfile && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setShowProfile(false)}
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
                  onClick={() => setShowProfile(false)}
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
            </div>
          </div>
        )}

        <input
          type="text"
          placeholder="Search cars..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="mb-6 shrink-0 rounded-lg border border-zinc-200 px-4 py-2 text-sm outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:focus:border-zinc-600"
        />

        <div className="overflow-y-auto flex-1">
          {/* This div contains the list of cars that will be filtered, and the parameters within map represent the index and type of car*/}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {cleanSelection(filtered, selections).map((car, i) => (
              <CarCard key={i} car={car} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
