"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import type { Car } from "../types/car";

function parseJson(data: unknown): Car[] {
  if (!Array.isArray(data)) return [];

  return data.map((item) => {
    const car = item as Record<string, unknown>;
    return {
      year: Number(car.year ?? 0),
      make: String(car.make ?? ""),
      model: String(car.model ?? ""),
      trim: car.trim != null ? String(car.trim) : null,
      body: String(car.body ?? ""),
      transmission: car.transmission != null ? String(car.transmission) : null,
      vin: String(car.vin ?? ""),
      state: String(car.state ?? ""),
      condition: car.condition != null ? Number(car.condition) : null,
      odometer: Number(car.odometer ?? 0),
      color: String(car.color ?? ""),
      interior: String(car.interior ?? ""),
      seller: String(car.seller ?? ""),
      mmr: Number(car.mmr ?? 0),
      sellingprice: Number(car.sellingprice ?? 0),
      saledate: String(car.saledate ?? ""),
      deal_rating:
        car.deal_rating === "Great Deal" || car.deal_rating === "Good Price" || car.deal_rating === "Fair Market"
          ? car.deal_rating
          : "Fair Market",
    };
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
      <p className="mt-2 text-sm">Rating: {car.deal_rating}</p>
    </div>
  );
}

export default function Home() {
  const [cars, setCars] = useState<Car[]>([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    fetch("/cleaned_cars.json")
      .then((res) => res.json())
      .then((data) => setCars(parseJson(data)));
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
