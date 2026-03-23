import { Car } from "../types/car";

export type SortField = "price" | "mileage" | "year" | "newest";
export type SortDirection = "asc" | "desc";

function sortValue(car: Car, sortBy: SortField): number {
  if (sortBy === "price") return car.sellingprice;
  if (sortBy === "mileage") return car.odometer;
  if (sortBy === "year") return car.year;
  if (sortBy === "newest") {
    const ts = Date.parse(car.saledate);
    return Number.isNaN(ts) ? 0 : ts;
  }
  return 0;
}

export function sortCars(cars: Car[], sortBy: SortField, direction: SortDirection): Car[] {
  const sorted = [...cars].sort((a, b) => sortValue(a, sortBy) - sortValue(b, sortBy));
  return direction === "desc" ? sorted.reverse() : sorted;
}
