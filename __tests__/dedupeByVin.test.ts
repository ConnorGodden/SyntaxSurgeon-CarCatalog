import { describe, it, expect } from "vitest";
import { dedupeByVin, normalizeVin } from "../utils/dedupeByVin";
import { parseCsv } from "../types/car";
import { readFileSync } from "fs";
import { join } from "path";
import { mockCar } from "./mockCar";

// ─── helpers ────────────────────────────────────────────────────────────────

const car = (vin: string) => mockCar({ vin });

describe("dedupeByVin — real dataset", () => {
  it("removes the duplicate 2006 PONTIAC Torrent (VIN 2ckdl73f566101612) present in cars.csv", () => {
    const csv = readFileSync(join(process.cwd(), "public/cars.csv"), "utf-8");
    const cars = parseCsv(csv);

    const vin = "2ckdl73f566101612";
    const rawCount = cars.filter((c) => c.vin === vin).length;
    expect(rawCount).toBe(2); // confirm the duplicate exists in the raw data

    const deduped = dedupeByVin(cars);
    const dedupedCount = deduped.filter((c) => c.vin === vin).length;
    expect(dedupedCount).toBe(1); // should be collapsed to one — FAILS until implemented
  });
});

// ─── dedupeByVin ────────────────────────────────────────────────────────────

describe("dedupeByVin", () => {

  it("returns an empty array when given an empty array", () => {
    expect(dedupeByVin([])).toEqual([]);
  });

  it("returns a single-car array unchanged", () => {
    const result = dedupeByVin([car("ABC123")]);
    expect(result).toHaveLength(1);
    expect(result[0].vin).toBe("ABC123");
  });

  it("removes a duplicate VIN, keeping only the first occurrence", () => {
    const first  = mockCar({ vin: "ABC123", sellingprice: 5000 });
    const second = mockCar({ vin: "ABC123", sellingprice: 9999 });
    const result = dedupeByVin([first, second]);
    expect(result).toHaveLength(1);
    expect(result[0].sellingprice).toBe(5000); // first one kept
  });

  it("removes multiple duplicate VINs across the list", () => {
    const list = [car("AAA"), car("BBB"), car("AAA"), car("CCC"), car("BBB")];
    const result = dedupeByVin(list);
    expect(result).toHaveLength(3);
    expect(result.map((c) => c.vin)).toEqual(["AAA", "BBB", "CCC"]);
  });

  it("keeps all cars when every VIN is unique", () => {
    const list = [car("A1"), car("B2"), car("C3")];
    const result = dedupeByVin(list);
    expect(result).toHaveLength(3);
  });

  it("preserves the original order of first-seen VINs", () => {
    const list = [car("Z"), car("A"), car("M"), car("A"), car("Z")];
    expect(dedupeByVin(list).map((c) => c.vin)).toEqual(["Z", "A", "M"]);
  });

  // --- VIN normalisation ---

  it("trims leading and trailing whitespace from VINs before comparing", () => {
    const a = mockCar({ vin: "  ABC123  " });
    const b = mockCar({ vin: "ABC123" });
    const result = dedupeByVin([a, b]);
    expect(result).toHaveLength(1);
  });

  it("treats VINs that differ only by case as distinct (case-sensitive)", () => {
    const result = dedupeByVin([car("abc123"), car("ABC123")]);
    expect(result).toHaveLength(2);
  });

  // --- invalid / missing VINs ---

  it("drops cars whose VIN is an empty string", () => {
    const result = dedupeByVin([car(""), car("VALID")]);
    expect(result).toHaveLength(1);
    expect(result[0].vin).toBe("VALID");
  });

  it("drops cars whose VIN is only whitespace", () => {
    const result = dedupeByVin([mockCar({ vin: "   " }), car("VALID")]);
    expect(result).toHaveLength(1);
  });

  it("drops cars whose VIN is the string 'undefined'", () => {
    const result = dedupeByVin([mockCar({ vin: "undefined" }), car("VALID")]);
    expect(result).toHaveLength(1);
  });

  it("drops cars whose VIN is the string 'null'", () => {
    const result = dedupeByVin([mockCar({ vin: "null" }), car("VALID")]);
    expect(result).toHaveLength(1);
  });

  it("multiple cars with empty/invalid VINs are all dropped", () => {
    const result = dedupeByVin([car(""), car(""), mockCar({ vin: "undefined" })]);
    expect(result).toHaveLength(0);
  });

  // --- immutability ---

  it("does not mutate the original array", () => {
    const list = [car("A"), car("A"), car("B")];
    const original = [...list];
    dedupeByVin(list);
    expect(list).toEqual(original);
  });
});

// ─── normalizeVin ────────────────────────────────────────────────────────────

describe("normalizeVin", () => {
  it("returns a plain valid VIN unchanged", () => {
    expect(normalizeVin("ABC123")).toBe("ABC123");
  });

  it("trims leading whitespace", () => {
    expect(normalizeVin("  ABC123")).toBe("ABC123");
  });

  it("trims trailing whitespace", () => {
    expect(normalizeVin("ABC123  ")).toBe("ABC123");
  });

  it("trims both leading and trailing whitespace", () => {
    expect(normalizeVin("  ABC123  ")).toBe("ABC123");
  });

  it("returns an empty string for an empty string input", () => {
    expect(normalizeVin("")).toBe("");
  });

  it("returns an empty string for a whitespace-only string", () => {
    expect(normalizeVin("   ")).toBe("");
  });

  it("returns an empty string for the string 'undefined'", () => {
    expect(normalizeVin("undefined")).toBe("");
  });

  it("returns an empty string for the string 'null'", () => {
    expect(normalizeVin("null")).toBe("");
  });

  it("is case-sensitive — does not alter mixed-case VINs", () => {
    expect(normalizeVin("Abc123")).toBe("Abc123");
  });
});
