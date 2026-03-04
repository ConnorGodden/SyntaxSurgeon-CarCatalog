export interface Car {
  year: number;
  make: string;
  model: string;
  trim: string | null;
  body: string;
  transmission: string | null;
  vin: string;
  state: string;
  condition: number | null;
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

export function parseJson(data: unknown): Car[] {
  if (!Array.isArray(data)) return [];
  return data.map((item) => {
    const car = item as Record<string, unknown>;
    return {
      year: Number(car.year ?? 0),
      make: String(car.make ?? ""),
      model: String(car.model ?? ""),
      trim: car.trim != null ? String(car.trim) : null,
      body: String(car.body ?? ""),
      transmission: car.transmission != null ? String(car.transmission) : null,
      vin: String(car.vin ?? ""),
      state: String(car.state ?? ""),
      condition: car.condition != null ? Number(car.condition) : null,
      odometer: Number(car.odometer ?? 0),
      color: String(car.color ?? ""),
      interior: String(car.interior ?? ""),
      seller: String(car.seller ?? ""),
      mmr: Number(car.mmr ?? 0),
      sellingprice: Number(car.sellingprice ?? 0),
      saledate: String(car.saledate ?? ""),
      deal_rating:
        car.deal_rating === "Great Deal" || car.deal_rating === "Good Price" || car.deal_rating === "Fair Market"
          ? car.deal_rating
          : "Fair Market",
    };
  });
}
