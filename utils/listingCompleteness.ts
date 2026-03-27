import type { Car } from "../types/car";

function hasText(value: string | null | undefined): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function hasFiniteNumber(value: number): boolean {
  return Number.isFinite(value);
}

export function getMissingListingFields(car: Car): string[] {
  const missing: string[] = [];

  if (!hasFiniteNumber(car.year) || car.year <= 0) missing.push("Year");
  if (!hasText(car.trim)) missing.push("Trim");
  if (!hasText(car.body)) missing.push("Body");
  if (!hasText(car.transmission)) missing.push("Transmission");
  if (!hasText(car.state)) missing.push("State");
  if (car.condition == null || car.condition === "") missing.push("Condition");
  if (!hasFiniteNumber(car.odometer)) missing.push("Mileage");
  if (!hasText(car.color)) missing.push("Color");
  if (!hasText(car.interior)) missing.push("Interior");
  if (!hasText(car.seller)) missing.push("Seller");
  if (!hasFiniteNumber(car.mmr)) missing.push("MMR");
  if (!hasFiniteNumber(car.sellingprice)) missing.push("Price");
  if (!hasText(car.saledate)) missing.push("Sale Date");

  return missing;
}

export function isListingIncomplete(car: Car): boolean {
  return getMissingListingFields(car).length > 0;
}

export function formatMissingFieldSummary(fields: string[]): string {
  if (fields.length === 0) return "";
  if (fields.length <= 2) return fields.join(", ");
  return `${fields.slice(0, 2).join(", ")} +${fields.length - 2} more`;
}

export function formatValueOrMissing(value: string | null | undefined): string {
  if (!hasText(value)) return "Missing";
  return value.trim();
}

export function formatNumberOrMissing(value: number, formatter: (next: number) => string): string {
  return hasFiniteNumber(value) ? formatter(value) : "Missing";
}
