"use client";

import Image from "next/image";
import { Fragment } from "react";
import type { ReactNode } from "react";
import type { Car } from "../../types/car";
import { getCarImageSrc } from "../../utils/carImage";
import { formatCondition, formatMoney, formatOdometerKm } from "../../utils/formatters";

type ComparisonOutcome = "left" | "right" | "tie" | "neutral";

type ComparisonRow = {
  label: string;
  leftValue: ReactNode;
  rightValue: ReactNode;
  outcome: ComparisonOutcome;
  note: string;
};

const conditionScores: Record<string, number> = {
  excellent: 5,
  like_new: 5,
  good: 4,
  fair: 3,
  average: 2,
  poor: 1,
};

const dealRatingScores: Record<Car["deal_rating"], number> = {
  "Great Deal": 3,
  "Good Price": 2,
  "Fair Market": 1,
};

function isDataUrl(src: string) {
  return src.startsWith("data:");
}

function getNumericValue(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function getConditionScore(condition: Car["condition"]): number | null {
  if (typeof condition === "number" && Number.isFinite(condition)) {
    return condition;
  }

  if (typeof condition !== "string") {
    return null;
  }

  const normalized = condition.trim().toLowerCase().replace(/\s+/g, "_");
  return conditionScores[normalized] ?? null;
}

function compareNumbers(
  left: number | null,
  right: number | null,
  betterDirection: "higher" | "lower",
): ComparisonOutcome {
  if (left == null && right == null) return "neutral";
  if (left != null && right == null) return "left";
  if (left == null && right != null) return "right";
  if (left === right) return "tie";

  const leftIsBetter = betterDirection === "higher" ? left! > right! : left! < right!;
  return leftIsBetter ? "left" : "right";
}

function formatText(value: string | null | undefined): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed : "N/A";
}

function getValueGap(car: Car): number | null {
  const price = getNumericValue(car.sellingprice);
  const mmr = getNumericValue(car.mmr);
  if (price == null || mmr == null) return null;
  return mmr - price;
}

function getRows(left: Car, right: Car): ComparisonRow[] {
  const leftPrice = getNumericValue(left.sellingprice);
  const rightPrice = getNumericValue(right.sellingprice);
  const leftMileage = getNumericValue(left.odometer);
  const rightMileage = getNumericValue(right.odometer);
  const leftYear = getNumericValue(left.year);
  const rightYear = getNumericValue(right.year);
  const leftCondition = getConditionScore(left.condition);
  const rightCondition = getConditionScore(right.condition);
  const leftDealRating = dealRatingScores[left.deal_rating];
  const rightDealRating = dealRatingScores[right.deal_rating];
  const leftGap = getValueGap(left);
  const rightGap = getValueGap(right);

  return [
    {
      label: "Price",
      leftValue: formatMoney(left.sellingprice),
      rightValue: formatMoney(right.sellingprice),
      outcome: compareNumbers(leftPrice, rightPrice, "lower"),
      note: "Lower price wins.",
    },
    {
      label: "Mileage",
      leftValue: formatOdometerKm(left.odometer),
      rightValue: formatOdometerKm(right.odometer),
      outcome: compareNumbers(leftMileage, rightMileage, "lower"),
      note: "Lower mileage wins.",
    },
    {
      label: "Model year",
      leftValue: Number.isFinite(left.year) ? String(left.year) : "N/A",
      rightValue: Number.isFinite(right.year) ? String(right.year) : "N/A",
      outcome: compareNumbers(leftYear, rightYear, "higher"),
      note: "Newer year wins.",
    },
    {
      label: "Condition",
      leftValue: formatCondition(left.condition),
      rightValue: formatCondition(right.condition),
      outcome: compareNumbers(leftCondition, rightCondition, "higher"),
      note: "Higher condition wins when available.",
    },
    {
      label: "Deal rating",
      leftValue: left.deal_rating,
      rightValue: right.deal_rating,
      outcome: compareNumbers(leftDealRating, rightDealRating, "higher"),
      note: "Stronger deal rating wins.",
    },
    {
      label: "Value vs MMR",
      leftValue: leftGap == null ? "N/A" : formatMoney(leftGap),
      rightValue: rightGap == null ? "N/A" : formatMoney(rightGap),
      outcome: compareNumbers(leftGap, rightGap, "higher"),
      note: "Bigger discount under MMR wins.",
    },
    {
      label: "Body",
      leftValue: formatText(left.body),
      rightValue: formatText(right.body),
      outcome: "neutral",
      note: "Preference-based.",
    },
    {
      label: "Transmission",
      leftValue: formatText(left.transmission),
      rightValue: formatText(right.transmission),
      outcome: "neutral",
      note: "Preference-based.",
    },
    {
      label: "Exterior",
      leftValue: formatText(left.color),
      rightValue: formatText(right.color),
      outcome: "neutral",
      note: "Preference-based.",
    },
    {
      label: "Interior",
      leftValue: formatText(left.interior),
      rightValue: formatText(right.interior),
      outcome: "neutral",
      note: "Preference-based.",
    },
    {
      label: "Seller",
      leftValue: formatText(left.seller),
      rightValue: formatText(right.seller),
      outcome: "neutral",
      note: "Context only.",
    },
    {
      label: "Location",
      leftValue: formatText(left.state),
      rightValue: formatText(right.state),
      outcome: "neutral",
      note: "Context only.",
    },
  ];
}

