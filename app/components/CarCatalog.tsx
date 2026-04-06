"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Car } from "../../types/car";
import type { SessionUser, UserRecord } from "../../types/user";
import { cleanSelection } from "../../types/filter";
import { findAllDuplicates } from "../../utils/duplicateDetection";

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
import CarCompareModal from "./CarCompareModal";
import CarDetailsModal from "./CarDetailsModal";

const getSavedListingsKey = (userId: string | null) =>
  userId ? `saved_listings_v1_${userId}` : "saved_listings_v1_guest";
const CATALOG_TITLE_SESSION_KEY = "catalog_title_v1";
const SEARCH_CARS_PLACEHOLDER = "Search cars...";
const CATALOG_TITLES = [
  "View our Catalog of Cars",
  "Find Your Next Car",
  "Browse Our Car Listings",
  "Explore Available Cars",
  "Search and Compare Cars",
  "Discover Cars That Fit Your Needs",
  "Explore Deals on Cars",
  "Your Car Marketplace",
] as const;

type AdminUser = Omit<UserRecord, "password">;
type UserSortOption = "newest" | "oldest" | "name-asc" | "name-desc";
type ActiveUserFilter = { key: keyof UserFilterState; label: string; value: string };
type UserFilterState = {
  role: "all" | "consumer" | "dealer" | "admin";
  joined: "all" | "last-7-days" | "last-30-days" | "this-year" | "older";
  listings: "all" | "none" | "1-2" | "3-5" | "6-plus";
  status: "all" | "active" | "inactive";
};

const USER_FILTER_BUTTONS: Array<{
  key: keyof UserFilterState;
  label: string;
  shortLabel: string;
}> = [
  { key: "role", label: "User Type", shortLabel: "U" },
  { key: "joined", label: "Date Joined", shortLabel: "D" },
  { key: "listings", label: "Number of Listings", shortLabel: "L" },
  { key: "status", label: "Status", shortLabel: "S" },
];

