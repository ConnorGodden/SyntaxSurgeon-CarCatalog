import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const CSV_PATH = path.join(process.cwd(), "public", "cars.csv");

const CSV_COLUMNS = [
  "year", "make", "model", "trim", "body", "transmission",
  "vin", "state", "condition", "odometer", "color", "interior",
  "seller", "mmr", "sellingprice", "saledate", "deal_rating",
] as const;

function escapeField(value: unknown): string {
  const str = String(value ?? "");
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function POST(req: NextRequest) {
  try {
    const car = await req.json();
    const row = CSV_COLUMNS.map((col) => escapeField(car[col])).join(",");
    fs.appendFileSync(CSV_PATH, "\n" + row, "utf8");
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
