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
}