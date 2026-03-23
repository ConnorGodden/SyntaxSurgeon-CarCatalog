import type { Car } from "../types/car";

// TODO: not yet implemented — see __tests__/dedupeByVin.test.ts

export function normalizeVin(vin: unknown): string {
  if (typeof vin !== "string") return "";
  return vin;
}

export function dedupeByVin(list: Car[]): Car[] {
  return [...list];
}
