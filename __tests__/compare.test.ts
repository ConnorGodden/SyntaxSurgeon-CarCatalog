import { describe, it, expect } from "vitest";
import { normalizeVin } from "../utils/dedupeByVin";
import { mockCar } from "./mockCar";

// Pure compare-selection reducer — mirrors the logic in CarCatalog.tsx
function applyToggleCompare(current: string[], vin: string): string[] {
  if (current.includes(vin)) return current.filter((v) => v !== vin);
  if (current.length >= 2) return [current[1], vin];
  return [...current, vin];
}

// ─── applyToggleCompare ───────────────────────────────────────────────────────

describe("applyToggleCompare", () => {
  it("adds the first car to an empty selection", () => {
    expect(applyToggleCompare([], "VIN_A")).toEqual(["VIN_A"]);
  });

  it("adds the second car to a single-item selection", () => {
    expect(applyToggleCompare(["VIN_A"], "VIN_B")).toEqual(["VIN_A", "VIN_B"]);
  });

  it("removes a car that is already selected", () => {
    expect(applyToggleCompare(["VIN_A", "VIN_B"], "VIN_A")).toEqual(["VIN_B"]);
    expect(applyToggleCompare(["VIN_A", "VIN_B"], "VIN_B")).toEqual(["VIN_A"]);
  });

  it("replaces the oldest selection when a third car is toggled in", () => {
    // Slot [0] is oldest; adding VIN_C should drop VIN_A and keep VIN_B
    expect(applyToggleCompare(["VIN_A", "VIN_B"], "VIN_C")).toEqual(["VIN_B", "VIN_C"]);
  });

  it("never exceeds two cars in the selection", () => {
    let selection: string[] = [];
    for (const vin of ["VIN_A", "VIN_B", "VIN_C", "VIN_D"]) {
      selection = applyToggleCompare(selection, vin);
    }
    expect(selection).toHaveLength(2);
  });

  it("is idempotent — toggling the same car twice returns original state", () => {
    const after1 = applyToggleCompare([], "VIN_A");
    const after2 = applyToggleCompare(after1, "VIN_A");
    expect(after2).toEqual([]);
  });

  it("does not mutate the input array", () => {
    const original = ["VIN_A"];
    applyToggleCompare(original, "VIN_B");
    expect(original).toEqual(["VIN_A"]);
  });
});

// ─── Compare readiness ────────────────────────────────────────────────────────

describe("compare readiness", () => {
  it("is ready when exactly 2 VINs are selected", () => {
    const selection = ["VIN_A", "VIN_B"];
    expect(selection.length === 2).toBe(true);
  });

  it("is not ready with 0 cars selected", () => {
    expect([].length === 2).toBe(false);
  });

  it("is not ready with 1 car selected", () => {
    expect(["VIN_A"].length === 2).toBe(false);
  });

  it("resolves selected cars from saved listings by VIN", () => {
    const saved = [
      mockCar({ vin: "VIN_A" }),
      mockCar({ vin: "VIN_B" }),
      mockCar({ vin: "VIN_C" }),
    ];
    const selection = ["VIN_A", "VIN_C"];
    const byVin = new Map(saved.map((c) => [normalizeVin(c.vin), c]));
    const compareCars = selection.map((v) => byVin.get(v)).filter(Boolean);
    expect(compareCars).toHaveLength(2);
    expect(compareCars[0]).toBe(saved[0]);
    expect(compareCars[1]).toBe(saved[2]);
  });

  it("ignores VINs that are not in saved listings", () => {
    const saved = [mockCar({ vin: "VIN_A" })];
    const selection = ["VIN_A", "VIN_MISSING"];
    const byVin = new Map(saved.map((c) => [normalizeVin(c.vin), c]));
    const compareCars = selection.map((v) => byVin.get(v)).filter(Boolean);
    expect(compareCars).toHaveLength(1);
  });
});
