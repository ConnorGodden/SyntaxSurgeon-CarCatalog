"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

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
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/cars.csv")
      .then((res) => res.text())
      .then((text) => setCars(parseCsv(text)));
  }, []);

  return (
    <div className="h-screen flex flex-col items-center p-8">
      <h1 className="mb-4 text-3xl font-bold shrink-0">Car Catalogue</h1>
      <input
        type="text"
        placeholder="Search cars..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-6 w-full max-w-2xl shrink-0 rounded-lg border border-zinc-200 px-4 py-2 text-sm outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:focus:border-zinc-600"
      />
      <div className="overflow-y-auto flex-1 w-full max-w-2xl">
        <div className="grid grid-cols-2 gap-3">
          {cars.map((car, i) => (
            <CarCard key={i} car={car} />
          ))}
        </div>
      </div>
    </div>
  );
}
