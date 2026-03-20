"use client";

import Image from "next/image";
import { Car } from "../../types/car";
import { CONDITION_OPTIONS } from "./AddListingForm";
import { getCarImageSrc } from "../../utils/carImage";

function labelFromSnakeCase(value: string) {
  const found = CONDITION_OPTIONS.find((o) => o.value === value);
  if (found) return found.label;
  return value
    .split("_")
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

function formatCondition(condition: Car["condition"]) {
  if (condition == null || condition === "") return "N/A";
  if (typeof condition === "string") return labelFromSnakeCase(condition);
  return `Score: ${condition}`;
}

function isDataUrl(src: string) {
  return src.startsWith("data:");
}

function formatMoney(value: number) {
  if (!isFinite(value)) return "N/A";
  return value.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

function formatOdometerKm(value: number) {
  if (!isFinite(value)) return "N/A";
  return `${value.toLocaleString()} KM`;
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
  onEdit,
}: {
  car: Car;
  onClose: () => void;
  onEdit?: (car: Car) => void;
}) {
  const src = getCarImageSrc(car);

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
              {car.year} {car.make} {car.model}
            </h2>
            <p className="mt-1 truncate text-sm text-zinc-600 dark:text-zinc-300">
              VIN: <span className="font-mono">{car.vin || "N/A"}</span>
            </p>
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
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-zinc-900 px-3 py-1 text-xs font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900">
                    {formatMoney(car.sellingprice)}
                  </span>
                  <span className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-semibold text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200">
                    {formatOdometerKm(car.odometer)}
                  </span>
                  <span className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-semibold text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200">
                    {formatCondition(car.condition)}
                  </span>
                  <span className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-semibold text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200">
                    {car.deal_rating}
                  </span>
                </div>
              </div>
            </div>
          </section>

          <section className="lg:col-span-2">
            <div className="grid gap-3">
              <SpecRow label="Trim" value={car.trim ?? "N/A"} />
              <SpecRow label="Body" value={car.body || "N/A"} />
              <SpecRow label="Transmission" value={car.transmission ?? "N/A"} />
              <SpecRow label="State" value={car.state || "N/A"} />
              <SpecRow label="Color" value={car.color || "N/A"} />
              <SpecRow label="Interior" value={car.interior || "N/A"} />
              <SpecRow label="Seller" value={car.seller || "N/A"} />
              <SpecRow label="MMR" value={formatMoney(car.mmr)} />
              <SpecRow label="Sale date" value={car.saledate || "N/A"} />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

