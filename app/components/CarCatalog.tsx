"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Car } from "../../types/car";
import type { SessionUser } from "../../types/user";
import { cleanSelection } from "../../types/filter";
import { findAllDuplicates } from "../../utils/duplicateDetection";

// Importing components
import { sortCars } from "../../utils/sortCars";
import { normalizeVin, dedupeByVin } from "../../utils/dedupeByVin";
import { getInitials } from "../../utils/formatters";
import CarCard from "./CarCard";
import FilterSelection, {
  FILTER_CONFIGS,
  getFilterDisplayValue,
  getFilterLabel,
} from "./FilterSelection";
import AddListingForm from "./AddListingForm";
import UserBox from "./UserBox";
import CarDetailsModal from "./CarDetailsModal";


const SAVED_LISTINGS_KEY = "saved_listings_v1";


export default function CarCatalog({ currentUser }: { currentUser: SessionUser | null }) {
  const router = useRouter();
  const [cars, setCars] = useState<Car[]>([]);
  const [query, setQuery] = useState("");
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [sortBy, setSortBy] = useState<"" | "price" | "mileage" | "year" | "newest">("");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [showAddForm, setShowAddForm] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [activeCar, setActiveCar] = useState<Car | null>(null);
  const [editCar, setEditCar] = useState<Car | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [savedListings, setSavedListings] = useState<Car[]>([]);
  const [showSavedListings, setShowSavedListings] = useState(false);
  const [requestedFilterKey, setRequestedFilterKey] = useState<(typeof FILTER_CONFIGS)[number]["key"] | null>(null);
  const PAGE_SIZE = 12;
  const isLoggedIn = Boolean(currentUser);

  const resetPage = () => setCurrentPage(1);

  const redirectToLogin = () => {
    router.push("/login");
  };

  const loadSavedFromStorage = (): Car[] => {
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

  const persistSaved = (next: Car[]) => {
    try {
      localStorage.setItem(SAVED_LISTINGS_KEY, JSON.stringify(dedupeByVin(next)));
    } catch {
      // ignore storage failures
    }
  };

  const loadListings = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const response = await fetch("/api/listings", { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok || !payload.ok || !Array.isArray(payload.data)) {
        throw new Error(payload.error || "Failed to load listings.");
      }
      setCars(payload.data as Car[]);
      if (payload.meta?.malformedRows) {
        setLoadError(`Loaded with ${payload.meta.malformedRows} malformed CSV row(s) skipped.`);
      }
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Failed to load listings.");
    } finally {
      setLoading(false);
    }
  };

  // Calculate duplicate groups
  const duplicateGroups = useMemo(() => findAllDuplicates(cars), [cars]);

  // Create a set of car IDs that are duplicates for quick lookup
  const duplicateCarIds = useMemo(() => {
    const ids = new Set<string>();
    duplicateGroups.forEach(group => {
      group.forEach(car => {
        ids.add(car.vin || `${car.make}-${car.model}-${car.year}-${car.sellingprice}`);
      });
    });
    return ids;
  }, [duplicateGroups]);

  // Debug logging
  useEffect(() => {
    console.log(`Found ${duplicateGroups.length} duplicate groups with ${duplicateCarIds.size} duplicate cars`);
  }, [duplicateGroups, duplicateCarIds]);

  useEffect(() => {
    setSavedListings(loadSavedFromStorage());
    void loadListings();
  }, []);

  const handleAddListing = async (car: Car) => {
    setSaveError(null);
    setSaving(true);
    try {
      const response = await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(car),
      });
      const payload = await response.json();
      if (!response.ok || !payload.ok || !payload.data) {
        throw new Error(payload.error || "Failed to create listing.");
      }
      setCars((prev) => [payload.data as Car, ...prev]);
      setShowAddForm(false);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Failed to create listing.");
    } finally {
      setSaving(false);
    }
  };

  const handleEditListing = async (car: Car) => {
    setSaveError(null);
    setSaving(true);
    try {
      const response = await fetch("/api/listings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(car),
      });
      const payload = await response.json();
      if (!response.ok || !payload.ok || !payload.data) {
        throw new Error(payload.error || "Failed to update listing.");
      }
      setCars((prev) =>
        prev.map((existing) => (existing.vin === car.vin ? (payload.data as Car) : existing)),
      );
      setEditCar(null);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Failed to update listing.");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    setLoadError(null);
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      const payload = await response.json();
      if (!response.ok || !payload.ok) {
        throw new Error(payload.error || "Logout failed.");
      }
      router.push("/catalog");
      router.refresh();
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Logout failed.");
    } finally {
      setLoggingOut(false);
    }
  };

  const handleSaveListing = (car: Car) => {
    const vin = normalizeVin(car.vin);
    if (!vin) return;
    const next = [{ ...car, vin }, ...savedListings.filter((c) => normalizeVin(c.vin) !== vin)];
    setSavedListings(next);
    persistSaved(next);
  };

  const handleRemoveSavedListing = (vin: string) => {
    const next = savedListings.filter((car) => normalizeVin(car.vin) !== vin);
    setSavedListings(next);
    persistSaved(next);
  };

  const isCarSaved = (car: Car) => {
    const vin = normalizeVin(car.vin);
    return !!vin && savedListings.some((saved) => normalizeVin(saved.vin) === vin);
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return cars;
    return cars.filter((car) => {
      const haystack =
        `${car.make} ${car.model} ${car.deal_rating} ${car.year} ${car.body}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [cars, query]);

  const visibleCars = useMemo(() => {
    const base = cleanSelection(filtered, selections);
    if (!sortBy) return base;
    return sortCars(base, sortBy, sortDirection);
  }, [filtered, selections, sortBy, sortDirection]);

  const visibleSavedListings = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = cleanSelection(savedListings, selections);
    if (!q) return base;
    return base.filter((car) => {
      const haystack =
        `${car.make} ${car.model} ${car.deal_rating} ${car.year} ${car.body}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [savedListings, selections, query]);

  const totalPages = Math.max(1, Math.ceil(visibleCars.length / PAGE_SIZE));
  const pagedCars = visibleCars.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const activeFilters = FILTER_CONFIGS.filter((config) => selections[config.key]).map((config) => ({
    key: config.key,
    label: getFilterLabel(config.key),
    value: selections[config.key],
    displayValue: getFilterDisplayValue(config.key, selections[config.key]),
  }));

  return (
    <div className="flex h-screen w-full bg-zinc-100/70 dark:bg-zinc-950">
      {/* Sidebar */}
      <aside
        className={`flex shrink-0 flex-col border-r border-zinc-200 bg-white/95 transition-all duration-300 dark:border-zinc-800 dark:bg-zinc-950/95 ${
          sidebarCollapsed
            ? "w-28 items-center px-3 py-5 shadow-[inset_-1px_0_0_rgba(0,0,0,0.04)]"
            : "w-80 p-4"
        }`}
      >
        <button
          type="button"
          onClick={() => setSidebarCollapsed((prev) => !prev)}
          className={`flex cursor-pointer items-center text-left transition ${
            sidebarCollapsed
              ? "h-14 w-full justify-center self-center rounded-2xl border border-transparent bg-transparent px-0 py-0 text-zinc-900 shadow-none hover:bg-zinc-50 dark:text-zinc-100 dark:hover:bg-zinc-900/70"
              : "gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 px-3 py-3 hover:border-zinc-300 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700 dark:hover:bg-zinc-900/80"
          }`}
          aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <span
            className={`flex shrink-0 items-center justify-center ${
              sidebarCollapsed
                ? "h-14 w-14 rounded-2xl border border-zinc-200 bg-white text-zinc-900 shadow-sm dark:border-zinc-700 dark:bg-white dark:text-zinc-950"
                : "h-11 w-11 rounded-2xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
            }`}
          >
            <svg
              viewBox="0 0 24 24"
              className={sidebarCollapsed ? "h-9 w-9" : "h-6 w-6"}
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              {sidebarCollapsed ? (
                <path d="M12 5 18 18H6L12 5Z" fill="currentColor" stroke="none" />
              ) : (
                <>
                  <path d="M3 13h3l2-5 3 8 2-4h8" />
                  <circle cx="7.5" cy="17.5" r="1.5" fill="currentColor" stroke="none" />
                  <circle cx="17.5" cy="17.5" r="1.5" fill="currentColor" stroke="none" />
                </>
              )}
            </svg>
          </span>
          {!sidebarCollapsed && (
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-zinc-500">Garage</p>
              <h2 className="truncate text-lg font-semibold text-zinc-950 dark:text-zinc-50">Car Catalogue</h2>
            </div>
          )}
        </button>

        {sidebarCollapsed && (
          <div className="mt-4 w-20 rounded-full border border-zinc-200 bg-zinc-50 px-2 py-1 text-center text-[10px] font-semibold uppercase tracking-[0.28em] text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
            Filters
          </div>
        )}

        <div
          className={`mt-4 min-h-0 flex-1 ${
            sidebarCollapsed
              ? "w-full overflow-visible rounded-[30px] bg-zinc-50/80 p-2 dark:bg-zinc-900/70"
              : "overflow-y-auto"
          }`}
        >
          <FilterSelection
            cars={cars}
            selections={selections}
            onSelectionChange={(next) => {
              setSelections(next);
              resetPage();
            }}
            collapsed={sidebarCollapsed}
            requestedFilterKey={requestedFilterKey}
            onFilterOpenHandled={() => setRequestedFilterKey(null)}
            onRequestExpand={(filterKey) => {
              setSidebarCollapsed(false);
              setRequestedFilterKey(filterKey ?? null);
            }}
          />
        </div>
      </aside>

      {/* Profile modal */}
      {showProfile && currentUser && (
        <UserBox
          user={currentUser}
          onShowProfileChange={setShowProfile}
          onLogout={() => {
            setShowProfile(false);
            void handleLogout();
          }}
          loggingOut={loggingOut}
        />
      )}

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden p-8">
        {/* Header */}
        <div className="mb-8 flex shrink-0 flex-col gap-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <h1 className="text-3xl font-bold">View our Catalog of Cars</h1>
            <div className="flex items-center gap-3 self-start md:self-auto">
              <button
                type="button"
                onClick={() => {
                  setSaveError(null);
                  if (!isLoggedIn) {
                    redirectToLogin();
                    return;
                  }
                  setShowAddForm(true);
                }}
                className="cursor-pointer rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                Add New Listing
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!isLoggedIn) {
                    redirectToLogin();
                    return;
                  }
                  setShowProfile(true);
                }}
                className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full bg-zinc-900 text-sm font-semibold text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
                aria-label={isLoggedIn ? "My Profile" : "Log In"}
              >
                {getInitials(currentUser?.fullName ?? "Guest User")}
              </button>
            </div>
          </div>

          {/* Search + sort */}
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between md:gap-4">
            <input
              type="text"
              placeholder={showSavedListings ? "Search saved listings..." : "Search cars..."}
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                resetPage();
              }}
              className="w-full flex-1 rounded-lg border border-zinc-200 px-4 py-2 text-sm outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:focus:border-zinc-600"
            />

            <div className="flex items-center gap-2 md:w-auto">
              <button
                type="button"
                onClick={() => {
                  setShowSavedListings((prev) => !prev);
                  resetPage();
                }}
                className={`cursor-pointer rounded-lg border px-3 py-2 text-sm transition ${
                  showSavedListings
                    ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                    : "border-zinc-200 bg-white hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800"
                }`}
              >
                Saved ({savedListings.length})
              </button>

              <label htmlFor="sort" className="sr-only">
                Sort results
              </label>
              <select
                id="sort"
                value={sortBy}
                onChange={(event) => {
                  const next = event.target.value as "" | "price" | "mileage" | "year" | "newest";
                  setSortBy(next);
                  setSortDirection(next === "newest" ? "desc" : "asc");
                  resetPage();
                }}
                className="w-full cursor-pointer rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:focus:border-zinc-600 md:w-40"
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

          {(loadError || saveError) && (
            <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
              {saveError || loadError}
            </p>
          )}

          {activeFilters.length > 0 && (
            <div className="rounded-2xl border border-zinc-200 bg-white/85 px-4 py-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/70">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-zinc-500">
                    Applied Filters
                  </p>
                  <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                    Results are currently narrowed by {activeFilters.length} filter{activeFilters.length === 1 ? "" : "s"}.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelections({});
                    resetPage();
                  }}
                  className="inline-flex cursor-pointer items-center justify-center rounded-full border border-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
                >
                  Clear all
                </button>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {activeFilters.map((filter) => (
                  <button
                    key={filter.key}
                    type="button"
                    onClick={() => {
                      setSelections((prev) => ({ ...prev, [filter.key]: "" }));
                      resetPage();
                    }}
                    className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-sm text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:border-zinc-600 dark:hover:bg-zinc-900"
                    aria-label={`Remove ${filter.label} filter`}
                  >
                    <span className="font-medium">{filter.label}:</span>
                    <span>{filter.displayValue}</span>
                    <span aria-hidden="true" className="text-zinc-400 dark:text-zinc-500">
                      ×
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Add listing modal */}
        {showAddForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl bg-white p-6 shadow-xl dark:bg-zinc-950">
              <AddListingForm
                onSubmit={handleAddListing}
                onCancel={() => setShowAddForm(false)}
                submitError={saveError}
                submitting={saving}
              />
            </div>
          </div>
        )}

        {/* Edit listing modal */}
        {editCar && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl bg-white p-6 shadow-xl dark:bg-zinc-950">
              <AddListingForm
                initialCar={editCar}
                onSubmit={handleEditListing}
                onCancel={() => setEditCar(null)}
                submitError={saveError}
                submitting={saving}
              />
            </div>
          </div>
        )}

        {/* Car detail modal */}
        {activeCar && (
          <CarDetailsModal
            car={activeCar}
            onClose={() => setActiveCar(null)}
            onSave={handleSaveListing}
            isSaved={isCarSaved(activeCar)}
            onEdit={(car) => {
              setSaveError(null);
              setActiveCar(null);
              setEditCar(car);
            }}
          />
        )}

        {/* Car grid */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="rounded-3xl border border-zinc-200 bg-white/80 p-8 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-300">
              Loading catalogue...
            </div>
          ) : showSavedListings ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {visibleSavedListings.length === 0 ? (
                <div className="col-span-full rounded-xl border border-dashed border-zinc-300 p-8 text-center text-zinc-600 dark:border-zinc-700 dark:text-zinc-300">
                  No saved listings yet. Open any car and click &ldquo;Save Listing&rdquo;.
                </div>
              ) : (
                visibleSavedListings.map((car, i) => (
                  <div key={car.vin || i} className="relative">
                    <button
                      type="button"
                      onClick={() => setActiveCar(car)}
                      className="w-full cursor-pointer rounded-lg text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 dark:focus-visible:ring-zinc-600 dark:focus-visible:ring-offset-zinc-950"
                    >
                      <CarCard car={car} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveSavedListing(normalizeVin(car.vin))}
                      className="absolute right-3 top-3 inline-flex cursor-pointer items-center gap-1 rounded-full border border-rose-200 bg-white/95 px-3 py-1.5 text-xs font-semibold text-rose-700 shadow-sm transition hover:bg-rose-50 dark:border-rose-700/60 dark:bg-zinc-900/95 dark:text-rose-300 dark:hover:bg-rose-950/30"
                      aria-label="Remove saved listing"
                    >
                      <span aria-hidden="true">✕</span> Remove
                    </button>
                  </div>
                ))
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                {pagedCars.map((car, index) => (
                  <button
                    type="button"
                    key={car.vin || index}
                    onClick={() => setActiveCar(car)}
                    className="cursor-pointer rounded-lg text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 dark:focus-visible:ring-zinc-600 dark:focus-visible:ring-offset-zinc-950"
                  >
                    <CarCard car={car} />
                  </button>
                ))}
              </div>

              <div className="mt-8 flex items-center justify-between">
                <p className="text-sm text-zinc-500">
                  {visibleCars.length === 0
                    ? "No results"
                    : `${(currentPage - 1) * PAGE_SIZE + 1}–${Math.min(
                        currentPage * PAGE_SIZE,
                        visibleCars.length,
                      )} of ${visibleCars.length}`}
                </p>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                    disabled={currentPage === 1}
                    className="cursor-pointer rounded-lg border border-zinc-200 px-3 py-1.5 text-sm hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-800 dark:hover:bg-zinc-800"
                  >
                    Prev
                  </button>
                  {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                    <button
                      key={page}
                      type="button"
                      onClick={() => setCurrentPage(page)}
                      className={`cursor-pointer rounded-lg border px-3 py-1.5 text-sm ${
                        page === currentPage
                          ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                          : "border-zinc-200 hover:bg-zinc-100 dark:border-zinc-800 dark:hover:bg-zinc-800"
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                    disabled={currentPage === totalPages}
                    className="cursor-pointer rounded-lg border border-zinc-200 px-3 py-1.5 text-sm hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-800 dark:hover:bg-zinc-800"
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