function getOutcomeClasses(outcome: ComparisonOutcome, side: "left" | "right"): string {
  if (outcome === "tie") {
    return "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-700/50 dark:bg-amber-950/20 dark:text-amber-200";
  }

  if (outcome === side) {
    return "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-700/50 dark:bg-emerald-950/20 dark:text-emerald-200";
  }

  if (outcome === "neutral") {
    return "border-zinc-200 bg-white text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100";
  }

  return "border-zinc-200 bg-zinc-50 text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400";
}

function getWins(rows: ComparisonRow[], side: "left" | "right") {
  return rows.filter((row) => row.outcome === side).length;
}

function SummaryCard({ car, accent, wins }: { car: Car; accent: string; wins: number }) {
  const src = getCarImageSrc(car);

  return (
    <article className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950/80">
      <div className="relative aspect-[16/10] w-full bg-zinc-100 dark:bg-zinc-900">
        {isDataUrl(src) ? (
          <img src={src} alt={`${car.year} ${car.make} ${car.model}`} className="h-full w-full object-cover" />
        ) : (
          <Image
            src={src}
            alt={`${car.year} ${car.make} ${car.model}`}
            fill
            sizes="(max-width: 1024px) 100vw, 45vw"
            className="object-cover"
          />
        )}
        <div className={`absolute left-4 top-4 rounded-full px-3 py-1 text-xs font-semibold ${accent}`}>
          {wins} winning {wins === 1 ? "metric" : "metrics"}
        </div>
      </div>

      <div className="p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-zinc-500">Selected car</p>
        <h3 className="mt-2 text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
          {Number.isFinite(car.year) ? car.year : "Unknown year"} {car.make} {car.model}
        </h3>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
          VIN: <span className="font-mono">{car.vin || "N/A"}</span>
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <span className="rounded-full bg-zinc-900 px-3 py-1 text-xs font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900">
            {formatMoney(car.sellingprice)}
          </span>
          <span className="rounded-full border border-zinc-200 px-3 py-1 text-xs font-semibold text-zinc-700 dark:border-zinc-700 dark:text-zinc-200">
            {formatOdometerKm(car.odometer)}
          </span>
          <span className="rounded-full border border-zinc-200 px-3 py-1 text-xs font-semibold text-zinc-700 dark:border-zinc-700 dark:text-zinc-200">
            {car.deal_rating}
          </span>
        </div>
      </div>
    </article>
  );
}

export default function CarCompareModal({
  leftCar,
  rightCar,
  onClose,
}: {
  leftCar: Car;
  rightCar: Car;
  onClose: () => void;
}) {
  const rows = getRows(leftCar, rightCar);
  const leftWins = getWins(rows, "left");
  const rightWins = getWins(rows, "right");

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/60 p-4 md:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Compare saved cars"
      onClick={onClose}
    >
      <div
        className="mx-auto my-4 flex min-h-fit w-full max-w-7xl flex-col overflow-hidden rounded-[2rem] bg-zinc-100 shadow-2xl dark:bg-zinc-900"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="border-b border-zinc-200 bg-white/90 px-6 py-5 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500">Saved car comparison</p>
              <h2 className="mt-2 text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
                Side-by-side breakdown of your two selected cars
              </h2>
              <p className="mt-2 max-w-3xl text-sm text-zinc-600 dark:text-zinc-300">
                Green highlights indicate the stronger spec for objective metrics like price, mileage, year,
                condition, deal rating, and MMR value gap.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="inline-flex cursor-pointer items-center justify-center rounded-2xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-900 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
            >
              Close
            </button>
          </div>
        </div>

        <div className="overflow-y-visible p-6 pb-10">
          <div className="grid gap-6 xl:grid-cols-2">
            <SummaryCard
              car={leftCar}
              wins={leftWins}
              accent="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200"
            />
            <SummaryCard
              car={rightCar}
              wins={rightWins}
              accent="bg-sky-100 text-sky-800 dark:bg-sky-950/40 dark:text-sky-200"
            />
          </div>

          <div className="mt-6 overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950/80">
            <div className="grid grid-cols-1 gap-px bg-zinc-200 dark:bg-zinc-800 lg:grid-cols-[1.2fr_0.85fr_0.85fr_0.7fr]">
              <div className="bg-zinc-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
                Feature
              </div>
              <div className="bg-zinc-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
                {leftCar.make} {leftCar.model}
              </div>
              <div className="bg-zinc-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
                {rightCar.make} {rightCar.model}
              </div>
              <div className="bg-zinc-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
                Notes
              </div>

              {rows.map((row) => (
                <Fragment key={row.label}>
                  <div
                    className="bg-white px-4 py-4 text-sm font-medium text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100"
                  >
                    {row.label}
                  </div>
                  <div
                    className={`px-4 py-4 text-sm font-medium ${getOutcomeClasses(row.outcome, "left")}`}
                  >
                    {row.leftValue}
                  </div>
                  <div
                    className={`px-4 py-4 text-sm font-medium ${getOutcomeClasses(row.outcome, "right")}`}
                  >
                    {row.rightValue}
                  </div>
                  <div
                    className="bg-white px-4 py-4 text-sm text-zinc-600 dark:bg-zinc-950 dark:text-zinc-300"
                  >
                    {row.note}
                  </div>
                </Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
