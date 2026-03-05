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

  useEffect(() => {
    fetch("/cleaned_cars.csv")
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
    <div className="h-screen flex flex-col items-center p-8">
      <div className="flex items-center justify-between w-full max-w-2xl mb-4 shrink-0">
        <h1 className="text-3xl font-bold">Car Catalogue</h1>
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

      <input
        type="text"
        placeholder="Search cars..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="mb-6 w-full max-w-2xl shrink-0 rounded-lg border border-zinc-200 px-4 py-2 text-sm outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:focus:border-zinc-600"
      />

      <FilterSelection cars={cars} selections={selections} onSelectionChange={setSelections} />

      <div className="overflow-y-auto flex-1 w-full max-w-2xl">

        {/* This div contains the list of cars that will be filtered, and the parameters within map represent the index and type of car*/}
        <div className="grid grid-cols-2 gap-3">
          {cleanSelection(filtered, selections).map((car, i) => (
            <CarCard key={i} car={car} />
          ))}
        </div>
      </div>
    </div>
  );
}
