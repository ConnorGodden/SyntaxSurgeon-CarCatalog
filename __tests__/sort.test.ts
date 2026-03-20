import { describe, it, expect } from "vitest";
import { sortCars } from "../utils/sortCars";
import { mockCar } from "./mockCar";

// Mock data
const cheap  = mockCar({ sellingprice: 5000,  odometer: 80000, year: 2008, saledate: "Mon Jan 05 2015 00:00:00 GMT-0800 (PST)" });
const mid    = mockCar({ sellingprice: 12000, odometer: 45000, year: 2012, saledate: "Wed Jan 07 2015 00:00:00 GMT-0800 (PST)" });
const pricey = mockCar({ sellingprice: 28000, odometer: 10000, year: 2014, saledate: "Fri Jan 09 2015 00:00:00 GMT-0800 (PST)" });

const CARS = [pricey, cheap, mid];

// --- sort by price ---

describe("sortCars — price", () => {
  it("sorts by price ascending (cheapest first)", () => {
    const result = sortCars(CARS, "price", "asc");
    expect(result.map((c) => c.sellingprice)).toEqual([5000, 12000, 28000]);
  });

  it("sorts by price descending (most expensive first)", () => {
    const result = sortCars(CARS, "price", "desc");
    expect(result.map((c) => c.sellingprice)).toEqual([28000, 12000, 5000]);
  });
});

// --- sort by mileage ---

describe("sortCars — mileage", () => {
  it("sorts by mileage ascending (lowest first)", () => {
    const result = sortCars(CARS, "mileage", "asc");
    expect(result.map((c) => c.odometer)).toEqual([10000, 45000, 80000]);
  });

  it("sorts by mileage descending (highest first)", () => {
    const result = sortCars(CARS, "mileage", "desc");
    expect(result.map((c) => c.odometer)).toEqual([80000, 45000, 10000]);
  });
});

// --- sort by year ---

describe("sortCars — year", () => {
  it("sorts by year ascending (oldest first)", () => {
    const result = sortCars(CARS, "year", "asc");
    expect(result.map((c) => c.year)).toEqual([2008, 2012, 2014]);
  });

  it("sorts by year descending (newest first)", () => {
    const result = sortCars(CARS, "year", "desc");
    expect(result.map((c) => c.year)).toEqual([2014, 2012, 2008]);
  });
});

// --- sort by newest (sale date) ---

describe("sortCars — newest", () => {
  it("sorts by sale date descending (most recently sold first) when direction is desc", () => {
    const result = sortCars(CARS, "newest", "desc");
    expect(result[0]).toBe(pricey); // Jan 9 — most recent
    expect(result[2]).toBe(cheap);  // Jan 5 — oldest
  });

  it("sorts by sale date ascending (oldest sale first) when direction is asc", () => {
    const result = sortCars(CARS, "newest", "asc");
    expect(result[0]).toBe(cheap);  // Jan 5
    expect(result[2]).toBe(pricey); // Jan 9
  });

  it("treats cars with an invalid saledate as timestamp 0 (sorts to beginning asc)", () => {
    const noDate = mockCar({ saledate: "not-a-date" });
    const result = sortCars([mid, noDate], "newest", "asc");
    expect(result[0]).toBe(noDate);
  });
});

// --- edge cases ---

describe("sortCars — edge cases", () => {
  it("returns an empty array when given an empty array", () => {
    expect(sortCars([], "price", "asc")).toEqual([]);
  });

  it("returns a single-element array unchanged", () => {
    expect(sortCars([cheap], "price", "asc")).toEqual([cheap]);
  });

  it("does not mutate the original array", () => {
    const original = [...CARS];
    sortCars(CARS, "price", "asc");
    expect(CARS).toEqual(original);
  });

  it("handles cars with equal values without throwing", () => {
    const a = mockCar({ sellingprice: 10000 });
    const b = mockCar({ sellingprice: 10000 });
    expect(() => sortCars([a, b], "price", "asc")).not.toThrow();
  });
});
