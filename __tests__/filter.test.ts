import { describe, it, expect } from "vitest";
import { cleanSelection } from "../types/filter";
import { mockCar } from "./mockCar";

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const ford2012  = mockCar({ make: "FORD",    model: "Focus",  year: 2012, body: "sedan",  condition: 30 });
const ford2014  = mockCar({ make: "FORD",    model: "Escape", year: 2014, body: "suv",    condition: 35 });
const nissan    = mockCar({ make: "NISSAN",  model: "Altima", year: 2013, body: "sedan",  condition: 34 });
const bmw       = mockCar({ make: "BMW",     model: "X6",     year: 2014, body: "suv",    condition: 40 });
const noTrim    = mockCar({ make: "KIA",     model: "Rio",    year: 2009, trim: null });

const ALL_CARS = [ford2012, ford2014, nissan, bmw, noTrim];

// ---------------------------------------------------------------------------
// cleanSelection
// ---------------------------------------------------------------------------

describe("cleanSelection", () => {
  it("returns all cars when selections is an empty object", () => {
    expect(cleanSelection(ALL_CARS, {})).toHaveLength(ALL_CARS.length);
  });

  it("returns all cars when every selection value is an empty string", () => {
    const result = cleanSelection(ALL_CARS, { make: "", body: "" });
    expect(result).toHaveLength(ALL_CARS.length);
  });

  it("filters by a single field — make", () => {
    const result = cleanSelection(ALL_CARS, { make: "FORD" });
    expect(result).toHaveLength(2);
    expect(result.every((c) => c.make === "FORD")).toBe(true);
  });

  it("filters by a single field — body", () => {
    const result = cleanSelection(ALL_CARS, { body: "suv" });
    expect(result).toHaveLength(2);
    expect(result.every((c) => c.body === "suv")).toBe(true);
  });

  it("filters by a single field — year", () => {
    const result = cleanSelection(ALL_CARS, { year: "2014" });
    expect(result).toHaveLength(2);
    expect(result.every((c) => c.year === 2014)).toBe(true);
  });

  it("filters by multiple fields simultaneously", () => {
    const result = cleanSelection(ALL_CARS, { make: "FORD", body: "suv" });
    expect(result).toHaveLength(1);
    expect(result[0]).toBe(ford2014);
  });

  it("returns an empty array when no cars match the selection", () => {
    const result = cleanSelection(ALL_CARS, { make: "TOYOTA" });
    expect(result).toHaveLength(0);
  });

  it("returns an empty array when the input car list is empty", () => {
    const result = cleanSelection([], { make: "FORD" });
    expect(result).toHaveLength(0);
  });

  it("treats condition as a string comparison (numeric condition from CSV)", () => {
    // Condition is stored as a number in Car; cleanSelection stringifies it
    const result = cleanSelection(ALL_CARS, { condition: "34" });
    expect(result).toHaveLength(1);
    expect(result[0]).toBe(nissan);
  });

  it("excludes cars where a selected field is null (e.g. trim)", () => {
    // noTrim has trim: null → stringifies to "" which won't equal "SE"
    const result = cleanSelection(ALL_CARS, { trim: "SE" });
    expect(result).not.toContain(noTrim);
  });

  it("returns cars that match a single-car dataset", () => {
    const result = cleanSelection([ford2012], { make: "FORD" });
    expect(result).toHaveLength(1);
    expect(result[0]).toBe(ford2012);
  });

  it("does not mutate the original cars array", () => {
    const original = [...ALL_CARS];
    cleanSelection(ALL_CARS, { make: "FORD" });
    expect(ALL_CARS).toEqual(original);
  });

  it("ignores selection keys with empty string values alongside active filters", () => {
    // make="" should be skipped; body="suv" should apply
    const result = cleanSelection(ALL_CARS, { make: "", body: "suv" });
    expect(result).toHaveLength(2);
    expect(result.every((c) => c.body === "suv")).toBe(true);
  });
});
