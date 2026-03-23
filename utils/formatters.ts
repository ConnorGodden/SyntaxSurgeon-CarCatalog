import type { Car } from "../types/car";

export function getInitials(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "CC"
  );
}

export function labelFromSnakeCase(value: string): string {
  return value
    .split("_")
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

export function formatCondition(condition: Car["condition"]): string {
  if (condition == null || condition === "") return "N/A";
  if (typeof condition === "number") return `Score: ${condition}`;
  return labelFromSnakeCase(condition);
}

export function formatMoney(value: number): string {
  if (!isFinite(value)) return "N/A";
  return value.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

export function formatOdometerKm(value: number): string {
  if (!isFinite(value)) return "N/A";
  return `${value.toLocaleString()} KM`;
}
