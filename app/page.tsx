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

    // This returns the cars that include some sort of your query within the haystack: (ex. haystack = "toyota camry 4.5 2025" & q = "toy", this will return the car)
    return cars.filter((car) => {
      const haystack = `${car.make} ${car.model} ${car.rating} ${car.year}`.toLowerCase();
      return haystack.includes(q)
    })
  }, [cars, query])

  return (
    <div className="h-screen flex flex-col items-center p-8">
      <h1 className="mb-4 text-3xl font-bold shrink-0">Car Catalogue</h1>
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
