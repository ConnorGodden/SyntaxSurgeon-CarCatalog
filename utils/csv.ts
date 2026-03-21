export interface ParsedCsvResult {
  headers: string[];
  rows: Record<string, string>[];
  malformedRowCount: number;
}

function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      values.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current);
  return values;
}

export function parseCsvText(text: string): ParsedCsvResult {
  const trimmed = text.trim();
  if (!trimmed) {
    return { headers: [], rows: [], malformedRowCount: 0 };
  }

  const lines = trimmed.split(/\r?\n/).filter((line) => line.length > 0);
  if (lines.length === 0) {
    return { headers: [], rows: [], malformedRowCount: 0 };
  }

  const headers = parseCsvLine(lines[0]).map((header) => header.trim());
  if (headers.length === 0) {
    return { headers: [], rows: [], malformedRowCount: lines.length - 1 };
  }

  const rows: Record<string, string>[] = [];
  let malformedRowCount = 0;

  for (const line of lines.slice(1)) {
    const values = parseCsvLine(line);
    if (values.length !== headers.length) {
      malformedRowCount += 1;
      continue;
    }

    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = values[index]?.trim() ?? "";
    });
    rows.push(row);
  }

  return { headers, rows, malformedRowCount };
}

export function escapeCsvValue(value: unknown): string {
  const stringValue = String(value ?? "");
  if (/[",\n\r]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

export function stringifyCsv(headers: string[], rows: Record<string, unknown>[]): string {
  const headerLine = headers.map(escapeCsvValue).join(",");
  const dataLines = rows.map((row) =>
    headers.map((header) => escapeCsvValue(row[header])).join(","),
  );

  return [headerLine, ...dataLines].join("\n");
}
