import "server-only";

import { readFile, writeFile } from "fs/promises";
import path from "path";
import { parseCsvText, stringifyCsv } from "../utils/csv";
import type { Car } from "../types/car";
import type { SessionUser } from "../types/user";
import { getSeededListingOwners } from "./users";

const LISTINGS_CSV_PATH = path.join(process.cwd(), "public", "cars.csv");

export const LISTING_HEADERS = [
  "year",
  "make",
  "model",
  "trim",
  "body",
  "transmission",
  "vin",
  "state",
  "condition",
  "odometer",
  "color",
  "interior",
  "seller",
  "mmr",
  "sellingprice",
  "saledate",
  "deal_rating",
  "ownerId",
  "ownerEmail",
  "ownerRole",
] as const;

type ListingRecord = Record<(typeof LISTING_HEADERS)[number], string>;

function pickSeedOwner(seedKey: string) {
  const owners = getSeededListingOwners();
  let hash = 0;
  for (const char of seedKey) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }
  return owners[hash % owners.length];
}

function coerceDealRating(value: string): Car["deal_rating"] {
  if (value === "Great Deal" || value === "Good Price" || value === "Fair Market") {
    return value;
  }
  return "Fair Market";
}

function normalizeCondition(value: string): string | number | null {
  if (!value.trim()) return null;
  const numericValue = Number(value);
  if (!Number.isNaN(numericValue)) {
    return numericValue;
  }
  return value.trim();
}

function mapRowToCar(row: Record<string, string>): Car | null {
  const vin = row.vin?.trim();
  const make = row.make?.trim();
  const model = row.model?.trim();
  const year = Number(row.year ?? "");
  const odometer = Number(row.odometer ?? "");
  const sellingprice = Number(row.sellingprice ?? "");
  const mmr = Number(row.mmr ?? "");
  const ownerId = row.ownerId?.trim();
  const ownerEmail = row.ownerEmail?.trim().toLowerCase();
  const ownerRole = row.ownerRole?.trim().toLowerCase();

  if (!vin || !make || !model || Number.isNaN(year) || Number.isNaN(odometer) || Number.isNaN(sellingprice) || Number.isNaN(mmr)) {
    return null;
  }

  if (!ownerId || !ownerEmail || (ownerRole !== "consumer" && ownerRole !== "dealer" && ownerRole !== "admin")) {
    return null;
  }

  return {
    year,
    make,
    model,
    trim: row.trim?.trim() ? row.trim.trim() : null,
    body: row.body?.trim() ?? "",
    transmission: row.transmission?.trim() ? row.transmission.trim() : null,
    vin,
    state: row.state?.trim() ?? "",
    condition: normalizeCondition(row.condition ?? ""),
    odometer,
    color: row.color?.trim() ?? "",
    interior: row.interior?.trim() ?? "",
    seller: row.seller?.trim() ?? "",
    mmr,
    sellingprice,
    saledate: row.saledate?.trim() ?? "",
    deal_rating: coerceDealRating(row.deal_rating ?? ""),
    ownerId,
    ownerEmail,
    ownerRole: ownerRole as Car["ownerRole"],
  };
}

function mapCarToRow(car: Car): ListingRecord {
  return {
    year: String(car.year ?? ""),
    make: car.make ?? "",
    model: car.model ?? "",
    trim: car.trim ?? "",
    body: car.body ?? "",
    transmission: car.transmission ?? "",
    vin: car.vin ?? "",
    state: car.state ?? "",
    condition: car.condition == null ? "" : String(car.condition),
    odometer: String(car.odometer ?? 0),
    color: car.color ?? "",
    interior: car.interior ?? "",
    seller: car.seller ?? "",
    mmr: String(car.mmr ?? 0),
    sellingprice: String(car.sellingprice ?? 0),
    saledate: car.saledate ?? "",
    deal_rating: car.deal_rating ?? "Fair Market",
    ownerId: car.ownerId ?? "",
    ownerEmail: car.ownerEmail ?? "",
    ownerRole: car.ownerRole ?? "",
  };
}

async function writeListings(cars: Car[]): Promise<void> {
  const content = stringifyCsv([...LISTING_HEADERS], cars.map(mapCarToRow));
  await writeFile(LISTINGS_CSV_PATH, `${content}\n`, "utf8");
}

export async function ensureListingsSeeded(): Promise<void> {
  const raw = await readFile(LISTINGS_CSV_PATH, "utf8");
  const parsed = parseCsvText(raw);
  const rows = parsed.rows;
  let mutated = parsed.headers.join(",") !== LISTING_HEADERS.join(",");

  const cars: Car[] = [];
  for (const row of rows) {
    const currentRow = { ...row };

    const ownerRole = currentRow.ownerRole?.trim().toLowerCase();
    if (
      !currentRow.ownerId ||
      !currentRow.ownerEmail ||
      (ownerRole !== "consumer" && ownerRole !== "dealer" && ownerRole !== "admin")
    ) {
      const seedOwner = pickSeedOwner(currentRow.vin ?? `${currentRow.make}-${currentRow.model}`);
      currentRow.ownerId = seedOwner.id;
      currentRow.ownerEmail = seedOwner.email;
      currentRow.ownerRole = seedOwner.role;
      mutated = true;
    }

    const car = mapRowToCar(currentRow);
    if (!car) {
      continue;
    }
    cars.push(car);
  }

  if (mutated) {
    await writeListings(cars);
  }
}

export async function readListings(): Promise<{ cars: Car[]; malformedRows: number }> {
  await ensureListingsSeeded();
  const raw = await readFile(LISTINGS_CSV_PATH, "utf8");
  const parsed = parseCsvText(raw);

  let malformedRows = parsed.malformedRowCount;
  const cars: Car[] = [];

  for (const row of parsed.rows) {
    const car = mapRowToCar(row);
    if (!car) {
      malformedRows += 1;
      continue;
    }
    cars.push(car);
  }

  return { cars, malformedRows };
}

export async function createListing(input: Car, currentUser: SessionUser): Promise<Car> {
  const { cars } = await readListings();

  const vin = input.vin?.trim();
  if (!vin) {
    throw new Error("VIN is required.");
  }

  if (cars.some((car) => car.vin === vin)) {
    throw new Error("A listing with that VIN already exists.");
  }

  const nextCar: Car = {
    ...input,
    vin,
    seller: input.seller?.trim() || currentUser.fullName,
    ownerId: currentUser.id,
    ownerEmail: currentUser.email,
    ownerRole: currentUser.role,
  };

  await writeListings([nextCar, ...cars]);
  return nextCar;
}

export async function updateListing(input: Car, currentUser: SessionUser): Promise<Car> {
  const { cars } = await readListings();
  const vin = input.vin?.trim();

  if (!vin) {
    throw new Error("VIN is required.");
  }

  const existing = cars.find((car) => car.vin === vin);
  if (!existing) {
    throw new Error("Listing not found.");
  }

  const nextCar: Car = {
    ...input,
    vin,
    seller: input.seller?.trim() || existing.seller || currentUser.fullName,
    ownerId: existing.ownerId || currentUser.id,
    ownerEmail: existing.ownerEmail || currentUser.email,
    ownerRole: existing.ownerRole || currentUser.role,
  };

  const nextCars = cars.map((car) => (car.vin === vin ? nextCar : car));
  await writeListings(nextCars);
  return nextCar;
}
