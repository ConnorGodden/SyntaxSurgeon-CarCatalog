import type { Car } from "../types/car";

export function normalizeVin(vin: unknown): string {
  if (typeof vin !== "string") return "";
  const normalized = vin.trim();
  if (!normalized || normalized === "undefined" || normalized === "null") {
    return "";
  }
  return normalized;
}

export function dedupeByVin(list: Car[]): Car[] {
  const seen = new Set<string>();

  return list.filter((car) => {
    const vin = normalizeVin(car.vin);
    if (!vin || seen.has(vin)) {
      return false;
    }

    seen.add(vin);
    return true;
  });
}
