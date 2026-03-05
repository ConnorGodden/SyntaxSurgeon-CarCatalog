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
}

export function parseCsv(text: string): Car[] {
  const lines = text.trim().split("\n");
  if (lines.length < 2) return [];
  const headers = lines[0].split(",");
  return lines.slice(1).map((line) => {
    const values = line.split(",");
    const car: Record<string, string> = {};
    headers.forEach((h, i) => (car[h.trim()] = values[i]?.trim() ?? ""));
    return {
      year: Number(car.year || 0),
      make: car.make ?? "",
      model: car.model ?? "",
      trim: car.trim !== "" ? car.trim : null,
      body: car.body ?? "",
      transmission: car.transmission !== "" ? car.transmission : null,
      vin: car.vin ?? "",
      state: car.state ?? "",
      condition: car.condition !== "" ? Number(car.condition) : null,
      odometer: Number(car.odometer || 0),
      color: car.color ?? "",
      interior: car.interior ?? "",
      seller: car.seller ?? "",
      mmr: Number(car.mmr || 0),
      sellingprice: Number(car.sellingprice || 0),
      saledate: car.saledate ?? "",
      deal_rating:
        car.deal_rating === "Great Deal" || car.deal_rating === "Good Price" || car.deal_rating === "Fair Market"
          ? car.deal_rating
          : "Fair Market",
    };
  });
}
