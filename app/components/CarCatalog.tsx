"use client";

import { useEffect, useState, useMemo } from "react";
import { Car, parseCsv } from "../../types/car";
import FilterSelection from "./FilterSelection";
import { cleanSelection } from "../../types/filter";
import CarCard from "./CarCard";


export default function CarCatalog() {
  const [cars, setCars] = useState<Car[]>([]);
  const [query, setQuery] = useState("");
  const [selections, setSelections] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch("/cars.csv")
      .then((res) => res.text())
      .then((text) => setCars(parseCsv(text)));
  }, []);

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
    <div className="flex h-screen w-full">
      {/* Left sidebar: filters */}
      <aside className="w-64 shrink-0 overflow-y-auto border-r border-zinc-200 p-6 dark:border-zinc-800">
        <FilterSelection cars={cars} selections={selections} onSelectionChange={setSelections} />
      </aside>

      {/* Right: catalog */}
      <div className="flex flex-1 flex-col p-8 overflow-hidden">
        <h1 className="mb-4 text-3xl font-bold shrink-0">View our Catalog of Cars</h1>
        <input
          type="text"
          placeholder="Search cars..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="mb-6 shrink-0 rounded-lg border border-zinc-200 px-4 py-2 text-sm outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:focus:border-zinc-600"
        />

        <div className="overflow-y-auto flex-1">
          <div className="grid grid-cols-3 gap-6">
            {cleanSelection(filtered, selections).map((car, i) => (
              <CarCard key={i} car={car} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
