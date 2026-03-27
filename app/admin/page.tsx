"use client";

import { useEffect, useState, useMemo } from "react";
import { Car, parseCsv } from "../../types/car";
import { findAllDuplicates } from "../../utils/duplicateDetection";
import Link from "next/link";

export default function AdminPage() {
  const [cars, setCars] = useState<Car[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<number | null>(null);

  useEffect(() => {
    fetch("/cars.csv")
      .then((res) => res.text())
      .then((text) => setCars(parseCsv(text)));
  }, []);

  const duplicateGroups = useMemo(() => findAllDuplicates(cars), [cars]);

  return (
    <div className="min-h-screen bg-zinc-100/70 dark:bg-zinc-950 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 mb-4"
          >
            ← Back to Catalog
          </Link>
          <h1 className="text-3xl font-bold text-zinc-950 dark:text-zinc-50">Admin Dashboard</h1>
          <p className="text-zinc-600 dark:text-zinc-400 mt-2">
            Manage duplicate listings ({duplicateGroups.length} groups found)
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Duplicate Groups List */}
          <div className="bg-white dark:bg-zinc-950 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-6">
            <h2 className="text-xl font-semibold mb-4 text-zinc-950 dark:text-zinc-50">Duplicate Groups</h2>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {duplicateGroups.length === 0 ? (
                <p className="text-zinc-500 dark:text-zinc-400">No duplicates found</p>
              ) : (
                duplicateGroups.map((group, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                      selectedGroup === index
                        ? 'border-amber-400 bg-amber-50 dark:bg-amber-950/50'
                        : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                    }`}
                    onClick={() => setSelectedGroup(selectedGroup === index ? null : index)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-zinc-950 dark:text-zinc-50">
                          {group[0].year} {group[0].make} {group[0].model}
                        </h3>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400">
                          {group.length} similar listings
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-zinc-950 dark:text-zinc-50">
                          ${Math.min(...group.map(c => c.sellingprice))} - ${Math.max(...group.map(c => c.sellingprice))}
                        </p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">Price range</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Selected Group Details */}
          <div className="bg-white dark:bg-zinc-950 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-6">
            <h2 className="text-xl font-semibold mb-4 text-zinc-950 dark:text-zinc-50">
              {selectedGroup !== null ? `Group ${selectedGroup + 1} Details` : 'Select a Group'}
            </h2>
            {selectedGroup !== null && duplicateGroups[selectedGroup] ? (
              <div className="space-y-4">
                {duplicateGroups[selectedGroup].map((car, carIndex) => (
                  <div key={car.vin || carIndex} className="p-4 border border-zinc-200 dark:border-zinc-800 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-zinc-950 dark:text-zinc-50">
                        {car.year} {car.make} {car.model} {car.trim}
                      </h3>
                      <span className="text-lg font-bold text-zinc-950 dark:text-zinc-50">
                        ${car.sellingprice.toLocaleString()}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                      <div>VIN: {car.vin || 'N/A'}</div>
                      <div>Mileage: {car.odometer.toLocaleString()} km</div>
                      <div>Color: {car.color}</div>
                      <div>State: {car.state}</div>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <Link
                        href={{
                          pathname: "/car-listing",
                          query: { carData: JSON.stringify(car) },
                        }}
                        className="px-3 py-1 text-sm bg-zinc-900 text-white rounded hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                      >
                        View Details
                      </Link>
                      <button className="px-3 py-1 text-sm border border-red-300 text-red-700 rounded hover:bg-red-50 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-950">
                        Mark for Removal
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-zinc-500 dark:text-zinc-400">
                Click on a duplicate group to view details and manage listings
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}