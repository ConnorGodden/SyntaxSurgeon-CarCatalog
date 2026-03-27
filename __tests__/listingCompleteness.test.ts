import { describe, expect, it } from "vitest";
import { mockCar } from "./mockCar";
import {
  formatMissingFieldSummary,
  formatNumberOrMissing,
  formatValueOrMissing,
  getMissingListingFields,
  isListingIncomplete,
} from "../utils/listingCompleteness";

describe("getMissingListingFields", () => {
  it("returns an empty array for complete listings", () => {
    expect(getMissingListingFields(mockCar())).toEqual([]);
  });

  it("reports all missing string and numeric fields", () => {
    const missing = getMissingListingFields(
      mockCar({
        year: Number.NaN,
        trim: null,
        body: "",
        transmission: null,
        state: "",
        condition: null,
        odometer: Number.NaN,
        color: "",
        interior: "",
        seller: "",
        mmr: Number.NaN,
        sellingprice: Number.NaN,
        saledate: "",
      }),
    );

    expect(missing).toEqual([
      "Year",
      "Trim",
      "Body",
      "Transmission",
      "State",
      "Condition",
      "Mileage",
      "Color",
      "Interior",
      "Seller",
      "MMR",
      "Price",
      "Sale Date",
    ]);
  });
});

describe("isListingIncomplete", () => {
  it("returns true when at least one important field is missing", () => {
    expect(isListingIncomplete(mockCar({ transmission: null }))).toBe(true);
  });

  it("returns false when no fields are missing", () => {
    expect(isListingIncomplete(mockCar())).toBe(false);
  });
});

describe("formatMissingFieldSummary", () => {
  it("returns a compact summary when more than two fields are missing", () => {
    expect(formatMissingFieldSummary(["Price", "Mileage", "Seller"])).toBe("Price, Mileage +1 more");
  });

  it("returns a comma-separated list for one or two fields", () => {
    expect(formatMissingFieldSummary(["Trim"])).toBe("Trim");
    expect(formatMissingFieldSummary(["Trim", "Color"])).toBe("Trim, Color");
  });
});

describe("fallback format helpers", () => {
  it("returns Missing for empty string-like values", () => {
    expect(formatValueOrMissing(null)).toBe("Missing");
    expect(formatValueOrMissing("   ")).toBe("Missing");
  });

  it("returns the trimmed text for present string values", () => {
    expect(formatValueOrMissing("  Dealer A  ")).toBe("Dealer A");
  });

  it("returns Missing for non-finite numbers", () => {
    expect(formatNumberOrMissing(Number.NaN, (value) => String(value))).toBe("Missing");
  });

  it("formats finite numbers with the provided formatter", () => {
    expect(formatNumberOrMissing(42, (value) => `#${value}`)).toBe("#42");
  });
});
