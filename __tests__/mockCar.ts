import { Car } from "../types/car";

/** Creates a mock Car with sensible defaults. Override any field as needed. */
export function mockCar(overrides: Partial<Car> = {}): Car {
  return {
    year: 2012,
    make: "FORD",
    model: "Focus",
    trim: "SE",
    body: "sedan",
    transmission: "automatic",
    vin: "1FAHP3F28CL123456",
    state: "oh",
    condition: 30,
    odometer: 45000,
    color: "black",
    interior: "black",
    seller: "test dealer",
    mmr: 9000,
    sellingprice: 8500,
    saledate: "Tue Jan 06 2015 03:00:00 GMT-0800 (PST)",
    deal_rating: "Good Price",
    ...overrides,
  };
}
