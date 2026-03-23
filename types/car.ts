import { parseCsvText } from "../utils/csv";
import type { UserRole } from "./user";

export interface Car {
  year: number;
  make: string;
  model: string;
  trim: string | null;
  body: string;
  transmission: string | null;
  vin: string;
  state: string;
  condition: string | number | null;
  odometer: number;
  color: string;
  interior: string;
  seller: string;
  mmr: number;
  sellingprice: number;
  saledate: string;
  deal_rating: "Great Deal" | "Good Price" | "Fair Market";
  image?: string;
  ownerId?: string;
  ownerEmail?: string;
  ownerRole?: UserRole;
}

export function parseCsv(text: string): Car[] {
  const parsed = parseCsvText(text);
  if (parsed.headers.length === 0) return [];

  return parsed.rows.flatMap((row) => {
    const year = Number(row.year || 0);
    const odometer = Number(row.odometer || 0);
    const mmr = Number(row.mmr || 0);
    const sellingprice = Number(row.sellingprice || 0);
    const rawCondition = row.condition ?? "";
    const numericCondition = Number(rawCondition);

    if (!row.make || !row.model || !row.vin) {
      return [];
    }

    return [{
      year,
      make: row.make ?? "",
      model: row.model ?? "",
      trim: row.trim !== "" ? row.trim : null,
      body: row.body ?? "",
      transmission: row.transmission !== "" ? row.transmission : null,
      vin: row.vin ?? "",
      state: row.state ?? "",
      condition: rawCondition === "" ? null : (Number.isNaN(numericCondition) ? rawCondition : numericCondition),
      odometer,
      color: row.color ?? "",
      interior: row.interior ?? "",
      seller: row.seller ?? "",
      mmr,
      sellingprice,
      saledate: row.saledate ?? "",
      deal_rating:
        row.deal_rating === "Great Deal" || row.deal_rating === "Good Price" || row.deal_rating === "Fair Market"
          ? row.deal_rating
          : "Fair Market",
      ownerId: row.ownerId?.trim() || undefined,
      ownerEmail: row.ownerEmail?.trim() || undefined,
      ownerRole:
        row.ownerRole === "consumer" || row.ownerRole === "dealer" || row.ownerRole === "admin"
          ? row.ownerRole
          : undefined,
    }];
  });
}