export default function CarCatalog({ currentUser }: { currentUser: SessionUser | null }) {
  const router = useRouter();
  const [cars, setCars] = useState<Car[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [catalogTitle, setCatalogTitle] = useState<string | null>(null);
  const [animatedSearchPlaceholder, setAnimatedSearchPlaceholder] = useState("");
  const [pageReady, setPageReady] = useState(false);
  const [query, setQuery] = useState("");
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [sortBy, setSortBy] = useState<"" | "price" | "mileage" | "year" | "newest">("");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [userSortBy, setUserSortBy] = useState<UserSortOption>("newest");
  const [showAddForm, setShowAddForm] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [activeCar, setActiveCar] = useState<Car | null>(null);
  const [editCar, setEditCar] = useState<Car | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [userLoadError, setUserLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [usersLoading, setUsersLoading] = useState(false);
  const [savedListings, setSavedListings] = useState<Car[]>([]);
  const [showSavedListings, setShowSavedListings] = useState(false);
  const [compareSelection, setCompareSelection] = useState<string[]>([]);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [showGuestMenu, setShowGuestMenu] = useState(false);
  const guestMenuRef = useRef<HTMLDivElement>(null);
  const [requestedFilterKey, setRequestedFilterKey] = useState<(typeof FILTER_CONFIGS)[number]["key"] | null>(null);
  const [activeAdminView, setActiveAdminView] = useState<"cars" | "users">("cars");
  const [userFilters, setUserFilters] = useState<UserFilterState>({
    role: "all",
    joined: "all",
    listings: "all",
    status: "all",
  });
  const PAGE_SIZE = 12;
  const isLoggedIn = Boolean(currentUser);
  const isAdmin = currentUser?.role === "admin";
  const showingCarsInterface = !isAdmin || activeAdminView === "cars";

  const resetPage = () => setCurrentPage(1);
  const getCarKey = (car: Car, fallbackIndex: number) => `${normalizeVin(car.vin) || "missing-vin"}-${fallbackIndex}`;

  const redirectToLogin = () => {
    router.push("/login");
  };

  const loadSavedFromStorage = (userId: string | null): Car[] => {
    try {
      const raw = localStorage.getItem(getSavedListingsKey(userId));
      if (!raw) return [];
      const parsed = JSON.parse(raw) as unknown;
      if (!Array.isArray(parsed)) return [];
      return dedupeByVin(parsed as Car[]);
    } catch {
      return [];
    }
  };

  const persistSaved = (next: Car[], userId: string | null) => {
    try {
      localStorage.setItem(getSavedListingsKey(userId), JSON.stringify(dedupeByVin(next)));
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

  const loadUsers = async () => {
    setUsersLoading(true);
    setUserLoadError(null);
    try {
      const response = await fetch("/api/users", { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok || !payload.ok || !Array.isArray(payload.data)) {
        throw new Error(payload.error || "Failed to load users.");
      }
      setUsers(payload.data as AdminUser[]);
      if (payload.meta?.malformedRows) {
        setUserLoadError(`Loaded with ${payload.meta.malformedRows} malformed user row(s) skipped.`);
      }
    } catch (error) {
      setUserLoadError(error instanceof Error ? error.message : "Failed to load users.");
    } finally {
      setUsersLoading(false);
    }
  };

  const duplicateGroups = useMemo(() => findAllDuplicates(cars), [cars]);

  const duplicateCarIds = useMemo(() => {
    const ids = new Set<string>();
    duplicateGroups.forEach((group) => {
      group.forEach((car) => {
        ids.add(car.vin || `${car.make}-${car.model}-${car.year}-${car.sellingprice}`);
      });
    });
    return ids;
  }, [duplicateGroups]);

  useEffect(() => {
    console.log(`Found ${duplicateGroups.length} duplicate groups with ${duplicateCarIds.size} duplicate cars`);
  }, [duplicateGroups, duplicateCarIds]);

  useEffect(() => {
    setSavedListings(loadSavedFromStorage(currentUser?.id ?? null));
    setCompareSelection([]);
    setShowCompareModal(false);
    void loadListings();
  }, [currentUser?.id]);

  useEffect(() => {
    if (!showGuestMenu) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (guestMenuRef.current && !guestMenuRef.current.contains(e.target as Node)) {
        setShowGuestMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showGuestMenu]);

  useEffect(() => {
    try {
      const savedTitle = sessionStorage.getItem(CATALOG_TITLE_SESSION_KEY);
      if (savedTitle && CATALOG_TITLES.includes(savedTitle as (typeof CATALOG_TITLES)[number])) {
        setCatalogTitle(savedTitle);
      } else {
        const randomIndex = Math.floor(Math.random() * CATALOG_TITLES.length);
        const nextTitle = CATALOG_TITLES[randomIndex];
        sessionStorage.setItem(CATALOG_TITLE_SESSION_KEY, nextTitle);
        setCatalogTitle(nextTitle);
      }
    } catch {
      const randomIndex = Math.floor(Math.random() * CATALOG_TITLES.length);
      setCatalogTitle(CATALOG_TITLES[randomIndex]);
    } finally {
      requestAnimationFrame(() => setPageReady(true));
    }
  }, []);

  useEffect(() => {
    if (!showingCarsInterface || showSavedListings) {
      setAnimatedSearchPlaceholder("");
      return;
    }

    let timeoutId: number | undefined;
    let restartCycleId: number | undefined;

    const runTypingAnimation = () => {
      setAnimatedSearchPlaceholder("");
      let nextIndex = 0;

      const typeNextCharacter = () => {
        nextIndex += 1;
        setAnimatedSearchPlaceholder(SEARCH_CARS_PLACEHOLDER.slice(0, nextIndex));

        if (nextIndex < SEARCH_CARS_PLACEHOLDER.length) {
          timeoutId = window.setTimeout(typeNextCharacter, 70);
          return;
        }

        timeoutId = window.setTimeout(() => {
          setAnimatedSearchPlaceholder("");
        }, 2200);
      };

      timeoutId = window.setTimeout(typeNextCharacter, 150);
    };

    runTypingAnimation();
    restartCycleId = window.setInterval(runTypingAnimation, 10000);

    return () => {
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
      if (restartCycleId) {
        window.clearInterval(restartCycleId);
      }
    };
  }, [showSavedListings, showingCarsInterface]);

  useEffect(() => {
    if (showingCarsInterface) {
      return;
    }

    setShowAddForm(false);
    setActiveCar(null);
    setEditCar(null);
    setShowSavedListings(false);
    setCompareSelection([]);
    setShowCompareModal(false);
    setSaveError(null);
    setQuery("");
    setCurrentPage(1);
  }, [showingCarsInterface]);

  useEffect(() => {
    if (showSavedListings) {
      return;
    }

    setCompareSelection([]);
    setShowCompareModal(false);
  }, [showSavedListings]);

  useEffect(() => {
    if (!isAdmin || activeAdminView !== "users") {
      return;
    }

    void loadUsers();
  }, [activeAdminView, isAdmin]);

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
    if (!isLoggedIn) return;
    const vin = normalizeVin(car.vin);
    if (!vin) return;
    const next = [{ ...car, vin }, ...savedListings.filter((c) => normalizeVin(c.vin) !== vin)];
    setSavedListings(next);
    persistSaved(next, currentUser?.id ?? null);
  };

  const handleRemoveSavedListing = (vin: string) => {
    const next = savedListings.filter((car) => normalizeVin(car.vin) !== vin);
    setSavedListings(next);
    setCompareSelection((current) => current.filter((selectedVin) => selectedVin !== vin));
    persistSaved(next, currentUser?.id ?? null);
  };

  const toggleCompareSelection = (car: Car) => {
    const vin = normalizeVin(car.vin);
    if (!vin) return;

    setCompareSelection((current) => {
      if (current.includes(vin)) {
        return current.filter((selectedVin) => selectedVin !== vin);
      }

      if (current.length >= 2) {
        return [current[1], vin];
      }

      return [...current, vin];
    });
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

  const selectedCompareCars = useMemo(() => {
    const savedByVin = new Map(savedListings.map((car) => [normalizeVin(car.vin), car] as const));
    return compareSelection
      .map((vin) => savedByVin.get(vin))
      .filter((car): car is Car => Boolean(car));
  }, [compareSelection, savedListings]);

  const listingCountByUser = useMemo(() => {
    const counts = new Map<string, number>();

    cars.forEach((car) => {
      const ownerId = car.ownerId?.trim();
      const ownerEmail = car.ownerEmail?.trim().toLowerCase();

      if (ownerId) {
        counts.set(ownerId, (counts.get(ownerId) ?? 0) + 1);
      }

      if (ownerEmail) {
        counts.set(ownerEmail, (counts.get(ownerEmail) ?? 0) + 1);
      }
    });

    return counts;
  }, [cars]);

  const visibleUsers = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filteredUsers = q
      ? users.filter((user) => {
          const haystack = `${user.fullName} ${user.email} ${user.role}`.toLowerCase();
          return haystack.includes(q);
        })
      : users;

    const now = Date.now();
    const dayInMs = 24 * 60 * 60 * 1000;

    const usersByFilters = filteredUsers.filter((user) => {
      const joinedAt = new Date(user.createdAt).getTime();
      const ageInDays = Number.isFinite(joinedAt) ? (now - joinedAt) / dayInMs : Number.POSITIVE_INFINITY;
      const listingCount =
        listingCountByUser.get(user.id) ??
        listingCountByUser.get(user.email.trim().toLowerCase()) ??
        0;

      const matchesRole = userFilters.role === "all" || user.role === userFilters.role;
      const matchesStatus =
        userFilters.status === "all" ||
        (userFilters.status === "active" ? user.isActive : !user.isActive);
      const matchesJoined =
        userFilters.joined === "all" ||
        (userFilters.joined === "last-7-days" && ageInDays <= 7) ||
        (userFilters.joined === "last-30-days" && ageInDays <= 30) ||
        (userFilters.joined === "this-year" && ageInDays > 30 && ageInDays <= 365) ||
        (userFilters.joined === "older" && ageInDays > 365);
      const matchesListings =
        userFilters.listings === "all" ||
        (userFilters.listings === "none" && listingCount === 0) ||
        (userFilters.listings === "1-2" && listingCount >= 1 && listingCount <= 2) ||
        (userFilters.listings === "3-5" && listingCount >= 3 && listingCount <= 5) ||
        (userFilters.listings === "6-plus" && listingCount >= 6);

      return matchesRole && matchesStatus && matchesJoined && matchesListings;
    });

    return [...usersByFilters].sort((left, right) => {
      if (userSortBy === "newest") {
        return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
      }
      if (userSortBy === "oldest") {
        return new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime();
      }
      if (userSortBy === "name-asc") {
        return left.fullName.localeCompare(right.fullName);
      }
      return right.fullName.localeCompare(left.fullName);
    });
  }, [listingCountByUser, query, userFilters, userSortBy, users]);

  const totalPages = Math.max(1, Math.ceil(visibleCars.length / PAGE_SIZE));
  const pagedCars = visibleCars.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const totalUserPages = Math.max(1, Math.ceil(visibleUsers.length / PAGE_SIZE));
  const pagedUsers = visibleUsers.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const activeFilters = FILTER_CONFIGS.filter((config) => selections[config.key]).map((config) => ({
    key: config.key,
    label: getFilterLabel(config.key),
    value: selections[config.key],
    displayValue: getFilterDisplayValue(config.key, selections[config.key]),
  }));
  const activeUserFilters: ActiveUserFilter[] = [];
  if (userFilters.role !== "all") {
    activeUserFilters.push({ key: "role", label: "User Type", value: userFilters.role });
  }
  if (userFilters.joined !== "all") {
    activeUserFilters.push({ key: "joined", label: "Date Joined", value: userFilters.joined });
  }
  if (userFilters.listings !== "all") {
    activeUserFilters.push({ key: "listings", label: "Number of Listings", value: userFilters.listings });
  }
  if (userFilters.status !== "all") {
    activeUserFilters.push({ key: "status", label: "Status", value: userFilters.status });
  }

  return (
    <div
      className={`flex h-screen w-full overflow-x-hidden bg-zinc-100/70 transition-all duration-500 ease-out dark:bg-zinc-950 ${
        pageReady ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
      }`}
    >
      <aside
        className={`flex shrink-0 flex-col border-r border-zinc-200 bg-white/95 transition-all duration-300 dark:border-zinc-800 dark:bg-zinc-950/95 ${
          sidebarCollapsed
            ? "w-24 items-center px-2 pt-5 pb-4 shadow-[inset_-1px_0_0_rgba(0,0,0,0.04)]"
            : "w-80 p-4"
        }`}
      >
        <div
          className={`flex items-center text-left ${
            sidebarCollapsed
              ? "h-14 w-full justify-center self-center px-0 py-0 text-zinc-900 dark:text-zinc-100"
              : "gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 px-3 py-3 dark:border-zinc-800 dark:bg-zinc-900"
          }`}
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
              className={sidebarCollapsed ? "h-[1.9rem] w-[1.9rem] sm:h-9 sm:w-9" : "h-6 w-6"}
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
              <h2 className="truncate text-lg font-semibold text-zinc-950 dark:text-zinc-50">
                {showingCarsInterface ? "Car Catalogue" : "User Management"}
              </h2>
            </div>
          )}
        </div>

        <div
          className={`${sidebarCollapsed ? "mt-4" : "mt-4"} min-h-0 flex-1 ${
            sidebarCollapsed
              ? "mx-auto w-full max-w-[4.4rem] overflow-hidden rounded-[30px] bg-white/95 p-2.5 dark:bg-zinc-950/95"
              : "overflow-x-hidden overflow-y-auto"
          }`}
        >
          {showingCarsInterface ? (
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
          ) : (
            <div className={`space-y-5 ${sidebarCollapsed ? "px-1" : "px-1 py-1"}`}>
              {sidebarCollapsed ? (
                <div className="flex h-full w-full flex-col items-center justify-start">
                  <div className="flex w-14 flex-col items-center gap-4 pt-0 pb-3 xl:gap-6 xl:pb-4">
                    {USER_FILTER_BUTTONS.map((filter) => {
                      const isActive = userFilters[filter.key] !== "all";

                      return (
                        <div key={filter.key} className="group relative flex items-center justify-center">
                          <button
                            type="button"
                            title={filter.label}
                            onClick={() => setSidebarCollapsed(false)}
                            className={`cursor-pointer relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border transition duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 dark:focus-visible:ring-zinc-600 dark:focus-visible:ring-offset-zinc-950 ${
                              isActive
                                ? "border-emerald-300 bg-zinc-50 text-emerald-700 dark:border-emerald-800 dark:bg-zinc-900 dark:text-emerald-300"
                                : "border-zinc-200 bg-zinc-50 text-zinc-600 hover:border-zinc-300 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-700 dark:hover:bg-zinc-800"
                            }`}
                            aria-label={filter.label}
                          >
                            <span className="text-xs font-semibold uppercase">{filter.shortLabel}</span>
                            {isActive ? (
                              <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-zinc-50 dark:ring-zinc-900" />
                            ) : null}
                          </button>

                          <div className="pointer-events-none absolute left-[calc(100%+0.65rem)] top-1/2 z-20 -translate-y-1/2 whitespace-nowrap rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-700 opacity-0 shadow-lg transition group-hover:opacity-100 group-focus-within:opacity-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200">
                            {filter.label}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <>
                  <div className="rounded-2xl border border-zinc-200 bg-white/80 px-4 py-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/70">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-zinc-500">User Filters</p>
                    <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                      Narrow admins, dealers, and consumers by signup date, listing count, and status.
                    </p>
                  </div>

                  <div className="space-y-4">
                <label className="block">
                  {!sidebarCollapsed && (
                    <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.3em] text-zinc-500">
                      User Type
                    </span>
                  )}
                  <select
                    value={userFilters.role}
                    onChange={(event) => {
                      setUserFilters((prev) => ({ ...prev, role: event.target.value as UserFilterState["role"] }));
                      resetPage();
                    }}
                    className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:focus:border-zinc-600"
                  >
                    <option value="all">All roles</option>
                    <option value="consumer">Consumer</option>
                    <option value="dealer">Dealer</option>
                    <option value="admin">Admin</option>
                  </select>
                </label>

                <label className="block">
                  {!sidebarCollapsed && (
                    <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.3em] text-zinc-500">
                      Date Joined
                    </span>
                  )}
                  <select
                    value={userFilters.joined}
                    onChange={(event) => {
                      setUserFilters((prev) => ({ ...prev, joined: event.target.value as UserFilterState["joined"] }));
                      resetPage();
                    }}
                    className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:focus:border-zinc-600"
                  >
                    <option value="all">Any time</option>
                    <option value="last-7-days">Last 7 days</option>
                    <option value="last-30-days">Last 30 days</option>
                    <option value="this-year">This year</option>
                    <option value="older">Older</option>
                  </select>
                </label>

                <label className="block">
                  {!sidebarCollapsed && (
                    <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.3em] text-zinc-500">
                      Number of Listings
                    </span>
                  )}
                  <select
                    value={userFilters.listings}
                    onChange={(event) => {
                      setUserFilters((prev) => ({ ...prev, listings: event.target.value as UserFilterState["listings"] }));
                      resetPage();
                    }}
                    className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:focus:border-zinc-600"
                  >
                    <option value="all">Any amount</option>
                    <option value="none">No listings</option>
                    <option value="1-2">1 to 2</option>
                    <option value="3-5">3 to 5</option>
                    <option value="6-plus">6 or more</option>
                  </select>
                </label>

                <label className="block">
                  {!sidebarCollapsed && (
                    <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.3em] text-zinc-500">
                      Status
                    </span>
                  )}
                  <select
                    value={userFilters.status}
                    onChange={(event) => {
                      setUserFilters((prev) => ({ ...prev, status: event.target.value as UserFilterState["status"] }));
                      resetPage();
                    }}
                    className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:focus:border-zinc-600"
                  >
                    <option value="all">Any status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </label>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => setSidebarCollapsed((prev) => !prev)}
          className={`mt-auto flex cursor-pointer items-center justify-center rounded-2xl border border-zinc-200 bg-zinc-50 text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:border-zinc-700 dark:hover:bg-zinc-800 ${
            sidebarCollapsed ? "h-14 w-14 self-center" : "h-14 w-14 self-end"
          }`}
          aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <svg
            viewBox="0 0 24 24"
            className="h-5 w-5 sm:h-6 sm:w-6"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            {sidebarCollapsed ? <path d="m9 6 6 6-6 6" /> : <path d="m15 6-6 6 6 6" />}
          </svg>
        </button>
      </aside>

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

      <div className="min-w-0 flex flex-1 flex-col overflow-hidden p-8">
        <div className="mb-8 flex shrink-0 flex-col gap-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            {isAdmin ? (
              <div className="inline-flex w-fit rounded-2xl border border-zinc-200 bg-white p-1 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                {(["cars", "users"] as const).map((view) => (
                  <button
                    key={view}
                    type="button"
                    onClick={() => setActiveAdminView(view)}
                    className={`cursor-pointer rounded-xl px-4 py-2 text-sm font-semibold transition ${
                      activeAdminView === view
                        ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                        : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                    }`}
                  >
                    {view === "cars" ? "Cars" : "Users"}
                  </button>
                ))}
              </div>
            ) : (
              <h1
                className={`min-h-9 text-3xl font-bold transition-opacity duration-300 ${
                  catalogTitle ? "opacity-100" : "opacity-0"
                }`}
              >
                {catalogTitle ?? " "}
              </h1>
            )}

            <div className="flex items-center gap-3 self-start md:self-auto">
              {showingCarsInterface && isLoggedIn && (
                <button
                  type="button"
                  onClick={() => {
                    setSaveError(null);
                    setShowAddForm(true);
                  }}
                  className="cursor-pointer rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                >
                  Add New Listing
                </button>
              )}
              <div ref={guestMenuRef} className="relative">
                <button
                  type="button"
                  onClick={() => {
                    if (!isLoggedIn) {
                      setShowGuestMenu((prev) => !prev);
                      return;
                    }
                    setShowProfile(true);
                  }}
                  className={`flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full text-sm font-semibold transition ${
                    isLoggedIn
                      ? "bg-zinc-900 text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
                      : "border-2 border-dashed border-zinc-400 bg-zinc-100 text-zinc-500 hover:border-zinc-500 hover:bg-zinc-200 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:border-zinc-500 dark:hover:bg-zinc-700"
                  }`}
                  aria-label={isLoggedIn ? "My Profile" : "Account"}
                  aria-expanded={!isLoggedIn ? showGuestMenu : undefined}
                >
                  {isLoggedIn ? (
                    getInitials(currentUser!.fullName)
                  ) : (
                    <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5" aria-hidden="true">
                      <path d="M10 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM3.465 14.493a1.23 1.23 0 0 0 .41 1.412A9.957 9.957 0 0 0 10 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 0 0-13.074.003Z" />
                    </svg>
                  )}
                </button>

                {!isLoggedIn && showGuestMenu && (
                  <div className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-48 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
                    <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-800">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Account</p>
                    </div>
                    <div className="p-2 flex flex-col gap-1">
                      <Link
                        href="/login"
                        onClick={() => setShowGuestMenu(false)}
                        className="cursor-pointer flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-900 hover:bg-zinc-100 dark:text-zinc-100 dark:hover:bg-zinc-800 transition"
                      >
                        Log In
                      </Link>
                      <Link
                        href="/login?mode=signup"
                        onClick={() => setShowGuestMenu(false)}
                        className="cursor-pointer flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-900 hover:bg-zinc-100 dark:text-zinc-100 dark:hover:bg-zinc-800 transition"
                      >
                        Sign Up
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {showingCarsInterface ? (
            <>
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between md:gap-4">
                <input
                  type="text"
                  placeholder={showSavedListings ? "Search saved listings..." : animatedSearchPlaceholder || " "}
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

                  {showSavedListings && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          if (selectedCompareCars.length === 2) {
                            setShowCompareModal(true);
                          }
                        }}
                        disabled={selectedCompareCars.length !== 2}
                        className={`cursor-pointer rounded-lg px-3 py-2 text-sm font-medium transition ${
                          selectedCompareCars.length === 2
                            ? "bg-emerald-600 text-white hover:bg-emerald-500"
                            : "cursor-not-allowed border border-zinc-200 bg-zinc-100 text-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-500"
                        }`}
                      >
                        Compare {selectedCompareCars.length}/2
                      </button>

                      <button
                        type="button"
                        onClick={() => setCompareSelection([])}
                        disabled={compareSelection.length === 0}
                        className="cursor-pointer rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800"
                      >
                        Clear
                      </button>
                    </>
                  )}

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
                      {sortDirection === "asc" ? "Asc" : "Desc"}
                    </button>
                  )}
                </div>
              </div>

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
                          x
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {showSavedListings && savedListings.length > 0 && (
                <div className="rounded-2xl border border-emerald-200 bg-linear-to-r from-emerald-50 via-white to-sky-50 px-4 py-4 shadow-sm dark:border-emerald-900/40 dark:from-emerald-950/20 dark:via-zinc-900/80 dark:to-sky-950/20">
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700 dark:text-emerald-300">
                        Compare Saved Cars
                      </p>
                      <p className="mt-1 text-sm text-zinc-700 dark:text-zinc-200">
                        Select exactly two saved cars to open a side-by-side comparison with highlighted winners.
                      </p>
                    </div>
                    <p className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
                      {compareSelection.length === 0
                        ? "Pick your first car"
                        : compareSelection.length === 1
                          ? "Pick one more car"
                          : "Ready to compare"}
                    </p>
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between md:gap-4">
                <input
                  type="text"
                  placeholder="Search users..."
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value);
                    resetPage();
                  }}
                  className="w-full flex-1 rounded-lg border border-zinc-200 px-4 py-2 text-sm outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:focus:border-zinc-600"
                />

                <div className="flex items-center gap-2 md:w-auto">
                  <label htmlFor="user-sort" className="sr-only">
                    Sort users
                  </label>
                <select
                  id="user-sort"
                  value={userSortBy}
                  onChange={(event) => {
                    setUserSortBy(event.target.value as UserSortOption);
                    resetPage();
                  }}
                  className="w-full cursor-pointer rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:focus:border-zinc-600 md:w-52"
                >
                    <option value="newest">Newest to oldest</option>
                    <option value="oldest">Oldest to newest</option>
                    <option value="name-asc">A-Z</option>
                    <option value="name-desc">Z-A</option>
                  </select>
                </div>
              </div>

              {activeUserFilters.length > 0 && (
                <div className="rounded-2xl border border-zinc-200 bg-white/85 px-4 py-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/70">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-zinc-500">
                        Applied Filters
                      </p>
                      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                        Users are narrowed by {activeUserFilters.length} filter{activeUserFilters.length === 1 ? "" : "s"}.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setUserFilters({
                          role: "all",
                          joined: "all",
                          listings: "all",
                          status: "all",
                        });
                        resetPage();
                      }}
                      className="inline-flex cursor-pointer items-center justify-center rounded-full border border-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
                    >
                      Clear all
                    </button>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {activeUserFilters.map((filter) => (
                      <button
                        key={filter.key}
                        type="button"
                        onClick={() => {
                          setUserFilters((prev) => ({ ...prev, [filter.key]: "all" }));
                          resetPage();
                        }}
                        className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-sm text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:border-zinc-600 dark:hover:bg-zinc-900"
                      >
                        <span className="font-medium">{filter.label}:</span>
                        <span>{filter.value}</span>
                        <span aria-hidden="true" className="text-zinc-400 dark:text-zinc-500">x</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {(loadError || userLoadError || saveError) && (
            <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
              {saveError || userLoadError || loadError}
            </p>
          )}
        </div>

        {showingCarsInterface && showAddForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl dark:bg-zinc-950">
              <AddListingForm
                onSubmit={handleAddListing}
                onCancel={() => setShowAddForm(false)}
                submitError={saveError}
                submitting={saving}
              />
            </div>
          </div>
        )}

        {showingCarsInterface && editCar && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl dark:bg-zinc-950">
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

        {showingCarsInterface && activeCar && (
          <CarDetailsModal
            car={activeCar}
            onClose={() => setActiveCar(null)}
            onSave={handleSaveListing}
            isSaved={isCarSaved(activeCar)}
            onEdit={isAdmin ? (car) => {
              setSaveError(null);
              setActiveCar(null);
              setEditCar(car);
            } : undefined}
            isLoggedIn={isLoggedIn}
          />
        )}

        {showingCarsInterface && showCompareModal && selectedCompareCars.length === 2 && (
          <CarCompareModal
            leftCar={selectedCompareCars[0]}
            rightCar={selectedCompareCars[1]}
            onClose={() => setShowCompareModal(false)}
          />
        )}

        <div className="flex-1 overflow-x-hidden overflow-y-auto">
          {!showingCarsInterface ? (
            usersLoading ? (
              <div className="rounded-3xl border border-zinc-200 bg-white/80 p-8 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-300">
                Loading users...
              </div>
            ) : visibleUsers.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-zinc-300 bg-white/80 p-8 text-sm text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900/60 dark:text-zinc-300">
                No users matched the current search.
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                  {pagedUsers.map((user) => (
                    <div
                      key={user.id}
                      className="flex h-100 flex-col rounded-3xl border border-zinc-200 bg-white/90 p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/70"
                    >
                      <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950/60">
                        <div className="flex items-start gap-3">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-zinc-900 text-sm font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900">
                            {getInitials(user.fullName)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-lg font-semibold leading-tight text-zinc-950 dark:text-zinc-50">
                              {user.fullName}
                            </p>
                            <p className="mt-1 break-all text-sm text-zinc-600 dark:text-zinc-300">{user.email}</p>
                          </div>
                        </div>
                        <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.18em]">
                          <span className="rounded-full bg-zinc-100 px-3 py-1 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                            {user.role}
                          </span>
                          <span
                            className={`rounded-full px-3 py-1 ${
                              user.isActive
                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
                                : "bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                            }`}
                          >
                            {user.isActive ? "active" : "inactive"}
                          </span>
                        </div>
                      </div>

                      <div className="mt-3 flex flex-1 flex-col gap-3">
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="min-h-28 rounded-2xl border border-zinc-200/80 bg-zinc-50 px-4 py-4 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950/60 dark:text-zinc-300">
                            <div className="flex h-full flex-col justify-between">
                              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Created</p>
                              <p className="mt-2 leading-snug">{new Date(user.createdAt).toLocaleString()}</p>
                            </div>
                          </div>
                          <div className="min-h-28 rounded-2xl border border-zinc-200/80 bg-zinc-50 px-4 py-4 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950/60 dark:text-zinc-300">
                            <div className="flex h-full flex-col justify-between">
                              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Listings</p>
                              <p className="mt-2 text-xl font-semibold leading-none text-zinc-900 dark:text-zinc-100">
                                {listingCountByUser.get(user.id) ?? listingCountByUser.get(user.email.trim().toLowerCase()) ?? 0}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50 px-4 py-3 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950/60 dark:text-zinc-300">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">User ID</p>
                          <p className="mt-2 break-all leading-snug">{user.id}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-8 flex items-center justify-between">
                  <p className="text-sm text-zinc-500">
                    {visibleUsers.length === 0
                      ? "No results"
                      : `${(currentPage - 1) * PAGE_SIZE + 1}-${Math.min(
                          currentPage * PAGE_SIZE,
                          visibleUsers.length,
                        )} of ${visibleUsers.length}`}
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
                    {Array.from({ length: totalUserPages }, (_, index) => index + 1).map((page) => (
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
                      onClick={() => setCurrentPage((page) => Math.min(totalUserPages, page + 1))}
                      disabled={currentPage === totalUserPages}
                      className="cursor-pointer rounded-lg border border-zinc-200 px-3 py-1.5 text-sm hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-800 dark:hover:bg-zinc-800"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </>
            )
          ) : loading ? (
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
                  <div
                    key={getCarKey(car, i)}
                    className={`relative rounded-2xl transition ${
                      compareSelection.includes(normalizeVin(car.vin))
                        ? "bg-emerald-50/70 dark:bg-emerald-950/20"
                        : ""
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setActiveCar(car)}
                      className="w-full cursor-pointer rounded-lg text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 dark:focus-visible:ring-zinc-600 dark:focus-visible:ring-offset-zinc-950"
                    >
                      <CarCard car={car} />
                    </button>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        toggleCompareSelection(car);
                      }}
                      className={`absolute left-3 top-3 inline-flex cursor-pointer items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold shadow-sm transition ${
                        compareSelection.includes(normalizeVin(car.vin))
                          ? "border border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-700/60 dark:bg-emerald-950/40 dark:text-emerald-200 dark:hover:bg-emerald-950/60"
                          : "border border-zinc-200 bg-white/95 text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900/95 dark:text-zinc-200 dark:hover:bg-zinc-800"
                      }`}
                      aria-pressed={compareSelection.includes(normalizeVin(car.vin))}
                    >
                      {compareSelection.includes(normalizeVin(car.vin)) ? "Selected" : "Select"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveSavedListing(normalizeVin(car.vin))}
                      className="absolute right-3 top-3 inline-flex cursor-pointer items-center gap-1 rounded-full border border-rose-200 bg-white/95 px-3 py-1.5 text-xs font-semibold text-rose-700 shadow-sm transition hover:bg-rose-50 dark:border-rose-700/60 dark:bg-zinc-900/95 dark:text-rose-300 dark:hover:bg-rose-950/30"
                      aria-label="Remove saved listing"
                    >
                      Remove
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
                    key={getCarKey(car, (currentPage - 1) * PAGE_SIZE + index)}
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
                    : `${(currentPage - 1) * PAGE_SIZE + 1}-${Math.min(
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
