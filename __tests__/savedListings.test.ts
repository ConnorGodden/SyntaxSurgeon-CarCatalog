import { describe, it, expect } from "vitest";
import { dedupeByVin, normalizeVin } from "../utils/dedupeByVin";
import { mockCar } from "./mockCar";

// The saved-listings key logic (mirrors CarCatalog.tsx getSavedListingsKey)
function getSavedListingsKey(userId: string | null): string {
  return userId ? `saved_listings_v1_${userId}` : "saved_listings_v1_guest";
}

// ─── getSavedListingsKey ──────────────────────────────────────────────────────

describe("getSavedListingsKey", () => {
  it("returns a user-specific key when a userId is provided", () => {
    expect(getSavedListingsKey("user-abc")).toBe("saved_listings_v1_user-abc");
  });

  it("returns the guest key when userId is null", () => {
    expect(getSavedListingsKey(null)).toBe("saved_listings_v1_guest");
  });

  it("produces different keys for different users", () => {
    const key1 = getSavedListingsKey("user-1");
    const key2 = getSavedListingsKey("user-2");
    expect(key1).not.toBe(key2);
  });

  it("never returns the guest key for a non-null userId", () => {
    expect(getSavedListingsKey("any-id")).not.toContain("guest");
  });
});

// ─── Saved listings deduplication ────────────────────────────────────────────
// When a car is saved it is prepended; dedupeByVin keeps the first occurrence.

describe("saved listings deduplication", () => {
  it("keeps only the most-recently-saved version when the same VIN is added twice", () => {
    const original = mockCar({ vin: "SAME", sellingprice: 8000 });
    const updated  = mockCar({ vin: "SAME", sellingprice: 9000 });

    // Simulate: prepend updated, then dedupe
    const saved = dedupeByVin([updated, original]);
    expect(saved).toHaveLength(1);
    expect(saved[0].sellingprice).toBe(9000);
  });

  it("preserves all distinct saved cars", () => {
    const cars = [
      mockCar({ vin: "AAA" }),
      mockCar({ vin: "BBB" }),
      mockCar({ vin: "CCC" }),
    ];
    expect(dedupeByVin(cars)).toHaveLength(3);
  });

  it("removes cars with missing VINs from saved listings", () => {
    const cars = [
      mockCar({ vin: "VALID" }),
      mockCar({ vin: "" }),
      mockCar({ vin: undefined as unknown as string }),
    ];
    const result = dedupeByVin(cars);
    expect(result.every((c) => normalizeVin(c.vin) !== "")).toBe(true);
  });

  it("removing a saved listing filters it out by VIN", () => {
    const saved = [
      mockCar({ vin: "  KEEP  " }),
      mockCar({ vin: "REMOVE" }),
    ];
    const vinToRemove = normalizeVin("REMOVE");
    const next = saved.filter((c) => normalizeVin(c.vin) !== vinToRemove);
    expect(next).toHaveLength(1);
    expect(normalizeVin(next[0].vin)).toBe("KEEP");
  });
});
