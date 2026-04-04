"use client";

import Image from "next/image";
import { Car } from "../../types/car";
import { getCarImageSrc } from "../../utils/carImage";
import { formatCondition, formatMoney, formatOdometerKm } from "../../utils/formatters";
import {
  formatNumberOrMissing,
  formatValueOrMissing,
  getMissingListingFields,
  isListingIncomplete,
} from "../../utils/listingCompleteness";
import { ReviewsSection } from "./ReviewsSection";

function isDataUrl(src: string) {
  return src.startsWith("data:");
}

function SpecRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="font-medium text-zinc-600 dark:text-zinc-300">{label}</div>
      <div className="text-right text-zinc-950 dark:text-zinc-50">{value}</div>
    </div>
  );
}

export default function CarDetailsModal({
  car,
  onClose,
  onSave,
  isSaved,
  onEdit,
  isLoggedIn,
}: {
  car: Car;
  onClose: () => void;
  onSave: (car: Car) => void;
  isSaved: boolean;
  onEdit?: (car: Car) => void;
  isLoggedIn: boolean;
}) {
  const src = getCarImageSrc(car);
  const missingFields = getMissingListingFields(car);
  const incomplete = isListingIncomplete(car);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-zinc-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-zinc-500">Listing</p>
            <h2 className="truncate text-xl font-semibold text-zinc-950 dark:text-zinc-50 sm:text-2xl">
              {Number.isFinite(car.year) ? car.year : "Unknown year"} {car.make} {car.model}
            </h2>
            <p className="mt-1 truncate text-sm text-zinc-600 dark:text-zinc-300">
              VIN: <span className="font-mono">{car.vin || "N/A"}</span>
            </p>
            {incomplete && (
              <p className="mt-2 inline-flex items-center rounded-full border border-amber-300 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800 dark:border-amber-700/60 dark:bg-amber-950/30 dark:text-amber-200">
                Incomplete listing
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            {onEdit && (
              <button
                type="button"
                onClick={() => onEdit(car)}
                className="cursor-pointer inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
              >
                Edit
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
            >
              Close
            </button>
          </div>
        </div>

        <div className="grid gap-6 p-6 lg:grid-cols-5">
          <section className="lg:col-span-3">
            <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
              <div className="relative aspect-[16/10] w-full bg-zinc-100 dark:bg-zinc-900">
                {isDataUrl(src) ? (
                  <img src={src} alt={`${car.year} ${car.make} ${car.model}`} className="h-full w-full object-cover" />
                ) : (
                  <Image
                    src={src}
                    alt={`${car.year} ${car.make} ${car.model}`}
                    fill
                    sizes="(max-width: 1024px) 100vw, 60vw"
                    className="object-cover"
                  />
                )}
              </div>
              <div className="p-5">
                {incomplete && (
                  <p className="mb-3 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-700/60 dark:bg-amber-950/30 dark:text-amber-200">
                    Missing fields: {missingFields.join(", ")}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-zinc-900 px-3 py-1 text-xs font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900">
                    {formatNumberOrMissing(car.sellingprice, formatMoney)}
                  </span>
                  <span className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-semibold text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200">
                    {formatNumberOrMissing(car.odometer, formatOdometerKm)}
                  </span>
                  <span className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-semibold text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200">
                    {formatCondition(car.condition)}
                  </span>
                  <span className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-semibold text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200">
                    {car.deal_rating}
                  </span>
                </div>
                <div className="mt-3 rounded-lg bg-zinc-100 p-2 dark:bg-zinc-900">
                  <button
                    type="button"
                    onClick={() => onSave(car)}
                    className={`inline-flex w-full items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold transition ${isSaved
                        ? "border border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-700/60 dark:bg-emerald-900/20 dark:text-emerald-300"
                        : "bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                      }`}
                  >
                    {isSaved ? "Saved Listing" : "Save Listing"}
                  </button>
                </div>
              </div>
            </div>
          </section>

          <section className="lg:col-span-2">
            <div className="grid gap-3">
              <SpecRow label="Trim" value={formatValueOrMissing(car.trim)} />
              <SpecRow label="Body" value={formatValueOrMissing(car.body)} />
              <SpecRow label="Transmission" value={formatValueOrMissing(car.transmission)} />
              <SpecRow label="State" value={formatValueOrMissing(car.state)} />
              <SpecRow label="Color" value={formatValueOrMissing(car.color)} />
              <SpecRow label="Interior" value={formatValueOrMissing(car.interior)} />
              <SpecRow label="Seller" value={formatValueOrMissing(car.seller)} />
              <SpecRow label="MMR" value={formatNumberOrMissing(car.mmr, formatMoney)} />
              <SpecRow label="Sale date" value={formatValueOrMissing(car.saledate)} />
            </div>
          </section>
        </div>

        <div className="border-t border-zinc-200 px-6 py-6 dark:border-zinc-800">
          <ReviewsSection vin={car.vin} isLoggedIn={isLoggedIn} />
        </div>
      </div>
    </div>
  );
}

