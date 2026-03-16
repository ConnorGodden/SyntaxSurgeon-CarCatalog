import { describe, it, expect } from "vitest";
import { parseCsv } from "../types/car";
import { getCarImageSrc } from "../utils/carImage";
import { mockCar } from "./mockCar";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const HEADER =
  "year,make,model,trim,body,transmission,vin,state,condition,odometer,color,interior,seller,mmr,sellingprice,saledate,deal_rating";

/** Builds a minimal valid CSV string from an array of row value arrays. */
function buildCsv(rows: string[][]): string {
  const lines = rows.map((r) => r.join(","));
  return [HEADER, ...lines].join("\n");
}

const SAMPLE_ROW = [
  "2012", "NISSAN", "Altima", "2.5", "sedan", "automatic",
  "1n4al2ap7cc163417", "mo", "34", "41162", "beige", "beige",
  "green toyota", "11100", "12700",
  "Tue Jan 06 2015 03:00:00 GMT-0800 (PDT)", "Fair Market",
];

// ---------------------------------------------------------------------------
// parseCsv
// ---------------------------------------------------------------------------

describe("parseCsv", () => {
  it("returns an empty array for an empty string", () => {
    expect(parseCsv("")).toEqual([]);
  });

  it("returns an empty array when only the header row is present", () => {
    expect(parseCsv(HEADER)).toEqual([]);
  });

  it("parses a single row into one Car object", () => {
    const cars = parseCsv(buildCsv([SAMPLE_ROW]));
    expect(cars).toHaveLength(1);
  });

  it("parses multiple rows into the correct number of Car objects", () => {
    const cars = parseCsv(buildCsv([SAMPLE_ROW, SAMPLE_ROW, SAMPLE_ROW]));
    expect(cars).toHaveLength(3);
  });

  it("parses year as a number", () => {
    const [car] = parseCsv(buildCsv([SAMPLE_ROW]));
    expect(car.year).toBe(2012);
    expect(typeof car.year).toBe("number");
  });

  it("parses odometer as a number", () => {
    const [car] = parseCsv(buildCsv([SAMPLE_ROW]));
    expect(car.odometer).toBe(41162);
    expect(typeof car.odometer).toBe("number");
  });

  it("parses sellingprice as a number", () => {
    const [car] = parseCsv(buildCsv([SAMPLE_ROW]));
    expect(car.sellingprice).toBe(12700);
  });

  it("parses mmr as a number", () => {
    const [car] = parseCsv(buildCsv([SAMPLE_ROW]));
    expect(car.mmr).toBe(11100);
  });

  it("parses string fields correctly (make, model, color, etc.)", () => {
    const [car] = parseCsv(buildCsv([SAMPLE_ROW]));
    expect(car.make).toBe("NISSAN");
    expect(car.model).toBe("Altima");
    expect(car.color).toBe("beige");
    expect(car.state).toBe("mo");
  });

  it("sets trim to null when the trim column is empty", () => {
    const row = [...SAMPLE_ROW];
    row[3] = ""; // trim column
    const [car] = parseCsv(buildCsv([row]));
    expect(car.trim).toBeNull();
  });

  it("preserves trim value when it is provided", () => {
    const [car] = parseCsv(buildCsv([SAMPLE_ROW]));
    expect(car.trim).toBe("2.5");
  });

  it("sets transmission to null when the column is empty", () => {
    const row = [...SAMPLE_ROW];
    row[5] = ""; // transmission column
    const [car] = parseCsv(buildCsv([row]));
    expect(car.transmission).toBeNull();
  });

  it("preserves transmission value when it is provided", () => {
    const [car] = parseCsv(buildCsv([SAMPLE_ROW]));
    expect(car.transmission).toBe("automatic");
  });

  it("sets condition to null when the column is empty", () => {
    const row = [...SAMPLE_ROW];
    row[8] = ""; // condition column
    const [car] = parseCsv(buildCsv([row]));
    expect(car.condition).toBeNull();
  });

  it("parses condition as a number when provided", () => {
    const [car] = parseCsv(buildCsv([SAMPLE_ROW]));
    expect(car.condition).toBe(34);
  });

  it("parses deal_rating as 'Fair Market'", () => {
    const [car] = parseCsv(buildCsv([SAMPLE_ROW]));
    expect(car.deal_rating).toBe("Fair Market");
  });

  it("parses deal_rating as 'Great Deal'", () => {
    const row = [...SAMPLE_ROW];
    row[16] = "Great Deal";
    const [car] = parseCsv(buildCsv([row]));
    expect(car.deal_rating).toBe("Great Deal");
  });

  it("parses deal_rating as 'Good Price'", () => {
    const row = [...SAMPLE_ROW];
    row[16] = "Good Price";
    const [car] = parseCsv(buildCsv([row]));
    expect(car.deal_rating).toBe("Good Price");
  });

  it("defaults deal_rating to 'Fair Market' for unrecognised values", () => {
    const row = [...SAMPLE_ROW];
    row[16] = "Unknown Rating";
    const [car] = parseCsv(buildCsv([row]));
    expect(car.deal_rating).toBe("Fair Market");
  });

  it("defaults year to 0 when the year column is missing", () => {
    const row = [...SAMPLE_ROW];
    row[0] = "";
    const [car] = parseCsv(buildCsv([row]));
    expect(car.year).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// getCarImageSrc
// ---------------------------------------------------------------------------

describe("getCarImageSrc", () => {
  it("returns car.image directly when it is a data URL", () => {
    const car = mockCar({ image: "data:image/png;base64,abc123" });
    expect(getCarImageSrc(car)).toBe("data:image/png;base64,abc123");
  });

  it("returns car.image directly when it is a regular URL", () => {
    const car = mockCar({ image: "https://example.com/car.jpg" });
    expect(getCarImageSrc(car)).toBe("https://example.com/car.jpg");
  });

  it("trims whitespace from car.image before returning it", () => {
    const car = mockCar({ image: "  /cars/custom.jpg  " });
    expect(getCarImageSrc(car)).toBe("/cars/custom.jpg");
  });

  it("falls back to lookup when car.image is undefined", () => {
    const car = mockCar({ year: 2010, make: "FORD", model: "Escape", image: undefined });
    expect(getCarImageSrc(car)).toBe("/cars/2010_ford_escape.jpg");
  });

  it("falls back to lookup when car.image is an empty string", () => {
    const car = mockCar({ year: 2009, make: "KIA", model: "Rio", image: "" });
    expect(getCarImageSrc(car)).toBe("/cars/2009_kia_rio.jpg");
  });

  it("normalises make to lowercase for the lookup key", () => {
    const car = mockCar({ year: 2008, make: "FORD", model: "Taurus", image: undefined });
    expect(getCarImageSrc(car)).toBe("/cars/2008_ford_taurus.jpg");
  });

  it("strips spaces from model name for the lookup key (e.g. '3 Series')", () => {
    const car = mockCar({ year: 2010, make: "BMW", model: "3 Series", image: undefined });
    expect(getCarImageSrc(car)).toBe("/cars/2010_bmw_3series.jpg");
  });

  it("strips spaces from multi-word model names (e.g. 'Town And Country')", () => {
    const car = mockCar({ year: 2014, make: "CHRYSLER", model: "Town And Country", image: undefined });
    expect(getCarImageSrc(car)).toBe("/cars/2014_chrysler_townandcountry.jpg");
  });

  it("returns the placeholder for a car with no matching local image", () => {
    const car = mockCar({ year: 1999, make: "UNKNOWN", model: "Ghost", image: undefined });
    expect(getCarImageSrc(car)).toBe("/cars/placeholder.svg");
  });

  it("returns correct path for a .webp image (e.g. 2014 BMW X6)", () => {
    const car = mockCar({ year: 2014, make: "BMW", model: "X6", image: undefined });
    expect(getCarImageSrc(car)).toBe("/cars/2014_bmw_x6.webp");
  });

  it("returns correct path for a .avif image (e.g. 2014 Ford Fusion)", () => {
    const car = mockCar({ year: 2014, make: "FORD", model: "Fusion", image: undefined });
    expect(getCarImageSrc(car)).toBe("/cars/2014_ford_fusion.avif");
  });
});
