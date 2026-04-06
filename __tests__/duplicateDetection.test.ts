import { describe, it, expect } from "vitest";
import { detectDuplicates, findAllDuplicates } from "../utils/duplicateDetection";
import { mockCar } from "./mockCar";

// ─── detectDuplicates ─────────────────────────────────────────────────────────

describe("detectDuplicates", () => {
  it("returns no duplicate when existing list is empty", () => {
    const car = mockCar({ vin: "UNIQUE1" });
    const result = detectDuplicates(car, []);
    expect(result.isDuplicate).toBe(false);
    expect(result.similarCars).toHaveLength(0);
    expect(result.confidence).toBe("low");
  });

  it("detects a high-confidence duplicate when VINs match exactly", () => {
    const car = mockCar({ vin: "TESTVIN123" });
    const existing = [mockCar({ vin: "TESTVIN123" })];
    const result = detectDuplicates(car, existing);
    expect(result.isDuplicate).toBe(true);
    expect(result.confidence).toBe("high");
  });

  it("detects a medium-confidence duplicate when make/model/year match but VINs differ", () => {
    const car     = mockCar({ vin: "VIN_NEW", make: "FORD", model: "Focus", year: 2012, sellingprice: 8500, odometer: 45000 });
    const existing = [mockCar({ vin: "VIN_OLD", make: "FORD", model: "Focus", year: 2012, sellingprice: 8500, odometer: 45000 })];
    const result = detectDuplicates(car, existing);
    expect(result.isDuplicate).toBe(true);
    // make+model(30%) + year(15%) + price(10%) + mileage(5%) = 60% = medium
    expect(result.confidence).toBe("medium");
  });

  it("does not flag cars with a completely different make/model/year/VIN", () => {
    const car     = mockCar({ vin: "VIN_A", make: "FORD",   model: "Focus", year: 2012 });
    const existing = [mockCar({ vin: "VIN_B", make: "TOYOTA", model: "Camry", year: 2005, sellingprice: 5000, odometer: 120000 })];
    const result = detectDuplicates(car, existing);
    expect(result.isDuplicate).toBe(false);
  });

  it("returns high confidence for a VIN match regardless of price differences", () => {
    const car     = mockCar({ vin: "EXACTMATCH", sellingprice: 5000 });
    const existing = [mockCar({ vin: "EXACTMATCH", sellingprice: 15000 })];
    const result = detectDuplicates(car, existing);
    expect(result.confidence).toBe("high");
  });

  it("populates similarCars with the matching car", () => {
    const match = mockCar({ vin: "SAME", sellingprice: 9999 });
    const car   = mockCar({ vin: "SAME" });
    const result = detectDuplicates(car, [match]);
    expect(result.similarCars).toContain(match);
  });

  it("includes all matches when multiple similar cars exist", () => {
    const car = mockCar({ vin: "MULTI", make: "FORD", model: "Focus", year: 2012, sellingprice: 8500, odometer: 45000 });
    const existing = [
      mockCar({ vin: "MULTI", make: "FORD", model: "Focus", year: 2012 }),
      mockCar({ vin: "OTHER", make: "FORD", model: "Focus", year: 2012, sellingprice: 8500, odometer: 45000 }),
    ];
    const result = detectDuplicates(car, existing);
    expect(result.similarCars.length).toBeGreaterThanOrEqual(1);
  });
});

// ─── findAllDuplicates ────────────────────────────────────────────────────────

describe("findAllDuplicates", () => {
  it("returns an empty array for an empty car list", () => {
    expect(findAllDuplicates([])).toEqual([]);
  });

  it("returns an empty array for a single car", () => {
    expect(findAllDuplicates([mockCar({ vin: "SOLO" })])).toHaveLength(0);
  });

  it("returns an empty array when all cars are clearly distinct", () => {
    const cars = [
      mockCar({ vin: "VIN1", make: "FORD",   model: "Focus",  year: 2012, sellingprice: 8500,  odometer: 45000 }),
      mockCar({ vin: "VIN2", make: "TOYOTA", model: "Camry",  year: 2005, sellingprice: 5000,  odometer: 120000 }),
      mockCar({ vin: "VIN3", make: "HONDA",  model: "Civic",  year: 2018, sellingprice: 20000, odometer: 10000 }),
    ];
    expect(findAllDuplicates(cars)).toHaveLength(0);
  });

  it("groups two cars with the same make/model/year/price/mileage (different VINs)", () => {
    const cars = [
      mockCar({ vin: "VIN_A", make: "FORD", model: "Focus", year: 2012, sellingprice: 8500, odometer: 45000 }),
      mockCar({ vin: "VIN_B", make: "FORD", model: "Focus", year: 2012, sellingprice: 8500, odometer: 45000 }),
    ];
    const groups = findAllDuplicates(cars);
    expect(groups.length).toBeGreaterThanOrEqual(1);
    expect(groups[0]).toHaveLength(2);
  });

  it("does not mix distinct duplicate groups together", () => {
    const cars = [
      mockCar({ vin: "AA1", make: "FORD",   model: "Focus", year: 2012, sellingprice: 8500, odometer: 45000 }),
      mockCar({ vin: "AA2", make: "FORD",   model: "Focus", year: 2012, sellingprice: 8500, odometer: 45000 }),
      mockCar({ vin: "BB1", make: "TOYOTA", model: "Camry", year: 2005, sellingprice: 5000, odometer: 120000 }),
      mockCar({ vin: "BB2", make: "TOYOTA", model: "Camry", year: 2005, sellingprice: 5000, odometer: 120000 }),
    ];
    const groups = findAllDuplicates(cars);
    for (const group of groups) {
      const makes = new Set(group.map((c) => c.make));
      expect(makes.size).toBe(1);
    }
  });

  it("reports each car at most once across all groups", () => {
    const cars = [
      mockCar({ vin: "X1", make: "FORD", model: "Focus", year: 2012, sellingprice: 8500, odometer: 45000 }),
      mockCar({ vin: "X2", make: "FORD", model: "Focus", year: 2012, sellingprice: 8500, odometer: 45000 }),
    ];
    const groups = findAllDuplicates(cars);
    const allVins = groups.flat().map((c) => c.vin);
    const uniqueVins = new Set(allVins);
    expect(uniqueVins.size).toBe(allVins.length);
  });
});
