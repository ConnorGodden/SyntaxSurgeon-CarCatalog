import { describe, it, expect } from "vitest";
import { parseCsvText, escapeCsvValue, stringifyCsv } from "../utils/csv";

// ─── parseCsvText ─────────────────────────────────────────────────────────────

describe("parseCsvText", () => {
  it("returns empty results for an empty string", () => {
    const result = parseCsvText("");
    expect(result.headers).toEqual([]);
    expect(result.rows).toEqual([]);
    expect(result.malformedRowCount).toBe(0);
  });

  it("returns empty results for whitespace-only input", () => {
    const result = parseCsvText("   \n  ");
    expect(result.rows).toHaveLength(0);
  });

  it("parses headers correctly from the first line", () => {
    const result = parseCsvText("name,age,city");
    expect(result.headers).toEqual(["name", "age", "city"]);
    expect(result.rows).toHaveLength(0);
  });

  it("parses a single data row into a record", () => {
    const result = parseCsvText("name,age\nAlice,30");
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]).toEqual({ name: "Alice", age: "30" });
  });

  it("parses multiple data rows", () => {
    const result = parseCsvText("name,age\nAlice,30\nBob,25");
    expect(result.rows).toHaveLength(2);
    expect(result.rows[1]).toEqual({ name: "Bob", age: "25" });
  });

  it("trims whitespace from header names", () => {
    const result = parseCsvText(" name , age \nAlice,30");
    expect(result.headers).toEqual(["name", "age"]);
  });

  it("trims whitespace from cell values", () => {
    const result = parseCsvText("name,age\n  Alice  ,  30  ");
    expect(result.rows[0]).toEqual({ name: "Alice", age: "30" });
  });

  it("counts rows with the wrong number of columns as malformed", () => {
    const result = parseCsvText("a,b,c\n1,2\n4,5,6");
    expect(result.malformedRowCount).toBe(1);
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]).toEqual({ a: "4", b: "5", c: "6" });
  });

  it("handles quoted fields containing commas", () => {
    const result = parseCsvText('name,city\nAlice,"New York, NY"');
    expect(result.rows[0].city).toBe("New York, NY");
  });

  it("handles escaped double-quotes inside quoted fields", () => {
    const result = parseCsvText('name,note\nAlice,"She said ""hello"""');
    expect(result.rows[0].note).toBe('She said "hello"');
  });

  it("handles Windows-style CRLF line endings", () => {
    const result = parseCsvText("name,age\r\nAlice,30\r\nBob,25");
    expect(result.rows).toHaveLength(2);
  });

  it("returns zero malformedRowCount when all rows are valid", () => {
    const result = parseCsvText("a,b\n1,2\n3,4");
    expect(result.malformedRowCount).toBe(0);
  });

  it("counts all rows as malformed when every row has wrong column count", () => {
    const result = parseCsvText("a,b,c\n1,2\n3,4");
    expect(result.malformedRowCount).toBe(2);
    expect(result.rows).toHaveLength(0);
  });
});

// ─── escapeCsvValue ───────────────────────────────────────────────────────────

describe("escapeCsvValue", () => {
  it("returns a plain string as-is when no special characters are present", () => {
    expect(escapeCsvValue("hello")).toBe("hello");
  });

  it("wraps a value containing a comma in double quotes", () => {
    expect(escapeCsvValue("hello, world")).toBe('"hello, world"');
  });

  it("wraps a value containing a double quote in double quotes and escapes it", () => {
    expect(escapeCsvValue('say "hi"')).toBe('"say ""hi"""');
  });

  it("wraps a value containing a newline in double quotes", () => {
    expect(escapeCsvValue("line1\nline2")).toBe('"line1\nline2"');
  });

  it("converts a number to its string representation", () => {
    expect(escapeCsvValue(42)).toBe("42");
  });

  it("converts null to an empty string", () => {
    expect(escapeCsvValue(null)).toBe("");
  });

  it("converts undefined to an empty string", () => {
    expect(escapeCsvValue(undefined)).toBe("");
  });

  it("returns an empty string for an empty-string input", () => {
    expect(escapeCsvValue("")).toBe("");
  });
});

// ─── stringifyCsv ─────────────────────────────────────────────────────────────

describe("stringifyCsv", () => {
  it("produces a header line followed by data lines", () => {
    const result = stringifyCsv(["name", "age"], [{ name: "Alice", age: "30" }]);
    expect(result).toBe("name,age\nAlice,30");
  });

  it("produces only a header line when there are no rows", () => {
    const result = stringifyCsv(["name", "age"], []);
    expect(result).toBe("name,age");
  });

  it("produces multiple data lines for multiple rows", () => {
    const rows = [{ a: "1", b: "2" }, { a: "3", b: "4" }];
    const result = stringifyCsv(["a", "b"], rows);
    expect(result).toBe("a,b\n1,2\n3,4");
  });

  it("escapes values with commas", () => {
    const result = stringifyCsv(["city"], [{ city: "New York, NY" }]);
    expect(result).toBe('city\n"New York, NY"');
  });

  it("outputs an empty string for a missing column value", () => {
    const result = stringifyCsv(["a", "b"], [{ a: "1" }]);
    expect(result).toBe("a,b\n1,");
  });

  it("round-trips through parseCsvText correctly", () => {
    const original = [{ make: "FORD", model: "Focus", year: "2012" }];
    const csv = stringifyCsv(["make", "model", "year"], original);
    const parsed = parseCsvText(csv);
    expect(parsed.rows).toEqual(original);
  });
});
