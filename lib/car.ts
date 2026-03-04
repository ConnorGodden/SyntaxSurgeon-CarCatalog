export interface Car {
  make: string;
  model: string;
  year: string;
  rating: string;
}

export function parseCsv(text: string): Car[] {
  const lines = text.trim().split("\n");
  const headers = lines[0].split(",");
  return lines.slice(1).map((line) => {
    const values = line.split(",");
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => (obj[h.trim()] = values[i]?.trim() ?? ""));
    return obj as unknown as Car;
  });
}

