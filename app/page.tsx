"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

interface Car {
  make: string;
  model: string;
  year: string;
  rating: string;
  image?: string;
}

function parseCsv(text: string): Car[] {
  const lines = text.trim().split("\n");
  const headers = lines[0].split(",");
  return lines.slice(1).map((line) => {
    const values = line.split(",");
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => (obj[h.trim()] = values[i]?.trim() ?? ""));
    return obj as unknown as Car;
  });
}

function CarCard({ car }: { car: Car }) {
  return (
    <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
      <div className="relative mb-3 h-36 w-full overflow-hidden rounded-md">
        <Image
          src={car.image?.trim() || "/cars/placeholder.svg"}
          alt={`${car.make} ${car.model}`}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover"
        />
      </div>
      <h2 className="text-base font-semibold">{car.make}</h2>
      <p className="text-sm text-zinc-500">{car.model}</p>
      <p className="mt-1 text-zinc-500">{car.year}</p>
      <p className="mt-2 text-sm">Rating: {car.rating} / 5</p>
    </div>
  );
}

export default function Home() {
  const [cars, setCars] = useState<Car[]>([]);
  const [query, setQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [rating, setRating] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/cars.csv")
      .then((res) => res.text())
      .then((text) => setCars(parseCsv(text)));
  }, []);

  async function handleCreateListing(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!make || !model || !year || !rating) {
      setError("Please fill in all fields.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/listings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ make, model, year, rating }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error || "Failed to create listing.");
        return;
      }

      // Optimistically add the new car to the list.
      const newCar: Car = { make, model, year, rating };
      setCars((prev) => [...prev, newCar]);

      setMake("");
      setModel("");
      setYear("");
      setRating("");
      setShowForm(false);
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  // useMemo, the filtering is skipped unless an actual input is changed (if cars or query is changed)
  const filtered = useMemo(() => {
    
    // We take the user's query and set it lowercase to standardize their query
    const q = query.trim().toLowerCase();

    // If the query is empty, just return the full list (normal state)
    if (!q) return cars;

    // This returns the cars that include some sort of your query within the haystack: (ex. haystack = "toyota camry 4.5 2025" & q = "toy", this will return the car)
    return cars.filter((car) => {
      const haystack = `${car.make} ${car.model} ${car.rating} ${car.year}`.toLowerCase();
      return haystack.includes(q)
    })
  }, [cars, query])

  return (
    <div className="h-screen flex flex-col items-center p-8">
      <div className="mb-6 flex w-full max-w-2xl items-center justify-between">
        <h1 className="text-3xl font-bold shrink-0">Car Catalogue</h1>
        <button
          onClick={() => setShowForm(true)}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Create listing
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-lg bg-white p-6 text-sm shadow-lg dark:bg-zinc-900">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Create a listing</h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
              >
                Close
              </button>
            </div>
            <form onSubmit={handleCreateListing} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Make"
                  value={make}
                  onChange={(e) => setMake(e.target.value)}
                  className="rounded-md border border-zinc-200 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-950"
                />
                <input
                  type="text"
                  placeholder="Model"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="rounded-md border border-zinc-200 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-950"
                />
                <input
                  type="number"
                  placeholder="Year"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="rounded-md border border-zinc-200 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-950"
                />
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="5"
                  placeholder="Rating (0–5)"
                  value={rating}
                  onChange={(e) => setRating(e.target.value)}
                  className="rounded-md border border-zinc-200 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-950"
                />
              </div>
              {error && (
                <p className="text-xs text-red-500">
                  {error}
                </p>
              )}
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="rounded-md px-3 py-1.5 text-xs text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-md bg-green-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-70"
                >
                  {isSubmitting ? "Posting..." : "Post listing"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <input
        type="text"
        placeholder="Search cars..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="mb-6 w-full max-w-2xl shrink-0 rounded-lg border border-zinc-200 px-4 py-2 text-sm outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:focus:border-zinc-600"
      />

      <div className="overflow-y-auto flex-1 w-full max-w-2xl">

        {/* This div contains the list of cars that will be filtered, and the parameters within map represent the index and type of car*/}
        <div className="grid grid-cols-2 gap-3">
          {filtered.map((car, i) => (
            <CarCard key={i} car={car} />
          ))}
        </div>
      </div>
    </div>
  );
}
